'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    Plus, 
    Trash2, 
    Loader2,
    Calendar,
    Home,
    User,
    ClipboardCheck,
    ArrowRight,
    Filter,
    ChevronRight,
    Play
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/components/auth/auth-provider';
import { Inspection, Property, Client } from '@/types';
import {
    fetchInspections, deleteInspection,
    fetchProperties, fetchClients
} from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { mockInspections, mockProperties, mockClients } from '@/lib/mock-data';
import Link from 'next/link';

export default function InspectionsPage() {
    const { user } = useAuth();
    const agencyId = user?.tenantId ?? 't1';

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [properties, setProperties] = useState<Record<string, Property>>({});
    const [clients, setClients] = useState<Record<string, Client>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let insps: Inspection[] = [];
            let props: Property[] = [];
            let cls: Client[] = [];

            if (isSupabaseConfigured) {
                [insps, props, cls] = await Promise.all([
                    fetchInspections(agencyId),
                    fetchProperties(agencyId),
                    fetchClients(agencyId),
                ]);
            } else {
                insps = mockInspections.filter(i => i.tenantId === agencyId);
                props = mockProperties.filter(p => p.tenantId === agencyId);
                cls = mockClients.filter(c => c.tenantId === agencyId);
            }

            setInspections(insps);
            
            // Map for quick lookup
            const propMap: Record<string, Property> = {};
            props.forEach(p => propMap[p.id] = p);
            setProperties(propMap);

            const clientMap: Record<string, Client> = {};
            cls.forEach(c => clientMap[c.id] = c);
            setClients(clientMap);

        } catch (err) {
            console.error('Failed to load inspections:', err);
        } finally {
            setLoading(false);
        }
    }, [agencyId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir esta vistoria?')) return;
        
        try {
            if (isSupabaseConfigured) await deleteInspection(id);
            setInspections(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir vistoria.');
        }
    };

    const filteredInspections = inspections.filter(i => {
        const prop = properties[i.propertyId]?.address?.toLowerCase() || '';
        const client = clients[i.clientId]?.name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return prop.includes(search) || client.includes(search);
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-bold animate-pulse">Carregando vistorias...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Breadcrumb className="mb-4">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-30" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/inspections" className="text-xs font-bold uppercase tracking-widest text-primary">Vistorias</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Painel de Vistorias</h1>
                    <p className="text-muted-foreground font-medium mt-1 italic">Gerencie o status e o progresso de todos os laudos técnicos.</p>
                </div>
                <Link href="/dashboard/inspections/new">
                    <Button size="lg" className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-3 bg-primary text-primary-foreground">
                        <Plus className="h-5 w-5" /> Nova Vistoria
                    </Button>
                </Link>
            </div>

            {/* Filters and Search */}
            <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Buscar por imóvel ou locatário..." 
                                className="h-14 pl-12 rounded-2xl bg-muted/50 border-none shadow-inner font-bold text-base focus-visible:ring-primary/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="secondary" className="h-14 rounded-2xl px-6 font-black gap-2 uppercase tracking-widest text-[10px] shadow-md">
                            <Filter className="h-4 w-4" /> Filtrar Status
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Inspections Table */}
            <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardHeader className="px-8 py-8 border-b border-border/40 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight">Histórico de Atividades</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Total de {filteredInspections.length} registros encontrados</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/30">
                                <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Imóvel & Tipo</TableHead>
                                <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inquilino</TableHead>
                                <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data do Laudo</TableHead>
                                <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredInspections.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <ClipboardCheck className="h-16 w-16" />
                                            <p className="font-black text-lg uppercase tracking-widest italic">Nenhuma vistoria encontrada</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInspections.map(i => {
                                    const property = properties[i.propertyId];
                                    const client = clients[i.clientId];
                                    const isOngoing = i.status === 'ongoing';

                                    return (
                                        <TableRow key={i.id} className="group hover:bg-muted/30 transition-all border-b border-border/20 last:border-0 h-24">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                                        i.type === 'entry' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                    }`}>
                                                        <Home className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-foreground text-sm line-clamp-1 max-w-[200px]">{property?.address || 'Imóvel Excluído'}</p>
                                                        <Badge variant="outline" className={`mt-1 text-[9px] font-black uppercase border-none rounded-lg px-2 shadow-sm ${
                                                            i.type === 'entry' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                                        }`}>
                                                            {i.type === 'entry' ? 'Vistoria de Entrada' : 'Vistoria de Saída'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-2 font-bold text-muted-foreground italic">
                                                    <User className="h-3.5 w-3.5 opacity-50" />
                                                    {client?.name || 'Locatário N/C'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-2 font-bold text-muted-foreground opacity-80">
                                                    <Calendar className="h-3.5 w-3.5 opacity-50" />
                                                    {new Date(i.date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8">
                                                {isOngoing ? (
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200 font-black text-[10px] uppercase rounded-xl px-3 py-1 animate-pulse">
                                                        Em Aberto
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 font-black text-[10px] uppercase rounded-xl px-3 py-1">
                                                        Concluído
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-3">
                                                    {isOngoing ? (
                                                        <Link href={`/dashboard/inspections/active-demo?id=${i.id}`}>
                                                            <Button size="sm" className="h-10 px-4 rounded-xl font-black gap-2 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all text-xs">
                                                                <Play className="h-3 w-3 fill-current" /> Continuar
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Link href={`/dashboard/inspections/summary-demo?id=${i.id}`}>
                                                            <Button variant="secondary" size="sm" className="h-10 px-4 rounded-xl font-black gap-2 shadow-md hover:bg-background hover:scale-105 transition-all text-xs">
                                                                Visualizar Laudo <ArrowRight className="h-3 w-3" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500 hover:text-white transition-all" onClick={(e) => handleDelete(i.id, e)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
