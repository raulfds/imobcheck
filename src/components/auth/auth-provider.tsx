'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
    const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const savedUser = localStorage.getItem('imob_user');
        if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
        }
        
        // Restore temp password if we were in the middle of a reset
        const savedTemp = sessionStorage.getItem('imob_temp_pass');
        if (savedTemp) {
            setLastTempPassword(savedTemp);
            setNeedsPasswordReset(true);
        }
        
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // ── Agency and Super Admin users via Supabase ─────────────────────────
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
                // FIXED: Must validate password matches temp_password if it exists
                if (data.temp_password && password === data.temp_password) {
                    setNeedsPasswordReset(true);
                    setLastTempPassword(password);
                    sessionStorage.setItem('imob_temp_pass', password);
                    setUser(loggedUser);
                    return;
                }

                // Normal login — validate via Supabase Auth
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (authError || !authData.user) {
                    throw new Error('Senha incorreta.');
                }

                // Link auth_id if missing
                if (!data.auth_id) {
                    await supabase.from('system_users').update({ auth_id: authData.user.id }).eq('id', data.id);
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

    const forgotPassword = async (_email: string) => {
        // Functionality removed for security reasons. 
        // Passwords must be reset by a Super Admin or Agency Admin.
        throw new Error('Recuperação de senha desabilitada por segurança. Entre em contato com seu administrador.');
    };

    const resetPassword = async (_newPassword: string) => {
        setIsLoading(true);
        try {
            if (user && isSupabaseConfigured) {
                let newAuthId = null;

                // 1. Persistently save the new password in Supabase Auth
                // We attempt to signUp FIRST
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: user.email,
                    password: _newPassword,
                });

                if (signUpError) {
                    // Handle "User already registered" by signing in with temp password and updating
                    if (signUpError.message.toLowerCase().includes('already registered')) {
                        const tempPass = lastTempPassword || sessionStorage.getItem('imob_temp_pass');
                        if (tempPass) {
                            const { error: signInError } = await supabase.auth.signInWithPassword({
                                email: user.email,
                                password: tempPass,
                            });

                            if (!signInError) {
                                const { data: updateData, error: updateError } = await supabase.auth.updateUser({
                                    password: _newPassword
                                });
                                if (updateError) throw updateError;
                                newAuthId = updateData.user.id;
                            } else {
                                // If signIn with temp password fails, it means either:
                                // a) The user is NOT in Auth yet but signUp failed for another reason
                                // b) The user IS in Auth but with a DIFFERENT password (not the temp one)
                                throw new Error('Erro de sincronização: A conta existe mas a confirmação de acesso falhou. Contate o suporte.');
                            }
                        } else {
                            throw new Error('Sessão expirada. Faça login com a senha temporária novamente.');
                        }
                    } else {
                        throw signUpError;
                    }
                } else if (signUpData.user) {
                    newAuthId = signUpData.user.id;
                    // If email confirmation is REQUIRED in Supabase, the user might be unusable immediately.
                    // But we proceed to update the system_users flags anyway.
                }

                // 2. Clear temp flags AND save auth_id in system_users table
                // We use BOTH ID and Email for extreme reliability
                const { error: dbError } = await supabase.from('system_users')
                    .update({
                        temp_password: null,
                        must_change_password: false,
                        ...(newAuthId && { auth_id: newAuthId })
                    })
                    .match({ id: user.id, email: user.email });

                if (dbError) {
                    console.error('[DB] Erro ao atualizar system_users:', dbError);
                    throw new Error('Erro ao salvar no banco de dados. Tente novamente.');
                }

                // 3. Clear transient state and finish login
                localStorage.setItem('imob_user', JSON.stringify(user));
                setNeedsPasswordReset(false);
                setLastTempPassword(null);
                sessionStorage.removeItem('imob_temp_pass');
                
                router.push(user.role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard');
            }
        } catch (err: any) {
            console.error('Reset password error:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setNeedsPasswordReset(false);
        localStorage.removeItem('imob_user');
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
