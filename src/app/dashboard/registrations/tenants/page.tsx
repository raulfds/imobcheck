'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    Users, 
    Search, 
    Plus, 
    Edit, 
    Trash2, 
    Mail,
    Filter
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/components/auth/auth-provider';
import { Client } from '@/types';
import {
    fetchClients, createClient, deleteClient
} from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { mockClients } from '@/lib/mock-data';
import { RegistrationsNav } from '@/components/vistorify/RegistrationsNav';

export default function TenantsPage() {
    const { user } = useAuth();
    const agencyId = user?.tenantId ?? 't1';

    const [tenants, setTenants] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);

    const [newTenant, setNewTenant] = useState({ name: '', email: '', cpf: '', phone: '' });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (isSupabaseConfigured) {
                const props = await fetchClients(agencyId);
                setTenants(props);
            } else {
                setTenants(mockClients.filter(c => c.tenantId === agencyId));
            }
        } catch (err) {
            console.error('Failed to load tenants:', err);
        } finally {
            setLoading(false);
        }
    }, [agencyId]);

    useEffect(() => { loadData(); }, [loadData]);

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

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Excluir este locatário?')) return;
        if (isSupabaseConfigured) await deleteClient(id);
        setTenants(prev => prev.filter(t => t.id !== id));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-bold animate-pulse">Buscando locatários...</p>
            </div>
        );
    }

    const filteredItems = tenants.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.cpf.includes(searchTerm)
    );

    return (
        <div className="space-y-8 w-full pb-10">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pt-4 md:pt-0">
                <div className="space-y-3 md:space-y-4">
                    <Breadcrumb className="hidden md:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/registrations" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">Cadastros</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/registrations/tenants" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Inquilinos</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-1.5 md:space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                            <Users className="h-3 w-3" />
                            Gestão de Locatários
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">Base de Clientes</h1>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <RegistrationsNav />
                
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                        <Input 
                            placeholder="Buscar inquilino..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 md:h-16 pl-12 pr-4 md:pl-12 md:pr-6 rounded-2xl bg-card border-border/50 shadow-md w-full font-bold focus-visible:ring-emerald-500/20 text-xs md:text-sm" 
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-12 md:h-16 w-12 md:w-16 rounded-2xl shadow-md shrink-0 border-border/50 bg-card hover:bg-muted/50 transition-all flex md:hidden">
                        <Filter className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl md:rounded-[2.5rem] shadow-premium overflow-hidden w-full m-0">
                <div className="px-5 md:px-10 py-6 md:py-10 border-b border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4 md:gap-6">
                    <div className="space-y-1 w-full text-center sm:text-left">
                        <h3 className="text-lg md:text-2xl font-black tracking-tight text-foreground uppercase leading-tight">Inquilinos & Locatários</h3>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{tenants.length} registros ativos</p>
                    </div>
                    <Button className="h-12 md:h-14 w-full sm:w-auto px-6 md:px-8 rounded-xl md:rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 md:gap-3 bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest text-[10px] md:text-xs" onClick={() => setIsAddTenantOpen(true)}>
                        <Plus className="h-4 w-4 md:h-5 md:w-5 stroke-[3px]" /> Novo Locatário
                    </Button>
                </div>
                
                {/* Mobile view (Cards) */}
                <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                    {filteredItems.length === 0 ? (
                        <div className="py-16 text-center opacity-30 flex flex-col items-center gap-4">
                            <Users className="h-12 w-12" />
                            <p className="font-black text-[10px] uppercase tracking-widest italic">Nenhum locatário encontrado</p>
                        </div>
                    ) : filteredItems.map(t => (
                        <div key={t.id} className="p-6 bg-muted/30 border border-border/40 rounded-2xl space-y-5 shadow-sm active:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-5">
                                <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 font-black text-xl uppercase border border-emerald-500/5 shadow-inner">
                                    {t.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-foreground leading-tight truncate">{t.name}</p>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 inline-flex self-start text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-500/10">
                                            CPF: {t.cpf}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <Mail className="h-3.5 w-3.5 text-emerald-500" />
                                            <p className="text-[10px] font-bold text-muted-foreground truncate">{t.email}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
                                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl bg-background border border-border/50 shadow-sm active:scale-95 transition-transform">
                                    <Edit className="h-4.5 w-4.5" />
                                </Button>
                                <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl bg-background border border-border/50 hover:bg-destructive hover:text-white shadow-sm active:scale-95 transition-transform" onClick={() => handleDeleteClient(t.id)}>
                                    <Trash2 className="h-4.5 w-4.5" />
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
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Users className="h-16 w-16" />
                                            <p className="font-black text-lg uppercase tracking-widest italic">Nenhum locatário encontrado</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.map(t => (
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

            {/* MODAL */}
            <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
                <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-card">
                    <div className="px-5 py-6 md:px-10 md:py-12 bg-emerald-600 group relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Users className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-2xl md:text-4xl font-black tracking-tight text-white leading-none">Novo Inquilino</DialogTitle>
                            <DialogDescription className="text-emerald-100/80 text-xs md:text-lg font-medium tracking-tight">
                                Adicionar um locatário ao sistema.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleAddTenant} className="p-5 md:p-10 space-y-6 md:space-y-8">
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
                        <div className="flex flex-col gap-3 pt-2 md:pt-4 shrink-0">
                            <Button type="submit" className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest">
                                Cadastrar Inquilino
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsAddTenantOpen(false)}>
                                Cancelar operação
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
