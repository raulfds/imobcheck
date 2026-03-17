'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    Building, 
    Users, 
    User, 
    Search, 
    Plus, 
    Edit, 
    Trash2, 
    MapPin,
    Mail,
    Filter
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/components/auth/auth-provider';
import { Property, Landlord, Client } from '@/types';
import {
    fetchProperties, createProperty, deleteProperty,
    fetchLandlords, createLandlord, deleteLandlord,
    fetchClients, createClient, deleteClient,
} from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { mockProperties, mockLandlords, mockClients } from '@/lib/mock-data';

export default function RegistrationsPage() {
    const { user } = useAuth();
    const agencyId = user?.tenantId ?? 't1';

    const [properties, setProperties] = useState<Property[]>([]);
    const [landlords, setLandlords] = useState<Landlord[]>([]);
    const [tenants, setTenants] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [newProperty, setNewProperty] = useState({ 
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        description: '' 
    });
    const [newLandlord, setNewLandlord] = useState({ name: '', email: '', cpf: '', phone: '' });
    const [newTenant, setNewTenant] = useState({ name: '', email: '', cpf: '', phone: '' });

    // Search/Filter states
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog states
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
    const [isAddLandlordOpen, setIsAddLandlordOpen] = useState(false);
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);

    // Load all data
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (isSupabaseConfigured) {
                const [props, lords, clients] = await Promise.all([
                    fetchProperties(agencyId),
                    fetchLandlords(agencyId),
                    fetchClients(agencyId),
                ]);
                setProperties(props);
                setLandlords(lords);
                setTenants(clients);
            } else {
                setProperties(mockProperties.filter(p => p.tenantId === agencyId));
                setLandlords(mockLandlords.filter(l => l.tenantId === agencyId));
                setTenants(mockClients.filter(c => c.tenantId === agencyId));
            }
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    }, [agencyId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAddProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fullAddress = `${newProperty.logradouro}, ${newProperty.numero}${newProperty.complemento ? ' - ' + newProperty.complemento : ''} - ${newProperty.bairro}, ${newProperty.cidade} - ${newProperty.estado}`;
            const propertyData = { 
                tenantId: agencyId, 
                address: fullAddress,
                cep: newProperty.cep,
                logradouro: newProperty.logradouro,
                numero: newProperty.numero,
                complemento: newProperty.complemento,
                bairro: newProperty.bairro,
                cidade: newProperty.cidade,
                estado: newProperty.estado,
                description: newProperty.description 
            };

            if (isSupabaseConfigured) {
                const p = await createProperty(propertyData);
                setProperties(prev => [p, ...prev]);
            } else {
                const p: Property = { id: `p${Date.now()}`, ...propertyData };
                setProperties(prev => [p, ...prev]);
            }
            setIsAddPropertyOpen(false);
            setNewProperty({ 
                cep: '', logradouro: '', numero: '', complemento: '', 
                bairro: '', cidade: '', estado: '', description: '' 
            });
        } catch (err) { console.error(err); alert('Erro ao cadastrar imóvel.'); }
    };

    const handleAddLandlord = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isSupabaseConfigured) {
                const l = await createLandlord({ tenantId: agencyId, ...newLandlord });
                setLandlords(prev => [l, ...prev]);
            } else {
                const l: Landlord = { id: `l${Date.now()}`, tenantId: agencyId, ...newLandlord };
                setLandlords(prev => [l, ...prev]);
            }
            setIsAddLandlordOpen(false);
            setNewLandlord({ name: '', email: '', cpf: '', phone: '' });
        } catch (err) { console.error(err); alert('Erro ao cadastrar locador.'); }
    };

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isSupabaseConfigured) {
                const c = await createClient({ tenantId: agencyId, ...newTenant });
                setTenants(prev => [c, ...prev]);
            } else {
                const c: Client = { id: `c${Date.now()}`, tenantId: agencyId, ...newTenant };
                setTenants(prev => [c, ...prev]);
            }
            setIsAddTenantOpen(false);
            setNewTenant({ name: '', email: '', cpf: '', phone: '' });
        } catch (err) { console.error(err); alert('Erro ao cadastrar locatário.'); }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('Excluir este imóvel?')) return;
        if (isSupabaseConfigured) await deleteProperty(id);
        setProperties(prev => prev.filter(p => p.id !== id));
    };

    const handleDeleteLandlord = async (id: string) => {
        if (!confirm('Excluir este locador?')) return;
        if (isSupabaseConfigured) await deleteLandlord(id);
        setLandlords(prev => prev.filter(l => l.id !== id));
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Excluir este locatário?')) return;
        if (isSupabaseConfigured) await deleteClient(id);
        setTenants(prev => prev.filter(t => t.id !== id));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-bold animate-pulse">Buscando cadastros...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 w-full pb-10">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/registrations" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Cadastros</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Gestão de Ativos
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Portfólio Imobiliário</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">Organize seus imóveis, proprietários e inquilinos em um só lugar.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="properties" className="w-full space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <TabsList className="bg-muted/50 p-1.5 rounded-[1.25rem] h-16 w-full md:w-auto shadow-inner">
                        <TabsTrigger value="properties" className="rounded-xl px-10 h-13 flex gap-3 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                            <Building className="h-4 w-4" /> Imóveis
                        </TabsTrigger>
                        <TabsTrigger value="landlords" className="rounded-xl px-10 h-13 flex gap-3 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                            <User className="h-4 w-4" /> Locadores
                        </TabsTrigger>
                        <TabsTrigger value="tenants" className="rounded-xl px-10 h-13 flex gap-3 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                            <Users className="h-4 w-4" /> Locatários
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <div className="relative group flex-1 sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Buscar por CEP, CPF ou nome..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-16 pl-12 pr-6 rounded-2xl bg-card border-border/50 shadow-md w-full font-bold focus-visible:ring-primary/20" 
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl shadow-md shrink-0 border-border/50 bg-card hover:bg-muted/50 transition-all hidden sm:flex">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* ─── IMÓVEIS CONTENT ─── */}
                <TabsContent value="properties" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                    <div className="bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] shadow-premium overflow-hidden">
                        <div className="px-6 md:px-10 py-6 md:py-10 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-1.5 w-full text-center sm:text-left">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase leading-none">Unidades Cadastradas</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Total de {properties.length} registros ativos</p>
                            </div>
                            <Button className="h-14 w-full sm:w-auto px-8 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-3 bg-primary text-primary-foreground uppercase tracking-widest text-xs" onClick={() => setIsAddPropertyOpen(true)}>
                                <Plus className="h-5 w-5 stroke-[3px]" /> Novo Imóvel
                            </Button>
                        </div>
                        
                        {/* Mobile view (Cards) */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {properties.filter(p => 
                                p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.cep?.includes(searchTerm)
                            ).length === 0 ? (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                                    <Building className="h-12 w-12" />
                                    <p className="font-black text-xs uppercase tracking-widest italic">Nenhum imóvel encontrado</p>
                                </div>
                            ) : properties.filter(p => 
                                p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                p.cep?.includes(searchTerm)
                            ).map(p => (
                                <div key={p.id} className="p-6 bg-muted/20 border border-border/50 rounded-3xl space-y-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5">
                                            <MapPin className="h-7 w-7" />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="font-black text-base text-foreground leading-tight">{p.address}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="px-2 py-0.5 rounded-md bg-muted/50 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                                                    {p.cep || "S/ CEP"}
                                                </div>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-tight">{p.description || "Residencial"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-border/10">
                                        <span className="text-[9px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest">ID: {p.id.substring(0, 8)}</span>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-destructive hover:text-white" onClick={() => handleDeleteProperty(p.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop view (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border bg-muted/20 h-20">
                                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Endereço e Identificação</TableHead>
                                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tipo / Categoria</TableHead>
                                        <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {properties.filter(p => 
                                        p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        p.cep?.includes(searchTerm)
                                    ).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Building className="h-16 w-16" />
                                                    <p className="font-black text-lg uppercase tracking-widest italic">Nenhum imóvel encontrado</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : properties.filter(p => 
                                        p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        p.cep?.includes(searchTerm)
                                    ).map(p => (
                                        <TableRow key={p.id} className="group hover:bg-muted/30 transition-all border-none h-32">
                                            <TableCell className="px-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/5">
                                                        <MapPin className="h-8 w-8" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <p className="font-black text-lg text-foreground leading-tight">{p.address}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-3 py-1 rounded-lg bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border/50">
                                                                CEP: {p.cep || "Não informado"}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">ID: {p.id.substring(0, 8)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <span className="px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                                                    {p.description || "Residencial"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shadow-sm border border-border/50 hover:bg-background transition-all">
                                                        <Edit className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shadow-sm border border-border/50 hover:bg-destructive hover:text-white transition-all group/delete" onClick={() => handleDeleteProperty(p.id)}>
                                                        <Trash2 className="h-4.5 w-4.5 group-hover/delete:scale-110 transition-transform" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {/* ─── LOCADORES CONTENT ─── */}
                <TabsContent value="landlords" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                    <div className="bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] shadow-premium overflow-hidden">
                        <div className="px-6 md:px-10 py-6 md:py-10 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-1.5 w-full text-center sm:text-left">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase leading-none">Locadores & Proprietários</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Gestão de contatos e participações</p>
                            </div>
                            <Button className="h-14 w-full sm:w-auto px-8 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:scale-105 transition-all gap-3 bg-blue-600 hover:bg-blue-700 text-white uppercase tracking-widest text-xs" onClick={() => setIsAddLandlordOpen(true)}>
                                <Plus className="h-5 w-5 stroke-[3px]" /> Novo Locador
                            </Button>
                        </div>

                        {/* Mobile view (Cards) */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {landlords.filter(l => 
                                l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                l.cpf.includes(searchTerm)
                            ).length === 0 ? (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                                    <User className="h-12 w-12" />
                                    <p className="font-black text-xs uppercase tracking-widest italic">Nenhum locador encontrado</p>
                                </div>
                            ) : landlords.filter(l => 
                                l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                l.cpf.includes(searchTerm)
                            ).map(l => (
                                <div key={l.id} className="p-6 bg-muted/20 border border-border/50 rounded-3xl space-y-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 font-black text-xl uppercase border border-blue-500/5">
                                            {l.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="font-black text-base text-foreground leading-tight truncate">{l.name}</p>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="px-2 py-0.5 rounded-md bg-blue-500/5 inline-flex self-start text-[10px] font-black text-blue-600 uppercase tracking-tighter">
                                                    CPF: {l.cpf}
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Mail className="h-3 w-3 text-blue-500" />
                                                    <p className="text-[10px] font-bold text-muted-foreground truncate">{l.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-destructive hover:text-white" onClick={() => handleDeleteLandlord(l.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop view (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border bg-muted/20 h-20">
                                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome do Proprietário</TableHead>
                                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contato Principal</TableHead>
                                        <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {landlords.filter(l => 
                                        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        l.cpf.includes(searchTerm)
                                    ).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <User className="h-16 w-16" />
                                                    <p className="font-black text-lg uppercase tracking-widest italic">Nenhum locador encontrado</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : landlords.filter(l => 
                                        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        l.cpf.includes(searchTerm)
                                    ).map(l => (
                                        <TableRow key={l.id} className="group hover:bg-muted/30 transition-all border-none h-32">
                                            <TableCell className="px-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-[1.25rem] bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 font-black text-xl uppercase group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg transition-all">
                                                        {l.name.charAt(0)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-foreground text-lg tracking-tight group-hover:text-blue-600 transition-colors">{l.name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">Proprietário Ativo</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-foreground font-black text-sm tracking-tight">
                                                        <Mail className="h-4 w-4 text-blue-500" />
                                                        {l.email}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest ml-6">E-mail de Contato</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shadow-sm border border-border/50 hover:bg-background transition-all">
                                                        <Edit className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shadow-sm border border-border/50 hover:bg-destructive hover:text-white transition-all group/delete" onClick={() => handleDeleteLandlord(l.id)}>
                                                        <Trash2 className="h-4.5 w-4.5 group-hover/delete:scale-110 transition-transform" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                {/* ─── LOCATÁRIOS CONTENT ─── */}
                <TabsContent value="tenants" className="animate-in fade-in slide-in-from-bottom-4 duration-500 m-0">
                    <div className="bg-card border border-border rounded-[2rem] md:rounded-[2.5rem] shadow-premium overflow-hidden">
                        <div className="px-6 md:px-10 py-6 md:py-10 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-1.5 w-full text-center sm:text-left">
                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase leading-none">Inquilinos & Locatários</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Base de clientes do portfólio</p>
                            </div>
                            <Button className="h-14 w-full sm:w-auto px-8 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all gap-3 bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest text-xs" onClick={() => setIsAddTenantOpen(true)}>
                                <Plus className="h-5 w-5 stroke-[3px]" /> Novo Locatário
                            </Button>
                        </div>

                        {/* Mobile view (Cards) */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {tenants.filter(t => 
                                t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                t.cpf.includes(searchTerm)
                            ).length === 0 ? (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                                    <Users className="h-12 w-12" />
                                    <p className="font-black text-xs uppercase tracking-widest italic">Nenhum locatário encontrado</p>
                                </div>
                            ) : tenants.filter(t => 
                                t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                t.cpf.includes(searchTerm)
                            ).map(t => (
                                <div key={t.id} className="p-6 bg-muted/20 border border-border/50 rounded-3xl space-y-4 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 font-black text-xl uppercase border border-emerald-500/5">
                                            {t.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="font-black text-base text-foreground leading-tight truncate">{t.name}</p>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <div className="px-2 py-0.5 rounded-md bg-emerald-500/5 inline-flex self-start text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                                                    CPF: {t.cpf}
                                                </div>
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <Mail className="h-3 w-3 text-emerald-500" />
                                                    <p className="text-[10px] font-bold text-muted-foreground truncate">{t.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-destructive hover:text-white" onClick={() => handleDeleteClient(t.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop view (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border bg-muted/20 h-20">
                                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome do Inquilino</TableHead>
                                        <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Contato Principal</TableHead>
                                        <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-border/50">
                                    {tenants.filter(t => 
                                        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        t.cpf.includes(searchTerm)
                                    ).length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Users className="h-16 w-16" />
                                                    <p className="font-black text-lg uppercase tracking-widest italic">Nenhum locatário encontrado</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : tenants.filter(t => 
                                        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        t.cpf.includes(searchTerm)
                                    ).map(t => (
                                        <TableRow key={t.id} className="group hover:bg-muted/30 transition-all border-none h-32">
                                            <TableCell className="px-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 rounded-[1.25rem] bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 font-black text-xl uppercase group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg transition-all">
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-black text-foreground text-lg tracking-tight group-hover:text-emerald-600 transition-colors">{t.name}</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">Locatário Ativo</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-foreground font-black text-sm tracking-tight">
                                                        <Mail className="h-4 w-4 text-emerald-500" />
                                                        {t.email}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase tracking-widest ml-6">E-mail de Contato</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10 text-right">
                                                <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shadow-sm border border-border/50 hover:bg-background transition-all">
                                                        <Edit className="h-4.5 w-4.5" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shadow-sm border border-border/50 hover:bg-destructive hover:text-white transition-all group/delete" onClick={() => handleDeleteClient(t.id)}>
                                                        <Trash2 className="h-4.5 w-4.5 group-hover/delete:scale-110 transition-transform" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ─── MODALS REDESIGN ─── */}
            <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-card">
                    <div className="px-6 py-8 md:px-10 md:py-12 bg-primary group relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Building className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">Novo Imóvel</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 text-sm md:text-lg font-medium tracking-tight">
                                Cadastrar nova unidade no sistema.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleAddProperty} className="p-6 md:p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4 space-y-2">
                                <Label htmlFor="pcep" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CEP</Label>
                                <Input 
                                    id="pcep" 
                                    required 
                                    value={newProperty.cep} 
                                    onChange={async (e) => {
                                        const val = e.target.value.replace(/\D/g, '').substring(0, 8);
                                        setNewProperty({ ...newProperty, cep: val });
                                        if (val.length === 8) {
                                            try {
                                                const res = await fetch(`https://viacep.com.br/ws/${val}/json/`);
                                                const data = await res.json();
                                                if (!data.erro) {
                                                    setNewProperty(prev => ({
                                                        ...prev,
                                                        cep: val,
                                                        logradouro: data.logradouro,
                                                        bairro: data.bairro,
                                                        cidade: data.localidade,
                                                        estado: data.uf
                                                    }));
                                                }
                                            } catch (err) { console.error('CEP fail', err); }
                                        }
                                    }} 
                                    placeholder="00000-000" 
                                    className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" 
                                />
                            </div>
                            <div className="md:col-span-8 space-y-2">
                                <Label htmlFor="plog" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Logradouro / Rua</Label>
                                <Input id="plog" required value={newProperty.logradouro} onChange={e => setNewProperty({ ...newProperty, logradouro: e.target.value })} placeholder="Nome da rua" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label htmlFor="pnum" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Número</Label>
                                <Input id="pnum" required value={newProperty.numero} onChange={e => setNewProperty({ ...newProperty, numero: e.target.value })} placeholder="123" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-8 space-y-2">
                                <Label htmlFor="pcomp" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Complemento</Label>
                                <Input id="pcomp" value={newProperty.complemento} onChange={e => setNewProperty({ ...newProperty, complemento: e.target.value })} placeholder="Apto 42, Bloco B" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-6 space-y-2">
                                <Label htmlFor="pbairro" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Bairro</Label>
                                <Input id="pbairro" required value={newProperty.bairro} onChange={e => setNewProperty({ ...newProperty, bairro: e.target.value })} placeholder="Nome do bairro" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label htmlFor="pcidade" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cidade</Label>
                                <Input id="pcidade" required value={newProperty.cidade} onChange={e => setNewProperty({ ...newProperty, cidade: e.target.value })} placeholder="São Paulo" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="puf" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">UF</Label>
                                <Input id="puf" required maxLength={2} value={newProperty.estado} onChange={e => setNewProperty({ ...newProperty, estado: e.target.value.toUpperCase() })} placeholder="SP" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4 text-center" />
                            </div>
                            <div className="md:col-span-12 space-y-2">
                                <Label htmlFor="pdesc" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Descrição curta (Tipo do imóvel)</Label>
                                <Input id="pdesc" value={newProperty.description} onChange={e => setNewProperty({ ...newProperty, description: e.target.value })} placeholder="Ex: Apartamento 3 Quartos com Suíte" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-4 shrink-0">
                            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest">
                                Finalizar Cadastro
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsAddPropertyOpen(false)}>
                                Cancelar operação
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddLandlordOpen} onOpenChange={setIsAddLandlordOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-card">
                    <div className="px-6 py-8 md:px-10 md:py-12 bg-blue-600 group relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <User className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">Novo Locador</DialogTitle>
                            <DialogDescription className="text-blue-100/80 text-sm md:text-lg font-medium tracking-tight">
                                Adicionar um proprietário de imóvel.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleAddLandlord} className="p-6 md:p-10 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="lname" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nome Completo</Label>
                                <Input id="lname" required value={newLandlord.name} onChange={e => setNewLandlord({ ...newLandlord, name: e.target.value })} placeholder="Ex: João da Silva Santos" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lemail" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">E-mail para Contato</Label>
                                <Input id="lemail" type="email" value={newLandlord.email} onChange={e => setNewLandlord({ ...newLandlord, email: e.target.value })} placeholder="Ex: joao@email.com" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lphone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Telefone</Label>
                                <Input id="lphone" value={newLandlord.phone} onChange={e => setNewLandlord({ ...newLandlord, phone: e.target.value })} placeholder="Ex: (11) 99999-9999" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lcpf" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CPF</Label>
                                <Input id="lcpf" required value={newLandlord.cpf} onChange={e => setNewLandlord({ ...newLandlord, cpf: e.target.value })} placeholder="Ex: 000.000.000-00" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-4 shrink-0">
                            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700 text-white uppercase tracking-widest">
                                Cadastrar Locador
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsAddLandlordOpen(false)}>
                                Cancelar operação
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-card">
                    <div className="px-6 py-8 md:px-10 md:py-12 bg-emerald-600 group relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Users className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-3xl md:text-4xl font-black tracking-tight text-white leading-none">Novo Inquilino</DialogTitle>
                            <DialogDescription className="text-emerald-100/80 text-sm md:text-lg font-medium tracking-tight">
                                Adicionar um locatário ao sistema.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleAddTenant} className="p-6 md:p-10 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="tname" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nome Completo</Label>
                                <Input id="tname" required value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} placeholder="Ex: Maria Oliveira Costa" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="temail" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">E-mail para Contato</Label>
                                <Input id="temail" type="email" value={newTenant.email} onChange={e => setNewTenant({ ...newTenant, email: e.target.value })} placeholder="Ex: maria@email.com" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tphone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Telefone</Label>
                                <Input id="tphone" value={newTenant.phone} onChange={e => setNewTenant({ ...newTenant, phone: e.target.value })} placeholder="Ex: (11) 99999-9999" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tcpf" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CPF</Label>
                                <Input id="tcpf" required value={newTenant.cpf} onChange={e => setNewTenant({ ...newTenant, cpf: e.target.value })} placeholder="Ex: 000.000.000-00" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-4 shrink-0">
                            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest">
                                Cadastrar Inquilino
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsAddTenantOpen(false)}>
                                Cancelar operação
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
