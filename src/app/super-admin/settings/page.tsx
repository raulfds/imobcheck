'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Trash2, Save, Settings, Layers, LayoutPanelTop, ArrowRight, Sparkles } from "lucide-react";
import { GLOBAL_ROOM_TEMPLATES } from '@/lib/presets';
import { RoomTemplate, TemplateCategory } from '@/types';
import { fetchRoomTemplates, saveRoomTemplate } from '@/lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function SuperAdminSettings() {
    const [templates, setTemplates] = useState<RoomTemplate[]>([]);
    const [newTemplateName, setNewTemplateName] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isLoading, setIsLoading] = useState(true);
    
    // Editing state
    const [editingTemplate, setEditingTemplate] = useState<RoomTemplate | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const loadData = async () => {
        try {
            const data = await fetchRoomTemplates();
            if (data.length > 0) {
                setTemplates(data);
            } else {
                setTemplates(GLOBAL_ROOM_TEMPLATES);
            }
        } catch (err) {
            console.error('Failed to load templates:', err);
            setTemplates(GLOBAL_ROOM_TEMPLATES);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddTemplate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const nome = newTemplateName.trim();
        if (nome && !templates.find(t => t.nome === nome)) {
            const newT = { nome, categorias: [] };
            setTemplates([...templates, newT]);
            setNewTemplateName('');
            try {
                await saveRoomTemplate(newT);
                await loadData(); // Refresh to get IDs
            } catch (err) {
                console.error('Failed to save template:', err);
            }
        }
    };

    const removeTemplate = (nome: string) => {
        if (confirm(`Excluir o modelo "${nome}"?`)) {
            setTemplates(templates.filter(t => t.nome !== nome));
            // In a real app, delete from DB here...
        }
    };

    const handleEditItems = (template: RoomTemplate) => {
        setEditingTemplate(JSON.parse(JSON.stringify(template))); // deep clone
        setIsEditDialogOpen(true);
    };

    const saveChanges = async () => {
        if (!editingTemplate) return;
        try {
            await saveRoomTemplate(editingTemplate);
            setIsEditDialogOpen(false);
            await loadData();
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Erro ao salvar alterações.');
        }
    };

    const addCategory = () => {
        if (!editingTemplate) return;
        const name = prompt('Nome da nova categoria (ex: Elétrico, Hidráulico):');
        if (name) {
            setEditingTemplate({
                ...editingTemplate,
                categorias: [...editingTemplate.categorias, { nome: name, itens: [] }]
            });
        }
    };

    const removeItemFromCategory = (catIdx: number, itemIdx: number) => {
        if (!editingTemplate) return;
        const newCats = [...editingTemplate.categorias];
        newCats[catIdx].itens.splice(itemIdx, 1);
        setEditingTemplate({ ...editingTemplate, categorias: newCats });
    };

    const addItemToCategory = (catIdx: number) => {
        if (!editingTemplate) return;
        const item = prompt('Nome do novo item:');
        if (item) {
            const newCats = [...editingTemplate.categorias];
            newCats[catIdx].itens.push(item);
            setEditingTemplate({ ...editingTemplate, categorias: newCats });
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
                                <BreadcrumbLink href="/super-admin" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Super Admin</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/super-admin/settings" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Preferências</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Modelos Globais</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">Configure as estruturas padrão de vistoria para todo o sistema.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-12">
                <Card className="rounded-[2.5rem] border border-border shadow-premium overflow-hidden bg-card">
                    <CardHeader className="p-8 border-b border-border/50 bg-muted/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <CardTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                                    <LayoutPanelTop className="h-6 w-6 text-primary" />
                                    Modelos de Ambientes
                                </CardTitle>
                                <CardDescription className="text-muted-foreground font-medium mt-1">
                                    Define as categorias de inspeção sugeridas globalmente.
                                </CardDescription>
                            </div>
                            <form onSubmit={(e) => handleAddTemplate(e)} className="flex gap-3 w-full md:w-auto">
                                <Input
                                    placeholder="Nome do Ambiente... (ex: Suíte Master)"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    className="h-12 w-full md:w-72 rounded-xl bg-muted/50 border-border/50 font-bold px-4"
                                />
                                <Button type="submit" variant="secondary" className="h-12 rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">
                                    Cadastrar
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(template => (
                                <div key={template.nome} className="group relative flex flex-col p-6 rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Layers className="h-5 w-5 text-primary" />
                                            </div>
                                            <span className="text-base font-black text-foreground tracking-tight">{template.nome}</span>
                                        </div>
                                        <button 
                                            onClick={() => removeTemplate(template.nome)} 
                                            className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4 flex-1">
                                        {template.categorias.length > 0 ? (
                                            <div className="space-y-2">
                                                {template.categorias.slice(0, 3).map((cat: TemplateCategory) => (
                                                    <div key={cat.nome} className="flex items-center justify-between bg-muted/30 p-3 rounded-xl border border-border/30">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">{cat.nome}</span>
                                                        <span className="text-[10px] font-bold text-primary">{cat.itens.length} itens</span>
                                                    </div>
                                                ))}
                                                {template.categorias.length > 3 && (
                                                    <div className="text-[10px] text-center font-black text-primary/40 uppercase tracking-widest pt-1">
                                                        + {template.categorias.length - 3} Categorias Adicionais
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                                    <Sparkles className="h-5 w-5 text-muted-foreground/30" />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest">Sem categorias definidas</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="mt-6 h-12 w-full rounded-2xl border-dashed border border-border/50 group-hover:border-primary/30 group-hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest gap-2"
                                        onClick={() => handleEditItems(template)}
                                    >
                                        <Pencil className="h-4 w-4" /> Gerenciar Itens Técnicos
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Categories & Items Modal - Premium Edit Environment */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                        <div className="px-10 py-12 bg-primary group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                                <Layers className="h-32 w-32 text-primary-foreground fill-current" />
                            </div>
                            <div className="relative z-10 space-y-2 text-primary-foreground">
                                <DialogTitle className="text-4xl font-black tracking-tight leading-none">Arquitetura: {editingTemplate?.nome}</DialogTitle>
                                <DialogDescription className="text-primary-foreground/70 text-lg font-medium tracking-tight">
                                    Configure as seções e os itens verificáveis deste ambiente.
                                </DialogDescription>
                            </div>
                        </div>
                        
                        <div className="p-10 space-y-8 max-h-[55vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {editingTemplate?.categorias.map((cat, catIdx) => (
                                    <div key={catIdx} className="space-y-4 p-6 rounded-3xl border border-border/50 bg-muted/30 group/cat">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-primary">{cat.nome}</h4>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/cat:opacity-100 transition-all"
                                                onClick={() => {
                                                    const newCats = [...editingTemplate.categorias];
                                                    newCats.splice(catIdx, 1);
                                                    setEditingTemplate({ ...editingTemplate, categorias: newCats });
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {cat.itens.map((item, itemIdx) => (
                                                <Badge key={itemIdx} variant="secondary" className="pl-3 pr-1 py-1.5 h-8 rounded-xl gap-2 bg-background text-foreground font-bold border border-border/50">
                                                    {item}
                                                    <button onClick={() => removeItemFromCategory(catIdx, itemIdx)} className="h-6 w-6 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 rounded-xl font-black text-[9px] uppercase tracking-widest border-dashed gap-1"
                                                onClick={() => addItemToCategory(catIdx)}
                                            >
                                                <Plus className="h-3 w-3" /> Item
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                
                                <Button variant="outline" className="h-full min-h-[140px] rounded-3xl border-dashed border-2 gap-3 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all" onClick={addCategory}>
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <span className="font-black text-[10px] uppercase tracking-widest">Nova Seção</span>
                                </Button>
                            </div>
                        </div>

                        <div className="p-10 pt-0 flex flex-col gap-4">
                            <Button onClick={saveChanges} className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground uppercase tracking-widest">
                                <Save className="h-5 w-5 mr-3" /> Salvar Modelo Normativo
                            </Button>
                            <Button variant="ghost" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] opacity-40 hover:opacity-100 hover:bg-muted/50 transition-all" onClick={() => setIsEditDialogOpen(false)}>
                                Descartar Alterações
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
