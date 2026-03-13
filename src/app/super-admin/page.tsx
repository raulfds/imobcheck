'use client';

import { useState } from 'react';
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
import { Plus, Building2, Users as UsersIcon, CreditCard, MoreHorizontal, Pencil, Ban, Trash2 } from 'lucide-react';

export default function SuperAdminDashboard() {
    const { tenants, updateTenant, deleteTenant } = useTenants();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTenantEmail, setNewTenantEmail] = useState('');

    const handleCreateTenant = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(false);
        setNewTenantEmail('');
        // Direct to /super-admin/tenants to manage
        window.location.href = '/super-admin/tenants';
    };

    const toggleStatus = (id: string) => {
        const tenant = tenants.find(t => t.id === id);
        if (tenant) updateTenant(id, { status: tenant.status === 'active' ? 'inactive' : 'active' });
    };

    const removeTenant = (id: string) => {
        deleteTenant(id);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Visão Geral</h1>
                    <p className="text-muted-foreground mt-1">Gerencie imobiliárias, assinaturas e acompanhe o crescimento.</p>
                </div>
                <Button className="gap-2 shadow-sm" onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="shadow-sm border-border overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/50">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Assinantes</CardTitle>
                        <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-foreground">{tenants.length}</div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
                            <span className="inline-block w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                            +4 este mês
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/50">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Ativos</CardTitle>
                        <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                            <UsersIcon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-foreground">542</div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">+12% desde ontem</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm border-border overflow-hidden sm:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/50">
                        <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
                        <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
                            <CreditCard className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-foreground">R$ 12.450</div>
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">+R$ 1.200 este mês</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm border-border">
                <CardHeader className="border-b bg-muted/30 pb-4">
                    <CardTitle className="text-lg text-foreground">Imobiliárias Assinantes</CardTitle>
                    <CardDescription>Lista completa de clientes provisionados no sistema.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="font-semibold text-muted-foreground">Imobiliária</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">E-mail Respon.</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">Plano</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground text-right w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.map((tenant) => (
                                    <TableRow key={tenant.id} className="group hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-foreground">{tenant.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{tenant.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize bg-background text-foreground font-medium">
                                                {tenant.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                                className={tenant.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-200 dark:border-green-900' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                            >
                                                {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-muted">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[160px]">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => toggleStatus(tenant.id)}
                                                    >
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        {tenant.status === 'active' ? 'Suspender' : 'Reativar'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                                        onClick={() => removeTenant(tenant.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {tenants.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground bg-card">
                                            Nenhum cliente cadastrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Cliente (Tenant)</DialogTitle>
                        <DialogDescription>
                            Provisione um novo ambiente para uma imobiliária e cadastre o responsável.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTenant}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="agencyName" className="font-semibold text-foreground">Nome da Imobiliária</Label>
                                <Input id="agencyName" placeholder="Ex: Imob Prime" required className="bg-background" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-semibold text-foreground">E-mail do Responsável (Acesso Inicial)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@imobiliaria.com"
                                    value={newTenantEmail}
                                    onChange={(e) => setNewTenantEmail(e.target.value)}
                                    required
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan" className="font-semibold text-foreground">Plano de Assinatura</Label>
                                <Select defaultValue="basic" name="plan">
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Selecione um plano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="basic">Basic (Até 3 usuários)</SelectItem>
                                        <SelectItem value="pro">Pro (Ilimitado)</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="border-t pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="shadow-sm">Provisionar Ambiente</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
