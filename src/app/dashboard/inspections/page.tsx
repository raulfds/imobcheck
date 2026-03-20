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
    Calendar,
    Home,
    User,
    ClipboardCheck,
    ArrowRight,
    Filter,
    Play,
    Edit3,
    FileText,
    Building2
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/components/auth/auth-provider';
import { Inspection, Property, Client } from '@/types';
import {
    fetchInspections, deleteInspection, updateInspection,
    fetchProperties, fetchClients, fetchLandlords
} from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { mockInspections, mockProperties, mockClients } from '@/lib/mock-data';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Landlord } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function InspectionsPage() {
    const { user } = useAuth();
    const agencyId = user?.agency_id ?? 't1';

    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [properties, setProperties] = useState<Record<string, Property>>({});
    const [clients, setClients] = useState<Record<string, Client>>({});
    const [allLandlords, setAllLandlords] = useState<Landlord[]>([]);
    const [allProperties, setAllProperties] = useState<Property[]>([]);
    const [allClients, setAllClients] = useState<Client[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all'); // all, ongoing, completed

    // Editing State
    const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            let insps: Inspection[] = [];
            let props: Property[] = [];
            let cls: Client[] = [];

            if (isSupabaseConfigured) {
                const [rInsps, rProps, rCls, lords] = await Promise.all([
                    fetchInspections(agencyId),
                    fetchProperties(agencyId),
                    fetchClients(agencyId),
                    fetchLandlords(agencyId)
                ]);
                insps = rInsps;
                props = rProps;
                cls = rCls;
                setAllProperties(props);
                setAllClients(cls);
                setAllLandlords(lords);
            } else {
                insps = mockInspections.filter(i => i.tenantId === agencyId);
                props = mockProperties.filter(p => p.tenantId === agencyId);
                cls = mockClients.filter(c => c.tenantId === agencyId);
            }

            // Ordenar vistorias por data (mais recentes primeiro)
            insps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            setInspections(insps);
            
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

    const handleEdit = (insp: Inspection, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingInspection({ ...insp });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingInspection) return;
        setSaving(true);
        try {
            if (isSupabaseConfigured) {
                await updateInspection(editingInspection.id, {
                    propertyId: editingInspection.propertyId,
                    clientId: editingInspection.clientId,
                    landlordId: editingInspection.landlordId,
                    type: editingInspection.type,
                    date: editingInspection.date
                });
            }
            setInspections(prev => prev.map(i => i.id === editingInspection.id ? editingInspection : i));
            setIsEditModalOpen(false);
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar vistoria.');
        } finally {
            setSaving(false);
        }
    };

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
        
        const matchesSearch = prop.includes(search) || client.includes(search);
        
        let matchesStatus = true;
        if (statusFilter === 'ongoing') {
            matchesStatus = i.status === 'ongoing';
        } else if (statusFilter === 'completed') {
            matchesStatus = i.status === 'completed' || i.status === 'draft';
        }
        
        return matchesSearch && matchesStatus;
    });

    const getInspectionTypeLabel = (type: string) => {
        const types = {
            entry: 'ENTRADA',
            exit: 'SAÍDA',
            verification: 'CONSTATAÇÃO'
        };
        return types[type as keyof typeof types] || type.toUpperCase();
    };

    const getTypeBadgeColor = (type: string) => {
        const colors = {
            entry: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
            exit: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
            verification: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
        };
        return colors[type as keyof typeof colors] || 'bg-muted border-border text-muted-foreground';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-bold animate-pulse">Carregando vistorias...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 w-full pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                <div className="space-y-4">
                    <Breadcrumb className="hidden sm:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">
                                    Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/inspections" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                    Vistorias
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Sistema de Gestão
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground leading-none">
                            Vistorias Técnicas
                        </h1>
                        <p className="text-muted-foreground text-xs md:text-lg font-medium tracking-tight">
                            Gerencie o ciclo completo de laudos e inspeções.
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/inspections/new" className="w-full md:w-auto">
                    <Button size="lg" className="h-14 md:h-16 w-full md:px-10 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-3 bg-primary text-primary-foreground text-xs md:text-sm uppercase tracking-widest">
                        <Plus className="h-5 w-5 stroke-[3px]" /> Nova Vistoria
                    </Button>
                </Link>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 md:gap-6">
                <div className="lg:col-span-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-5 md:left-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Search className="h-5 w-5 md:h-6 md:w-6 stroke-[2.5px]" />
                        </div>
                        <Input 
                            placeholder="Buscar endereço ou inquilino..." 
                            className="h-14 md:h-20 pl-14 md:pl-16 pr-8 rounded-2xl md:rounded-3xl bg-card border-border/50 shadow-sm font-bold text-base md:text-lg focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/50 placeholder:font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'all')}>
                        <SelectTrigger className="h-14 md:h-20 rounded-2xl md:rounded-3xl px-6 font-black gap-3 uppercase tracking-widest text-[10px] md:text-xs border-border/50 bg-card hover:bg-muted/50 shadow-sm transition-all">
                            <Filter className="h-5 w-5" />
                            <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as vistorias</SelectItem>
                            <SelectItem value="ongoing">Em andamento</SelectItem>
                            <SelectItem value="completed">Concluídas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="lg:col-span-1">
                    <Button 
                        variant="outline" 
                        className="h-14 md:h-20 w-full rounded-2xl md:rounded-3xl px-6 font-black gap-3 uppercase tracking-widest text-[10px] md:text-xs border-border/50 bg-card hover:bg-muted/50 shadow-sm transition-all"
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                        }}
                    >
                        Limpar filtros
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card border-border/50 rounded-2xl shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total</p>
                                <p className="text-3xl font-black text-foreground mt-2">{inspections.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ClipboardCheck className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border/50 rounded-2xl shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Em Andamento</p>
                                <p className="text-3xl font-black text-foreground mt-2">
                                    {inspections.filter(i => i.status === 'ongoing').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Play className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border/50 rounded-2xl shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concluídas</p>
                                <p className="text-3xl font-black text-foreground mt-2">
                                    {inspections.filter(i => i.status === 'completed' || i.status === 'draft').length}
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Inspections List */}
            <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] shadow-premium overflow-hidden">
                <div className="px-6 py-6 md:px-10 md:py-10 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1.5 text-center sm:text-left">
                        <h3 className="text-lg md:text-2xl font-black tracking-tight text-foreground uppercase leading-none">
                            Histórico de Vistorias
                        </h3>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                            {filteredInspections.length} vistoria{filteredInspections.length !== 1 ? 's' : ''} encontrada{filteredInspections.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 bg-background px-6 py-3 rounded-2xl border border-border/50">
                        <div className="flex -space-x-3">
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center overflow-hidden">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center overflow-hidden">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Dados em tempo real
                        </span>
                    </div>
                </div>

                {/* Mobile Card List */}
                <div className="grid md:hidden grid-cols-1 gap-4 p-4">
                    {filteredInspections.length === 0 ? (
                        <div className="py-20 text-center flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <ClipboardCheck className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                            <p className="font-black text-sm uppercase tracking-widest text-foreground">Nenhuma vistoria encontrada</p>
                            <p className="text-xs text-muted-foreground">Tente ajustar os filtros ou criar uma nova vistoria</p>
                        </div>
                    ) : (
                        filteredInspections.map(i => {
                            const property = properties[i.propertyId];
                            const client = clients[i.clientId];
                            const isOngoing = i.status === 'ongoing';
                            return (
                                <div key={i.id} className="bg-muted/30 rounded-2xl p-5 border border-border/50 space-y-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${getTypeBadgeColor(i.type)}`}>
                                            <Home className="h-6 w-6" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={isOngoing ? "warning" : "success"} className="font-black text-[9px] uppercase px-3 py-1 rounded-lg">
                                                {isOngoing ? 'Em Andamento' : 'Concluído'}
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-destructive hover:text-white transition-all text-muted-foreground/50"
                                                onClick={(e) => handleDelete(i.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-foreground text-base tracking-tight truncate leading-tight">
                                            {property?.address || 'Imóvel Excluído'}
                                        </p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${getTypeBadgeColor(i.type)}`}>
                                                {getInspectionTypeLabel(i.type)}
                                            </span>
                                            <span className="text-[10px] font-bold text-muted-foreground opacity-60">
                                                {new Date(i.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border/20">
                                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                            <User className="h-3.5 w-3.5 text-primary" />
                                            <span className="truncate max-w-[120px]">{client?.name || 'Locatário N/C'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {isOngoing ? (
                                                <Link href={`/dashboard/inspections/active-demo?id=${i.id}`}>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-9 px-4 rounded-lg font-black bg-blue-600 hover:bg-blue-700 text-[9px] uppercase tracking-widest"
                                                    >
                                                        <Play className="h-3 w-3 mr-1" /> Continuar
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link href={`/dashboard/inspections/summary-demo?id=${i.id}`}>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="h-9 px-4 rounded-lg font-black text-[9px] uppercase tracking-widest border border-border/50"
                                                    >
                                                        Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border bg-muted/20 h-20">
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Identificação do Imóvel
                                </TableHead>
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Locatário / Inquilino
                                </TableHead>
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Data do Laudo
                                </TableHead>
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Tipo
                                </TableHead>
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Status do Processo
                                </TableHead>
                                <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    Ações
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border/50">
                            {filteredInspections.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-6 max-w-xs mx-auto text-center">
                                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                                <ClipboardCheck className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="font-black text-lg uppercase tracking-widest text-foreground">
                                                    Nenhuma vistoria encontrada
                                                </p>
                                                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                                    Não encontramos registros para sua busca. Tente ajustar os filtros ou criar uma nova vistoria.
                                                </p>
                                                <Link href="/dashboard/inspections/new">
                                                    <Button className="mt-4 gap-2">
                                                        <Plus className="h-4 w-4" /> Criar Nova Vistoria
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredInspections.map(i => {
                                    const property = properties[i.propertyId];
                                    const client = clients[i.clientId];
                                    const isOngoing = i.status === 'ongoing';

                                    return (
                                        <TableRow key={i.id} className="group hover:bg-muted/30 transition-all border-none h-32">
                                            <TableCell className="px-10">
                                                <div className="flex items-center gap-6">
                                                    <div className={`h-16 w-16 rounded-[1.25rem] flex items-center justify-center shrink-0 border transition-all group-hover:scale-105 group-hover:shadow-lg ${getTypeBadgeColor(i.type)}`}>
                                                        <Home className="h-7 w-7" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors truncate max-w-[280px]">
                                                            {property?.address || 'Imóvel Excluído'}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-muted-foreground opacity-60">
                                                                ID: {i.id.substring(0, 8)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 font-black text-foreground text-sm tracking-tight">
                                                        <User className="h-4 w-4 text-primary" />
                                                        {client?.name || 'Locatário N/C'}
                                                    </div>
                                                    {client?.email && (
                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60 ml-6">
                                                            {client.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 font-black text-muted-foreground text-sm tracking-tight">
                                                        <Calendar className="h-4 w-4 opacity-50" />
                                                        {new Date(i.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-muted-foreground opacity-40 ml-6 uppercase tracking-widest">
                                                        Data de Registro
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <Badge className={`font-black text-[10px] uppercase rounded-xl px-4 py-1.5 shadow-sm ${getTypeBadgeColor(i.type)}`}>
                                                    {getInspectionTypeLabel(i.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                {isOngoing ? (
                                                    <Badge variant="warning" className="font-black text-[10px] uppercase rounded-xl px-4 py-1.5 animate-pulse shadow-sm">
                                                        Em Andamento
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="success" className="font-black text-[10px] uppercase rounded-xl px-4 py-1.5 shadow-sm">
                                                        Concluído
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {isOngoing ? (
                                                        <Link href={`/dashboard/inspections/active-demo?id=${i.id}`}>
                                                            <Button size="sm" className="h-12 px-6 rounded-xl font-black gap-2 shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                                                                <Play className="h-3.5 w-3.5 fill-current" /> Continuar
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Link href={`/dashboard/inspections/summary-demo?id=${i.id}`}>
                                                            <Button variant="secondary" size="sm" className="h-12 px-6 rounded-xl font-black gap-2 shadow-sm border border-border/50 hover:bg-background hover:scale-105 transition-all text-[10px] uppercase tracking-widest">
                                                                Visualizar <ArrowRight className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-12 w-12 rounded-xl hover:bg-muted shadow-sm transition-all" 
                                                        onClick={(e) => handleEdit(i, e)}
                                                    >
                                                        <Edit3 className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-12 w-12 rounded-xl hover:bg-destructive shadow-sm hover:text-destructive-foreground transition-all group/delete" 
                                                        onClick={(e) => handleDelete(i.id, e)}
                                                    >
                                                        <Trash2 className="h-4.5 w-4.5 group-hover/delete:scale-110 transition-transform" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-none bg-card shadow-2xl">
                    <DialogHeader className="px-10 pt-10 pb-6 bg-muted/20 border-b border-border/40">
                        <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                            Editar Vistoria
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                            Altere os dados básicos deste laudo
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingInspection && (
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Imóvel
                                </Label>
                                <SearchableSelect
                                    options={allProperties.map(p => ({ 
                                        id: p.id, 
                                        label: p.address, 
                                        searchValue: p.address 
                                    }))}
                                    value={editingInspection.propertyId}
                                    onValueChange={(val) => setEditingInspection({ ...editingInspection, propertyId: val })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Inquilino
                                    </Label>
                                    <SearchableSelect
                                        options={allClients.map(c => ({ 
                                            id: c.id, 
                                            label: c.name, 
                                            searchValue: c.name 
                                        }))}
                                        value={editingInspection.clientId}
                                        onValueChange={(val) => setEditingInspection({ ...editingInspection, clientId: val })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Locador
                                    </Label>
                                    <SearchableSelect
                                        options={allLandlords.map(l => ({ 
                                            id: l.id, 
                                            label: l.name, 
                                            searchValue: l.name 
                                        }))}
                                        value={editingInspection.landlordId || ''}
                                        onValueChange={(val) => setEditingInspection({ ...editingInspection, landlordId: val })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Tipo
                                    </Label>
                                    <Select 
                                        value={editingInspection.type} 
                                        onValueChange={(value) => {
                                            if (value) {
                                                setEditingInspection({ ...editingInspection, type: value as any })
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="entry">Entrada</SelectItem>
                                            <SelectItem value="exit">Saída</SelectItem>
                                            <SelectItem value="verification">Constatação</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                        Data
                                    </Label>
                                    <Input 
                                        type="date" 
                                        value={editingInspection.date.split('T')[0]} 
                                        onChange={(e) => setEditingInspection({ ...editingInspection, date: e.target.value })}
                                        className="h-12 rounded-xl bg-muted/30 border-none font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="px-10 pb-10 pt-4 flex gap-4">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl font-bold" 
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="rounded-xl font-black px-8 shadow-xl shadow-primary/20" 
                            onClick={handleUpdate} 
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}