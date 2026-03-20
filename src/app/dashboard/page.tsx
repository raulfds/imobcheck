'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
    ChevronRight,
    PlusCircle,
    Building2,
    Users as UsersIcon,
    Trash2,
    Play,
    Settings,
    TrendingUp,
    LayoutDashboard,
    ClipboardList,
    Home,
    UserCircle
} from 'lucide-react';
import { Inspection, Landlord, Property, Client } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchInspections, fetchProperties, fetchClients, deleteInspection, fetchLandlords } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { MetricCard } from '@/components/vistorify/MetricCard';

export default function TenantDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const agencyId = user?.agency_id ?? '';

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [propertyCount, setPropertyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<Record<string, Property>>({});
    const [clients, setClients] = useState<Record<string, Client>>({});
    const [landlordsMap, setLandlordsMap] = useState<Record<string, Landlord>>({});

    // Função para obter o nome do locador
    const getLandlordName = (landlordId?: string) => {
        if (!landlordId) return 'Proprietário não informado';
        const landlord = landlordsMap[landlordId];
        if (!landlord) return 'Proprietário não encontrado';
        return landlord.name;
    };

    // Função para formatar a exibição do imóvel
    const getPropertyDisplay = (inspection: Inspection) => {
        const property = properties[inspection.propertyId];
        const landlordName = getLandlordName(inspection.landlordId);
        
        if (property?.address) {
            return `${landlordName} - ${property.address}`;
        }
        
        return `Imóvel de ${landlordName}`;
    };

    const loadStats = useCallback(async () => {
        if (!agencyId || !isSupabaseConfigured) { 
            setLoading(false); 
            return; 
        }
        try {
            const [insp, props, cls, lords] = await Promise.all([
                fetchInspections(agencyId),
                fetchProperties(agencyId),
                fetchClients(agencyId),
                fetchLandlords(agencyId)
            ]);
            
            setInspections(insp);
            setPropertyCount(props.length);
            
            // Criar mapas para lookup rápido
            const propMap: Record<string, Property> = {};
            props.forEach(p => propMap[p.id] = p);
            setProperties(propMap);
            
            const clientMap: Record<string, Client> = {};
            cls.forEach(c => clientMap[c.id] = c);
            setClients(clientMap);
            
            const landlordsMapData: Record<string, Landlord> = {};
            lords.forEach(landlord => {
                landlordsMapData[landlord.id] = landlord;
            });
            setLandlordsMap(landlordsMapData);
            
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    }, [agencyId]);

    const handleDeleteInspection = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta vistoria?')) return;
        
        try {
            if (isSupabaseConfigured) await deleteInspection(id);
            setInspections(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Delete inspection error:', err);
            alert('Erro ao excluir vistoria.');
        }
    };

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

            {/* Metric Grid - High Impact */}
            <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Vistorias Totais"
                    value={inspections.length}
                    subtext={`${ongoingCount} em andamento`}
                    icon="fact_check"
                    onClick={() => router.push('/dashboard/inspections')}
                    className="bg-primary/5 border-primary/20"
                />
                <MetricCard
                    title="Imóveis"
                    value={propertyCount}
                    subtext="Registrados"
                    icon="corporate_fare"
                    onClick={() => router.push('/dashboard/registrations/properties')}
                    className="bg-blue-500/5 border-blue-500/20"
                />
                <MetricCard
                    title="Taxa de Conclusão"
                    value={`${completionRate}%`}
                    subtext="Eficiência mensal"
                    icon="trending_up"
                    className="bg-emerald-500/5 border-emerald-500/20"
                />
                <MetricCard
                    title="Inquilinos"
                    value={Object.keys(clients).length}
                    subtext="Ativos no sistema"
                    icon="groups"
                    onClick={() => router.push('/dashboard/registrations/tenants')}
                    className="bg-amber-500/5 border-amber-500/20"
                />
            </div>

            {/* Premium Navigation Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm relative overflow-hidden group h-full">
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-foreground">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Ações Rápidas
                        </h3>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <Button 
                                onClick={() => router.push('/dashboard/inspections/new')}
                                className="h-20 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between px-6 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <PlusCircle className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black uppercase tracking-widest text-[10px]">Nova</p>
                                        <p className="text-lg font-black tracking-tight leading-none">Vistoria</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 opacity-40 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <Button 
                                variant="outline"
                                onClick={() => router.push('/dashboard/registrations/properties')}
                                className="h-16 rounded-2xl border-border bg-card hover:bg-muted/50 transition-all flex items-center justify-between px-6 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-sm">Gerenciar Imóveis</p>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <Button 
                                variant="outline"
                                onClick={() => router.push('/dashboard/team')}
                                className="h-16 rounded-2xl border-border bg-card hover:bg-muted/50 transition-all flex items-center justify-between px-6 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                        <UsersIcon className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-sm">Minha Equipe</p>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <Button 
                                variant="outline"
                                onClick={() => router.push('/dashboard/settings')}
                                className="h-16 rounded-2xl border-border bg-card hover:bg-muted/50 transition-all flex items-center justify-between px-6 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <p className="font-bold text-sm">Configurações</p>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-40 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm relative overflow-hidden group h-full">
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-foreground">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            Navegação Rápida
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                variant="ghost"
                                onClick={() => router.push('/dashboard/inspections')}
                                className="h-24 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <ClipboardList className="h-6 w-6 text-primary" />
                                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Vistorias</p>
                            </Button>

                            <Button 
                                variant="ghost"
                                onClick={() => router.push('/dashboard/registrations/properties')}
                                className="h-24 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <Home className="h-6 w-6 text-blue-500" />
                                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Imóveis</p>
                            </Button>

                            <Button 
                                variant="ghost"
                                onClick={() => router.push('/dashboard/registrations/tenants')}
                                className="h-24 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <UserCircle className="h-6 w-6 text-amber-500" />
                                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Inquilinos</p>
                            </Button>

                            <Button 
                                variant="ghost"
                                onClick={() => router.push('/dashboard/team')}
                                className="h-24 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted transition-all flex flex-col items-center justify-center gap-2 group"
                            >
                                <UsersIcon className="h-6 w-6 text-emerald-500" />
                                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground">Equipe</p>
                            </Button>
                        </div>
                        
                        <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Dica de Produtividade</p>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                Use o atalho <kbd className="px-1.5 py-0.5 rounded border bg-background text-[10px] font-bold">N</kbd> para criar uma nova vistoria de qualquer lugar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="lg:col-span-2">
                    <div className="bg-card border border-border rounded-xl md:rounded-[2.5rem] shadow-sm overflow-hidden h-full flex flex-col">
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
                            {recentInspections.map((inspection) => {
                                const property = properties[inspection.propertyId];
                                const landlordName = getLandlordName(inspection.landlordId);
                                const client = clients[inspection.clientId];
                                
                                return (
                                    <div 
                                        key={inspection.id} 
                                        className="group px-6 md:px-10 py-6 md:py-8 flex items-center gap-4 md:gap-8 hover:bg-muted/30 transition-all cursor-pointer" 
                                        onClick={() => router.push(
                                            inspection.status === 'completed' 
                                                ? `/dashboard/inspections/summary-demo?id=${inspection.id}` 
                                                : `/dashboard/inspections/active-demo?id=${inspection.id}`
                                        )}
                                    >
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
                                            <p className="text-base md:text-lg font-black text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                                                {getPropertyDisplay(inspection)}
                                            </p>
                                            {client && (
                                                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                    <span className="inline-block w-1 h-1 rounded-full bg-primary/60"></span>
                                                    Inquilino: {client.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="hidden sm:flex items-center gap-3 pr-2">
                                            {inspection.status === 'ongoing' ? (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-9 px-4 rounded-xl font-black gap-2 bg-blue-600 hover:bg-blue-700 text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/dashboard/inspections/active-demo?id=${inspection.id}`);
                                                        }}
                                                    >
                                                        <Play className="h-3.5 w-3.5 fill-current" /> Continuar
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-xl hover:bg-destructive hover:text-white transition-all text-muted-foreground"
                                                        onClick={(e) => handleDeleteInspection(inspection.id, e)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] px-2 md:px-3 py-1 rounded-lg border bg-emerald-500/5 border-emerald-500/10 text-emerald-500">
                                                    CONCLUÍDO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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