'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState('');
    const { login, isLoading, needsPasswordReset, resetPassword } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        }
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
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
            <div className="flex min-h-screen items-center justify-center bg-background p-6 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                    <CardHeader className="space-y-4 text-center items-center pt-10 px-6 md:px-8">
                        <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight">Segurança</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium italic">
                                Crie uma senha definitiva agora.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleResetSubmit}>
                        <CardContent className="space-y-6 px-6 md:px-8 pt-4 pb-8">
                            {error && (
                                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-muted-foreground text-xs font-black uppercase tracking-widest pl-1">Nova Senha</Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Min. 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="bg-muted/50 border-border/50 text-foreground h-14 pl-12 pr-12 rounded-xl placeholder:font-medium transition-all focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                                    >
                                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs font-black uppercase tracking-widest pl-1">Confirmar Nova Senha</Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Repita a nova senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="bg-muted/50 border-border/50 text-foreground h-14 pl-12 pr-4 rounded-xl placeholder:font-medium transition-all focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="px-6 md:px-8 pb-10">
                            <Button 
                                className="w-full h-14 rounded-xl bg-primary text-primary-foreground hover:bg-emerald-500 hover:text-white font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Salvando...' : 'Confirmar e Acessar'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary/30 relative overflow-hidden">
            {/* Background elements - Theme aware */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-[440px] border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] md:rounded-[3rem] overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <CardHeader className="space-y-6 text-center items-center pt-10 md:pt-14 px-6 md:px-10">
                    <div className="w-full flex justify-center mb-2">
                        <Logo className="scale-125 md:scale-150" />
                    </div>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                    <CardContent className="space-y-8 px-10 pt-4 pb-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] pl-1">E-mail Corporativo</Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-muted/50 border-border/50 text-foreground h-16 pl-12 rounded-[1.25rem] placeholder:text-muted-foreground/50 placeholder:font-bold text-lg transition-all focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="password" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Senha de Acesso</Label>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-muted/50 border-border/50 text-foreground h-16 pl-12 pr-12 rounded-[1.25rem] placeholder:text-muted-foreground/50 text-lg transition-all focus:ring-2 focus:ring-primary/50"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-10 pb-14 pt-2">
                        <Button 
                            className="w-full h-16 rounded-[1.25rem] bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] font-black text-xl shadow-2xl shadow-primary/20 transition-all border-none" 
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    <span>Autenticando...</span>
                                </div>
                            ) : 'Entrar no Sistema'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            
            {/* Footer Support - Theme aware */}
            <div className="absolute bottom-10 text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Precisa de assistência?</p>
                <a href="mailto:suporte@vistorify.com.br" className="text-xs text-primary font-bold hover:underline transition-all">suporte@vistorify.com.br</a>
            </div>
        </div>
    );
}
