'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    Building, 
    Search, 
    Plus, 
    Edit, 
    Trash2, 
    MapPin,
    Filter
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/components/auth/auth-provider';
import { Property } from '@/types';
import {
    fetchProperties,
    createProperty,
    deleteProperty
} from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { RegistrationsNav } from '@/components/vistorify/RegistrationsNav';
import { useToast } from '@/hooks/use-toast';

export default function PropertiesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // Garantir que temos o agency_id do usuário
    const agencyId = user?.agency_id;

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [savedPropertyId, setSavedPropertyId] = useState<string | null>(null);

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

    const loadData = useCallback(async () => {
        if (!agencyId) {
            console.error('Agency ID não encontrado');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            if (isSupabaseConfigured) {
                const props = await fetchProperties(agencyId);
                setProperties(props);
            } else {
                // Fallback para dados mockados se necessário
                setProperties([]);
            }
        } catch (err) {
            console.error('Failed to load properties:', err);
            toast({
                title: 'Erro ao carregar',
                description: 'Não foi possível carregar os imóveis.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [agencyId, toast]);

    useEffect(() => { 
        if (agencyId) {
            loadData(); 
        }
    }, [agencyId, loadData]);

    const handleAddProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!agencyId) {
            toast({
                title: 'Erro',
                description: 'Usuário não vinculado a uma agência.',
                variant: 'destructive',
            });
            return;
        }

        if (!newProperty.cep || !newProperty.logradouro || !newProperty.numero || !newProperty.bairro || !newProperty.cidade || !newProperty.estado) {
            toast({
                title: 'Atenção',
                description: 'Preencha todos os campos obrigatórios do endereço.',
                variant: 'destructive',
            });
            return;
        }
        
        setIsSaving(true);
        try {
            const fullAddress = `${newProperty.logradouro}, ${newProperty.numero}${newProperty.complemento ? ' - ' + newProperty.complemento : ''} - ${newProperty.bairro}, ${newProperty.cidade} - ${newProperty.estado}`;
            const propertyData = { 
                tenantId: agencyId, // Isso será mapeado para agency_id
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
                setSavedPropertyId(p.id);
                
                toast({
                    title: 'Sucesso!',
                    description: 'Imóvel cadastrado com sucesso.',
                });
            } else {
                // Modo de desenvolvimento sem Supabase
                const mockProperty: Property = { 
                    id: `temp-${Date.now()}`, 
                    ...propertyData,
                    address: `${propertyData.logradouro}, ${propertyData.numero} - ${propertyData.bairro}, ${propertyData.cidade} - ${propertyData.estado}`
                };
                setProperties(prev => [mockProperty, ...prev]);
                
                toast({
                    title: 'Modo Desenvolvimento',
                    description: 'Imóvel salvo localmente (Supabase não configurado).',
                });
            }
            
            // Não fecha imediatamente se quisermos mostrar opções de próxima ação
            // setIsAddPropertyOpen(false);
            setNewProperty({ 
                cep: '', logradouro: '', numero: '', complemento: '', 
                bairro: '', cidade: '', estado: '', description: '' 
            });
        } catch (err) { 
            console.error(err); 
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar o imóvel. Verifique sua conexão e tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este imóvel?')) return;
        
        try {
            if (isSupabaseConfigured) {
                await deleteProperty(id);
            }
            setProperties(prev => prev.filter(p => p.id !== id));
            
            toast({
                title: 'Sucesso!',
                description: 'Imóvel excluído com sucesso.',
            });
        } catch (err) {
            console.error(err);
            toast({
                title: 'Erro',
                description: 'Erro ao excluir imóvel.',
                variant: 'destructive',
            });
        }
    };

    const handleCepBlur = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                
                if (!data.erro) {
                    setNewProperty(prev => ({
                        ...prev,
                        logradouro: data.logradouro || prev.logradouro,
                        bairro: data.bairro || prev.bairro,
                        cidade: data.localidade || prev.cidade,
                        estado: data.uf || prev.estado
                    }));
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    };

    if (!agencyId) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Building className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground font-bold">Usuário não vinculado a uma agência</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-bold animate-pulse">Buscando imóveis...</p>
            </div>
        );
    }

    const filteredProperties = properties.filter(p => 
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.cep?.includes(searchTerm) ||
        p.logradouro?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 w-full pb-10">
            {/* Header section */}
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
                                <BreadcrumbLink href="/dashboard/registrations/properties" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Imóveis</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-1.5 md:space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                            <Building className="h-3 w-3" />
                            Gestão de Imóveis
                        </div>
                        <h1 className="text-2xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">Portfólio Imobiliário</h1>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <RegistrationsNav />
                
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full md:w-auto">
                    <div className="relative group flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Buscar imóvel..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-12 md:h-16 pl-12 pr-4 md:pl-12 md:pr-6 rounded-2xl bg-card border-border/50 shadow-md w-full font-bold focus-visible:ring-primary/20 text-xs md:text-sm" 
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
                        <h3 className="text-lg md:text-2xl font-black tracking-tight text-foreground uppercase leading-tight">Unidades Cadastradas</h3>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{properties.length} registros ativos</p>
                    </div>
                    <Button className="h-12 md:h-14 w-full sm:w-auto px-6 md:px-8 rounded-xl md:rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 md:gap-3 bg-primary text-primary-foreground uppercase tracking-widest text-[10px] md:text-xs" onClick={() => setIsAddPropertyOpen(true)}>
                        <Plus className="h-4 w-4 md:h-5 md:w-5 stroke-[3px]" /> Novo Imóvel
                    </Button>
                </div>
                
                {/* Mobile view (Cards) */}
                <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                    {filteredProperties.length === 0 ? (
                        <div className="py-16 text-center opacity-30 flex flex-col items-center gap-4">
                            <Building className="h-12 w-12" />
                            <p className="font-black text-[10px] uppercase tracking-widest italic">Nenhum imóvel encontrado</p>
                        </div>
                    ) : filteredProperties.map(p => (
                        <div key={p.id} className="p-6 bg-muted/30 border border-border/40 rounded-2xl space-y-5 shadow-sm active:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-5">
                                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/5 shadow-inner">
                                    <MapPin className="h-7 w-7" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-sm text-foreground leading-tight break-words">{p.address}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <div className="px-3 py-1 rounded-lg bg-background/80 border border-border/50 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            CEP: {p.cep || "---"}
                                        </div>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{p.description || "Residencial"}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-border/10">
                                <span className="text-[9px] font-bold text-muted-foreground opacity-30 uppercase tracking-widest">#{p.id.substring(0, 6)}</span>
                                <div className="flex gap-3">
                                    <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl bg-background border border-border/50 shadow-sm active:scale-95 transition-transform">
                                        <Edit className="h-4.5 w-4.5" />
                                    </Button>
                                    <Button variant="secondary" size="icon" className="h-11 w-11 rounded-xl bg-background border border-border/50 hover:bg-destructive hover:text-white shadow-sm active:scale-95 transition-transform" onClick={() => handleDeleteProperty(p.id)}>
                                        <Trash2 className="h-4.5 w-4.5" />
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
                            {filteredProperties.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Building className="h-16 w-16" />
                                            <p className="font-black text-lg uppercase tracking-widest italic">Nenhum imóvel encontrado</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredProperties.map(p => (
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

            {/* MODAL */}
            <Dialog open={isAddPropertyOpen} onOpenChange={setIsAddPropertyOpen}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl md:rounded-[2.5rem] p-0 border-none shadow-2xl bg-card">
                    <div className="px-5 py-6 md:px-10 md:py-12 bg-primary group relative overflow-hidden shrink-0">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Building className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-2xl md:text-4xl font-black tracking-tight text-white leading-none">Novo Imóvel</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 text-xs md:text-lg font-medium tracking-tight">
                                Cadastrar nova unidade no sistema.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleAddProperty} className="p-5 md:p-10 space-y-6 md:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4 space-y-2">
                                <Label htmlFor="pcep" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">CEP</Label>
                                <Input 
                                    id="pcep" 
                                    value={newProperty.cep} 
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').substring(0, 8);
                                        setNewProperty({ ...newProperty, cep: val });
                                    }}
                                    onBlur={(e) => handleCepBlur(e.target.value)}
                                    placeholder="00000-000" 
                                    className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" 
                                />
                            </div>
                            <div className="md:col-span-8 space-y-2">
                                <Label htmlFor="plog" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Logradouro / Rua</Label>
                                <Input id="plog" value={newProperty.logradouro} onChange={e => setNewProperty({ ...newProperty, logradouro: e.target.value })} placeholder="Nome da rua" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label htmlFor="pnum" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Número</Label>
                                <Input id="pnum" value={newProperty.numero} onChange={e => setNewProperty({ ...newProperty, numero: e.target.value })} placeholder="123" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-8 space-y-2">
                                <Label htmlFor="pcomp" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Complemento</Label>
                                <Input id="pcomp" value={newProperty.complemento} onChange={e => setNewProperty({ ...newProperty, complemento: e.target.value })} placeholder="Apto 42, Bloco B" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-6 space-y-2">
                                <Label htmlFor="pbairro" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Bairro</Label>
                                <Input id="pbairro" value={newProperty.bairro} onChange={e => setNewProperty({ ...newProperty, bairro: e.target.value })} placeholder="Nome do bairro" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-4 space-y-2">
                                <Label htmlFor="pcidade" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cidade</Label>
                                <Input id="pcidade" value={newProperty.cidade} onChange={e => setNewProperty({ ...newProperty, cidade: e.target.value })} placeholder="São Paulo" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="puf" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">UF</Label>
                                <Input id="puf" maxLength={2} value={newProperty.estado} onChange={e => setNewProperty({ ...newProperty, estado: e.target.value.toUpperCase() })} placeholder="SP" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4 text-center" />
                            </div>
                            <div className="md:col-span-12 space-y-2">
                                <Label htmlFor="pdesc" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Descrição curta (Tipo do imóvel)</Label>
                                <Input id="pdesc" value={newProperty.description} onChange={e => setNewProperty({ ...newProperty, description: e.target.value })} placeholder="Ex: Apartamento 3 Quartos com Suíte" className="h-14 rounded-xl bg-muted/30 border-border/50 font-bold px-4" />
                            </div>
                        </div>
                        {savedPropertyId ? (
                            <div className="flex flex-col gap-4 pt-6 animate-in fade-in zoom-in duration-300">
                                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                                    <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-2">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <h4 className="font-black text-emerald-600 uppercase tracking-tight">Imóvel Cadastrado!</h4>
                                    <p className="text-xs text-emerald-600/70 font-bold">O que você deseja fazer agora?</p>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <Button 
                                        type="button" 
                                        className="h-14 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white uppercase tracking-widest text-[10px]"
                                        onClick={() => {
                                            setIsAddPropertyOpen(false);
                                            setSavedPropertyId(null);
                                            router.push(`/dashboard/inspections/new?propertyId=${savedPropertyId}`);
                                        }}
                                    >
                                        Iniciar Vistoria Agora
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        className="h-14 rounded-xl font-black uppercase tracking-widest text-[10px]"
                                        onClick={() => {
                                            setSavedPropertyId(null);
                                            setIsAddPropertyOpen(false);
                                        }}
                                    >
                                        Voltar para a Lista
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost"
                                        className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] opacity-60"
                                        onClick={() => setSavedPropertyId(null)}
                                    >
                                        Cadastrar Outro Imóvel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 pt-2 md:pt-4 shrink-0">
                                <Button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin" />
                                            Salvando...
                                        </div>
                                    ) : 'Finalizar Cadastro'}
                                </Button>
                                <Button type="button" variant="ghost" className="rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsAddPropertyOpen(false)}>
                                    Cancelar operação
                                </Button>
                            </div>
                        )}
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}