'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { InspectionItem, InspectionEnvironment as Environment } from '@/types';
import { 
    CheckCircle2, 
    XCircle, 
    Camera, 
    Plus, 
    ArrowLeft, 
    ChevronRight, 
    FileText, 
    Trash2, 
    Save,
    AlertCircle,
    Check,
    Layout,
    Image as ImageIcon,
    MoreVertical,
    Clock
} from 'lucide-react';
import { saveDraft, getDraft, saveBlob, getBlob, purgeOldDrafts } from '@/lib/db';
import { fetchRoomTemplates, saveRoomTemplate } from '@/lib/database';
import { useAuth } from '@/components/auth/auth-provider';

const DRAFT_ID = 'active-inspection-demo';

export default function ActiveInspection() {
    const { user } = useAuth();
    const agencyId = user?.tenantId || 'tenant-1'; 
    
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

    const handleSaveAsTemplate = async (env: Environment) => {
        try {
            const template: any = {
                nome: env.name,
                categorias: Object.entries(
                    env.items.reduce((acc: any, item) => {
                        const cat = item.category || 'Geral';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item.name);
                        return acc;
                    }, {})
                ).map(([nome, itens]: [string, any]) => ({ nome, itens }))
            };

            await saveRoomTemplate(template, agencyId);
            alert(`O ambiente "${env.name}" foi salvo como modelo da agência.`);
            
            const tmpls = await fetchRoomTemplates(agencyId);
            setAvailableTemplates(tmpls);
        } catch (err) {
            console.error('Failed to save template:', err);
            alert("Erro ao salvar este ambiente como modelo.");
        }
    };

    const [isAddEnvModalOpen, setIsAddEnvModalOpen] = useState(false);
    const [selectedTemplateName, setSelectedTemplateName] = useState('');
    const [customTemplateName, setCustomTemplateName] = useState('');

    useEffect(() => {
        async function init() {
            await purgeOldDrafts();
            try {
                const tmpls = await fetchRoomTemplates(agencyId);
                setAvailableTemplates(tmpls);
            } catch (err) {
                console.error('Failed to fetch templates:', err);
            }

            const draft = await getDraft(DRAFT_ID);
            let initialEnvs = [];

            if (draft && draft.environments && draft.environments.length > 0) {
                initialEnvs = JSON.parse(JSON.stringify(draft.environments));

                for (const env of initialEnvs) {
                    if (env.generalPhotos) {
                        for (let i = 0; i < env.generalPhotos.length; i++) {
                            const key = env.generalPhotos[i];
                            if (key.startsWith('blob-ref:')) {
                                const blob = await getBlob(key);
                                if (blob) env.generalPhotos[i] = URL.createObjectURL(blob);
                            }
                        }
                    }
                    if (env.items) {
                        for (const item of env.items) {
                            if (item.photo && item.photo.startsWith('blob-ref:')) {
                                const blob = await getBlob(item.photo);
                                if (blob) item.photo = URL.createObjectURL(blob);
                            }
                        }
                    }
                }
                setEnvironments(initialEnvs);
            } else {
                setEnvironments([]);
            }
            setIsLoading(false);
        }
        init();
    }, [agencyId]);

    useEffect(() => {
        if (!isLoading) {
            const cleanEnvs = JSON.parse(JSON.stringify(environments));
            for (const env of cleanEnvs) {
                if (env.generalPhotos) {
                    env.generalPhotos = env.generalPhotos.map((p: string) => p.startsWith('blob:') ? `blob-ref:gen-${env.id}-${p.slice(-5)}` : p);
                }
                if (env.items) {
                    env.items.forEach((item: InspectionItem) => {
                        if (item.photo && item.photo.startsWith('blob:')) {
                            item.photo = `blob-ref:item-${item.id}`;
                        }
                    });
                }
            }
            saveDraft(DRAFT_ID, agencyId, cleanEnvs);
        }
    }, [environments, isLoading, agencyId]);

    const stats = {
        total: environments.reduce((acc, env) => acc + (env.items?.length || 0), 0),
        checked: environments.reduce((acc, env) => acc + (env.items?.filter((i) => i.status !== 'pending').length || 0), 0),
    };
    const progress = stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0;

    const updateItem = (envId: string, itemId: string, updates: Partial<InspectionItem>) => {
        setEnvironments(envs => envs.map(env => {
            if (env.id !== envId) return env;
            return {
                ...env,
                items: env.items.map((item) => {
                    if (item.id !== itemId) return item;
                    return { ...item, ...updates };
                })
            };
        }));
    };

    const addGeneralPhoto = async (envId: string) => {
        const response = await fetch('https://via.placeholder.com/800x600');
        const blob = await response.blob();
        const key = `blob-ref:gen-${envId}-${Date.now()}`;
        await saveBlob(key, blob);
        const url = URL.createObjectURL(blob);

        setEnvironments(envs => envs.map(env => {
            if (env.id !== envId) return env;
            return {
                ...env,
                generalPhotos: [...(env.generalPhotos || []), url]
            };
        }));
    };

    const captureItemPhoto = async (envId: string, itemId: string) => {
        const response = await fetch('https://via.placeholder.com/800x600');
        const blob = await response.blob();
        const key = `blob-ref:item-${itemId}-${Date.now()}`;
        await saveBlob(key, blob);
        const url = URL.createObjectURL(blob);

        updateItem(envId, itemId, { photo: url });
    };

    const handleAddEnvironment = (e: React.FormEvent) => {
        e.preventDefault();

        let templateItems: { name: string, category: string }[] = [
            { name: 'Limpeza Geral', category: 'Geral' },
            { name: 'Pintura', category: 'Geral' }
        ];
        let envName = customTemplateName || 'Novo Ambiente';

        if (selectedTemplateName !== 'custom') {
            const template = availableTemplates.find(t => t.nome === selectedTemplateName);
            if (template) {
                templateItems = template.categorias.flatMap((cat: any) =>
                    cat.itens.map((it: string) => ({ name: it, category: cat.nome }))
                );
                envName = template.nome;
            }
        }

        const newEnvId = `env-${Date.now()}`;
        const newEnvironment: Environment = {
            id: newEnvId,
            name: envName,
            generalPhotos: [],
            items: templateItems.map((it, i) => ({
                id: `it-${newEnvId}-${i}`,
                name: it.name,
                category: it.category,
                status: 'pending',
                defect: '',
                observation: '',
                photo: undefined,
            }))
        };

        setEnvironments([...environments, newEnvironment]);
        setIsAddEnvModalOpen(false);
        setCustomTemplateName('');
        setSelectedTemplateName('');
        setActiveEnvId(newEnvId);
    };

    const removeEnvironment = (envId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja remover este ambiente da vistoria?')) {
            setEnvironments(environments.filter(env => env.id !== envId));
        }
    };

    const handleFinish = () => {
        window.location.href = '/dashboard/inspections/summary-demo';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Clock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xl font-black uppercase tracking-widest text-foreground">Sincronizando</p>
                    <p className="text-muted-foreground font-medium italic">Recuperando dados da vistoria local...</p>
                </div>
            </div>
        );
    }

    // ─── AMBIENTE ATIVO (Checklist Detalhado) ───
    if (activeEnvId) {
        const env = environments.find((e) => e.id === activeEnvId)!;
        return (
            <div className="max-w-2xl mx-auto space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-border/40">
                    <div className="flex items-center gap-4">
                        <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl shadow-md" onClick={() => setActiveEnvId(null)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{env.name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Conferência de Itens</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none font-black px-4 py-1.5 rounded-full">
                        {env.items.filter(i => i.status !== 'pending').length}/{env.items.length}
                    </Badge>
                </div>

                <Tabs defaultValue="items" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-16 bg-muted/40 p-1.5 rounded-2xl mb-8">
                        <TabsTrigger value="items" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all gap-2">
                            <Layout className="h-4 w-4" /> Checklist
                        </TabsTrigger>
                        <TabsTrigger value="photos" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-xl transition-all gap-2">
                            <ImageIcon className="h-4 w-4" /> Fotos Gerais
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="items" className="space-y-10">
                        {Object.entries(
                            env.items.reduce((acc: Record<string, InspectionItem[]>, item: InspectionItem) => {
                                const cat = item.category || 'Geral';
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(item);
                                return acc;
                            }, {})
                        ).map(([categoryName, items]: [string, InspectionItem[]]) => (
                            <div key={categoryName} className="space-y-6">
                                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                                        {categoryName}
                                    </h3>
                                    <div className="h-px bg-border/40 flex-1" />
                                </div>
                                {items.map((item: InspectionItem) => (
                                    <Card key={item.id} className={`overflow-hidden border-none shadow-xl transition-all rounded-[1.5rem] ${
                                        item.status === 'not_ok' ? 'bg-red-50/30 ring-2 ring-red-500/20' : 
                                        item.status === 'ok' ? 'bg-emerald-50/30' : 'bg-card'
                                    }`}>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                <span className="font-black text-xl tracking-tight leading-tight">{item.name}</span>
                                                <div className="flex gap-3 w-full md:w-auto">
                                                    <Button
                                                        className={`flex-1 md:flex-none h-12 px-6 rounded-xl font-black transition-all gap-2 ${
                                                            item.status === 'ok' 
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' 
                                                            : 'bg-muted/50 hover:bg-emerald-50 text-emerald-600'
                                                        }`}
                                                        onClick={() => updateItem(env.id, item.id, { status: 'ok' })}
                                                    >
                                                        <Check className="h-5 w-5" /> OK
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        className={`flex-1 md:flex-none h-12 px-6 rounded-xl font-black transition-all gap-2 ${
                                                            item.status === 'not_ok' 
                                                            ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20' 
                                                            : 'bg-muted/50 hover:bg-red-50 text-red-600'
                                                        }`}
                                                        onClick={() => updateItem(env.id, item.id, { status: 'not_ok' })}
                                                    >
                                                        <AlertCircle className="h-5 w-5" /> AVARIA
                                                    </Button>
                                                </div>
                                            </div>

                                            {item.status === 'not_ok' && (
                                                <div className="space-y-6 bg-white/40 p-6 rounded-2xl animate-in fade-in zoom-in-95">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Natureza do Defeito</Label>
                                                            <Select value={item.defect || ""} onValueChange={(v) => updateItem(env.id, item.id, { defect: v || undefined })}>
                                                                <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold">
                                                                    <SelectValue placeholder="Selecione o problema" />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                                    <SelectItem value="Riscado" className="font-bold">Riscado / Manchado</SelectItem>
                                                                    <SelectItem value="Quebrado" className="font-bold">Quebrado / Danificado</SelectItem>
                                                                    <SelectItem value="Faltando" className="font-bold">Faltando Peça</SelectItem>
                                                                    <SelectItem value="Sujo" className="font-bold">Sujeira Excessiva</SelectItem>
                                                                    <SelectItem value="Outro" className="font-bold text-primary">Outro (Descrever)</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observações Técnicas</Label>
                                                            <Input
                                                                placeholder="Detalhes adicionais..."
                                                                className="h-12 rounded-xl bg-card border-none shadow-sm font-bold"
                                                                value={item.observation}
                                                                onChange={(e) => updateItem(env.id, item.id, { observation: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex justify-between">
                                                    Registro Fotográfico do Item
                                                    {item.status === 'not_ok' && <Badge variant="destructive" className="h-4 text-[7px] font-black px-1.5 uppercase tracking-tighter">Obrigatório</Badge>}
                                                </Label>
                                                <div className="grid grid-cols-1">
                                                    <button
                                                        className="w-full h-32 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center bg-muted/20 hover:bg-primary/5 hover:border-primary/40 transition-all group relative overflow-hidden"
                                                        onClick={() => captureItemPhoto(env.id, item.id)}
                                                    >
                                                        {item.photo ? (
                                                            <>
                                                                <img src={item.photo} alt="Item" className="h-full w-full object-cover" />
                                                                <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                                                                    <Camera className="h-8 w-8 mb-2" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Alternar Foto</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Camera className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors mb-2" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Capturar Evidência</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="photos" className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-2 gap-6">
                            {(env.generalPhotos || []).map((photo: string, i: number) => (
                                <div key={i} className="aspect-video relative rounded-3xl overflow-hidden border shadow-lg group">
                                    <img src={photo} alt={`Foto geral ${i + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-end">
                                        <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black text-[10px]">VISÃO GERAL {i + 1}</Badge>
                                    </div>
                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <button
                                className="aspect-video rounded-3xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:bg-primary/10 hover:border-primary/40 transition-all group"
                                onClick={() => addGeneralPhoto(env.id)}
                            >
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Adicionar Panorama</span>
                            </button>
                        </div>
                        <div className="bg-foreground p-6 rounded-[2rem] text-card-foreground flex gap-4 items-center">
                            <AlertCircle className="h-10 w-10 text-primary shrink-0" />
                            <p className="text-xs font-medium italic opacity-80">
                                <span className="font-black not-italic block mb-1">DICA DO ESPECIALISTA</span>
                                Tire fotos panorâmicas do ambiente para registrar o estado geral de conservação antes de focar nos itens individuais.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions for Active Env */}
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 flex gap-4 max-w-2xl mx-auto rounded-t-[2.5rem] shadow-2xl">
                    <Button variant="secondary" className="h-14 flex-1 rounded-2xl font-black gap-2 shadow-md border-none" onClick={() => handleSaveAsTemplate(env)}>
                        <Save className="h-5 w-5" /> Salvar Modelo
                    </Button>
                    <Button className="h-14 flex-[2] rounded-2xl font-black text-lg shadow-xl shadow-primary/20 bg-primary text-primary-foreground" onClick={() => setActiveEnvId(null)}>
                        Concluir <ArrowLeft className="h-5 w-5 rotate-180" />
                    </Button>
                </div>
            </div>
        );
    }

    // ─── LISTAGEM DE AMBIENTES (Visão Geral) ───
    return (
        <div className="max-w-xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">Vistoria Ativa</h1>
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                            {stats.checked} de {stats.total} verificados
                        </span>
                        <span className="text-2xl font-black text-primary">{progress}%</span>
                    </div>
                </div>
                <div className="relative h-4 w-full bg-muted/40 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className="absolute h-full bg-primary transition-all duration-1000 ease-in-out flex items-center justify-end px-2"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="h-1.5 w-1.5 rounded-full bg-white shadow-lg animate-pulse" />
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {environments.length === 0 && (
                    <div className="text-center py-20 bg-muted/20 border-2 border-dashed border-border/40 rounded-[2.5rem] flex flex-col items-center gap-6">
                        <div className="h-20 w-20 rounded-[2rem] bg-background flex items-center justify-center shadow-xl text-primary/20">
                            <Layout className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <p className="font-black text-xl uppercase tracking-tight">Vistoria Vazia</p>
                            <p className="text-muted-foreground font-medium italic">Adicione o primeiro ambiente para começar o laudo.</p>
                        </div>
                        <Button className="h-12 px-8 rounded-xl font-black gap-2" onClick={() => setIsAddEnvModalOpen(true)}>
                            <Plus className="h-5 w-5" /> Adicionar Cômodo
                        </Button>
                    </div>
                )}
                
                {environments.map((env) => {
                    const envChecked = env.items?.filter((i: InspectionItem) => i.status !== 'pending').length || 0;
                    const itemsDone = env.items?.length > 0 && envChecked === env.items.length;
                    const photosCount = (env.generalPhotos || []).length;
                    const hasDefects = env.items.some(i => i.status === 'not_ok');

                    return (
                        <Card
                            key={env.id}
                            className={`group cursor-pointer border-none shadow-xl transition-all rounded-[1.8rem] hover:scale-[1.02] active:scale-[0.98] ${
                                itemsDone ? 'bg-emerald-50/20' : 'bg-card'
                            }`}
                            onClick={() => setActiveEnvId(env.id)}
                        >
                            <CardContent className="p-6 flex flex-row items-center gap-5">
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:rotate-3 ${
                                    itemsDone ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {itemsDone ? <Check className="h-8 w-8" /> : <Layout className="h-8 w-8" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-black tracking-tight truncate">{env.name}</h3>
                                        {hasDefects && <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center rounded-full"><AlertCircle className="h-3 w-3" /></Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                                        <span>{envChecked}/{env.items?.length || 0} Itens</span>
                                        {photosCount > 0 && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                                                <span className="flex items-center gap-1.5">
                                                    <Camera className="h-3 w-3" /> {photosCount} Fotos
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-muted-foreground hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        onClick={(e) => removeEnvironment(env.id, e)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <ChevronRight className="h-6 w-6 text-primary transition-transform group-hover:translate-x-1" />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {environments.length > 0 && (
                    <Button
                        variant="outline"
                        className="h-24 border-2 border-dashed border-primary/20 rounded-[2rem] bg-primary/5 flex flex-col gap-2 hover:bg-primary/10 hover:border-primary/40 transition-all font-black uppercase text-[10px] tracking-widest text-primary"
                        onClick={() => setIsAddEnvModalOpen(true)}
                    >
                        <Plus className="h-8 w-8" />
                        Adicionar Novo Ambiente
                    </Button>
                )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 max-w-xl mx-auto rounded-t-[2.5rem] shadow-2xl">
                <Button 
                    className="w-full h-16 rounded-2xl font-black text-xl gap-3 shadow-2xl shadow-primary/30 transition-all disabled:opacity-40"
                    disabled={progress < 100 || environments.length === 0} 
                    onClick={handleFinish}
                >
                    <FileText className="h-6 w-6" />
                    Gerar Laudo Final
                </Button>
            </div>

            {/* Modal de Adição de Ambiente */}
            <Dialog open={isAddEnvModalOpen} onOpenChange={setIsAddEnvModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-primary p-10 text-primary-foreground relative overflow-hidden">
                        <Layout className="h-32 w-32 absolute -bottom-8 -right-8 text-black/10 rotate-12" />
                        <DialogTitle className="text-3xl font-black tracking-tight">Onde estamos?</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 mt-2 text-base font-medium">
                            Selecione o cômodo para iniciar a conferência.
                        </DialogDescription>
                    </div>
                    <form onSubmit={handleAddEnvironment} className="p-10 space-y-8 bg-card">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="template" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modelo de Checklist</Label>
                                <Select value={selectedTemplateName} onValueChange={(val) => setSelectedTemplateName(val || '')}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6">
                                        <SelectValue placeholder="Escolha um cômodo..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                        <SelectItem value="custom" className="font-black text-primary rounded-xl py-3 px-4 mb-2 bg-primary/5">
                                            + Criar Manualmente
                                        </SelectItem>
                                        <div className="max-h-[300px] overflow-auto pr-1">
                                            {availableTemplates.map((tmpl, idx) => (
                                                <SelectItem key={idx} value={tmpl.nome} className="rounded-xl py-3 px-4 font-bold border-b last:border-0 border-border/10">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{tmpl.nome}</span>
                                                        {!tmpl.agency_id ?
                                                            <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 bg-emerald-500 text-white border-none ml-2">PADRÃO</Badge> :
                                                            <Badge variant="outline" className="text-[8px] h-4 py-0 px-1 bg-blue-500 text-white border-none ml-2">SALVO</Badge>
                                                        }
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedTemplateName === 'custom' && (
                                <div className="space-y-3 pt-6 border-t border-border/40 animate-in slide-in-from-top-4">
                                    <Label htmlFor="customName" className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Identificação do Espaço</Label>
                                    <Input
                                        id="customName"
                                        placeholder="Ex: Área Gourmet, Garagem 2..."
                                        value={customTemplateName}
                                        onChange={(e) => setCustomTemplateName(e.target.value)}
                                        required
                                        className="h-14 rounded-2xl bg-primary/5 border-none shadow-inner font-bold px-6 text-primary"
                                    />
                                    <p className="text-[10px] text-muted-foreground font-medium italic mt-1">Este ambiente terá apenas itens de limpeza e pintura por padrão.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" size="lg" className="h-14 rounded-2xl font-black shadow-xl shadow-primary/20" disabled={!selectedTemplateName || (selectedTemplateName === 'custom' && !customTemplateName)}>
                                Confirmar e Ir
                            </Button>
                            <Button type="button" variant="ghost" className="h-12 rounded-2xl font-bold opacity-60 hover:opacity-100" onClick={() => setIsAddEnvModalOpen(false)}>
                                Desistir
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
