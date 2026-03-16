'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Pencil, Trash2, Save } from "lucide-react";
import { GLOBAL_ROOM_TEMPLATES } from '@/lib/presets';
import { RoomTemplate, TemplateCategory } from '@/types';
import { fetchRoomTemplates, saveRoomTemplate } from '@/lib/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

    // Global Categories state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [globalCategories] = useState<TemplateCategory[]>([
        { nome: "Estrutural", itens: ["Paredes", "Pintura", "Piso", "Teto", "Portas", "Janelas"] },
        { nome: "Elétrico", itens: ["Tomadas", "Interruptores", "Lâmpadas", "Luminárias", "Quadros"] }
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const addGlobalItem = (catIdx: number) => {
        // Implementation disabled for mock
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações Globais</h1>
                <p className="text-muted-foreground mt-1">Gerencie os parâmetros do sistema e integrações do painel Super Admin.</p>
            </div>

            <div className="grid gap-6">
                <Card className="shadow-sm border-border">
                    <CardHeader className="bg-muted border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Modelos de Ambientes (Global)</CardTitle>
                                <CardDescription>
                                    Configurações padrão sugeridas para todas as imobiliárias.
                                </CardDescription>
                            </div>
                            <Button size="sm" className="gap-2" onClick={() => handleAddTemplate()}>
                                <Plus className="h-4 w-4" /> Novo Modelo
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <form onSubmit={(e) => handleAddTemplate(e)} className="flex gap-2">
                            <Input
                                placeholder="Novo ambiente... (ex: Hall de Entrada)"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                className="bg-background border-border"
                            />
                            <Button type="submit" variant="secondary" className="shrink-0">
                                Adicionar
                            </Button>
                        </form>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {templates.map(template => (
                                <div key={template.nome} className="group flex flex-col p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="text-sm font-bold text-foreground">{template.nome}</span>
                                        </div>
                                        <button 
                                            onClick={() => removeTemplate(template.nome)} 
                                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 transition-all"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {template.categorias.length > 0 ? (
                                            template.categorias.slice(0, 2).map((cat: TemplateCategory) => (
                                                <div key={cat.nome} className="text-[10px] text-muted-foreground bg-background p-1.5 rounded border border-border">
                                                    <span className="font-semibold uppercase mr-1">{cat.nome}:</span>
                                                    {cat.itens.slice(0, 3).join(', ')}{cat.itens.length > 3 && '...'}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[10px] text-muted-foreground italic">Sem categorias.</div>
                                        )}
                                        {template.categorias.length > 2 && (
                                            <div className="text-[9px] text-center text-primary font-medium">+ {template.categorias.length - 2} categorias</div>
                                        )}
                                    </div>
                                    
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="mt-3 text-[10px] h-7 w-full border-dashed border"
                                        onClick={() => handleEditItems(template)}
                                    >
                                        <Pencil className="h-3 w-3 mr-1" /> Editar Ítens
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Categories & Items Modal */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Modelo: {editingTemplate?.nome}</DialogTitle>
                            <DialogDescription>
                                Adicione ou remova categorias e itens técnicos deste ambiente.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                            {editingTemplate?.categorias.map((cat, catIdx) => (
                                <div key={catIdx} className="space-y-3 p-4 rounded-lg border border-border bg-muted">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-sm uppercase text-foreground">{cat.nome}</h4>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 text-red-400 hover:text-red-500"
                                            onClick={() => {
                                                const newCats = [...editingTemplate.categorias];
                                                newCats.splice(catIdx, 1);
                                                setEditingTemplate({ ...editingTemplate, categorias: newCats });
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {cat.itens.map((item, itemIdx) => (
                                            <Badge key={itemIdx} variant="secondary" className="gap-1 pr-1 font-normal bg-card">
                                                {item}
                                                <button onClick={() => removeItemFromCategory(catIdx, itemIdx)} className="hover:text-red-500">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-6 text-[10px] border-dashed"
                                            onClick={() => addItemToCategory(catIdx)}
                                        >
                                            + Adicionar Item
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            
                            <Button variant="outline" className="w-full border-dashed gap-2" onClick={addCategory}>
                                <Plus className="h-4 w-4" /> Adicionar Categoria
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={saveChanges} className="gap-2">
                                <Save className="h-4 w-4" /> Salvar Modelo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


            </div>
        </div>
    );
}
