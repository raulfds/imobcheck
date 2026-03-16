'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, Shield, MoreHorizontal, Pencil, Trash2, Mail, Loader2, KeyRound, Copy, Check } from 'lucide-react';
import { User } from '@/types';
import { fetchUsersByRole, saveSystemUser, deleteSystemUser, resetUserPassword } from '@/lib/database';

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
            const formData = editingUser; // Use editingUser as formData
            const tempPassword = await saveSystemUser(formData);
            setIsModalOpen(false);
            if (tempPassword) {
                setGeneratedPasswordInfo({ name: formData.name || '', password: tempPassword });
                setIsPasswordModalOpen(true);
            }
            fetchUsers(); // Changed from loadUsers() to fetchUsers()
        } catch (err) {
            console.error('Error saving user:', err);
            alert('Erro ao salvar administrador.'); // Added alert for error
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
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Super Administradores</h1>
                    <p className="text-muted-foreground mt-1">Gerencie os usuários com acesso total à plataforma.</p>
                </div>
                <Button className="gap-2 shadow-sm" onClick={handleCreateClick}>
                    <UserPlus className="h-4 w-4" />
                    Novo Super Admin
                </Button>
            </div>

            <Card className="shadow-sm border-border">
                <CardHeader className="border-b bg-muted pb-4">
                    <CardTitle className="text-lg text-foreground flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Lista de Administradores
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-background hover:bg-background">
                                    <TableHead className="font-semibold text-muted-foreground">Nome</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">E-mail</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-semibold text-muted-foreground text-right w-[100px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">
                                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Carregando...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                            Nenhum administrador cadastrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="group hover:bg-muted transition-colors">
                                            <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">
                                                    Ativo
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none flex items-center justify-center rounded-md hover:bg-muted">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleEditClick(user)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer text-blue-600 focus:text-blue-600" onClick={() => handleResetPassword(user.id, user.name)}>
                                                            <KeyRound className="mr-2 h-4 w-4" /> Resetar Senha
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Remover
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser?.id ? 'Editar Administrador' : 'Novo Super Administrador'}</DialogTitle>
                        <DialogDescription>
                            {editingUser?.id 
                                ? 'Atualize as informações de acesso deste administrador.' 
                                : 'Convide um novo usuário com acesso total ao painel admin.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveUser}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input 
                                    value={editingUser?.name || ''}
                                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                                    placeholder="João Silva" 
                                    required 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>E-mail Corporativo</Label>
                                <Input 
                                    type="email"
                                    value={editingUser?.email || ''}
                                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                    placeholder="joao@imobcheck.com.br" 
                                    required 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    editingUser?.id ? 'Salvar Alterações' : 'Criar Administrador'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Password Display Modal */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Senha Gerada com Sucesso
                        </DialogTitle>
                        <DialogDescription>
                            Copie a senha abaixo e envie para <strong>{generatedPasswordInfo?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="password" title="Senha Temporária">
                                Senha Temporária
                            </Label>
                            <div className="flex bg-muted p-3 rounded-md font-mono text-xl justify-between items-center border border-border">
                                <span className="tracking-wider select-all">{generatedPasswordInfo?.password}</span>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={copyToClipboard}>
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 border border-amber-200 mb-2">
                        <strong>Aviso:</strong> O usuário será obrigado a trocar esta senha no primeiro acesso. Esta senha não será mostrada novamente.
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={() => setIsPasswordModalOpen(false)} className="w-full">
                            Entendi, já copiei
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
