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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2 } from 'lucide-react';
import { createProperty } from '@/lib/database';
import { Property } from '@/types';

interface QuickAddPropertyProps {
    agencyId: string;
    onSuccess: (property: Property) => void;
}

export function QuickAddProperty({ agencyId, onSuccess }: QuickAddPropertyProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address || !agencyId) return;

        setLoading(true);
        try {
            const newProperty = await createProperty({
                tenantId: agencyId,
                address,
                description,
            });
            onSuccess(newProperty);
            setOpen(false);
            setAddress('');
            setDescription('');
        } catch (error) {
            console.error('Error creating property:', error);
            alert('Erro ao cadastrar imóvel.');
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
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Novo Imóvel</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
                            Cadastre um imóvel rapidamente para a vistoria.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-8">
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço Completo</Label>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Ex: Rua das Flores, 123 - Centro"
                                className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-foreground">Descrição (Opcional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: Apartamento com 3 quartos..."
                                className="rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20 min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={loading || !address}
                            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary text-primary-foreground"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Salvar Imóvel
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
