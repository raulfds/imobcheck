'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
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

    const completedCount = inspections.filter((i: Inspection) => i.status === 'completed').length;
    const ongoingCount = inspections.filter((i: Inspection) => i.status === 'ongoing').length;
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
        <div className="space-y-6 md:space-y-12 w-full pb-10">
            {/* Hero Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 mb-4">
                <div className="max-w-3xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Sistema Online
                    </div>
                    <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter leading-[0.9]">Painel Principal</h2>
                    <p className="text-muted-foreground text-sm md:text-lg lg:text-xl font-medium tracking-tight max-w-2xl">Acompanhe métricas de vistorias e pendências críticas com precisão.</p>
                </div>
            </div>

            {/* Metric Grid - Responsive columns: 2 columns on mobile-large */}
            <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-2 max-w-2xl">
                <MetricCard
                    title="Vistorias"
                    value={inspections.length}
                    subtext={`${ongoingCount} pendentes`}
                    icon="fact_check"
                    onClick={() => router.push('/dashboard/inspections')}
                />
                <MetricCard
                    title="Imóveis"
                    value={propertyCount}
                    subtext="Cadastrados"
                    icon="corporate_fare"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-1 space-y-6 md:space-y-8">
                    <div className="grid gap-4 pt-4">
                        <button 
                            onClick={() => router.push('/dashboard/inspections/new')}
                            className="flex items-center gap-5 p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <PlusCircle className="h-16 w-16" />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                <PlusCircle className="h-7 w-7" />
                            </div>
                            <div className="relative z-10">
                                <p className="font-black text-foreground tracking-tight mb-0.5">Nova Vistoria</p>
                                <p className="text-[11px] text-muted-foreground font-bold tracking-wide">Iniciar laudo de entrada/saída</p>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => router.push('/dashboard/registrations')}
                            className="flex items-center gap-5 p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <Building2 className="h-16 w-16" />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                <Building2 className="h-7 w-7" />
                            </div>
                            <div className="relative z-10">
                                <p className="font-black text-foreground tracking-tight mb-0.5">Cadastrar Imóvel</p>
                                <p className="text-[11px] text-muted-foreground font-bold tracking-wide">Adicionar unidade ao portfólio</p>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => router.push('/dashboard/team')}
                            className="flex items-center gap-5 p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <UsersIcon className="h-16 w-16" />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                                <UsersIcon className="h-7 w-7" />
                            </div>
                            <div className="relative z-10">
                                <p className="font-black text-foreground tracking-tight mb-0.5">Gestão de Equipe</p>
                                <p className="text-[11px] text-muted-foreground font-bold tracking-wide">Vistoriadores e permissões</p>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <Card className="border border-border/50 shadow-sm bg-muted/20 rounded-2xl">
                        <CardContent className="p-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <History className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm font-black tracking-tight uppercase">Lembrete de Hoje</p>
                                    <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-80">
                                        Vistoria da Rua Alagoas expira em breve. Recomendamos priorizar a revisão dos itens críticos.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Inspections Flow */}
                <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-xl md:rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 border-b border-border bg-muted/30 gap-4 sm:gap-0">
                            <div className="space-y-1.5">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase leading-none">Atividade Recente</h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Últimas vistorias registradas</p>
                            </div>
                            <Button variant="outline" className="text-[9px] md:text-[10px] font-black text-primary hover:text-primary hover:bg-primary/5 uppercase tracking-widest rounded-lg md:rounded-xl px-4 md:px-6 h-10 md:h-11 border-primary/20 w-full sm:w-auto" onClick={() => router.push('/dashboard/inspections')}>
                                VER TUDO <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                        <div className="flex-1 divide-y divide-border">
                            {recentInspections.map((inspection) => (
                                <div key={inspection.id} className="group px-6 md:px-10 py-6 md:py-8 flex items-center gap-4 md:gap-8 hover:bg-muted/30 transition-all cursor-pointer" onClick={() => router.push(`/dashboard/inspections/${inspection.id}`)}>
                                    <div className={`h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-105 group-hover:shadow-lg ${
                                        inspection.status === 'completed' 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-emerald-500/5'
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5'
                                    }`}>
                                        <span className="material-symbols-outlined !text-xl md:!text-2xl">{inspection.status === 'completed' ? 'verified' : 'pending_actions'}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1 md:space-y-2">
                                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${
                                                inspection.type === 'entry' ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'
                                            }`}>
                                                {inspection.type === 'entry' ? 'ENTRADA' : 'SAÍDA'}
                                            </span>
                                            <div className="hidden xs:block h-1 w-1 rounded-full bg-border" />
                                            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{inspection.date}</span>
                                        </div>
                                        <p className="text-base md:text-lg font-black text-foreground group-hover:text-primary transition-colors truncate tracking-tight">Imóvel #{inspection.propertyId.substring(0, 8)}</p>
                                    </div>
                                    <div className="hidden sm:flex flex-col items-end gap-2 pr-2">
                                        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-2 md:px-3 py-1 rounded-lg border ${
                                            inspection.status === 'completed' 
                                                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' 
                                                : 'bg-amber-500/5 border-amber-500/10 text-amber-500'
                                        }`}>
                                            {inspection.status === 'completed' ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {recentInspections.length === 0 && (
                                <div className="p-12 md:p-24 text-center flex flex-col items-center gap-4 md:gap-6">
                                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-muted flex items-center justify-center">
                                        <span className="material-symbols-outlined !text-3xl md:!text-4xl text-muted-foreground opacity-30">search_off</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs md:text-sm font-black uppercase tracking-widest text-foreground">Nenhuma vistoria encontrada</p>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-bold opacity-60">As vistorias aparecerão aqui.</p>
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

