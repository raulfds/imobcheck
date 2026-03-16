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
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [description, setDescription] = useState('');
    const [fetchingCep, setFetchingCep] = useState(false);

    const handleCepBlur = async () => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            setFetchingCep(true);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
                if (response.ok) {
                    const data = await response.json();
                    setLogradouro(data.street || '');
                    setBairro(data.neighborhood || '');
                    setCidade(data.city || '');
                    setEstado(data.state || '');
                }
            } catch (error) {
                console.error('Error fetching CEP:', error);
            } finally {
                setFetchingCep(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullAddress = `${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}, ${bairro}, ${cidade} - ${estado}, CEP: ${cep}`;
        if (!logradouro || !numero || !agencyId) return;

        setLoading(true);
        try {
            const newProperty = await createProperty({
                tenantId: agencyId,
                address: fullAddress,
                cep,
                logradouro,
                numero,
                complemento,
                bairro,
                cidade,
                estado,
                description,
            });
            onSuccess(newProperty);
            setOpen(false);
            setCep('');
            setLogradouro('');
            setNumero('');
            setComplemento('');
            setBairro('');
            setCidade('');
            setEstado('');
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
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black tracking-tight text-foreground">Novo Imóvel</DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-widest opacity-70">
                            Cadastre um imóvel rapidamente para a vistoria.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cep" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CEP</Label>
                                <div className="relative">
                                    <Input
                                        id="cep"
                                        value={cep}
                                        onChange={(e) => setCep(e.target.value)}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                        required
                                    />
                                    {fetchingCep && <Loader2 className="absolute right-3 top-3 h-6 w-6 animate-spin opacity-40 text-primary" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="numero" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Número</Label>
                                <Input
                                    id="numero"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                    placeholder="123"
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logradouro" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Logradouro</Label>
                            <Input
                                id="logradouro"
                                value={logradouro}
                                onChange={(e) => setLogradouro(e.target.value)}
                                placeholder="Rua, Avenida..."
                                className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="complemento" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Complemento</Label>
                                <Input
                                    id="complemento"
                                    value={complemento}
                                    onChange={(e) => setComplemento(e.target.value)}
                                    placeholder="Apto, Sala..."
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bairro" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bairro</Label>
                                <Input
                                    id="bairro"
                                    value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                    placeholder="Centro..."
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cidade" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade</Label>
                                <Input
                                    id="cidade"
                                    value={cidade}
                                    onChange={(e) => setCidade(e.target.value)}
                                    placeholder="Cidade"
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">UF</Label>
                                <Input
                                    id="estado"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                    placeholder="SP"
                                    className="h-12 rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descrição (Opcional)</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Notas sobre o imóvel..."
                                className="rounded-xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20 min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="submit" 
                            disabled={loading || !logradouro || !numero}
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
