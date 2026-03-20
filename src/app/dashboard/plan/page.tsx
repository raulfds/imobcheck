'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
    Crown, 
    Users, 
    FileText, 
    Image, 
    Calendar, 
    TrendingUp, 
    AlertCircle, 
    CheckCircle2, 
    Zap, 
    Shield, 
    Clock,
    ArrowRight,
    CreditCard,
    CalendarDays,
    CircleDollarSign
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';

interface Plan {
    id: string;
    name: string;
    user_limit: number;
    inspection_limit: number;
    photo_storage_days: number;
    price: number;
    features: string[];
}

interface Agency {
    id: string;
    name: string;
    plan: string;
    plan_id: string;
    billing_cycle: 'monthly' | 'annual';
    expires_at: string | null;
    status: string;
}

export default function MeuPlanoPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [agency, setAgency] = useState<Agency | null>(null);
    const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
    const [usage, setUsage] = useState({
        totalUsers: 0,
        totalInspections: 0,
        storageUsed: 0
    });

    useEffect(() => {
        async function loadPlanData() {
            if (!user?.tenantId) return;

            try {
                // 1. Buscar dados da agência
                const { data: agencyData, error: agencyError } = await supabase
                    .from('agencies')
                    .select('*')
                    .eq('id', user.tenantId)
                    .single();

                if (agencyError) throw agencyError;

                setAgency(agencyData);

                // 2. Buscar plano atual
                if (agencyData.plan_id) {
                    const { data: planData, error: planError } = await supabase
                        .from('subscription_plans')
                        .select('*')
                        .eq('id', agencyData.plan_id)
                        .single();

                    if (!planError && planData) {
                        setCurrentPlan(planData);
                    }
                } else if (agencyData.plan) {
                    // Fallback para campo plan antigo
                    const { data: planData, error: planError } = await supabase
                        .from('subscription_plans')
                        .select('*')
                        .eq('name', agencyData.plan)
                        .single();

                    if (!planError && planData) {
                        setCurrentPlan(planData);
                    }
                }

                // 3. Buscar todos os planos disponíveis
                const { data: plansData, error: plansError } = await supabase
                    .from('subscription_plans')
                    .select('*')
                    .order('price', { ascending: true });

                if (!plansError && plansData) {
                    setAvailablePlans(plansData);
                }

                // 4. Buscar estatísticas de uso
                // Total de usuários
                const { count: userCount, error: userError } = await supabase
                    .from('system_users')
                    .select('*', { count: 'exact', head: true })
                    .eq('agency_id', user.tenantId);

                if (!userError) {
                    setUsage(prev => ({ ...prev, totalUsers: userCount || 0 }));
                }

                // Total de vistorias
                const { count: inspectionCount, error: inspectionError } = await supabase
                    .from('inspections')
                    .select('*', { count: 'exact', head: true })
                    .eq('agency_id', user.tenantId);

                if (!inspectionError) {
                    setUsage(prev => ({ ...prev, totalInspections: inspectionCount || 0 }));
                }

            } catch (error) {
                console.error('Erro ao carregar dados do plano:', error);
            } finally {
                setLoading(false);
            }
        }

        loadPlanData();
    }, [user?.tenantId]);

    const getPlanBadge = (planName: string) => {
        switch (planName?.toLowerCase()) {
            case 'basic':
            case 'standard':
                return <Badge className="bg-slate-500/10 text-slate-600 border-slate-200 font-black">Standard</Badge>;
            case 'professional':
            case 'pro':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 font-black">Profissional</Badge>;
            case 'enterprise':
            case 'business':
                return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200 font-black">Enterprise</Badge>;
            default:
                return <Badge className="bg-primary/10 text-primary border-primary/20 font-black">{planName}</Badge>;
        }
    };

    const getProgressPercentage = (current: number, limit: number) => {
        return Math.min((current / limit) * 100, 100);
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'Não definida';
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse">Carregando informações do plano...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-10 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/plano" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                    Meu Plano
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Meu Plano</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">
                            Gerencie sua assinatura e acompanhe os limites do seu plano.
                        </p>
                    </div>
                </div>
                <Button className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2">
                    <CreditCard className="h-5 w-5" />
                    Gerenciar Assinatura
                </Button>
            </div>

            <div className="grid gap-8">
                {/* Current Plan Card */}
                <Card className="border-none shadow-xl bg-gradient-to-br from-primary/5 via-primary/0 to-transparent overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    <CardHeader className="px-8 py-8 border-b border-border/40">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Crown className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Plano Atual</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">
                                    Seu plano e benefícios
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        {getPlanBadge(currentPlan?.name || agency?.plan || 'Standard')}
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            {agency?.billing_cycle === 'annual' ? 'Ciclo Anual' : 'Ciclo Mensal'}
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-black tracking-tight mb-2">
                                        {currentPlan?.name || agency?.plan || 'Standard'}
                                    </h2>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-primary">
                                            R$ {currentPlan?.price?.toFixed(2) || '0,00'}
                                        </span>
                                        <span className="text-muted-foreground font-bold">
                                            /{agency?.billing_cycle === 'annual' ? 'ano' : 'mês'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-muted-foreground">Próxima cobrança</span>
                                        <span className="font-black">{formatDate(agency?.expires_at ?? null)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-muted-foreground">Status</span>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 font-black">
                                            {agency?.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Recursos do Plano</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">
                                            Até {currentPlan?.user_limit || 3} usuários
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">
                                            Até {currentPlan?.inspection_limit || 10} vistorias
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Image className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">
                                            Armazenamento de fotos: {currentPlan?.photo_storage_days || 30} dias
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Usage Statistics Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-none shadow-lg bg-card overflow-hidden group">
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Usuários Ativos</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl font-black text-foreground">
                                        {usage.totalUsers} <span className="text-muted-foreground/30 text-lg">/ {currentPlan?.user_limit || 3}</span>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground mt-1">Colaboradores cadastrados</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-1000 rounded-full"
                                    style={{ width: `${getProgressPercentage(usage.totalUsers, currentPlan?.user_limit || 3)}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-card overflow-hidden group">
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vistorias Realizadas</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl font-black text-foreground">
                                        {usage.totalInspections} <span className="text-muted-foreground/30 text-lg">/ {currentPlan?.inspection_limit || 10}</span>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground mt-1">Vistorias neste período</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <FileText className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary transition-all duration-1000 rounded-full"
                                    style={{ width: `${getProgressPercentage(usage.totalInspections, currentPlan?.inspection_limit || 10)}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-card overflow-hidden group">
                        <CardHeader className="pb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Armazenamento</p>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className="text-3xl font-black text-foreground">
                                        0% <span className="text-muted-foreground/30 text-lg">/ 100%</span>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground mt-1">Espaço utilizado</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Image className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4 h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-1000 rounded-full" style={{ width: '0%' }} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upgrade Suggestions */}
                <Card className="border-none shadow-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 overflow-hidden">
                    <CardHeader className="px-8 py-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Aumente seu Limite</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">
                                    Escolha o plano ideal para seu negócio
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            {availablePlans.filter(p => p.name !== currentPlan?.name).map((plan) => (
                                <Card key={plan.id} className="border-2 border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-black">{plan.name}</CardTitle>
                                        <div className="text-2xl font-black text-primary mt-2">
                                            R$ {plan.price.toFixed(2)}
                                            <span className="text-xs font-normal text-muted-foreground">/{agency?.billing_cycle === 'annual' ? 'ano' : 'mês'}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span>Até {plan.user_limit} usuários</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span>Até {plan.inspection_limit} vistorias</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Image className="h-4 w-4 text-primary" />
                                            <span>{plan.photo_storage_days} dias de armazenamento</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white transition-all gap-2">
                                            Fazer Upgrade
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* FAQ / Support Card */}
                <Card className="border-none shadow-lg bg-card">
                    <CardHeader className="px-8 py-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Precisa de Ajuda?</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">
                                    Suporte e informações adicionais
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20">
                                <CalendarDays className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <h4 className="font-black text-sm">Cancelamento</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Você pode cancelar sua assinatura a qualquer momento. O serviço continuará ativo até o fim do período pago.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/20">
                                <CircleDollarSign className="h-6 w-6 text-primary shrink-0" />
                                <div>
                                    <h4 className="font-black text-sm">Faturamento</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        As faturas são geradas automaticamente no primeiro dia de cada ciclo. Você receberá por e-mail.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-bold text-amber-800">Dúvidas sobre seu plano?</p>
                                <p className="text-amber-700/80 mt-1">
                                    Entre em contato com nosso suporte: <strong>suporte@imobcheck.com.br</strong> ou através do chat no dashboard.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}