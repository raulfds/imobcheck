'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, Shield, MoreHorizontal, Pencil, Trash2, Mail, Loader2, KeyRound, Copy, Check, UserCheck } from 'lucide-react';
import { User } from '@/types';
import { fetchUsersByRole, saveSystemUser, deleteSystemUser, resetUserPassword } from '@/lib/database';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchTerm, setSearchTerm] = useState('');
    const [generatedPasswordInfo, setGeneratedPasswordInfo] = useState<{name: string, password: string} | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchUsersByRole('SUPER_ADMIN');
            setUsers(data);
        } catch (err) {
            console.error('Error fetching admins:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateClick = () => {
        setEditingUser({ name: '', email: '', role: 'SUPER_ADMIN' });
        setIsModalOpen(true);
    };

    const handleEditClick = (user: User) => {
        setEditingUser({ ...user });
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser?.name || !editingUser?.email) return;
        
        setIsSaving(true);
        try {
            const formData = editingUser; 
            const tempPassword = await saveSystemUser(formData);
            setIsModalOpen(false);
            if (tempPassword) {
                setGeneratedPasswordInfo({ name: formData.name || '', password: tempPassword });
                setIsPasswordModalOpen(true);
            }
            fetchUsers(); 
        } catch (err) {
            console.error('Error saving user:', err);
            alert('Erro ao salvar administrador.'); 
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

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja remover o acesso de ${name}?`)) {
            try {
                await deleteSystemUser(id);
                fetchUsers();
            } catch (err) {
                console.error('Error deleting admin:', err);
                alert('Erro ao remover administrador.');
            }
        }
    };

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
                                <BreadcrumbLink href="/super-admin/users" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary transition-colors">Gestão de acessos</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <Shield className="h-3 w-3" />
                            Segurança da Rede
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none">Super Admins</h1>
                        <p className="text-muted-foreground text-lg font-medium tracking-tight">Gerencie os usuários com privilégios totais sobre a plataforma.</p>
                    </div>
                </div>
                <Button className="h-16 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-3 bg-primary text-primary-foreground uppercase tracking-widest text-xs" onClick={handleCreateClick}>
                    <UserPlus className="h-5 w-5 stroke-[3px]" /> Novo Super Admin
                </Button>
            </div>

            <Card className="rounded-[2.5rem] border border-border shadow-premium overflow-hidden bg-card">
                <CardHeader className="p-8 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground">Time de Administração</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium mt-1">Usuários autorizados a gerenciar o sistema globalmente.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/50 h-16 hover:bg-transparent">
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome Completo</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">E-mail Corporativo</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Papel</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Status</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground bg-muted/5 italic">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span>Carregando administradores...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground bg-muted/5 italic">Nenhum administrador cadastrado no sistema.</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="group border-b border-border/50 h-20 hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-xs text-primary">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-foreground text-sm">{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-muted-foreground text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 opacity-40" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-background border-border/50 text-foreground">
                                                {user.role.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <div className="flex justify-center">
                                                <Badge className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-none shadow-none">
                                                    Ativo
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 font-black border-border/50 shadow-2xl">
                                                    <DropdownMenuLabel className="text-[9px] uppercase tracking-widest opacity-40 px-3 py-2">Gestão de Usuário</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer gap-3 h-11 rounded-xl text-[10px] uppercase tracking-widest" onClick={() => handleEditClick(user)}>
                                                        <Pencil className="h-4 w-4" /> Editar Perfil
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer gap-3 h-11 rounded-xl text-[10px] uppercase tracking-widest text-blue-600 focus:text-blue-600" onClick={() => handleResetPassword(user.id, user.name)}>
                                                        <KeyRound className="h-4 w-4" /> Gerar Nova Senha
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-2 opacity-50" />
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:bg-destructive/5 focus:text-destructive cursor-pointer gap-3 h-11 rounded-xl text-[10px] uppercase tracking-widest"
                                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" /> Revogar Acesso
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Admin Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="px-10 py-12 bg-slate-900 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Shield className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-4xl font-black tracking-tight text-white leading-none">
                                {editingUser?.id ? 'Editar Admin' : 'Novo Guardião'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-lg font-medium tracking-tight">
                                {editingUser?.id 
                                    ? 'Atualize os privilégios e dados do administrador.' 
                                    : 'Adicione um novo membro com acesso total à infraestrutura.'}
                            </DialogDescription>
                        </div>
                    </div>
                    <form onSubmit={handleSaveUser} className="p-10 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nome Completo</Label>
                                <Input 
                                    value={editingUser?.name || ''}
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    placeholder="Ex: Alexandre Oliveira" 
                                    required 
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-xl placeholder:text-muted-foreground/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">E-mail Corporativo (@imobcheck.com.br)</Label>
                                <Input 
                                    type="email"
                                    value={editingUser?.email || ''}
                                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                    placeholder="alexandre@imobcheck.com.br" 
                                    required 
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-xl placeholder:text-muted-foreground/30"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 pt-4">
                            <Button type="submit" disabled={isSaving} className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest">
                                {isSaving ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Sincronizando...
                                    </div>
                                ) : (
                                    editingUser?.id ? 'Salvar Alterações' : 'Conceder Acesso Administrador'
                                )}
                            </Button>
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsModalOpen(false)}>
                                Cancelar Registro
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Password Display Modal - Premium */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="px-10 py-12 bg-emerald-600 group relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-700">
                            <UserCheck className="h-32 w-32 fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2 text-white">
                            <DialogTitle className="text-4xl font-black tracking-tight leading-none flex items-center gap-3">
                                <KeyRound className="h-10 w-10 text-emerald-200" />
                                Credenciais Ativas
                            </DialogTitle>
                            <DialogDescription className="text-emerald-100 text-lg font-medium tracking-tight">
                                Senha temporária gerada para <strong>{generatedPasswordInfo?.name}</strong>.
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Senha de Primeiro Acesso</Label>
                            <div className="flex bg-muted/30 p-6 rounded-2xl font-mono text-3xl justify-between items-center border border-border/50 shadow-inner group/pass">
                                <span className="tracking-widest select-all font-black text-primary">{generatedPasswordInfo?.password}</span>
                                <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={copyToClipboard}>
                                    {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20">
                            <div className="flex gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <Shield className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-amber-700 uppercase tracking-widest text-[10px]">Protocolo de Segurança</p>
                                    <p className="text-sm font-medium text-amber-700/80 leading-snug">
                                        Esta senha é temporária e será invalidada após o primeiro login. Por segurança, ela não será exibida novamente.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button type="button" onClick={() => setIsPasswordModalOpen(false)} className="w-full h-16 rounded-2xl font-black text-lg bg-slate-900 hover:bg-slate-800 text-white transition-all uppercase tracking-widest">
                            Entendido, Segurança Confirmada
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
