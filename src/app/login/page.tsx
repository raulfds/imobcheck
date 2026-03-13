'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [view, setView] = useState<'login' | 'forgot'>('login');
    const { login, isLoading, needsPasswordReset, resetPassword, forgotPassword } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await forgotPassword(email);
            setView('login');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao recuperar senha');
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        try {
            await resetPassword(newPassword);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao redefinir a senha.');
        }
    };

    if (needsPasswordReset) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border shadow-2xl bg-[#212121] text-white">
                    <CardHeader className="space-y-1 text-center items-center">
                        <CardTitle className="text-2xl font-bold">Definir Nova Senha</CardTitle>
                        <CardDescription className="text-gray-300">
                            Para sua segurança, você precisa criar uma nova senha antes de continuar o acesso ao sistema.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleResetSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-gray-200">Nova Senha</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Digite sua senha definitiva..."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full shadow-md bg-white text-black hover:bg-gray-200 font-bold" type="submit" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar e Acessar o Painel'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    if (view === 'forgot') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border shadow-2xl bg-[#212121] text-white">
                    <CardHeader className="space-y-1 text-center items-center">
                        <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
                        <CardDescription className="text-gray-300">
                            Informe seu e-mail corporativo. Enviaremos uma senha temporária em instantes.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleForgotSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email-forgot" className="text-gray-200">E-mail</Label>
                                <Input
                                    id="email-forgot"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button className="w-full shadow-md bg-white text-black hover:bg-gray-200 font-bold" type="submit" disabled={isLoading}>
                                {isLoading ? 'Enviando...' : 'Enviar Nova Senha'}
                            </Button>
                            <Button variant="ghost" type="button" className="w-full text-gray-400 hover:text-white transition-colors" onClick={() => setView('login')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar para o Login
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md border-border shadow-2xl bg-[#212121] text-white">
                <CardHeader className="space-y-4 text-center items-center">
                    <div className="w-full flex justify-center mb-4">
                        <Image 
                            src="/vistorify_logo2_preto.jpg-removebg-preview.png" 
                            alt="Vistorify Logo" 
                            width={220} 
                            height={65} 
                            className="object-contain drop-shadow-sm"
                            priority
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold">Acesse sua conta</CardTitle>
                    <CardDescription className="text-gray-300">
                        Entre com suas credenciais para gerenciar suas vistorias.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-200">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-gray-200">Senha</Label>
                                <button type="button" onClick={() => setView('forgot')} className="text-sm font-medium text-gray-300 hover:text-white hover:underline outline-none transition-colors">
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full shadow-md bg-white text-black hover:bg-gray-200 font-bold" type="submit" disabled={isLoading}>
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
