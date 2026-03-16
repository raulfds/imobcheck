'use client';

import React, { useState, useEffect } from 'react';
import { useTenants } from '@/components/providers/tenant-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Ban, Trash2, KeyRound, Users, Building2 } from 'lucide-react';
import { Tenant, SubscriptionPlan } from '@/types';
import { fetchPlans } from '@/lib/database';
import { TenantFacetCard } from '@/components/vistorify/TenantFacetCard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type FormState = { 
    name: string; 
    adminName: string;
    email: string; 
    phone: string;
    plan: string; 
    billingCycle: 'monthly' | 'annual';
    acquisitionDate: string;
    status: 'active' | 'inactive' 
};

const emptyForm: FormState = { 
    name: '', 
    adminName: '',
    email: '', 
    phone: '',
    plan: 'basic', 
    billingCycle: 'monthly',
    acquisitionDate: new Date().toISOString().split('T')[0],
    status: 'active' 
};

export default function SuperAdminTenantsPage() {
    const { tenants, addTenant, updateTenant, deleteTenant, resetTenantAdminPassword } = useTenants();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

    // Create modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState<FormState>(emptyForm);

    // Edit modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<FormState>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Password display modal
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passwordTarget, setPasswordTarget] = useState('');

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const data = await fetchPlans();
                setPlans(data);
                if (data.length > 0) {
                    setCreateForm(prev => ({ ...prev, plan: data[0].name as string }));
                }
            } catch (err) {
                console.error('Error loading plans:', err);
            }
        };
        loadPlans();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.name.trim() || !createForm.email.trim()) return;
        try {
            setSaving(true);
            const selectedPlanId = plans.find((p: SubscriptionPlan) => p.name === createForm.plan)?.id;
            const result = await addTenant({ 
                name: createForm.name, 
                adminName: createForm.adminName,
                email: createForm.email, 
                phone: createForm.phone,
                plan: createForm.plan, 
                planId: selectedPlanId,
                billingCycle: createForm.billingCycle,
                acquisitionDate: createForm.acquisitionDate,
                status: 'active' 
            });
            
            setCreateForm(emptyForm);
            setIsCreateOpen(false);
            
            if (result.tempPassword) {
                setGeneratedPassword(result.tempPassword);
                setPasswordTarget(createForm.email);
                setIsPasswordOpen(true);
            }
        } catch { alert('Erro ao criar imobiliária.'); }
        finally { setSaving(false); }
    };

    const openEdit = (tenant: Tenant) => {
        setEditingId(tenant.id);
        setEditForm({ 
            name: tenant.name, 
            adminName: tenant.adminName || '',
            email: tenant.email, 
            phone: tenant.phone || '',
            plan: tenant.plan, 
            billingCycle: tenant.billingCycle || 'monthly',
            acquisitionDate: tenant.acquisitionDate ? tenant.acquisitionDate.split('T')[0] : new Date().toISOString().split('T')[0],
            status: tenant.status 
        });
        setIsEditOpen(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;
        try {
            setSaving(true);
            const selectedPlanId = plans.find((p: SubscriptionPlan) => p.name === editForm.plan)?.id;
            await updateTenant(editingId, { 
                name: editForm.name, 
                adminName: editForm.adminName,
                email: editForm.email, 
                phone: editForm.phone,
                plan: editForm.plan, 
                planId: selectedPlanId,
                billingCycle: editForm.billingCycle,
                acquisitionDate: editForm.acquisitionDate,
                status: editForm.status 
            });
            setIsEditOpen(false);
            setEditingId(null);
        } catch { alert('Erro ao salvar alterações.'); }
        finally { setSaving(false); }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        await updateTenant(id, { status: currentStatus === 'active' ? 'inactive' : 'active' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja deletar permanentemente esta imobiliária? Esta ação não pode ser desfeita.')) {
            await deleteTenant(id);
        }
    };

    const handleResetPassword = async (tenant: Tenant) => {
        if (confirm(`Deseja gerar uma nova senha de administrador para ${tenant.name}?`)) {
            const newPassword = await resetTenantAdminPassword(tenant.id, tenant.email);
            if (newPassword) {
                setGeneratedPassword(newPassword);
                setPasswordTarget(tenant.email);
                setIsPasswordOpen(true);
            }
        }
    };

    const filtered = tenants.filter((t: Tenant) => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.adminName && t.adminName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTab = activeTab === 'all' || t.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const activeCount = tenants.filter((t: Tenant) => t.status === 'active').length;
    const inactiveCount = tenants.filter((t: Tenant) => t.status === 'inactive').length;

    return (
        <div className="space-y-12 w-full pb-10">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/super-admin" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/super-admin/tenants" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary transition-colors">Assinantes</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Gestão de Ecossistema
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Imobiliárias Parceiras</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">Gerencie imobiliárias, planos e níveis de acesso em toda a rede ImobCheck.</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Reimagined for modern look */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-card rounded-[2rem] border border-border p-8 shadow-premium group hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                            <Users className="h-7 w-7" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 group-hover:text-primary transition-colors">Total de Contas</div>
                    </div>
                    <div>
                        <p className="text-5xl font-black text-foreground tracking-tighter leading-none">{tenants.length}</p>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-3 opacity-60">Imobiliárias no ecossistema</p>
                    </div>
                </div>
                <div className="bg-card rounded-[2rem] border border-border p-8 shadow-premium group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-inner">
                            <CheckCircle2 className="h-7 w-7" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/40 group-hover:text-emerald-500 transition-colors">Operação Ativa</div>
                    </div>
                    <div>
                        <p className="text-5xl font-black text-foreground tracking-tighter leading-none">{activeCount}</p>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-3 opacity-60">Provisionamento estável</p>
                    </div>
                </div>
                <div className="bg-card rounded-[2rem] border border-border p-8 shadow-premium group hover:border-amber-500/50 transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-inner">
                            <AlertTriangle className="h-7 w-7" />
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/40 group-hover:text-amber-500 transition-colors">Ações Pendentes</div>
                    </div>
                    <div>
                        <p className="text-5xl font-black text-foreground tracking-tighter leading-none">{inactiveCount}</p>
                        <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest mt-3 opacity-60">Acessos bloqueados/expirados</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-8">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-1.5 rounded-[1.25rem] shadow-inner">
                        {(['all', 'active', 'inactive'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab
                                    ? 'bg-background text-primary shadow-lg scale-100 ring-1 ring-border'
                                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/80'
                                    }`}
                            >
                                {tab === 'all' ? `Todas` :
                                    tab === 'active' ? `Ativas` :
                                        `Suspensas`}
                                <span className={`ml-3 px-2 py-0.5 rounded-md text-[9px] ${activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground/40'}`}>
                                    {tab === 'all' ? tenants.length :
                                        tab === 'active' ? activeCount :
                                            inactiveCount}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <div className="relative group flex-1 min-w-[320px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar imobiliária, admin ou e-mail..."
                                className="pl-12 bg-card border-border/50 h-16 rounded-2xl shadow-md focus-visible:ring-primary/20 text-sm font-bold placeholder:text-muted-foreground/40"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-16 w-16 rounded-2xl shadow-md shrink-0 border-border/50 bg-card hover:bg-muted/50 transition-all">
                            <Filter className="h-5 w-5" />
                        </Button>
                        <Button className="h-16 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-3 bg-primary text-primary-foreground uppercase tracking-widest text-xs ml-2" onClick={() => setIsCreateOpen(true)}>
                            <Plus className="h-5 w-5 stroke-[3px]" /> Nova Imobiliária
                        </Button>
                    </div>
                </div>

                {/* Grid view using TenantFacetCard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 relative pt-4 -mx-1">
                    {filtered.length === 0 ? (
                        <div className="col-span-full text-center py-24 bg-card border border-border rounded-[2.5rem] shadow-premium">
                            <div className="flex flex-col items-center gap-6 opacity-30">
                                <Building2 className="h-20 w-20" />
                                <div className="space-y-1.5">
                                    <p className="text-xl font-black uppercase tracking-widest italic leading-none">Nenhuma imobiliária encontrada</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Tente ajustar seus filtros de busca</p>
                                </div>
                            </div>
                        </div>
                    ) : filtered.map((tenant: Tenant, idx: number) => {
                        let variant: 'left' | 'center' | 'right' = 'left';
                        const pos = idx % 3;
                        if (pos === 1) variant = 'center';
                        if (pos === 2) variant = 'right';

                        const healthScore = tenant.status === 'active' ? 9.2 : 4.5;

                        return (
                            <div key={tenant.id} className="relative group">
                                <TenantFacetCard
                                    id={tenant.id}
                                    name={tenant.name}
                                    adminName={tenant.adminName || ""}
                                    variant={variant}
                                    inspectionsCount={Math.floor(Math.random() * 50) + 5}
                                    healthScore={healthScore}
                                    onClick={() => openEdit(tenant)}
                                />

                                {/* Absolute positioned quick actions */}
                                <div className={`absolute top-10 right-10 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 ${variant === 'center' ? 'right-14 top-14' : ''}`}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-900/90 hover:bg-black text-white backdrop-blur-xl border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-6 w-6" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 font-black border-border/50 shadow-2xl animate-in zoom-in-95 duration-200">
                                            <DropdownMenuItem onClick={() => openEdit(tenant)} className="cursor-pointer gap-4 h-12 rounded-xl text-[10px] uppercase tracking-widest">
                                                <Pencil className="h-4 w-4" /> Editar Informações
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleResetPassword(tenant)} className="cursor-pointer gap-4 h-12 rounded-xl text-[10px] uppercase tracking-widest text-amber-500 focus:text-amber-500">
                                                <KeyRound className="h-4 w-4" /> Resetar Senha Admin
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-2 opacity-50" />
                                            <DropdownMenuItem onClick={() => handleToggleStatus(tenant.id, tenant.status)} className="cursor-pointer gap-4 h-12 rounded-xl text-[10px] uppercase tracking-widest">
                                                {tenant.status === 'active'
                                                    ? <><Ban className="h-4 w-4 text-amber-500" /> <span className="text-amber-500">Suspender Acesso</span></>
                                                    : <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500">Reativar Acesso</span></>
                                                }
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(tenant.id)} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive gap-4 h-12 rounded-xl text-[10px] uppercase tracking-widest">
                                                <Trash2 className="h-4 w-4" /> Remover Imobiliária
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── CREATE MODAL ─── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="px-10 py-12 bg-primary group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Building2 className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-4xl font-black tracking-tight text-white leading-none">Nova Imobiliária</DialogTitle>
                            <DialogDescription className="text-primary-foreground/80 text-lg font-medium tracking-tight">
                                Provisione um novo ambiente para o cliente no sistema.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="c-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nome da Instituição</Label>
                                <Input
                                    id="c-name"
                                    placeholder="Ex: Imob Prime Negócios"
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg placeholder:text-muted-foreground/40"
                                    value={createForm.name}
                                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c-admin" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Administrador Responsável</Label>
                                <Input
                                    id="c-admin"
                                    placeholder="Nome completo"
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg placeholder:text-muted-foreground/40"
                                    value={createForm.adminName}
                                    onChange={e => setCreateForm(p => ({ ...p, adminName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c-phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Telefone Principal</Label>
                                <Input
                                    id="c-phone"
                                    placeholder="(00) 00000-0000"
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg placeholder:text-muted-foreground/40"
                                    value={createForm.phone}
                                    onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="c-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">E-mail de Acesso Administrativo</Label>
                                <Input
                                    id="c-email"
                                    type="email"
                                    placeholder="gerente@imobiliaria.com.br"
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg placeholder:text-muted-foreground/40"
                                    value={createForm.email}
                                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Plano de Assinatura</Label>
                                <Select
                                    value={createForm.plan}
                                    onValueChange={v => setCreateForm(p => ({ ...p, plan: v as string }))}
                                >
                                    <SelectTrigger className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl p-2 font-bold border-border/50 shadow-2xl">
                                        {plans.map((p: SubscriptionPlan) => (
                                            <SelectItem key={p.id} value={p.name as string} className="rounded-xl h-11">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ciclo de Cobrança</Label>
                                <Select
                                    value={createForm.billingCycle}
                                    onValueChange={v => setCreateForm(p => ({ ...p, billingCycle: v as 'monthly' | 'annual' }))}
                                >
                                    <SelectTrigger className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl p-2 font-bold border-border/50 shadow-2xl">
                                        <SelectItem value="monthly" className="rounded-xl h-11">Mensalidade</SelectItem>
                                        <SelectItem value="annual" className="rounded-xl h-11">Anuidade (Desconto)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-4">
                            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest" disabled={saving}>
                                {saving ? 'Processando...' : 'Finalizar Provisionamento'}
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsCreateOpen(false)}>
                                Cancelar operação
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT MODAL ─── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="px-10 py-12 bg-muted/50 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Pencil className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-4xl font-black tracking-tight text-white leading-none">Editar Assinante</DialogTitle>
                            <DialogDescription className="text-slate-300 text-lg font-medium tracking-tight">
                                Atualize as informações de cadastro e plano do cliente.
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleEdit} className="p-10 space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nome da Imobiliária</Label>
                                <Input
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg"
                                    value={editForm.name}
                                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Admin Responsável</Label>
                                <Input
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg"
                                    value={editForm.adminName}
                                    onChange={e => setEditForm(p => ({ ...p, adminName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Telefone</Label>
                                <Input
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg"
                                    value={editForm.phone}
                                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email de Contato</Label>
                                <Input
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg opacity-50 cursor-not-allowed"
                                    value={editForm.email}
                                    readOnly
                                />
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1 opacity-50">O e-mail principal é imutável nesta tela</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Plano Atual</Label>
                                <Select
                                    value={editForm.plan}
                                    onValueChange={v => setEditForm(p => ({ ...p, plan: v as string }))}
                                >
                                    <SelectTrigger className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl p-2 font-bold border-border/50 shadow-2xl">
                                        {plans.map((p: SubscriptionPlan) => (
                                            <SelectItem key={p.id} value={p.name as string} className="rounded-xl h-11">{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Ciclo Ativo</Label>
                                <Select
                                    value={editForm.billingCycle}
                                    onValueChange={v => setEditForm(p => ({ ...p, billingCycle: v as 'monthly' | 'annual' }))}
                                >
                                    <SelectTrigger className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-lg">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl p-2 font-bold border-border/50 shadow-2xl">
                                        <SelectItem value="monthly" className="rounded-xl h-11">Mensal</SelectItem>
                                        <SelectItem value="annual" className="rounded-xl h-11">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Estado da Assinatura</Label>
                                <Select
                                    value={editForm.status}
                                    onValueChange={v => setEditForm(p => ({ ...p, status: v as FormState['status'] }))}
                                >
                                    <SelectTrigger className={`h-16 rounded-2xl border-border/50 font-black px-6 text-lg ${editForm.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl p-2 font-black border-border/50 shadow-2xl">
                                        <SelectItem value="active" className="rounded-xl h-11 text-emerald-600">ATIVO / EM DIA</SelectItem>
                                        <SelectItem value="inactive" className="rounded-xl h-11 text-destructive">SUSPENSO / INADIMPLENTE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-4">
                            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest" disabled={saving}>
                                {saving ? 'Salvando...' : 'Confirmar Alterações'}
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsEditOpen(false)}>
                                Descartar mudanças
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── PASSWORD MODAL ─── */}
            <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8 overflow-hidden border-none shadow-2xl">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Senha Gerada!</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Esta é a senha temporária para o acesso de <strong>{passwordTarget}</strong>. 
                            <br />Copie e envie para o usuário.
                        </DialogDescription>
                        
                        <div className="w-full bg-muted p-5 rounded-2xl flex items-center justify-between border-2 border-dashed border-primary/20 group hover:border-primary/50 transition-colors">
                            <code className="text-2xl font-mono font-black tracking-widest text-foreground">
                                {generatedPassword}
                            </code>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="rounded-xl h-10 px-4 font-bold"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedPassword);
                                    alert('Senha copiada!');
                                }}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Copiar
                            </Button>
                        </div>
                        
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-left">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                Esta senha é temporária. O sistema obrigará o usuário a cadastrar uma nova senha pessoal assim que ele realizar o primeiro login.
                            </p>
                        </div>
                        
                        <Button className="w-full h-12 rounded-xl font-black mt-4 shadow-lg shadow-primary/20" onClick={() => setIsPasswordOpen(false)}>
                            Já guarduei a senha
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
