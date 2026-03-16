'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/database';
import { Client } from '@/types';

interface QuickAddClientProps {
    agencyId: string;
    onSuccess: (client: Client) => void;
}

export function QuickAddClient({ agencyId, onSuccess }: QuickAddClientProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !agencyId) return;

        setLoading(true);
        try {
            const newClient = await createClient({
                tenantId: agencyId,
                name,
                cpf,
                email: email || undefined,
                phone: phone || undefined
            });
            onSuccess(newClient);
            setOpen(false);
            setName('');
            setCpf('');
            setEmail('');
            setPhone('');
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Erro ao cadastrar locatário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                    <Plus className="h-4 w-4" />
                </Button>
            } />
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Novo Locatário</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
                            Cadastre um locatário rapidamente para a vistoria.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-8">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: João da Silva"
                                className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cpf" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CPF (Obrigatório)</Label>
                                <Input
                                    id="cpf"
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    placeholder="000.000.000-00"
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Ex: joao@email.com"
                                className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={loading || !name || !cpf}
                            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Salvar Locatário
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
