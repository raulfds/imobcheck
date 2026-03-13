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
    const router = useRouter();

    useEffect(() => {
        const savedUser = localStorage.getItem('imob_user');
        if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
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
                if (data.must_change_password || (data.temp_password && password === data.temp_password)) {
                    setNeedsPasswordReset(true);
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

    const forgotPassword = async (email: string) => {
        setIsLoading(true);
        try {
            if (isSupabaseConfigured) {
                // Check user exists
                const { data } = await supabase.from('system_users').select('id').eq('email', email).single();
                if (!data) throw new Error('E-mail não encontrado.');

                // In a real system: send email via Supabase or SMTP
                // For now, reset to temp password in DB
                const tempPassword = Math.random().toString(36).slice(-8);
                await supabase.from('system_users').update({
                    temp_password: tempPassword,
                    must_change_password: true,
                }).eq('email', email);

                alert(`Senha temporária "${tempPassword}" foi gerada. Em produção, isso seria enviado por e-mail para ${email}.`);
            } else {
                alert(`E-mail de recuperação enviado para ${email} (simulado).`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const resetPassword = async (_newPassword: string) => {
        setIsLoading(true);
        try {
            console.log('Mock: Resetting password...', _newPassword.length);
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (user && isSupabaseConfigured) {
                await supabase.from('system_users').update({
                    temp_password: null,
                    must_change_password: false,
                }).eq('id', user.id);
            }

            if (user) {
                localStorage.setItem('imob_user', JSON.stringify(user));
                setNeedsPasswordReset(false);
                router.push(user.role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard');
            }
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
