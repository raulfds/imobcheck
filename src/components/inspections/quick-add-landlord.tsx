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
import { createLandlord } from '@/lib/database';
import { Landlord } from '@/types';

interface QuickAddLandlordProps {
    agencyId: string;
    onSuccess: (landlord: Landlord) => void;
}

export function QuickAddLandlord({ agencyId, onSuccess }: QuickAddLandlordProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !agencyId) return;

        setLoading(true);
        try {
            const newLandlord = await createLandlord({
                tenantId: agencyId,
                name,
                email,
            });
            onSuccess(newLandlord);
            setOpen(false);
            setName('');
            setEmail('');
        } catch (error) {
            console.error('Error creating landlord:', error);
            alert('Erro ao cadastrar locador.');
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
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Novo Locador (Proprietário)</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
                            Cadastre um locador rapidamente para a vistoria.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-8">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Maria Oliveira"
                                className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Ex: maria@email.com"
                                className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={loading || !name}
                            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Salvar Locador
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
