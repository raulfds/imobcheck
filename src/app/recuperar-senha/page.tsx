'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { requestPasswordResetAction } from '@/app/actions/auth-actions';

export default function RecuperarSenhaPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação básica
        if (!email || !email.includes('@')) {
            setError('Por favor, insira um e-mail válido.');
            return;
        }
        
        setError('');
        setIsLoading(true);
        
        try {
            const result = await requestPasswordResetAction(email);
            
            if (result.success) {
                setSubmittedEmail(email);
                setSuccess(true);
            } else {
                setError(result.error || 'Erro ao solicitar recuperação de senha');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-6 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-md border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
                    <CardHeader className="space-y-4 text-center items-center pt-10 px-6 md:px-8">
                        <div className="h-20 w-20 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                            <CheckCircle2 className="h-12 w-12" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black tracking-tight">E-mail Enviado!</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Enviamos instruções para <strong className="text-primary">{submittedEmail}</strong>
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 md:px-8 py-4 text-center space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            ✅ Verifique sua caixa de entrada e também a pasta de spam.
                            <br />
                            📧 Você receberá uma senha temporária para acessar sua conta.
                        </p>
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-left">
                            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">⚠️ Importante:</p>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Ao fazer login com a senha temporária, você será solicitado a criar uma nova senha para segurança da sua conta.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 md:px-8 pb-10">
                        <Link href="/login" className="w-full">
                            <Button className="w-full h-14 rounded-xl font-black text-lg bg-primary hover:bg-emerald-500 transition-all">
                                Voltar para o Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-[440px] border-border/50 shadow-2xl bg-card text-card-foreground rounded-[2rem] md:rounded-[3rem] overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <CardHeader className="space-y-6 text-center items-center pt-10 md:pt-14 px-6 md:px-10">
                    <Link href="/login" className="absolute left-8 top-10 text-muted-foreground hover:text-primary transition-colors p-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div className="w-full flex justify-center mb-2">
                        <Logo className="scale-125 md:scale-150" />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-3xl font-black tracking-tight">Recuperar Senha</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">
                            Enviaremos uma senha temporária para o seu e-mail
                        </CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8 px-10 pt-6 pb-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-500/20 animate-in shake duration-300">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <Label htmlFor="email" className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] pl-1">
                                Seu E-mail Cadastrado
                            </Label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@exemplo.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError('');
                                    }}
                                    required
                                    disabled={isLoading}
                                    className="bg-muted/50 border-border/50 text-foreground h-16 pl-12 rounded-[1.25rem] placeholder:text-muted-foreground/50 placeholder:font-bold text-lg transition-all focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground pl-1">
                                Insira o e-mail usado no cadastro da sua conta.
                            </p>
                        </div>
                    </CardContent>
                    
                    <CardFooter className="px-10 pb-14 pt-2">
                        <Button 
                            className="w-full h-16 rounded-[1.25rem] bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] font-black text-xl shadow-2xl shadow-primary/20 transition-all border-none disabled:opacity-50 disabled:hover:scale-100" 
                            type="submit" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Enviando...</span>
                                </div>
                            ) : 'Enviar Senha Temporária'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}