'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useRouter } from 'next/navigation';
import { finalizeUserPassword } from '@/app/actions/auth-actions';

export default function RedefinirSenhaPage() {
    const { user, needsPasswordReset, isLoading: authLoading } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        // Se já mudou a senha ou não precisa, vai pro dashboard
        if (!authLoading && user && !needsPasswordReset) {
            router.push('/dashboard');
        }
    }, [user, needsPasswordReset, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
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
        
        setIsLoading(true);
        try {
            if (!user?.email) throw new Error('Dados do usuário não encontrados');
            
            const result = await finalizeUserPassword({
                email: user.email,
                newPassword: newPassword
            });
            
            if (result.success) {
                // Forçar recarregamento para limpar o estado needsPasswordReset no AuthProvider
                window.location.href = '/dashboard?senha_atualizada=true';
            } else {
                setError(result.error || 'Erro ao atualizar senha');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-[440px] border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] md:rounded-[3rem] overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <CardHeader className="space-y-6 text-center items-center pt-10 md:pt-14 px-6 md:px-10">
                    <div className="w-full flex justify-center mb-2">
                        <Logo className="scale-125 md:scale-150" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tight">Nova Senha</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium italic">
                            Sua senha é temporária. Por favor, escolha uma nova senha definitiva.
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 px-10 pt-6 pb-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <Label htmlFor="newPassword" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] pl-1">
                                Nova Senha
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="bg-muted/50 border-border/50 text-foreground h-16 pl-12 pr-12 rounded-[1.25rem] placeholder:text-muted-foreground/50 text-lg transition-all focus:ring-2 focus:ring-primary/50"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="confirmPassword" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] pl-1">
                                Confirmar Nova Senha
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Repita a senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-muted/50 border-border/50 text-foreground h-16 pl-12 pr-4 rounded-[1.25rem] placeholder:text-muted-foreground/50 text-lg transition-all focus:ring-2 focus:ring-primary/50"
                                />
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
                                    <span>Salvando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="h-6 w-6" />
                                    <span>Definir Nova Senha</span>
                                </div>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
