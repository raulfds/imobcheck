'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTenants } from '@/components/providers/tenant-provider';
import { Plus, Building2, Users as UsersIcon, CreditCard, MoreHorizontal, Pencil, Ban, Trash2, ArrowUpRight, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { supabase } from '@/lib/supabase'; // Ajuste o path conforme sua estrutura
import { useRouter } from 'next/navigation';

// Interface para os dados do cliente (primeira fase)
interface ClientData {
    name: string;
    email: string;
    phone: string;
    cpf: string;
}

// Interface para os dados da imobiliária (segunda fase)
interface AgencyData {
    name: string;
    email: string;
    plan: string;
    admin_name: string;
    phone: string;
    cnpj: string;
    address: string;
}

export default function SuperAdminDashboard() {
    const { tenants, updateTenant, deleteTenant, addTenant } = useTenants();
    const router = useRouter();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Estados para controlar as fases do formulário
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Dados do cliente (primeira fase)
    const [clientData, setClientData] = useState<ClientData>({
        name: '',
        email: '',
        phone: '',
        cpf: ''
    });
    
    // Dados da imobiliária (segunda fase)
    const [agencyData, setAgencyData] = useState<AgencyData>({
        name: '',
        email: '',
        plan: 'basic',
        admin_name: '',
        phone: '',
        cnpj: '',
        address: ''
    });

    // Reset do formulário
    const resetForm = () => {
        setCurrentStep(1);
        setError(null);
        setClientData({
            name: '',
            email: '',
            phone: '',
            cpf: ''
        });
        setAgencyData({
            name: '',
            email: '',
            plan: 'basic',
            admin_name: '',
            phone: '',
            cnpj: '',
            address: ''
        });
    };

    // Fechar modal com reset
    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    // Primeira fase: Criar cliente
    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            // Inserir na tabela clients
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .insert([
                    {
                        name: clientData.name,
                        email: clientData.email,
                        phone: clientData.phone,
                        cpf: clientData.cpf,
                        // agency_id será atualizado após criar a agência
                    }
                ])
                .select()
                .single();
            
            if (clientError) throw clientError;
            
            // Armazenar o ID do cliente criado no sessionStorage
            sessionStorage.setItem('temp_client_id', client.id);
            sessionStorage.setItem('temp_client_name', client.name);
            
            // Avançar para segunda fase
            setCurrentStep(2);
        } catch (error: any) {
            console.error('Erro ao criar cliente:', error);
            setError(error.message || 'Erro ao criar cliente. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    // Segunda fase: Criar agência (imobiliária)
    const handleCreateAgency = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            const tempClientId = sessionStorage.getItem('temp_client_id');
            const tempClientName = sessionStorage.getItem('temp_client_name');
            
            if (!tempClientId) {
                throw new Error('ID do cliente não encontrado. Por favor, inicie o cadastro novamente.');
            }
            
            // Inserir na tabela agencies
            const { data: agency, error: agencyError } = await supabase
                .from('agencies')
                .insert([
                    {
                        name: agencyData.name,
                        email: agencyData.email,
                        plan: agencyData.plan,
                        admin_name: agencyData.admin_name,
                        phone: agencyData.phone,
                        cnpj: agencyData.cnpj,
                        address: agencyData.address,
                        status: 'active',
                        billing_cycle: 'monthly',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ])
                .select()
                .single();
            
            if (agencyError) throw agencyError;
            
            // Atualizar o cliente com o agency_id
            const { error: updateError } = await supabase
                .from('clients')
                .update({ agency_id: agency.id })
                .eq('id', tempClientId);
            
            if (updateError) throw updateError;
            
            // Atualizar o estado local dos tenants (agências)
            if (agency && addTenant) {
                const newTenant = {
                    id: agency.id,
                    name: agency.name,
                    email: agency.email,
                    plan: agency.plan,
                    status: agency.status
                };
                addTenant(newTenant);
            }
            
            // Limpar dados temporários
            sessionStorage.removeItem('temp_client_id');
            sessionStorage.removeItem('temp_client_name');
            
            // Fechar modal e resetar formulário
            handleCloseModal();
            
            // Mostrar mensagem de sucesso
            alert(`Imobiliária ${agency.name} criada com sucesso!`);
            
            // Refresh da página para atualizar a lista
            router.refresh();
            
        } catch (error: any) {
            console.error('Erro ao criar imobiliária:', error);
            setError(error.message || 'Erro ao criar imobiliária. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    // Função para voltar à primeira fase
    const handleBackToFirstStep = () => {
        setCurrentStep(1);
        setError(null);
    };

    const toggleStatus = (id: string) => {
        const tenant = tenants.find(t => t.id === id);
        if (tenant) updateTenant(id, { status: tenant.status === 'active' ? 'inactive' : 'active' });
    };

    const removeTenant = (id: string) => {
        if (confirm('Tem certeza que deseja remover esta imobiliária?')) {
            deleteTenant(id);
        }
    };

    return (
        <div className="space-y-12 w-full pb-10">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/super-admin" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary transition-colors">Visão Geral</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                            <TrendingUp className="h-3 w-3" />
                            Controle da Rede
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Painel de Controle</h1>
                        <p className="text-muted-foreground text-base md:text-lg font-medium tracking-tight">Monitoramento do ecossistema ImobCheck.</p>
                    </div>
                </div>
                <Button className="h-14 md:h-16 px-6 md:px-8 rounded-xl md:rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-3 bg-primary text-primary-foreground uppercase tracking-widest text-xs" onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-5 w-5 stroke-[3px]" /> Novo Cliente
                </Button>
            </div>

            {/* Stats Cards - Refined for mobile-first */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                <div className="bg-card rounded-2xl md:rounded-[2rem] border border-border p-6 md:p-8 shadow-premium group hover:border-primary/50 transition-all flex md:block items-center justify-between md:justify-start">
                    <div className="flex items-center md:items-start justify-between md:mb-6 w-full md:w-auto">
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                            <Building2 className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        <div className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">Total Assinantes</div>
                    </div>
                    <div>
                        <p className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none">{tenants.length}</p>
                        <div className="flex items-center gap-2 mt-2 md:mt-3 font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-emerald-500">
                             <ArrowUpRight className="h-3 w-3" />
                             +4 este mês
                        </div>
                    </div>
                </div>
                
                <div className="bg-card rounded-2xl md:rounded-[2rem] border border-border p-6 md:p-8 shadow-premium group hover:border-primary/50 transition-all flex md:block items-center justify-between md:justify-start">
                    <div className="flex items-center md:items-start justify-between md:mb-6 w-full md:w-auto">
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                            <UsersIcon className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        <div className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">Usuários Ativos</div>
                    </div>
                    <div>
                        <p className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none">542</p>
                        <div className="flex items-center gap-2 mt-2 md:mt-3 font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-emerald-500">
                             <ArrowUpRight className="h-3 w-3" />
                             +12% vs anterior
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-2xl md:rounded-[2rem] border border-border p-6 md:p-8 shadow-premium group hover:border-primary/50 transition-all flex md:block items-center justify-between md:justify-start sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center md:items-start justify-between md:mb-6 w-full md:w-auto">
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-inner">
                            <DollarSign className="h-6 w-6 md:h-7 md:w-7" />
                        </div>
                        <div className="hidden md:block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">Receita Recorrente</div>
                    </div>
                    <div>
                        <p className="text-3xl md:text-5xl font-black text-foreground tracking-tighter leading-none truncate overflow-hidden">R$ 12.4K</p>
                        <div className="flex items-center gap-2 mt-2 md:mt-3 font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-primary">
                             <ArrowUpRight className="h-3 w-3" />
                             +R$ 1.200 projetado
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area - Refined Table - Scrollable for mobile */}
            <Card className="rounded-2xl md:rounded-[2.5rem] border border-border shadow-premium overflow-hidden bg-card">
                <CardHeader className="p-6 md:p-8 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl md:text-2xl font-black tracking-tight text-foreground">Imobiliárias Recentes</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium mt-1">Últimos clientes provisionados.</CardDescription>
                        </div>
                        <Button variant="ghost" className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => window.location.href = '/super-admin/tenants'}>
                            Ver Todas
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/50 h-16 hover:bg-transparent">
                                <TableHead className="px-6 md:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Imobiliária</TableHead>
                                <TableHead className="px-6 md:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap hidden md:table-cell">E-mail Admin</TableHead>
                                <TableHead className="px-6 md:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center whitespace-nowrap">Plano</TableHead>
                                <TableHead className="px-6 md:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center whitespace-nowrap">Status</TableHead>
                                <TableHead className="px-6 md:px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right whitespace-nowrap">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id} className="group border-b border-border/50 h-20 hover:bg-muted/30 transition-colors">
                                    <TableCell className="px-6 md:px-8">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground shrink-0 uppercase">
                                                {tenant.name.substring(0, 2)}
                                            </div>
                                            <span className="font-bold text-foreground text-xs md:text-sm truncate max-w-[120px] md:max-w-none">{tenant.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 md:px-8 text-muted-foreground text-sm font-medium hidden md:table-cell">{tenant.email}</TableCell>
                                    <TableCell className="px-8 text-center">
                                        <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-background border-border/50 text-foreground">
                                            {tenant.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-8 text-center">
                                        <div className="flex justify-center">
                                            <Badge
                                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none ${
                                                    tenant.status === 'active' 
                                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                                    : 'bg-destructive/10 text-destructive'
                                                }`}
                                            >
                                                {tenant.status === 'active' ? 'Ativo' : 'Suspenso'}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger render={
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all" />
                                            }>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 font-black border-border/50 shadow-2xl">
                                                <DropdownMenuLabel className="text-[9px] uppercase tracking-widest opacity-40 px-3 py-2">Opções de Gestão</DropdownMenuLabel>
                                                <DropdownMenuItem className="cursor-pointer gap-3 h-11 rounded-xl text-[10px] uppercase tracking-widest">
                                                    <Pencil className="h-4 w-4" /> Editar Cadastro
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className={`cursor-pointer gap-3 h-11 rounded-xl text-[10px] uppercase tracking-widest ${tenant.status === 'active' ? 'text-amber-500' : 'text-emerald-500'}`}
                                                    onClick={() => toggleStatus(tenant.id)}
                                                >
                                                    <Ban className="h-4 w-4" />
                                                    {tenant.status === 'active' ? 'Suspender Acesso' : 'Reativar Acesso'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-2 opacity-50" />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer gap-3 h-11 rounded-xl text-[10px] uppercase tracking-widest"
                                                    onClick={() => removeTenant(tenant.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Excluir permanentemente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tenants.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground bg-muted/5 italic">
                                        Nenhuma imobiliária provisionada ainda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Client Modal - Versão com duas fases */}
            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent className="w-[95vw] md:max-w-2xl rounded-2xl md:rounded-[2.5rem] p-0 overflow-hidden border-border/50 shadow-2xl bg-card">
                    <div className="px-6 md:px-10 py-8 md:py-12 bg-primary group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 md:p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Building2 className="h-20 w-20 md:h-32 md:w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-2xl md:text-4xl font-black tracking-tight text-white leading-none">
                                {currentStep === 1 ? 'Novo Cliente' : 'Nova Imobiliária'}
                            </DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 text-sm md:text-lg font-medium tracking-tight">
                                {currentStep === 1 
                                    ? 'Cadastre os dados do cliente (proprietário).' 
                                    : 'Configure a imobiliária deste cliente.'}
                            </DialogDescription>
                            {/* Indicador de progresso */}
                            <div className="flex gap-2 mt-4">
                                <div className={`h-1 flex-1 rounded-full ${currentStep >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                                <div className={`h-1 flex-1 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                            </div>
                            {/* Nome do cliente na segunda fase */}
                            {currentStep === 2 && sessionStorage.getItem('temp_client_name') && (
                                <div className="mt-2 text-sm text-primary-foreground/60">
                                    Cliente: <span className="font-bold text-white">{sessionStorage.getItem('temp_client_name')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <div className="mx-6 md:mx-10 mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* Primeira Fase: Formulário do Cliente */}
                    {currentStep === 1 && (
                        <form onSubmit={handleCreateClient} className="p-6 md:p-10 space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="clientName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Nome do Cliente *
                                    </Label>
                                    <Input 
                                        id="clientName" 
                                        placeholder="Ex: João da Silva"
                                        value={clientData.name}
                                        onChange={(e) => setClientData({...clientData, name: e.target.value})}
                                        required 
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40" 
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="clientEmail" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        E-mail *
                                    </Label>
                                    <Input
                                        id="clientEmail"
                                        type="email"
                                        placeholder="cliente@email.com"
                                        value={clientData.email}
                                        onChange={(e) => setClientData({...clientData, email: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="clientPhone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Telefone *
                                    </Label>
                                    <Input
                                        id="clientPhone"
                                        placeholder="(11) 99999-9999"
                                        value={clientData.phone}
                                        onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="clientCpf" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        CPF *
                                    </Label>
                                    <Input
                                        id="clientCpf"
                                        placeholder="000.000.000-00"
                                        value={clientData.cpf}
                                        onChange={(e) => setClientData({...clientData, cpf: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 md:gap-4 pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Cadastrando...
                                        </>
                                    ) : (
                                        'Continuar para Imobiliária'
                                    )}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className="rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all disabled:opacity-20" 
                                    onClick={handleCloseModal}
                                    disabled={isLoading}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Segunda Fase: Formulário da Imobiliária */}
                    {currentStep === 2 && (
                        <form onSubmit={handleCreateAgency} className="p-6 md:p-10 space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="agencyName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Nome da Imobiliária *
                                    </Label>
                                    <Input 
                                        id="agencyName" 
                                        placeholder="Ex: Imob Prime Negócios"
                                        value={agencyData.name}
                                        onChange={(e) => setAgencyData({...agencyData, name: e.target.value})}
                                        required 
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40" 
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="agencyEmail" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        E-mail da Imobiliária *
                                    </Label>
                                    <Input
                                        id="agencyEmail"
                                        type="email"
                                        placeholder="contato@imobiliaria.com.br"
                                        value={agencyData.email}
                                        onChange={(e) => setAgencyData({...agencyData, email: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adminName" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Nome do Administrador *
                                    </Label>
                                    <Input
                                        id="adminName"
                                        placeholder="Nome do responsável"
                                        value={agencyData.admin_name}
                                        onChange={(e) => setAgencyData({...agencyData, admin_name: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="agencyPhone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Telefone da Imobiliária *
                                    </Label>
                                    <Input
                                        id="agencyPhone"
                                        placeholder="(11) 3333-4444"
                                        value={agencyData.phone}
                                        onChange={(e) => setAgencyData({...agencyData, phone: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cnpj" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        CNPJ *
                                    </Label>
                                    <Input
                                        id="cnpj"
                                        placeholder="00.000.000/0000-00"
                                        value={agencyData.cnpj}
                                        onChange={(e) => setAgencyData({...agencyData, cnpj: e.target.value})}
                                        required
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Endereço
                                    </Label>
                                    <Input
                                        id="address"
                                        placeholder="Rua, número, bairro, cidade - UF"
                                        value={agencyData.address}
                                        onChange={(e) => setAgencyData({...agencyData, address: e.target.value})}
                                        disabled={isLoading}
                                        className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg placeholder:text-muted-foreground/40"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="plan" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                        Plano Inicial *
                                    </Label>
                                    <Select 
                                        value={agencyData.plan} 
                                        onValueChange={(value) => setAgencyData({...agencyData, plan: value || 'basic'})}
                                    >
                                        <SelectTrigger className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-muted/30 border-border/50 font-bold px-4 md:px-6 text-base md:text-lg">
                                            <SelectValue placeholder="Selecione um plano" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl md:rounded-2xl p-2 font-bold border-border/50 shadow-2xl">
                                            <SelectItem value="basic" className="rounded-lg md:rounded-xl h-11">Basic (Até 3 usuários)</SelectItem>
                                            <SelectItem value="pro" className="rounded-lg md:rounded-xl h-11">Pro (Ilimitado)</SelectItem>
                                            <SelectItem value="enterprise" className="rounded-lg md:rounded-xl h-11">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 md:gap-4 pt-4">
                                <div className="flex gap-3">
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={handleBackToFirstStep}
                                        disabled={isLoading}
                                        className="flex-1 h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-lg border-border/50 uppercase tracking-widest disabled:opacity-50"
                                    >
                                        Voltar
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="flex-1 h-14 md:h-16 rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Criando...
                                            </>
                                        ) : (
                                            'Criar Imobiliária'
                                        )}
                                    </Button>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className="rounded-xl md:rounded-2xl h-12 md:h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all disabled:opacity-20" 
                                    onClick={handleCloseModal}
                                    disabled={isLoading}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}