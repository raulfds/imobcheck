'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Trash2, Save, FileText } from "lucide-react";
import { SubscriptionPlan } from '@/types';
import { fetchPlans, savePlan, deletePlan } from '@/lib/database';

export default function PlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);

    const loadPlans = async () => {
        setIsLoading(true);
        try {
            const data = await fetchPlans();
            setPlans(data);
        } catch (err) {
            console.error('Failed to load plans:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const handleCreatePlan = () => {
        setEditingPlan({
            name: '',
            userLimit: 3,
            inspectionLimit: 10,
            photoStorageDays: 30,
            price: 0,
            features: []
        });
        setIsEditDialogOpen(true);
    };

    const handleEditPlan = (plan: SubscriptionPlan) => {
        setEditingPlan({ ...plan });
        setIsEditDialogOpen(true);
    };

    const handleDeletePlan = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            try {
                await deletePlan(id);
                loadPlans();
            } catch (err) {
                console.error('Error deleting plan:', err);
                alert('Erro ao excluir plano.');
            }
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSavePlan = async () => {
        if (!editingPlan || !editingPlan.name) return;
        setIsSaving(true);
        try {
            await savePlan(editingPlan);
            setIsEditDialogOpen(false);
            alert('Plano salvo com sucesso!');
            loadPlans();
        } catch (err) {
            console.error('Error saving plan:', err);
            alert('Erro ao salvar plano. Verifique o console para mais detalhes.');
        } finally {
            setIsSaving(false);
        }
    };

    const addFeature = () => {
        const feature = prompt('Nova funcionalidade (ex: Suporte 24h):');
        if (feature) {
            setEditingPlan({
                ...editingPlan,
                features: [...(editingPlan?.features || []), feature]
            });
        }
    };

    const removeFeature = (idx: number) => {
        const newFeatures = [...(editingPlan?.features || [])];
        newFeatures.splice(idx, 1);
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerenciamento de Planos</h1>
                    <p className="text-muted-foreground mt-1">Configure as ofertas e limites de assinatura para as imobiliárias.</p>
                </div>
                <Button onClick={handleCreatePlan} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Plano
                </Button>
            </div>

            <Card className="shadow-sm border-border">
                <CardHeader className="bg-muted border-b">
                    <CardTitle className="text-lg">Planos Ativos</CardTitle>
                    <CardDescription>Visualize e edite os planos de assinatura disponíveis.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-background">
                            <TableRow>
                                <TableHead className="font-bold">Nome</TableHead>
                                <TableHead className="font-bold">Limite Usuários</TableHead>
                                <TableHead className="font-bold">Limite Vistorias</TableHead>
                                <TableHead className="font-bold">Storage Fotos (Dias)</TableHead>
                                <TableHead className="font-bold">Preço (R$)</TableHead>
                                <TableHead className="text-right font-bold pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">Carregando planos...</TableCell>
                                </TableRow>
                            ) : plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">Nenhum plano cadastrado.</TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id} className="hover:bg-muted">
                                        <TableCell className="font-semibold">{plan.name}</TableCell>
                                        <TableCell>{plan.userLimit}</TableCell>
                                        <TableCell>{plan.inspectionLimit === 9999 ? 'Ilimitado' : plan.inspectionLimit}</TableCell>
                                        <TableCell>{plan.photoStorageDays} dias</TableCell>
                                        <TableCell>R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditPlan(plan)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDeletePlan(plan.id)}>
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingPlan?.id ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                        <DialogDescription>
                            Configure os limites e o valor para o plano de assinatura.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nome</Label>
                            <Input id="name" value={editingPlan?.name || ''} onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Preço (R$)</Label>
                            <Input id="price" type="number" step="0.01" value={editingPlan?.price || 0} onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="users" className="text-right">Usuários</Label>
                            <Input id="users" type="number" value={editingPlan?.userLimit || 0} onChange={(e) => setEditingPlan({...editingPlan, userLimit: Number(e.target.value)})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="inspections" className="text-right">Vistorias</Label>
                            <Input id="inspections" type="number" value={editingPlan?.inspectionLimit || 0} onChange={(e) => setEditingPlan({...editingPlan, inspectionLimit: Number(e.target.value)})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="storage" className="text-right">Storage (dias)</Label>
                            <Input id="storage" type="number" value={editingPlan?.photoStorageDays || 0} onChange={(e) => setEditingPlan({...editingPlan, photoStorageDays: Number(e.target.value)})} className="col-span-3" />
                        </div>
                        
                        <div className="space-y-3 pt-2">
                            <Label>Funcionalidades</Label>
                            <div className="flex flex-wrap gap-2">
                                {editingPlan?.features?.map((f, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1 pr-1 bg-muted font-normal">
                                        {f}
                                        <button onClick={() => removeFeature(idx)} className="hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                <Button variant="outline" size="sm" className="h-6 text-[10px] border-dashed" onClick={addFeature}>
                                    + Funcionalidade
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSavePlan} className="gap-2" disabled={isSaving}>
                            <Save className="h-4 w-4" /> {isSaving ? 'Salvando...' : 'Salvar Plano'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
