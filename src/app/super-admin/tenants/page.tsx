'use client';

import { useState, useEffect } from 'react';
import { useTenants } from '@/components/providers/tenant-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Building2, Search, MoreHorizontal, Pencil, Ban, Trash2, ShieldCheck, KeyRound, CheckCircle2, Users, CreditCard, AlertTriangle, Phone, Calendar, User as UserIcon, Clock, RefreshCcw } from 'lucide-react';
import { Tenant, SubscriptionPlan } from '@/types';
import { fetchPlans } from '@/lib/database';

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
    const { tenants, addTenant, updateTenant, deleteTenant, resetTenantAdminPassword, loading } = useTenants();
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
            const selectedPlanId = plans.find(p => p.name === createForm.plan)?.id;
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
            const selectedPlanId = plans.find(p => p.name === editForm.plan)?.id;
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

    const handleToggleStatus = (tenant: Tenant) => {
        updateTenant(tenant.id, { status: tenant.status === 'active' ? 'inactive' : 'active' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este assinante?')) {
            await deleteTenant(id);
        }
    };

    const handleResetPassword = async (tenant: Tenant) => {
        try {
            setSaving(true);
            const newPassword = await resetTenantAdminPassword(tenant.id, tenant.email);
            setGeneratedPassword(newPassword);
            setPasswordTarget(tenant.email);
            setIsPasswordOpen(true);
        } catch (err) {
            console.error('Error resetting password:', err);
            alert('Erro ao resetar senha.');
        } finally {
            setSaving(false);
        }
    };

    const filtered = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.adminName && t.adminName.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTab = activeTab === 'all' || t.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const activeCount = tenants.filter(t => t.status === 'active').length;
    const inactiveCount = tenants.filter(t => t.status === 'inactive').length;

    return (
        <div className="space-y-8 max-w-full px-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Assinantes</h1>
                    <p className="text-muted-foreground mt-1">Gestão de imobiliárias, planos e acessos ao sistema.</p>
                </div>
                <Button className="gap-2 shadow-lg h-11 px-6 rounded-xl hover:scale-105 transition-transform" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-5 w-5" />
                    Nova Imobiliária
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1">Total</Badge>
                    </div>
                    <p className="text-3xl font-black text-foreground">{tenants.length}</p>
                    <p className="text-sm text-muted-foreground font-medium">Imobiliárias cadastradas</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-none px-3 py-1">Ativas</Badge>
                    </div>
                    <p className="text-3xl font-black text-foreground">{activeCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Operando normalmente</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-amber-500" />
                        </div>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-none px-3 py-1">Atenção</Badge>
                    </div>
                    <p className="text-3xl font-black text-foreground">{inactiveCount}</p>
                    <p className="text-sm text-muted-foreground font-medium">Contas suspensas</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-6 py-5 border-b border-border bg-muted">
                    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
                        {(['all', 'active', 'inactive'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                            >
                                {tab === 'all' ? `Todas` :
                                    tab === 'active' ? `Ativas` :
                                        `Suspensas`}
                                <span className="ml-2 opacity-50 font-normal">
                                    {tab === 'all' ? tenants.length :
                                        tab === 'active' ? activeCount :
                                            inactiveCount}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar imobiliária, admin ou e-mail..."
                            className="pl-10 bg-card border-border h-11 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-background border-b border-border">
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Imobiliária / Admin</th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Plano / Ciclo</th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Email / Contato</th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Expiração</th>
                                <th className="text-left px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Status</th>
                                <th className="text-right px-6 py-4 font-bold text-muted-foreground text-xs uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-24 text-muted-foreground bg-card">
                                        <div className="flex flex-col items-center gap-3">
                                            <Building2 className="h-12 w-12 opacity-20" />
                                            <p className="text-base font-medium">Nenhuma imobiliária encontrada</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.map(tenant => {
                                const isExpired = tenant.expiresAt && new Date(tenant.expiresAt) < new Date();
                                return (
                                <tr key={tenant.id} className="group hover:bg-muted transition-all cursor-default">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-card border border-transparent group-hover:border-border transition-all">
                                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-base">{tenant.name}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                    <UserIcon className="h-3 w-3" />
                                                    <span>{tenant.adminName || 'Admin não definido'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit px-3 py-0.5 rounded-lg border-border bg-background text-foreground font-bold capitalize">
                                                <CreditCard className="h-3 w-3 mr-1.5 opacity-60" />
                                                {tenant.plan}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase ml-1">
                                                <RefreshCcw className="h-2.5 w-2.5" />
                                                {tenant.billingCycle === 'annual' ? 'Anual' : 'Mensal'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="space-y-1">
                                            <p className="text-foreground font-medium">{tenant.email}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                <span>{tenant.phone || 'Sem telefone'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className={`flex items-center gap-2 font-medium ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                                            <Clock className="h-4 w-4 opacity-50" />
                                            <span>
                                                {tenant.expiresAt 
                                                    ? new Date(tenant.expiresAt).toLocaleDateString('pt-BR')
                                                    : 'Aguardando Login'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge className={`px-3 py-1.5 rounded-xl border-none font-bold ${tenant.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            <span className={`h-2 w-2 rounded-full mr-2 ${tenant.status === 'active' ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                                            {tenant.status === 'active' ? 'Ativo' : 'Suspenso'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="h-10 w-10 rounded-xl hover:bg-muted/50 hover:text-foreground border border-transparent hover:border-border transition-all flex items-center justify-center outline-none">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-border">
                                                <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer font-medium" onClick={() => openEdit(tenant)}>
                                                    <Pencil className="h-4 w-4 mr-3" /> Editar dados
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer font-medium" onClick={() => handleResetPassword(tenant)}>
                                                    <KeyRound className="h-4 w-4 mr-3" /> Resetar senha
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 opacity-50" />
                                                <DropdownMenuItem className="rounded-xl px-3 py-2.5 cursor-pointer font-medium" onClick={() => handleToggleStatus(tenant)}>
                                                    {tenant.status === 'active'
                                                        ? <><Ban className="h-4 w-4 mr-3 text-amber-500" /> Suspender conta</>
                                                        : <><ShieldCheck className="h-4 w-4 mr-3 text-green-500" /> Reativar conta</>
                                                    }
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1 opacity-50" />
                                                <DropdownMenuItem
                                                    className="rounded-xl px-3 py-2.5 cursor-pointer font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
                                                    onClick={() => handleDelete(tenant.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-3" /> Excluir permanentemente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── CREATE MODAL ─── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-foreground p-8 text-card-foreground relative">
                        <Building2 className="h-12 w-12 text-foreground absolute top-6 right-6 opacity-40 rotate-12" />
                        <DialogTitle className="text-2xl font-black">Nova Imobiliária</DialogTitle>
                        <DialogDescription className="text-muted-foreground mt-2 text-base">
                            Provisione um novo ambiente para o cliente no sistema.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleCreate} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="c-name" className="text-foreground font-bold ml-1">Nome da Imobiliária *</Label>
                                <Input
                                    id="c-name"
                                    placeholder="Ex: Imob Prime Negócios"
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={createForm.name}
                                    onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c-admin" className="text-foreground font-bold ml-1">Nome do Admin *</Label>
                                <Input
                                    id="c-admin"
                                    placeholder="Nome do responsável"
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={createForm.adminName}
                                    onChange={e => setCreateForm(p => ({ ...p, adminName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c-phone" className="text-foreground font-bold ml-1">Telefone / WhatsApp</Label>
                                <Input
                                    id="c-phone"
                                    placeholder="(00) 00000-0000"
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={createForm.phone}
                                    onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="c-email" className="text-foreground font-bold ml-1">E-mail de Login *</Label>
                                <Input
                                    id="c-email"
                                    type="email"
                                    placeholder="gerente@imobiliaria.com.br"
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={createForm.email}
                                    onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground font-bold ml-1">Plano</Label>
                                <Select
                                    value={createForm.plan}
                                    onValueChange={v => setCreateForm(p => ({ ...p, plan: v as string }))}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {plans.map(p => (
                                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground font-bold ml-1">Ciclo de Pagamento</Label>
                                <Select
                                    value={createForm.billingCycle}
                                    onValueChange={v => setCreateForm(p => ({ ...p, billingCycle: v as 'monthly' | 'annual' }))}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="annual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 font-bold" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="rounded-xl h-11 px-8 font-black shadow-lg shadow-slate-900/10" disabled={saving}>
                                {saving ? 'Processando...' : 'Cadastrar Imobiliária'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT MODAL ─── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-8 text-card-foreground relative">
                        <Pencil className="h-12 w-12 text-black/10 absolute top-6 right-6 rotate-[-10deg]" />
                        <DialogTitle className="text-2xl font-black">Editar Assinante</DialogTitle>
                        <DialogDescription className="text-card-foreground/70 mt-2 text-base">
                            Atualize as informações de cadastro e plano do cliente.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleEdit} className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Nome da Imobiliária</Label>
                                <Input
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={editForm.name}
                                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Admin Responsável</Label>
                                <Input
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={editForm.adminName}
                                    onChange={e => setEditForm(p => ({ ...p, adminName: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Telefone</Label>
                                <Input
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card"
                                    value={editForm.phone}
                                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Email de Contato</Label>
                                <Input
                                    className="h-12 rounded-xl border-border bg-background focus:bg-card opacity-70"
                                    value={editForm.email}
                                    readOnly
                                />
                                <p className="text-[10px] text-muted-foreground ml-1">O email principal não pode ser alterado aqui.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Plano</Label>
                                <Select
                                    value={editForm.plan}
                                    onValueChange={v => setEditForm(p => ({ ...p, plan: v as string }))}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {plans.map(p => (
                                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Ciclo</Label>
                                <Select
                                    value={editForm.billingCycle}
                                    onValueChange={v => setEditForm(p => ({ ...p, billingCycle: v as 'monthly' | 'annual' }))}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-border bg-background">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="annual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-foreground font-bold ml-1 text-sm uppercase tracking-wider">Status da Conta</Label>
                                <Select
                                    value={editForm.status}
                                    onValueChange={v => setEditForm(p => ({ ...p, status: v as FormState['status'] }))}
                                >
                                    <SelectTrigger className={`h-12 rounded-xl border-border ${editForm.status === 'active' ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="active">Ativa</SelectItem>
                                        <SelectItem value="inactive">Suspensa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" className="rounded-xl h-11 px-6 font-bold" onClick={() => setIsEditOpen(false)}>Descartar</Button>
                            <Button type="submit" className="rounded-xl h-11 px-8 font-black shadow-lg" disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
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
