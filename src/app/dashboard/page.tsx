'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    ClipboardCheck, 
    Home, 
    UserCheck, 
    ArrowRight, 
    Loader2, 
    Calendar,
    ChevronRight,
    Search,
    PlusCircle,
    Building2,
    Users as UsersIcon,
    History
} from 'lucide-react';
import { Inspection } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchInspections, fetchProperties, fetchClients } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function TenantDashboard() {
    const { user } = useAuth();
    const agencyId = user?.tenantId ?? '';

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [propertyCount, setPropertyCount] = useState(0);
    const [clientCount, setClientCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        if (!agencyId || !isSupabaseConfigured) { setLoading(false); return; }
        try {
            const [insp, props, clients] = await Promise.all([
                fetchInspections(agencyId),
                fetchProperties(agencyId),
                fetchClients(agencyId),
            ]);
            setInspections(insp);
            setPropertyCount(props.length);
            setClientCount(clients.length);
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, [agencyId]);

    useEffect(() => { loadStats(); }, [loadStats]);

    const completedCount = inspections.filter(i => i.status === 'completed').length;
    const ongoingCount = inspections.filter(i => i.status === 'ongoing').length;
    const recentInspections = inspections.slice(0, 5);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
                <p className="text-muted-foreground font-bold animate-pulse">Sincronizando dados...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden group border-none shadow-lg bg-card">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <ClipboardCheck className="h-16 w-16 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vistorias</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground">{completedCount}</div>
                        <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1">
                            {ongoingCount} em andamento
                        </p>
                    </CardContent>
                    <div className="h-1 w-full bg-primary/10 absolute bottom-0">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: inspections.length > 0 ? `${(completedCount / inspections.length) * 100}%` : '0%' }} />
                    </div>
                </Card>

                <Card className="relative overflow-hidden group border-none shadow-lg bg-card">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Home className="h-16 w-16 text-blue-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Portfólio</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground">{propertyCount}</div>
                        <p className="text-xs font-bold text-muted-foreground mt-1">Imóveis cadastrados</p>
                    </CardContent>
                    <div className="h-1 w-full bg-blue-500/10 absolute bottom-0" />
                </Card>

                <Card className="relative overflow-hidden group border-none shadow-lg bg-card">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <UserCheck className="h-16 w-16 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Locatários</p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground">{clientCount}</div>
                        <p className="text-xs font-bold text-muted-foreground mt-1">Base ativa</p>
                    </CardContent>
                    <div className="h-1 w-full bg-emerald-500/10 absolute bottom-0" />
                </Card>

                <Card className="relative overflow-hidden group border-none shadow-lg bg-card bg-primary text-primary-foreground">
                    <CardHeader className="pb-2">
                        <p className="text-xs font-black uppercase tracking-widest opacity-80">Próximos Passos</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm font-bold leading-tight">Você tem {ongoingCount} vistorias para finalizar hoje.</div>
                        <Button variant="secondary" size="sm" className="w-full rounded-xl font-black bg-background text-foreground hover:bg-muted" onClick={() => window.location.href = '/dashboard/inspections'}>
                            Ver Listagem
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h3 className="text-xl font-black tracking-tight mb-1">Ações de Gestão</h3>
                        <p className="text-sm text-muted-foreground font-medium">Atalhos rápidos para produtividade.</p>
                    </div>
                    
                    <div className="grid gap-4">
                        <button 
                            onClick={() => window.location.href = '/dashboard/inspections/new'}
                            className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-left group"
                        >
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                                <PlusCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-foreground leading-none mb-1">Nova Vistoria</p>
                                <p className="text-[11px] text-muted-foreground font-bold">Entrada ou Saída</p>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => window.location.href = '/dashboard/registrations'}
                            className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group"
                        >
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-foreground leading-none mb-1">Cadastrar Imóvel</p>
                                <p className="text-[11px] text-muted-foreground font-bold">Unidade residencial/comercial</p>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => window.location.href = '/dashboard/team'}
                            className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left group"
                        >
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform">
                                <UsersIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-foreground leading-none mb-1">Gestão de Equipe</p>
                                <p className="text-[11px] text-muted-foreground font-bold">Vistoriadores e Admins</p>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <Card className="border-none shadow-lg bg-muted/30">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg">
                                    <History className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black">Lembrete</p>
                                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                        Vistoria da Rua Alagoas expira em breve. Revise os itens pendentes.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Feed Card */}
                <Card className="lg:col-span-2 border-none shadow-xl bg-card overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between px-8 py-6 border-b border-border/40">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight">Atividade Recente</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70">Últimas vistorias registradas</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-xs font-black uppercase tracking-widest hover:bg-muted" onClick={() => window.location.href = '/dashboard/inspections'}>
                            Ver Tudo <ArrowRight className="h-3 w-3 ml-2" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {recentInspections.map((inspection, idx) => (
                                <div key={inspection.id} className="group px-8 py-6 flex items-center gap-6 hover:bg-muted/30 transition-all cursor-pointer">
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-110 ${
                                        inspection.status === 'completed' 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                    }`}>
                                        <ClipboardCheck className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0 h-5 rounded-md ${
                                                inspection.type === 'entry' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-slate-500/5 border-slate-500/20 text-slate-600'
                                            }`}>
                                                {inspection.type === 'entry' ? 'Entrada' : 'Saída'}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{inspection.date}</span>
                                        </div>
                                        <p className="font-black text-foreground group-hover:text-primary transition-colors truncate">Imóvel #{inspection.propertyId.substring(0, 8)}</p>
                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                            <Calendar className="h-3 w-3 opacity-50" />
                                            Sincronizado às 14:30
                                        </p>
                                    </div>
                                    <div className="hidden sm:block text-right pr-2">
                                        <Badge className={`rounded-lg px-2.5 py-1 font-black text-[10px] border-none shadow-none ${
                                            inspection.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {inspection.status === 'completed' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                                        </Badge>
                                    </div>
                                    <Button size="icon" variant="secondary" className="h-10 w-10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all" onClick={() => window.location.href = `/dashboard/inspections/${inspection.id}`}>
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            ))}
                            {recentInspections.length === 0 && (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                        <Search className="h-8 w-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground">Nenhuma vistoria encontrada</p>
                                        <p className="text-sm text-muted-foreground font-medium">As vistorias que você realizar aparecerão aqui.</p>
                                    </div>
                                    <Button className="mt-4 rounded-xl font-black h-11" onClick={() => window.location.href = '/dashboard/inspections/new'}>
                                        Criar Primeira Vistoria
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

