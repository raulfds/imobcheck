'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Loader2, Shield, User as UserIcon, KeyRound, Copy, Check, Users as UsersIcon } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/components/auth/auth-provider';
import { User } from '@/types';
import { fetchUsersByAgency, saveSystemUser, deleteSystemUser, fetchPlans, resetUserPassword } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export default function TeamManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userLimit, setUserLimit] = useState<number>(3); // Default to 3
    const [generatedPasswordInfo, setGeneratedPasswordInfo] = useState<{name: string, password: string} | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'INSPECTOR'
    });

    const loadData = useCallback(async () => {
        if (!currentUser?.tenantId) return;
        setIsLoading(true);
        try {
            // 1. Fetch users
            const members = await fetchUsersByAgency(currentUser.tenantId);
            setUsers(members);

            // 2. Fetch agency plan limit
            const { data: agency } = await supabase
                .from('agencies')
                .select('plan_id')
                .eq('id', currentUser.tenantId)
                .single();

            if (agency?.plan_id) {
                const plans = await fetchPlans();
                const myPlan = plans.find(p => p.id === agency.plan_id);
                if (myPlan) {
                    setUserLimit(myPlan.userLimit);
                }
            }
        } catch (err) {
            console.error('Error loading team data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.tenantId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser?.tenantId || !newUser.name || !newUser.email) return;

        setIsSaving(true);
        try {
            const tempPassword = await saveSystemUser({
                ...newUser,
                tenantId: currentUser.tenantId
            } as User);
            setIsModalOpen(false);
            if (tempPassword) {
                setGeneratedPasswordInfo({ name: newUser.name || '', password: tempPassword });
                setIsPasswordModalOpen(true);
            }
            setNewUser({ name: '', email: '', role: 'INSPECTOR' });
            loadData();
        } catch (err) {
            console.error('Error inviting user:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (confirm(`Deseja gerar uma nova senha temporária para ${name}?`)) {
            try {
                const tempPassword = await resetUserPassword(id);
                setGeneratedPasswordInfo({ name, password: tempPassword });
                setIsPasswordModalOpen(true);
            } catch (err) {
                console.error('Error resetting password:', err);
                alert('Erro ao resetar senha.');
            }
        }
    };

    const copyToClipboard = () => {
        if (!generatedPasswordInfo) return;
        navigator.clipboard.writeText(generatedPasswordInfo.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async (id: string, name: string) => {
        if (id === currentUser?.id) {
            alert('Você não pode remover a si mesmo.');
            return;
        }
        if (confirm(`Remover acesso de ${name}?`)) {
            try {
                await deleteSystemUser(id);
                loadData();
            } catch (err) {
                console.error('Error deleting user:', err);
            }
        }
    };

    const limitReached = users.length >= userLimit;

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-10">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/team" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Equipe</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Gestão de Equipe</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">Controle de acessos e permissões dos seus colaboradores.</p>
                    </div>
                </div>
                <Button className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2" onClick={() => setIsModalOpen(true)} disabled={limitReached}>
                    <UserPlus className="h-5 w-5" />
                    Convidar Membro
                </Button>
            </div>

            {/* Quick Stats & Alerts */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-lg bg-card overflow-hidden group">
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Capacidade do Plano</p>
                    </CardHeader>
                    <CardContent className="flex items-end justify-between">
                        <div>
                            <div className="text-3xl font-black text-foreground">{users.length} <span className="text-muted-foreground/30 font-bold">/ {userLimit}</span></div>
                            <p className="text-xs font-bold text-muted-foreground mt-1">Colaboradores ativos</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                    </CardContent>
                    <div className="h-1 w-full bg-primary/10">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(users.length / userLimit) * 100}%` }} />
                    </div>
                </Card>

                {limitReached && (
                    <Card className="md:col-span-2 border-none shadow-lg bg-amber-500/5 border-amber-500/10 flex items-center">
                        <CardContent className="p-6 flex items-center gap-4 w-full">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 animate-pulse">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-amber-900 leading-tight">Limite Atingido!</p>
                                <p className="text-xs text-amber-800/80 font-medium leading-relaxed">
                                    Seu plano permite até {userLimit} usuários. Para adicionar novos membros, considere fazer um <strong>Upgrade</strong> do seu plano.
                                </p>
                            </div>
                            <Button variant="outline" className="border-amber-500/20 text-amber-700 font-black rounded-xl hover:bg-amber-500/10 shrink-0 shadow-none">
                                Upgrade
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Members Table */}
            <Card className="border-none shadow-xl bg-card overflow-hidden">
                <CardHeader className="px-8 py-8 border-b border-border/40">
                    <CardTitle className="text-xl font-black tracking-tight">Membros da Imobiliária</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Colaboradores ativos nesta organização</CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border bg-muted/20 h-20">
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Colaborador</TableHead>
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Privilégios</TableHead>
                                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Status</TableHead>
                                <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                                            <p className="font-bold animate-pulse uppercase text-[10px] tracking-widest">Carregando lista...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <UserIcon className="h-12 w-12 opacity-10" />
                                            <p className="font-black text-foreground/50 italic">Nenhum colaborador encontrado.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u) => (
                                    <TableRow key={u.id} className="group hover:bg-muted/30 transition-all border-b border-border/20 last:border-0 h-20">
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border-2 border-transparent group-hover:border-primary/20 group-hover:bg-primary/5 transition-all overflow-hidden shrink-0">
                                                    {u.role === 'CLIENT_ADMIN' 
                                                        ? <Shield className="h-5 w-5 text-primary" /> 
                                                        : <UserIcon className="h-5 w-5" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground truncate">{u.name}</p>
                                                    <p className="text-xs text-muted-foreground font-medium truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8">
                                            <Badge variant="outline" className={`px-2.5 py-0.5 rounded-lg border-none font-black text-[10px] uppercase tracking-tighter shadow-none ${
                                                u.role === 'CLIENT_ADMIN' ? 'bg-primary/10 text-primary' : 'bg-slate-500/10 text-slate-600'
                                            }`}>
                                                {u.role === 'CLIENT_ADMIN' ? 'Administrador' : 'Vistoriador'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600">Ativo</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-10 w-10 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-none" 
                                                    title="Gerar nova senha temporária"
                                                    onClick={() => handleResetPassword(u.id, u.name)}
                                                >
                                                    <KeyRound className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="icon" 
                                                    className="h-10 w-10 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-none" 
                                                    onClick={() => handleDelete(u.id, u.name)}
                                                    disabled={u.id === currentUser?.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Invite Modal Redesign */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="bg-primary p-10 relative overflow-hidden group">
                        <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <DialogTitle className="text-3xl font-black tracking-tight text-white leading-none">Convidar</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-medium italic mt-2">
                            Adicione um novo membro à equipe.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleInvite} className="p-8 space-y-6 bg-card">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Ex: João da Silva" 
                                    className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all font-bold px-4"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="joao@exemplo.com.br" 
                                    className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all font-bold px-4"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cargo / Função</Label>
                                <Select 
                                    value={newUser.role} 
                                    onValueChange={(v) => setNewUser({...newUser, role: v as User['role']})}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold px-4">
                                        <SelectValue placeholder="Selecione o cargo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="CLIENT_ADMIN">Administrador (Imobiliária)</SelectItem>
                                        <SelectItem value="INSPECTOR">Vistoriador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={isSaving}>
                                {isSaving ? 'Processando...' : 'Gerar Convite de Acesso'}
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-12 font-bold opacity-60 hover:opacity-100" onClick={() => setIsModalOpen(false)}>
                                Descartar
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Password Display Modal Redesign */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="flex flex-col items-center text-center space-y-6 py-6">
                        <div className="h-20 w-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-2 rotate-3">
                            <KeyRound className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-3xl font-black tracking-tight">Acesso Gerado!</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium text-base">
                                Copie a senha temporária de <strong>{generatedPasswordInfo?.name}</strong>.
                            </DialogDescription>
                        </div>
                        
                        <div className="w-full bg-muted/50 p-6 rounded-[2rem] flex items-center justify-between border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors group">
                            <code className="text-3xl font-mono font-black tracking-[0.2em] text-foreground select-all">
                                {generatedPasswordInfo?.password}
                            </code>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="h-12 w-12 rounded-2xl p-0 hover:bg-primary hover:text-white transition-all shadow-none"
                                onClick={copyToClipboard}
                            >
                                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                        
                        <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 flex gap-4 text-left items-start">
                            <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-900 leading-relaxed font-bold opacity-80">
                                <strong>IMPORTANTE:</strong> Por segurança, esta senha será exibida apenas uma vez. O usuário será obrigado a cadastrar uma nova senha no primeiro acesso.
                            </p>
                        </div>
                        
                        <Button className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/10 mt-4" onClick={() => setIsPasswordModalOpen(false)}>
                            Entendi, Já Copiei
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
