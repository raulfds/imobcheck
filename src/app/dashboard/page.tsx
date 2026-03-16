'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    ChevronRight,
    PlusCircle,
    Building2,
    Users as UsersIcon,
    History
} from 'lucide-react';
import { Inspection } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchInspections, fetchProperties, fetchClients } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { MetricCard } from '@/components/vistorify/MetricCard';
import { IssueListItem } from '@/components/vistorify/IssueListItem';

export default function TenantDashboard() {
    const { user } = useAuth();
    const agencyId = user?.tenantId ?? '';

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [propertyCount, setPropertyCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        if (!agencyId || !isSupabaseConfigured) { setLoading(false); return; }
        try {
            const [insp, props] = await Promise.all([
                fetchInspections(agencyId),
                fetchProperties(agencyId),
                fetchClients(agencyId), // Keeping the fetch so side effects happen, but ignoring result to satisfy linter
            ]);
            setInspections(insp);
            setPropertyCount(props.length);
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
                <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando dados...</p>
            </div>
        );
    }

    const completionRate = inspections.length ? Math.round((completedCount / inspections.length) * 100) : 0;

    return (
        <div className="space-y-12 max-w-[1440px] mx-auto w-full">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div className="max-w-2xl">
                    <h2 className="text-5xl font-black text-slate-100 tracking-tight mb-2">Painel Principal</h2>
                    <p className="text-slate-400 text-lg">Acompanhe métricas de vistorias, portfólio de imóveis e pendências críticas.</p>
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Vistorias Totais"
                    value={inspections.length}
                    subtext={`${ongoingCount} pendentes`}
                    icon="fact_check"
                />
                <MetricCard
                    title="Taxa de Conclusão"
                    value={`${completionRate}%`}
                    subtext="ESTÁVEL"
                    icon="analytics"
                    trend={completionRate > 80 ? 'up' : 'neutral'}
                />
                <MetricCard
                    title="Imóveis Ativos"
                    value={propertyCount}
                    subtext="Cadastrados"
                    icon="corporate_fare"
                />
                <MetricCard
                    title="Alertas Críticos"
                    value={ongoingCount > 5 ? '07' : '02'}
                    subtext="Verificar hoje"
                    icon="error"
                    trend="down"
                    iconColor="text-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Compliance Issues */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-8">
                        <h4 className="text-lg font-bold mb-6 text-slate-100">Avisos e Pendências</h4>
                        <div className="space-y-4">
                            {ongoingCount > 0 ? (
                                <>
                                    <IssueListItem
                                        title="Vistoria Expirando"
                                        location="Rua das Flores, 123"
                                        timeAgo="2H AGO"
                                        severity="critical"
                                    />
                                    <IssueListItem
                                        title="Assinatura Pendente"
                                        location="Condomínio Alpha"
                                        timeAgo="5H AGO"
                                        severity="warning"
                                    />
                                    <IssueListItem
                                        title="Sincronização OK"
                                        location="Edifício Central"
                                        timeAgo="1D AGO"
                                        severity="info"
                                    />
                                </>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Nenhum aviso no momento.</p>
                            )}
                        </div>
                        <button className="w-full mt-6 py-3 text-sm font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest">
                            Ver Todos os Avisos
                        </button>
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

                {/* Recent Inspections Flow */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-800/20 border border-slate-800 rounded-xl overflow-hidden h-full flex flex-col">
                        <div className="flex flex-row items-center justify-between px-8 py-6 border-b border-slate-800 bg-[#1A1A1A]">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black tracking-tight text-slate-100">Atividade Recente</h3>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Últimas vistorias registradas</p>
                            </div>
                            <Button variant="ghost" className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-slate-800/50 uppercase tracking-widest" onClick={() => window.location.href = '/dashboard/inspections'}>
                                VER TUDO <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                            </Button>
                        </div>
                        <div className="flex-1 divide-y divide-slate-800/50">
                            {recentInspections.map((inspection) => (
                                <div key={inspection.id} className="group px-8 py-6 flex items-center gap-6 hover:bg-slate-800/30 transition-all cursor-pointer" onClick={() => window.location.href = `/dashboard/inspections/${inspection.id}`}>
                                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 ${
                                        inspection.status === 'completed' 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                    }`}>
                                        <span className="material-symbols-outlined">{inspection.status === 'completed' ? 'verified' : 'pending_actions'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                inspection.type === 'entry' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-700 border-slate-600 text-slate-300'
                                            }`}>
                                                {inspection.type === 'entry' ? 'ENTRADA' : 'SAÍDA'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{inspection.date}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-100 group-hover:text-primary transition-colors truncate">Imóvel #{inspection.propertyId.substring(0, 8)}</p>
                                    </div>
                                    <div className="hidden sm:block text-right pr-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            inspection.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                                        }`}>
                                            {inspection.status === 'completed' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {recentInspections.length === 0 && (
                                <div className="p-16 text-center flex flex-col items-center gap-4">
                                    <span className="material-symbols-outlined text-4xl text-slate-700">search_off</span>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-300">Nenhuma vistoria encontrada</p>
                                        <p className="text-xs text-slate-500 font-medium">Suas vistorias aparecerão aqui.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

