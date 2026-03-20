'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function SearchParamsHandler({ setSuccess }: { setSuccess: (msg: string) => void }) {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        if (searchParams.get('senha_criada') === 'true') {
            setSuccess('Senha criada com sucesso! Faça login com sua nova senha.');
        }
    }, [searchParams, setSuccess]);
    
    return null;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState<'login' | 'first-access'>('login');
    const { login, isLoading } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            await login(email, password);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary/30 relative overflow-hidden">
            <Suspense fallback={null}>
                <SearchParamsHandler setSuccess={setSuccess} />
            </Suspense>
            
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-[440px] border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] md:rounded-[3rem] overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <CardHeader className="space-y-6 text-center items-center pt-8 md:pt-10 px-6 md:px-10">
                    <div className="w-full flex justify-center mb-2">
                        <Logo className="scale-110" />
                    </div>

                    {/* Tabs Selector */}
                    <div className="flex w-full bg-muted rounded-2xl p-1.5 h-14 relative group">
                        <button
                            onClick={() => { setActiveTab('login'); setError(''); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-black transition-all z-10",
                                activeTab === 'login' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LogIn className="h-4 w-4" />
                            ENTRAR
                        </button>
                        <button
                            onClick={() => { setActiveTab('first-access'); setError(''); }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-black transition-all z-10 underline-offset-4",
                                activeTab === 'first-access' ? "bg-card text-emerald-500 shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <UserPlus className="h-4 w-4" />
                            PRIMEIRO ACESSO
                        </button>
                    </div>
                </CardHeader>

                <form onSubmit={handleLoginSubmit}>
                    <CardContent className="space-y-6 px-10 pt-2 pb-6">
                        <div className="text-center mb-4">
                            <CardTitle className="text-2xl font-black tracking-tight">
                                {activeTab === 'login' ? 'Bem-vindo de volta' : 'Ativar sua conta'}
                            </CardTitle>
                            <CardDescription className="font-medium italic text-xs mt-1">
                                {activeTab === 'login' 
                                    ? 'Acesse o painel do seu negócio' 
                                    : 'Use o código que você recebeu do suporte'}
                            </CardDescription>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-500/20 animate-in shake duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border border-emerald-500/20 animate-in fade-in duration-300">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}
                        
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] pl-1">
                                E-mail Corporativo
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-muted/30 border-border/50 text-foreground h-14 pl-12 rounded-[1rem] placeholder:text-muted-foreground/30 placeholder:font-bold transition-all focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="password" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                                    {activeTab === 'login' ? 'Senha de Acesso' : 'Código Temporário'}
                                </Label>
                                {activeTab === 'login' && (
                                    <Link 
                                        href="/recuperar-senha" 
                                        className="text-[10px] text-primary font-bold hover:underline transition-all"
                                    >
                                        Esqueceu a senha?
                                    </Link>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={activeTab === 'login' ? "••••••••" : "Cole seu código aqui"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-muted/30 border-border/50 text-foreground h-14 pl-12 pr-12 rounded-[1rem] placeholder:text-muted-foreground/30 text-lg transition-all focus:ring-2 focus:ring-primary/50"
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
                    </CardContent>
                    <CardFooter className="px-10 pb-10 pt-2">
                        <Button 
                            className={cn(
                                "w-full h-16 rounded-[1.25rem] font-black text-lg shadow-2xl transition-all border-none",
                                activeTab === 'login' ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20" : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                            )}
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Processando...</span>
                                </div>
                            ) : (
                                activeTab === 'login' ? 'ENTRAR' : 'ATIVAR CONTA'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            
            {/* Footer Support */}
            <div className="absolute bottom-10 text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                    Precisa de assistência?
                </p>
                <a 
                    href="mailto:suporte@vistorify.com.br" 
                    className="text-xs text-primary font-bold hover:underline transition-all"
                >
                    suporte@vistorify.com.br
                </a>
            </div>
        </div>
    );
}