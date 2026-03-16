'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
    Loader2, 
    ClipboardList, 
    ArrowRight, 
    CheckCircle2, 
    Zap,
    Building2,
    Users2,
    Settings2,
    Play
} from 'lucide-react';
import { Property, Client, Landlord, InspectionType } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';
import { fetchProperties, fetchClients, fetchLandlords, createInspection } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { QuickAddProperty } from '@/components/inspections/quick-add-property';
import { QuickAddClient } from '@/components/inspections/quick-add-client';
import { QuickAddLandlord } from '@/components/inspections/quick-add-landlord';

export default function NewInspection() {
    const router = useRouter();
    const { user } = useAuth();
    const agencyId = user?.tenantId ?? '';

    const [properties, setProperties] = useState<Property[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [landlords, setLandlords] = useState<Landlord[]>([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    const [propertyId, setPropertyId] = useState('');
    const [clientId, setClientId] = useState('');
    const [landlordId, setLandlordId] = useState('');
    const [type, setType] = useState<InspectionType>('entry');

    const loadData = useCallback(async () => {
        if (!agencyId || !isSupabaseConfigured) { setLoading(false); return; }
        try {
            const [props, cls, lds] = await Promise.all([
                fetchProperties(agencyId),
                fetchClients(agencyId),
                fetchLandlords(agencyId),
            ]);
            setProperties(props);
            setClients(cls);
            setLandlords(lds);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [agencyId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handlePropertyAdded = (newProp: Property) => {
        setProperties(prev => [newProp, ...prev]);
        setPropertyId(newProp.id);
    };

    const handleClientAdded = (newClient: Client) => {
        setClients(prev => [newClient, ...prev]);
        setClientId(newClient.id);
    };

    const handleLandlordAdded = (newLandlord: Landlord) => {
        setLandlords(prev => [newLandlord, ...prev]);
        setLandlordId(newLandlord.id);
    };

    const handleStart = async () => {
        if (!propertyId || !clientId || !landlordId) return;
        setStarting(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            if (isSupabaseConfigured && agencyId) {
                const inspection = await createInspection({
                    tenantId: agencyId,
                    propertyId,
                    clientId,
                    landlordId,
                    type,
                    status: 'ongoing',
                    date: today,
                    environments: [],
                });
                router.push(`/dashboard/inspections/active-demo?id=${inspection.id}`);
            } else {
                router.push('/dashboard/inspections/active-demo');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao criar vistoria.');
        } finally {
            setStarting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-10 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/inspections" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Vistorias</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/inspections/new" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Nova</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Nova Vistoria</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">Vistorias seguras, objetivas e datadas.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="md:col-span-2 space-y-8">
                    <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="px-10 pt-10 pb-6 border-b border-border/40 bg-muted/20">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Settings2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Configurações do Laudo</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70">Identificação das partes e imóvel</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-10 py-10 space-y-8">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                    <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                                    <p className="text-xs font-black uppercase tracking-widest opacity-40">Consultando Base...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label htmlFor="property" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Building2 className="h-3 w-3" /> Imóvel do Portfólio
                                            </Label>
                                            <QuickAddProperty agencyId={agencyId} onSuccess={handlePropertyAdded} />
                                        </div>
                                        <Select value={propertyId} onValueChange={(v: string | null) => { if (v) setPropertyId(v); }}>
                                            <SelectTrigger id="property" className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus:ring-primary/20">
                                                <SelectValue placeholder={properties.length === 0 ? 'Nenhum imóvel cadastrado' : 'Selecione o imóvel'} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                                {properties.map(p => (
                                                    <SelectItem key={p.id} value={p.id} className="rounded-xl py-3 font-bold">{p.address}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between ml-1">
                                                <Label htmlFor="landlord" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Users2 className="h-3 w-3" /> Locador (Dono)
                                                </Label>
                                                <QuickAddLandlord agencyId={agencyId} onSuccess={handleLandlordAdded} />
                                            </div>
                                            <Select value={landlordId} onValueChange={(v: string | null) => { if (v) setLandlordId(v); }}>
                                                <SelectTrigger id="landlord" className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus:ring-primary/20">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                                    {landlords.map(l => (
                                                        <SelectItem key={l.id} value={l.id} className="rounded-xl py-3 font-bold">{l.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between ml-1">
                                                <Label htmlFor="client" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Users2 className="h-3 w-3" /> Locatário
                                                </Label>
                                                <QuickAddClient agencyId={agencyId} onSuccess={handleClientAdded} />
                                            </div>
                                            <Select value={clientId} onValueChange={(v: string | null) => { if (v) setClientId(v); }}>
                                                <SelectTrigger id="client" className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus:ring-primary/20">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                                    {clients.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="rounded-xl py-3 font-bold">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modalidade de Vistoria</Label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <button 
                                                onClick={() => setType('entry')}
                                                className={`p-4 rounded-[1.5rem] border-4 transition-all flex flex-col items-center gap-2 ${
                                                    type === 'entry' 
                                                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 shadow-xl' 
                                                    : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type === 'entry' ? 'bg-emerald-500 text-white' : 'bg-muted/50'}`}>
                                                    <ClipboardList className="h-5 w-5" />
                                                </div>
                                                <span className="font-black text-[10px] uppercase tracking-wider">Entrada</span>
                                            </button>
                                            <button 
                                                onClick={() => setType('exit')}
                                                className={`p-4 rounded-[1.5rem] border-4 transition-all flex flex-col items-center gap-2 ${
                                                    type === 'exit' 
                                                    ? 'border-amber-500 bg-amber-500/5 text-amber-700 shadow-xl' 
                                                    : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type === 'exit' ? 'bg-amber-500 text-white' : 'bg-muted/50'}`}>
                                                    <Play className="h-5 w-5 rotate-90" />
                                                </div>
                                                <span className="font-black text-[10px] uppercase tracking-wider">Saída</span>
                                            </button>
                                            <button 
                                                onClick={() => setType('verification')}
                                                className={`p-4 rounded-[1.5rem] border-4 transition-all flex flex-col items-center gap-2 ${
                                                    type === 'verification' 
                                                    ? 'border-blue-500 bg-blue-500/5 text-blue-700 shadow-xl' 
                                                    : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50'
                                                }`}
                                            >
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${type === 'verification' ? 'bg-blue-500 text-white' : 'bg-muted/50'}`}>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </div>
                                                <span className="font-black text-[10px] uppercase tracking-wider">Constatação</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Button
                        className="w-full h-20 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground gap-4 group"
                        onClick={handleStart}
                        disabled={!propertyId || !clientId || !landlordId || loading || starting}
                    >
                        {starting ? (
                            <><Loader2 className="h-6 w-6 animate-spin" /> Processando...</>
                        ) : (
                            <>
                                Iniciar Vistoria Técnica 
                                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ClipboardList className="h-32 w-32 -mr-10 -mt-10" />
                        </div>
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-lg font-black tracking-tight">Resumo do Plano</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Status</p>
                                <p className="font-black text-xl">Ativo: Premium</p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-2xl space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span>Vistorias Mês</span>
                                    <span>24/50</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[48%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-card rounded-[2rem]">
                        <CardHeader>
                            <CardTitle className="text-base font-black tracking-tight">Dicas Pro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <p className="text-xs font-medium text-muted-foreground italic">Certifique-se de que o dispositivo está com bateria carregada para tirar fotos.</p>
                            </div>
                            <div className="flex gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <p className="text-xs font-medium text-muted-foreground italic">O checklist sincroniza automaticamente com a nuvem a cada alteração.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
