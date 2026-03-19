'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShieldCheck, Building2, ArrowLeft, UserPlus } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Step = 'login' | 'first-access-email' | 'verify-cnpj' | 'create-password';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentStep, setCurrentStep] = useState<Step>('login');
    const { login, isLoading, verifyFirstAccess, verifyCnpj, createPassword } = useAuth();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('senha_criada') === 'true') {
            setSuccess('Senha criada com sucesso! Faça login com sua nova senha.');
        }
    }, [searchParams]);

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

    const handleFirstAccessEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const firstAccessData = await verifyFirstAccess(email);
            
            if (firstAccessData) {
                setCurrentStep('verify-cnpj');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Email não encontrado ou não autorizado para primeiro acesso');
        }
    };

    const handleCnpjSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        try {
            const isValid = await verifyCnpj(cnpj);
            
            if (isValid) {
                setCurrentStep('create-password');
            } else {
                setError('CNPJ não corresponde ao cadastro da agência');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao verificar CNPJ');
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
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
            await createPassword(newPassword);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao criar senha');
        }
    };

    const handleBackToLogin = () => {
        setCurrentStep('login');
        setEmail('');
        setCnpj('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    const startFirstAccess = () => {
        setCurrentStep('first-access-email');
        setError('');
        setSuccess('');
    };

    // Tela de primeiro acesso - digitar email
    if (currentStep === 'first-access-email') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                    <CardHeader className="space-y-4 text-center items-center pt-10 px-6 md:px-8">
                        <button 
                            onClick={handleBackToLogin}
                            className="absolute left-6 top-6 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <UserPlus className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight">Primeiro Acesso</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium italic">
                                Digite seu e-mail corporativo para começar
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleFirstAccessEmailSubmit}>
                        <CardContent className="space-y-6 px-6 md:px-8 pt-4 pb-8">
                            {error && (
                                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="first-access-email" className="text-muted-foreground text-xs font-black uppercase tracking-widest pl-1">
                                    E-mail Corporativo
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="first-access-email"
                                        type="email"
                                        placeholder="seu@exemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-muted/50 border-border/50 text-foreground h-14 pl-12 rounded-xl placeholder:font-medium transition-all focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Utilize o e-mail cadastrado em sua agência
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="px-6 md:px-8 pb-10">
                            <Button 
                                className="w-full h-14 rounded-xl bg-primary text-primary-foreground hover:bg-emerald-500 hover:text-white font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verificando...' : 'Verificar E-mail'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    // Tela de verificação de CNPJ
    if (currentStep === 'verify-cnpj') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                    <CardHeader className="space-y-4 text-center items-center pt-10 px-6 md:px-8">
                        <button 
                            onClick={() => setCurrentStep('first-access-email')}
                            className="absolute left-6 top-6 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <Building2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight">Verificação</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium italic">
                                Confirme o CNPJ da sua agência
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <form onSubmit={handleCnpjSubmit}>
                        <CardContent className="space-y-6 px-6 md:px-8 pt-4 pb-8">
                            {error && (
                                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="cnpj" className="text-muted-foreground text-xs font-black uppercase tracking-widest pl-1">
                                    CNPJ da Agência
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="cnpj"
                                        type="text"
                                        placeholder="00.000.000/0000-00"
                                        value={cnpj}
                                        onChange={(e) => setCnpj(e.target.value)}
                                        required
                                        className="bg-muted/50 border-border/50 text-foreground h-14 pl-12 rounded-xl placeholder:font-medium transition-all focus:ring-2 focus:ring-emerald-500/50"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Digite o CNPJ cadastrado para sua agência
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="px-6 md:px-8 pb-10">
                            <Button 
                                className="w-full h-14 rounded-xl bg-primary text-primary-foreground hover:bg-emerald-500 hover:text-white font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verificando...' : 'Verificar CNPJ'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    // Tela de criação de senha
    if (currentStep === 'create-password') {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                    <CardHeader className="space-y-4 text-center items-center pt-10 px-6 md:px-8">
                        <button 
                            onClick={() => setCurrentStep('verify-cnpj')}
                            className="absolute left-6 top-6 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <ShieldCheck className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight">Criar Senha</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium italic">
                                Primeiro acesso! Crie sua senha
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <form onSubmit={handlePasswordSubmit}>
                        <CardContent className="space-y-6 px-6 md:px-8 pt-4 pb-8">
                            {error && (
                                <div className="bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-muted-foreground text-xs font-black uppercase tracking-widest pl-1">
                                    Nova Senha
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Mínimo 6 caracteres"
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
                                <Label htmlFor="confirmPassword" className="text-muted-foreground text-xs font-black uppercase tracking-widest pl-1">
                                    Confirmar Senha
                                </Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <Input
                                        id="confirmPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Digite a senha novamente"
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
                                {isLoading ? 'Criando senha...' : 'Criar Senha e Continuar'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    // Tela de login principal com destaque para Primeiro Acesso
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 selection:bg-primary/30 relative overflow-hidden">
            {/* Background elements */}
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
                
                {/* Botão de Primeiro Acesso em destaque */}
                <div className="px-10 mb-6">
                    <Button
                        onClick={startFirstAccess}
                        variant="outline"
                        className="w-full h-14 rounded-[1.25rem] border-2 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                        <UserPlus className="h-5 w-5 mr-2" />
                        Primeiro Acesso? Clique aqui
                    </Button>
                </div>

                <div className="relative px-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-4 text-muted-foreground font-black tracking-wider">
                            ou
                        </span>
                    </div>
                </div>

                <form onSubmit={handleLoginSubmit}>
                    <CardContent className="space-y-8 px-10 pt-6 pb-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-emerald-500/20 animate-in fade-in duration-300">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}
                        
                        <div className="space-y-3">
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
                                    className="bg-muted/50 border-border/50 text-foreground h-16 pl-12 rounded-[1.25rem] placeholder:text-muted-foreground/50 placeholder:font-bold text-lg transition-all focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="password" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                                    Senha de Acesso
                                </Label>
                                <Link 
                                    href="/recuperar-senha" 
                                    className="text-xs text-primary font-bold hover:underline transition-all"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
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
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors p-1"
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
                                    <span>Entrando...</span>
                                </div>
                            ) : 'Entrar'}
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