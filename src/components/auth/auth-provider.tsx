'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { finalizeUserPassword } from '@/app/actions/auth-actions';

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (password: string) => Promise<void>;
    isLoading: boolean;
    needsPasswordReset: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const savedUser = localStorage.getItem('imob_user');
        if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
        }
        
        // Restore reset state if we were in the middle of a reset
        const needsReset = sessionStorage.getItem('imob_needs_reset');
        if (needsReset === 'true') {
            setNeedsPasswordReset(true);
        }
        
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // ── Agency and Super Admin users via Supabase ─────────────────────────
            if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
                const MOCK_USER: User = {
                    id: 'mock-1',
                    email: 'test@example.com',
                    name: 'Admin Test',
                    role: 'SUPER_ADMIN',
                    tenantId: 'agency-1'
                };
                setUser(MOCK_USER);
                localStorage.setItem('imob_user', JSON.stringify(MOCK_USER));
                router.push('/super-admin');
                return;
            }

            if (isSupabaseConfigured) {
                const { data, error } = await supabase
                    .from('system_users')
                    .select('*')
                    .eq('email', email.toLowerCase())
                    .single();

                if (error || !data) {
                    throw new Error('E-mail não cadastrado no sistema.');
                }

                const loggedUser: User = {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role,
                    tenantId: data.agency_id,
                };

                // Check agency status and subscription if not super admin
                if (loggedUser.role !== 'SUPER_ADMIN' && loggedUser.tenantId) {
                    const { data: agency, error: agencyError } = await supabase
                        .from('agencies')
                        .select('*')
                        .eq('id', loggedUser.tenantId)
                        .single();

                    if (agencyError || !agency) {
                        throw new Error('Imobiliária não encontrada.');
                    }

                    // 1. Check if inactive
                    if (agency.status !== 'active') {
                        throw new Error('O acesso desta imobiliária está suspenso. Entre em contato com o suporte.');
                    }

                    // 2. Check expiration
                    if (agency.expires_at && new Date(agency.expires_at) < new Date()) {
                        await supabase.from('agencies').update({ status: 'inactive' }).eq('id', agency.id);
                        throw new Error('Sua assinatura expirou. O acesso foi bloqueado.');
                    }

                    // 3. Record first login and set expiration if not set
                    if (!agency.first_login_at) {
                        const now = new Date();
                        const expiresAt = new Date();
                        if (agency.billing_cycle === 'annual') {
                            expiresAt.setFullYear(now.getFullYear() + 1);
                        } else {
                            expiresAt.setMonth(now.getMonth() + 1);
                        }

                        await supabase.from('agencies').update({
                            first_login_at: now.toISOString(),
                            expires_at: expiresAt.toISOString()
                        }).eq('id', agency.id);
                    }
                }

                // Check temp password / must change password
                if (data.temp_password) {
                    if (password !== data.temp_password) {
                        throw new Error('Senha temporária incorreta.');
                    }
                    setNeedsPasswordReset(true);
                    sessionStorage.setItem('imob_needs_reset', 'true');
                    setUser(loggedUser);
                    localStorage.setItem('imob_user', JSON.stringify(loggedUser));
                    return;
                }

                // Normal login — validate via Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError) {
                    // Provide detailed error message instead of generic one
                    const msg = authError.message.toLowerCase();
                    if (msg.includes('invalid login credentials')) throw new Error('E-mail ou senha incorretos.');
                    if (msg.includes('email not confirmed')) throw new Error('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
                    throw new Error(authError.message);
                }

                if (!authData.user) {
                    throw new Error('Falha na autenticação.');
                }

                // Link auth_id if missing
                if (!data.auth_id) {
                    const { error: linkError } = await supabase.from('system_users').update({ auth_id: authData.user.id }).eq('id', data.id);
                    if (linkError) console.warn('[AUTH] Falha ao vincular auth_id:', linkError);
                }

                setUser(loggedUser);
                localStorage.setItem('imob_user', JSON.stringify(loggedUser));
                
                // Route based on role
                switch (loggedUser.role) {
                    case 'SUPER_ADMIN':
                        router.push('/super-admin');
                        break;
                    case 'CLIENT_ADMIN':
                    case 'INSPECTOR':
                        router.push('/dashboard');
                        break;
                    default:
                        router.push('/login');
                        break;
                }
                return;
            }

            throw new Error('Sistema não configurado para autenticação.');
        } finally {
            setIsLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const forgotPassword = async (_email: string) => {
        // Functionality removed for security reasons. 
        // Passwords must be reset by a Super Admin or Agency Admin.
        throw new Error('Recuperação de senha desabilitada por segurança. Entre em contato com seu administrador.');
    };

    const resetPassword = async (_newPassword: string) => {
        setIsLoading(true);
        console.log('[AUTH] Finalizando nova senha para:', user?.email);
        try {
            if (user && isSupabaseConfigured) {
                // 1. Utilize Server Action to finalize password (bypasses email rate limits)
                const result = await finalizeUserPassword({
                    email: user.email,
                    newPassword: _newPassword
                });

                if (!result.success) {
                    throw new Error(result.error || 'Erro ao processar nova senha.');
                }

                console.log('[AUTH] Senha finalizada via servidor. Realizando login automático...');

                // 2. Perform silent login to establish the session
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: _newPassword
                });

                if (loginError) {
                    console.error('[AUTH] Erro no login automático:', loginError.message);
                    // If login fails, we redirect to login page anyway so they can try manually
                }

                // 3. Clear transient state and finish
                localStorage.setItem('imob_user', JSON.stringify(user));
                setNeedsPasswordReset(false);
                sessionStorage.removeItem('imob_needs_reset');
                
                router.push(user.role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard');
            }
        } catch (err: unknown) {
            console.error('[AUTH] Reset password fatal error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setNeedsPasswordReset(false);
        localStorage.removeItem('imob_user');
        sessionStorage.removeItem('imob_needs_reset');
        if (isSupabaseConfigured) supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, forgotPassword, resetPassword, isLoading, needsPasswordReset }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
