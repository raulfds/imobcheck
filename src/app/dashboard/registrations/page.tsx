'use client';

import { useState, useEffect, useCallback } from 'react';
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
    const [newProperty, setNewProperty] = useState({ address: '', description: '' });
    const [newLandlord, setNewLandlord] = useState({ name: '', email: '' });
    const [newTenant, setNewTenant] = useState({ name: '', email: '' });

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
            if (isSupabaseConfigured) {
                const p = await createProperty({ tenantId: agencyId, ...newProperty });
                setProperties(prev => [p, ...prev]);
            } else {
                const p: Property = { id: `p${Date.now()}`, tenantId: agencyId, ...newProperty };
                setProperties(prev => [p, ...prev]);
            }
            setIsAddPropertyOpen(false);
            setNewProperty({ address: '', description: '' });
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
            setNewLandlord({ name: '', email: '' });
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
            setNewTenant({ name: '', email: '' });
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
        <div className="space-y-10 max-w-7xl mx-auto pb-10">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Breadcrumb className="mb-4">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-30" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/registrations" className="text-xs font-bold uppercase tracking-widest text-primary">Cadastros</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Gestão de Portfólio</h1>
                    <p className="text-muted-foreground font-medium mt-1 italic">Organize seus imóveis, proprietários e futuros inquilinos.</p>
                </div>
            </div>

            <Tabs defaultValue="properties" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-14 w-full md:w-auto self-start">
                        <TabsTrigger value="properties" className="rounded-xl px-8 h-11 flex gap-2 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                            <Building className="h-4 w-4" /> Imóveis
                        </TabsTrigger>
                        <TabsTrigger value="landlords" className="rounded-xl px-8 h-11 flex gap-2 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                            <User className="h-4 w-4" /> Locadores
                        </TabsTrigger>
                        <TabsTrigger value="tenants" className="rounded-xl px-8 h-11 flex gap-2 font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                            <Users className="h-4 w-4" /> Locatários
                        </TabsTrigger>
                    </TabsList>
                    
                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input placeholder="Filtrar registros..." className="h-14 pl-10 pr-4 rounded-2xl bg-card border-none shadow-md w-full md:w-64 font-medium focus-visible:ring-primary/20" />
                        </div>
                        <Button variant="secondary" size="icon" className="h-14 w-14 rounded-2xl shadow-md shrink-0">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* ─── IMÓVEIS CONTENT ─── */}
                <TabsContent value="properties" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-xl bg-card overflow-hidden">
                        <CardHeader className="px-8 py-8 border-b border-border/40 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Imóveis</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Total de {properties.length} unidades registradas</CardDescription>
                            </div>
                            <Button className="h-11 px-6 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2" onClick={() => setIsAddPropertyOpen(true)}>
                                <Plus className="h-4 w-4" /> Novo Imóvel
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/30">
                                        <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço do Imóvel</TableHead>
                                        <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo / Descrição</TableHead>
                                        <TableHead className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {properties.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-20 italic text-muted-foreground font-medium">Nenhum imóvel cadastrado ainda.</TableCell></TableRow>
                                    ) : properties.map(p => (
                                        <TableRow key={p.id} className="group hover:bg-muted/30 transition-all border-b border-border/20 last:border-0 h-20">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                                        <MapPin className="h-5 w-5" />
                                                    </div>
                                                    <p className="font-black text-foreground truncate max-w-[300px]">{p.address}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 font-bold text-muted-foreground italic">
                                                {p.description || "Sem descrição"}
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-background transition-all">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500 hover:text-white transition-all" onClick={() => handleDeleteProperty(p.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── LOCADORES CONTENT ─── */}
                <TabsContent value="landlords" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-xl bg-card overflow-hidden">
                        <CardHeader className="px-8 py-8 border-b border-border/40 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Locadores</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Proprietários parceiros</CardDescription>
                            </div>
                            <Button className="h-11 px-6 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2" onClick={() => setIsAddLandlordOpen(true)}>
                                <Plus className="h-4 w-4" /> Novo Locador
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/30">
                                        <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</TableHead>
                                        <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informações de Contato</TableHead>
                                        <TableHead className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {landlords.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-20 italic text-muted-foreground font-medium">Nenhum locador registrado.</TableCell></TableRow>
                                    ) : landlords.map(l => (
                                        <TableRow key={l.id} className="group hover:bg-muted/30 transition-all border-b border-border/20 last:border-0 h-20">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 font-black text-xs uppercase">
                                                        {l.name.charAt(0)}
                                                    </div>
                                                    <p className="font-black text-foreground">{l.name}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                    <Mail className="h-3 w-3 opacity-50" />
                                                    {l.email}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-background transition-all">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500 hover:text-white transition-all" onClick={() => handleDeleteLandlord(l.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ─── LOCATÁRIOS CONTENT ─── */}
                <TabsContent value="tenants" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border-none shadow-xl bg-card overflow-hidden">
                        <CardHeader className="px-8 py-8 border-b border-border/40 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Locatários</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Base de inquilinos ativa</CardDescription>
                            </div>
                            <Button className="h-11 px-6 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2" onClick={() => setIsAddTenantOpen(true)}>
                                <Plus className="h-4 w-4" /> Novo Locatário
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/30">
                                        <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</TableHead>
                                        <TableHead className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informações de Contato</TableHead>
                                        <TableHead className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants.length === 0 ? (
                                        <TableRow><TableCell colSpan={3} className="text-center py-20 italic text-muted-foreground font-medium">Nenhum inquilino registrado.</TableCell></TableRow>
                                    ) : tenants.map(t => (
                                        <TableRow key={t.id} className="group hover:bg-muted/30 transition-all border-b border-border/20 last:border-0 h-20">
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 font-black text-xs uppercase">
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <p className="font-black text-foreground">{t.name}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8">
                                                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                                    <Mail className="h-3 w-3 opacity-50" />
                                                    {t.email}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-background transition-all">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-500 hover:text-white transition-all" onClick={() => handleDeleteClient(t.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ─── MODALS REDESIGN ─── */}
            <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-foreground p-8 text-card-foreground relative overflow-hidden">
                        <Building className="h-24 w-24 text-card-foreground/10 absolute -bottom-4 -right-4 rotate-12" />
                        <DialogTitle className="text-3xl font-black tracking-tight">Novo Imóvel</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-2 text-base font-medium opacity-80">
                            Preencha as informações básicas para o novo registro.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleAddProperty} className="p-8 space-y-6 bg-card">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço Completo</Label>
                                <Input id="address" required value={newProperty.address} onChange={e => setNewProperty({ ...newProperty, address: e.target.value })} placeholder="Rua, Número, Bairro, Cidade - UF" className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição / Tipo</Label>
                                <Input id="description" value={newProperty.description} onChange={e => setNewProperty({ ...newProperty, description: e.target.value })} placeholder="Ex: Apartamento 2 Quartos" className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Salvar Unidade
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-12 font-bold opacity-60 hover:opacity-100" onClick={() => setIsAddPropertyOpen(false)}>
                                Descartar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddLandlordOpen} onOpenChange={setIsAddLandlordOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <User className="h-24 w-24 text-white/10 absolute -bottom-4 -right-4 rotate-12" />
                        <DialogTitle className="text-3xl font-black tracking-tight text-white">Novo Locador</DialogTitle>
                        <DialogDescription className="text-blue-100 mt-2 text-base font-medium opacity-80">
                            Proprietário do imóvel.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleAddLandlord} className="p-8 space-y-6 bg-card">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="lname" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <Input id="lname" required value={newLandlord.name} onChange={e => setNewLandlord({ ...newLandlord, name: e.target.value })} className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lemail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                                <Input id="lemail" type="email" value={newLandlord.email} onChange={e => setNewLandlord({ ...newLandlord, email: e.target.value })} className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-blue-600 hover:bg-blue-700">
                                Cadastrar Proprietário
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-12 font-bold opacity-60 hover:opacity-100" onClick={() => setIsAddLandlordOpen(false)}>
                                Descartar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
                        <Users className="h-24 w-24 text-white/10 absolute -bottom-4 -right-4 rotate-12" />
                        <DialogTitle className="text-3xl font-black tracking-tight text-white">Novo Locatário</DialogTitle>
                        <DialogDescription className="text-emerald-100 mt-2 text-base font-medium opacity-80">
                            O futuro inquilino do imóvel.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleAddTenant} className="p-8 space-y-6 bg-card">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="tname" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <Input id="tname" required value={newTenant.name} onChange={e => setNewTenant({ ...newTenant, name: e.target.value })} className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="temail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                                <Input id="temail" type="email" value={newTenant.email} onChange={e => setNewTenant({ ...newTenant, email: e.target.value })} className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700">
                                Cadastrar Inquilino
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-12 font-bold opacity-60 hover:opacity-100" onClick={() => setIsAddTenantOpen(false)}>
                                Descartar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
