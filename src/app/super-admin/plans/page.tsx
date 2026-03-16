'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Trash2, Save, Rocket, ShieldCheck, Zap } from "lucide-react";
import { SubscriptionPlan } from '@/types';
import { fetchPlans, savePlan, deletePlan } from '@/lib/database';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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
                                <BreadcrumbLink href="/super-admin/plans" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary transition-colors">Configurações de planos</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <Rocket className="h-3 w-3" />
                            Modelos de Assinatura
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-foreground leading-none">Gestão de Ofertas</h1>
                        <p className="text-muted-foreground text-lg font-medium tracking-tight">Configure as camadas de serviço e limites para o ecossistema.</p>
                    </div>
                </div>
                <Button className="h-16 px-8 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all gap-3 bg-primary text-primary-foreground uppercase tracking-widest text-xs" onClick={handleCreatePlan}>
                    <Plus className="h-5 w-5 stroke-[3px]" /> Novo Plano
                </Button>
            </div>

            <Card className="rounded-[2.5rem] border border-border shadow-premium overflow-hidden bg-card">
                <CardHeader className="p-8 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground">Planos Disponíveis</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium mt-1">Níveis de acesso provisionáveis para novas imobiliárias.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/50 h-16 hover:bg-transparent">
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Nome do Plano</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Limite Usuários</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Limite Vistorias</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Retenção de Fotos</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Preço Mensal</TableHead>
                                <TableHead className="px-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground bg-muted/5 italic">Carregando configurações de planos...</TableCell>
                                </TableRow>
                            ) : plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground bg-muted/5 italic">Nenhum plano configurado no sistema.</TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id} className="group border-b border-border/50 h-20 hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-8">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${
                                                    plan.name.toLowerCase().includes('enterprise') ? 'bg-purple-500/10 text-purple-600' : 
                                                    plan.name.toLowerCase().includes('pro') ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {plan.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-foreground text-sm uppercase tracking-tight">{plan.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <Badge variant="outline" className="px-3 py-1 rounded-full text-[9px] font-black bg-background border-border/50 text-foreground">
                                                {plan.userLimit} Users
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <span className="text-sm font-bold text-foreground">
                                                {plan.inspectionLimit === 9999 ? 'Ilimitado' : plan.inspectionLimit}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {plan.photoStorageDays} dias
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <span className="text-lg font-black text-foreground">
                                                R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all" onClick={() => handleEditPlan(plan)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-background text-destructive hover:text-destructive border border-transparent hover:border-border transition-all" onClick={() => handleDeletePlan(plan.id)}>
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

            {/* Edit/Create Plan Modal */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="px-10 py-12 bg-slate-900 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Zap className="h-32 w-32 text-white fill-current" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <DialogTitle className="text-4xl font-black tracking-tight text-white leading-none">
                                {editingPlan?.id ? 'Editar Nível' : 'Novo Plano'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-lg font-medium tracking-tight">
                                Defina os benefícios e o custo da oferta de serviço.
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identificação Comercial</Label>
                                <Input 
                                    placeholder="Ex: Plano Enterprise"
                                    value={editingPlan?.name || ''} 
                                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-xl placeholder:text-muted-foreground/30"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Preço Mensal (R$)</Label>
                                <Input 
                                    type="number" 
                                    step="0.01" 
                                    value={editingPlan?.price || 0} 
                                    onChange={(e) => setEditingPlan({...editingPlan, price: Number(e.target.value)})}
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-black px-6 text-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Usuários Permitidos</Label>
                                <Input 
                                    type="number" 
                                    value={editingPlan?.userLimit || 0} 
                                    onChange={(e) => setEditingPlan({...editingPlan, userLimit: Number(e.target.value)})}
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Vistorias (9999 = Ilim.)</Label>
                                <Input 
                                    type="number" 
                                    value={editingPlan?.inspectionLimit || 0} 
                                    onChange={(e) => setEditingPlan({...editingPlan, inspectionLimit: Number(e.target.value)})}
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Retenção de Fotos (Dias)</Label>
                                <Input 
                                    type="number" 
                                    value={editingPlan?.photoStorageDays || 0} 
                                    onChange={(e) => setEditingPlan({...editingPlan, photoStorageDays: Number(e.target.value)})}
                                    className="h-16 rounded-2xl bg-muted/30 border-border/50 font-bold px-6 text-xl"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Diferenciais e Funcionalidades</Label>
                                <Button variant="outline" size="sm" className="h-8 rounded-xl font-black text-[9px] uppercase tracking-widest border-dashed gap-1" onClick={addFeature}>
                                    <Plus className="h-3 w-3" /> Adicionar
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editingPlan?.features?.map((f, idx) => (
                                    <Badge key={idx} variant="secondary" className="pl-3 pr-1 py-1.5 h-9 rounded-xl gap-2 bg-muted text-foreground font-bold border border-border/50">
                                        {f}
                                        <button onClick={() => removeFeature(idx)} className="h-6 w-6 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {(!editingPlan?.features || editingPlan.features.length === 0) && (
                                    <div className="text-[10px] text-muted-foreground italic font-medium">Nenhum diferencial adicionado.</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-10 pt-0 flex flex-col gap-4">
                        <Button onClick={handleSavePlan} className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest" disabled={isSaving}>
                            {isSaving ? 'Gravando Alterações...' : (editingPlan?.id ? 'Salvar Configurações' : 'Criar Layer de Serviço')}
                        </Button>
                        <Button type="button" variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsEditDialogOpen(false)}>
                            Descartar Mudanças
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
