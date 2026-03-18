'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InspectionItem, InspectionEnvironment as Environment } from '@/types';
import { 
    Loader2,
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
    Clock,
    Droplets,
    Zap,
    Flame,
    Key,
    FileCheck2,
    ChevronDown,
    ChevronUp,
    Home,
    Sofa,
    Utensils,
    Bed,
    Bath,
    Coffee,
    Car,
    Trees,
    ImagePlus,
    Edit2,
    MoreVertical,
    Copy,
    PenLine,
    X
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
/* eslint-disable @next/next/no-img-element */
import { saveDraft, getDraft, saveBlob, getBlob, purgeOldDrafts, deleteDraft } from '@/lib/db';
import { fetchRoomTemplates, saveRoomTemplate, fetchInspection, updateInspection } from '@/lib/database';
import { useAuth } from '@/components/auth/auth-provider';
import { isSupabaseConfigured } from '@/lib/supabase';

const DRAFT_ID = 'active-inspection-demo';

export default function ActiveInspection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inspectionId = searchParams.get('id');
    const { user } = useAuth();
    const agencyId = user?.tenantId || 'tenant-1'; 
    
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [collapsedInternalCategories, setCollapsedInternalCategories] = useState<Record<string, boolean>>({});
    const [targetedEnvId, setTargetedEnvId] = useState<string | null>(null);
    const [photoName, setPhotoName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const blobKeyMapRef = useRef<Record<string, string>>({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);

    const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
    const [editingEnvName, setEditingEnvName] = useState('');

    // Insurance-related state
    const [meters, setMeters] = useState({ light: '', water: '', gas: '' });
    const [keys, setKeys] = useState<{description: string, quantity: number}[]>([]);
    const [agreement, setAgreement] = useState('');
    const [inspectionData, setInspectionData] = useState<any>(null);
    const [isFinishing, setIsFinishing] = useState(false);

    const handleSaveAsTemplate = async (env: Environment) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const template: any = {
                nome: env.name,
                categorias: Object.entries(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    env.items.reduce((acc: any, item) => {
                        const cat = item.category || 'Geral';
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item.name);
                        return acc;
                    }, {})
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                if (inspectionId && isSupabaseConfigured) {
                    const insp = await fetchInspection(inspectionId);
                    if (insp) {
                        setInspectionData(insp);
                        
                        // Check if we have a local draft for this specific ID
                        const draft = await getDraft(inspectionId);
                        let initialEnvs = [];

                        if (draft) {
                            if (draft.environments && draft.environments.length > 0) {
                                initialEnvs = JSON.parse(JSON.stringify(draft.environments));
                                // Restore blobs
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
                                setEnvironments(insp.environments || []);
                            }
                            
                            setMeters(draft.meters && Object.keys(draft.meters).length > 0 ? draft.meters : insp.meters || { light: '', water: '', gas: '' });
                            setKeys(draft.keys && draft.keys.length > 0 ? draft.keys : insp.keys || []);
                            setAgreement(draft.agreement || insp.agreementTerm || '');
                        } else {
                            // No local draft, use database data
                            setEnvironments(insp.environments || []);
                            if (insp.meters) setMeters(insp.meters as any);
                            if (insp.keys) setKeys(insp.keys as any);
                            if (insp.agreementTerm) setAgreement(insp.agreementTerm);
                        }
                    }
                } else {
                    // Fallback to demo draft ID if no ID provided (legacy behavior)
                    const draft = await getDraft(DRAFT_ID);
                    if (draft) {
                        setEnvironments(draft.environments || []);
                        if (draft.meters) setMeters(draft.meters);
                        if (draft.keys) setKeys(draft.keys);
                        if (draft.agreement) setAgreement(draft.agreement);
                    }
                }
            } catch (err) {
                console.error('Failed to init inspection:', err);
            }
            setIsLoading(false);
        }
        init();
    }, [agencyId, inspectionId]);

    useEffect(() => {
        if (!isLoading) {
            const cleanEnvs = JSON.parse(JSON.stringify(environments));
            for (const env of cleanEnvs) {
                if (env.generalPhotos) {
                    env.generalPhotos = env.generalPhotos.map((p: string) => p.startsWith('blob:') ? (blobKeyMapRef.current[p] || `blob-ref:gen-${env.id}-${p.slice(-5)}`) : p);
                }
                if (env.items) {
                    env.items.forEach((item: InspectionItem) => {
                        if (item.photo && item.photo.startsWith('blob:')) {
                            item.photo = blobKeyMapRef.current[item.photo] || `blob-ref:item-${item.id}`;
                        }
                    });
                }
            }
            
            const currentId = inspectionId || DRAFT_ID;
            saveDraft(currentId, agencyId, cleanEnvs, { meters, keys, agreement });
        }
    }, [environments, isLoading, agencyId, inspectionId, meters, keys, agreement]);

    const [isSavingSupabase, setIsSavingSupabase] = useState(false);
    const handleManualSave = async () => {
        if (!inspectionId || !isSupabaseConfigured) return;
        setIsSavingSupabase(true);
        try {
            const cleanEnvs = JSON.parse(JSON.stringify(environments));
            for (const env of cleanEnvs) {
                if (env.generalPhotos) {
                    env.generalPhotos = env.generalPhotos.map((p: string) => p.startsWith('blob:') ? (blobKeyMapRef.current[p] || `blob-ref:gen-${env.id}-${p.slice(-5)}`) : p);
                }
                if (env.items) {
                    env.items.forEach((item: InspectionItem) => {
                        if (item.photo && item.photo.startsWith('blob:')) {
                            item.photo = blobKeyMapRef.current[item.photo] || `blob-ref:item-${item.id}`;
                        }
                    });
                }
            }

            await updateInspection(inspectionId, {
                environments: cleanEnvs,
                meters: meters as any,
                keys: keys as any,
                agreementTerm: agreement
            });
            alert('Rascunho salvo com sucesso!');
        } catch (err) {
            console.error('Manual save failed:', err);
            alert('Falha ao salvar rascunho.');
        } finally {
            setIsSavingSupabase(false);
        }
    };

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

    const addItemToEnv = (envId: string, category: string) => {
        const itemName = prompt('Nome do novo item:');
        if (!itemName) return;

        const newItem: InspectionItem = {
            id: `it-custom-${Date.now()}`,
            name: itemName,
            category: category,
            status: 'pending',
            defect: '',
            observation: '',
            photo: undefined,
        };

        setEnvironments(envs => envs.map(env => {
            if (env.id !== envId) return env;
            return {
                ...env,
                items: [...env.items, newItem]
            };
        }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, envId: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const blob = new Blob([file], { type: file.type });
            const key = `blob-ref:gen-${envId}-${Date.now()}-${i}`;
            await saveBlob(key, blob);
            const url = URL.createObjectURL(blob);
            blobKeyMapRef.current[url] = key;

            setEnvironments(envs => envs.map(env => {
                if (env.id !== envId) return env;
                return {
                    ...env,
                    generalPhotos: [...(env.generalPhotos || []), url]
                };
            }));
        }
        // Clear input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addGeneralPhoto = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const deletePhoto = (envId: string, photoUrl: string) => {
        setEnvironments(envs => envs.map(env => {
            if (env.id !== envId) return env;
            return {
                ...env,
                generalPhotos: (env.generalPhotos || []).filter(p => p !== photoUrl)
            };
        }));
    };

    const handleAddEnvironment = (e?: React.FormEvent, templateFromGrid?: string, customNameArg?: string) => {
        if (e) e.preventDefault();

        const templateToUse = templateFromGrid || selectedTemplateName;
        let envName = customNameArg || customTemplateName || templateToUse || 'Novo Ambiente';
        let templateItems: { name: string, category: string }[] = [
            { name: 'Limpeza Geral', category: 'Geral' },
            { name: 'Pintura', category: 'Geral' }
        ];

        if (templateToUse && templateToUse !== 'custom') {
            const template = availableTemplates.find(t => t.nome === templateToUse);
            if (template) {
                templateItems = template.categorias.flatMap((cat: any) =>
                    cat.itens.map((it: string) => ({ name: it, category: cat.nome }))
                );
                if (!customNameArg) envName = template.nome;
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

    const removeEnvironment = (envId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm('Tem certeza que deseja remover este ambiente da vistoria?')) {
            const nextEnvs = environments.filter(env => env.id !== envId);
            setEnvironments(nextEnvs);
            if (activeEnvId === envId) {
                setActiveEnvId(nextEnvs.length > 0 ? nextEnvs[0].id : null);
            }
        }
    };

    const duplicateEnvironment = (envId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const envToCopy = environments.find(env => env.id === envId);
        if (!envToCopy) return;

        const newEnvId = `env-copy-${Date.now()}`;
        const newEnv: Environment = {
            ...envToCopy,
            id: newEnvId,
            name: `${envToCopy.name} (Cópia)`,
            generalPhotos: [],
            items: envToCopy.items.map((it, i) => ({
                id: `it-${newEnvId}-${i}`,
                name: it.name,
                category: it.category,
                status: 'pending',
                photo: undefined,
                observation: '',
                defect: ''
            }))
        };
        setEnvironments([...environments, newEnv]);
        setActiveEnvId(newEnvId);
    };

    const saveRenamedEnv = (envId: string) => {
        if (!editingEnvName.trim()) {
            setEditingEnvId(null);
            return;
        }
        setEnvironments(envs => envs.map(e => e.id === envId ? { ...e, name: editingEnvName.trim() } : e));
        setEditingEnvId(null);
    };

    const handleFinish = async () => {
        if (inspectionId && isSupabaseConfigured) {
            setIsFinishing(true);
            try {
                // Ensure all data is saved
                const cleanEnvs = JSON.parse(JSON.stringify(environments));
                for (const env of cleanEnvs) {
                    if (env.generalPhotos) {
                        env.generalPhotos = env.generalPhotos.map((p: string) => p.startsWith('blob:') ? (blobKeyMapRef.current[p] || `blob-ref:gen-${env.id}-${p.slice(-5)}`) : p);
                    }
                    if (env.items) {
                        env.items.forEach((item: InspectionItem) => {
                            if (item.photo && item.photo.startsWith('blob:')) {
                                item.photo = blobKeyMapRef.current[item.photo] || `blob-ref:item-${item.id}`;
                            }
                        });
                    }
                }

                await updateInspection(inspectionId, { 
                    status: 'completed',
                    environments: cleanEnvs,
                    meters: meters as any,
                    keys: keys as any,
                    agreementTerm: agreement
                });
                
                await deleteDraft(inspectionId);
                router.push(`/dashboard/inspections/summary-demo?id=${inspectionId}`);
            } catch (err) {
                console.error(err);
                alert('Erro ao finalizar vistoria.');
            } finally {
                setIsFinishing(false);
            }
        } else {
            router.push('/dashboard/inspections/summary-demo');
        }
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

    // ─── PÁGINA DE VISTORIA (Visão Geral em Sessões) ───
    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 pb-40 animate-in fade-in duration-700 px-3">
            {/* Header Simples */}
            <div className="pt-8 pb-2">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-none">Vistoria Ativa</h1>
            </div>

            {/* 1. SESSÃO: AMBIENTES */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Ambientes</h3>
                    <div className="h-px bg-border/40 flex-1" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 bg-primary/5 text-primary hover:bg-primary/10"
                        onClick={() => setIsAddEnvModalOpen(true)}
                    >
                        <Plus className="h-3 w-3" /> Adicionar
                    </Button>
                </div>

                {environments.length === 0 && (
                    <div className="text-center py-12 bg-muted/5 border-2 border-dashed border-border/20 rounded-[2rem] flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center shadow-lg text-primary/20">
                            <Layout className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-black text-lg uppercase tracking-tight text-foreground/40">Nenhum Ambiente</p>
                            <p className="text-muted-foreground text-xs font-medium italic">Adicione o primeiro cômodo acima.</p>
                        </div>
                    </div>
                )}

                {/* Horizontal Tabs for Environments */}
                {environments.length > 0 && (
                    <Tabs value={activeEnvId || environments[0].id} onValueChange={setActiveEnvId} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto bg-transparent h-auto p-0 gap-2 pb-2 no-scrollbar">
                            {environments.map((env) => (
                                <TabsTrigger 
                                    key={env.id} 
                                    value={env.id}
                                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl rounded-2xl px-6 py-3 font-black tracking-tight"
                                >
                                    {env.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {environments.map((env) => {
                            const envChecked = env.items?.filter((i: InspectionItem) => i.status !== 'pending').length || 0;
                            const itemsDone = env.items?.length > 0 && envChecked === env.items.length;
                            const photosCount = (env.generalPhotos || []).length;

                            return (
                                <TabsContent key={env.id} value={env.id} className="mt-4 outline-none">
                                    <div className="bg-card rounded-[2rem] shadow-xl overflow-hidden p-3 sm:p-4 border border-border/10">
                                        
                                        {/* Environment Header Actions */}
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
                                            {editingEnvId === env.id ? (
                                                <div className="flex items-center gap-2 flex-1 mr-4">
                                                    <Input 
                                                        value={editingEnvName} 
                                                        onChange={e => setEditingEnvName(e.target.value)} 
                                                        className="h-12 text-xl font-black bg-muted/40 rounded-xl border-none shadow-inner"
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && saveRenamedEnv(env.id)}
                                                    />
                                                    <Button onClick={() => saveRenamedEnv(env.id)} className="h-12 w-12 rounded-xl p-0 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"><Check className="h-5 w-5"/></Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                                        itemsDone ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                        {itemsDone ? <Check className="h-6 w-6" /> : <Layout className="h-6 w-6" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                                            {env.name}
                                                            <button title="Renomear" onClick={() => { setEditingEnvId(env.id); setEditingEnvName(env.name); }} className="text-muted-foreground hover:text-primary transition-colors h-6 w-6 inline-flex items-center justify-center rounded-md"><PenLine className="h-4 w-4"/></button>
                                                        </h3>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                                                            {env.items?.length || 0} Itens • {photosCount} Fotos
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button title="Duplicar" variant="ghost" size="icon" className="h-10 w-10 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl" onClick={(e) => duplicateEnvironment(env.id, e)}>
                                                    <Copy className="h-4 w-4"/>
                                                </Button>
                                                <Button title="Excluir" variant="ghost" size="icon" className="h-10 w-10 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl" onClick={(e) => removeEnvironment(env.id, e)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                                            {/* Checklist de Itens Integrado */}
                                            <div className="space-y-4">
                                                {Object.entries(
                                                    env.items.reduce((acc: Record<string, InspectionItem[]>, item: InspectionItem) => {
                                                        const cat = item.category || 'Geral';
                                                        if (!acc[cat]) acc[cat] = [];
                                                        acc[cat].push(item);
                                                        return acc;
                                                    }, {})
                                                ).map(([categoryName, items]: [string, InspectionItem[]]) => {
                                                    const categoryKey = `${env.id}-${categoryName}`;
                                                    const isCatCollapsed = collapsedInternalCategories[categoryKey] ?? true;

                                                    return (
                                                        <div key={categoryName} className="space-y-3">
                                                            <button 
                                                                onClick={() => setCollapsedInternalCategories(prev => ({ ...prev, [categoryKey]: !isCatCollapsed }))}
                                                                className="flex items-center justify-between w-full px-2 group/cat"
                                                            >
                                                                <p className="text-[10px] font-black text-muted-foreground group-hover/cat:text-primary transition-colors uppercase tracking-[0.2em]">{categoryName}</p>
                                                                {isCatCollapsed ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronUp className="h-3 w-3 text-primary" />}
                                                            </button>
                                                            
                                                            {!isCatCollapsed && (
                                                                <div className="bg-muted/30 rounded-3xl p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                                    {items.map((item) => (
                                                                        <div key={item.id} className="space-y-2">
                                                                            <div className="flex items-center justify-between p-3 bg-card rounded-2xl shadow-sm border border-border/10">
                                                                                <span className="text-sm font-bold text-foreground/80 px-2 truncate flex-1">{item.name}</span>
                                                                                <div className="flex gap-1">
                                                                                    <button 
                                                                                        onClick={() => updateItem(env.id, item.id, { status: item.status === 'ok' ? 'pending' : 'ok' })}
                                                                                        className={`h-9 px-4 rounded-xl font-black text-[9px] transition-all ${
                                                                                            item.status === 'ok' ? 'bg-emerald-600 text-white shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600'
                                                                                        }`}
                                                                                    >
                                                                                        OK
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={() => updateItem(env.id, item.id, { status: item.status === 'not_ok' ? 'pending' : 'not_ok' })}
                                                                                        className={`h-9 px-4 rounded-xl font-black text-[9px] transition-all ${
                                                                                            item.status === 'not_ok' ? 'bg-red-600 text-white shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-600'
                                                                                        }`}
                                                                                    >
                                                                                        AVARIA
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            {item.status === 'not_ok' && (
                                                                                <div className="px-2 pb-2 animate-in zoom-in-95 duration-200">
                                                                                    <Input 
                                                                                        placeholder="Descreva a avaria em texto livre..."
                                                                                        value={item.observation || ''}
                                                                                        onChange={(e) => updateItem(env.id, item.id, { observation: e.target.value })}
                                                                                        className="h-10 rounded-xl bg-white border-2 border-red-100 shadow-inner font-bold text-xs px-4 focus-visible:ring-red-200"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        className="w-full h-10 rounded-xl border border-dashed border-primary/20 text-primary hover:bg-primary/5 font-black text-[9px] uppercase tracking-widest mt-1"
                                                                        onClick={() => addItemToEnv(env.id, categoryName)}
                                                                    >
                                                                        <Plus className="h-3 w-3 mr-1" /> Adicionar Item em {categoryName}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="flex-1 h-12 rounded-2xl border-2 border-dashed border-primary/10 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest gap-2"
                                                        onClick={() => {
                                                            const catName = prompt('Nome da nova categoria (ex: Pintura, Elétrica):');
                                                            if (catName) addItemToEnv(env.id, catName);
                                                        }}
                                                    >
                                                        <Plus className="h-4 w-4" /> Nova Categoria
                                                    </Button>
                                                    <Button 
                                                        variant="secondary" 
                                                        className="flex-[2] h-12 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-[10px] uppercase tracking-widest gap-3 shadow-lg shadow-primary/20"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTargetedEnvId(env.id);
                                                            setIsPhotoModalOpen(true);
                                                        }}
                                                    >
                                                        <Camera className="h-4 w-4" /> Capturar Evidências
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Fotos do Ambiente */}
                                            {photosCount > 0 && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-2">Fotos do Ambiente</p>
                                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1">
                                                        {(env.generalPhotos || []).map((photo, i) => (
                                                            <div key={i} className="relative group/photo shrink-0">
                                                                <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                                                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <button 
                                                                    onClick={() => deletePhoto(env.id, photo)}
                                                                    className="absolute -top-2 -right-2 h-7 w-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-3 pt-4 border-t border-border/40">
                                                <Button 
                                                    variant="ghost" 
                                                    className="h-10 text-primary font-bold text-xs hover:bg-primary/5 rounded-xl ml-auto"
                                                    onClick={() => handleSaveAsTemplate(env)}
                                                >
                                                    Salvar como Modelo
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                )}
            </section>

            {/* 2. SESSÃO: DADOS DE LEITURA */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dados de Leitura</h3>
                    <div className="h-px bg-border/40 flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { id: 'light', label: 'Luz', icon: Zap, color: 'yellow', value: meters.light },
                        { id: 'water', label: 'Água', icon: Droplets, color: 'blue', value: meters.water },
                        { id: 'gas', label: 'Gás', icon: Flame, color: 'orange', value: meters.gas },
                    ].map((m) => (
                        <Card key={m.id} className="border-none shadow-premium bg-card rounded-[2rem] overflow-hidden group">
                            <div className="p-6 flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl bg-${m.color}-500/10 flex items-center justify-center text-${m.color}-600`}>
                                    <m.icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Input 
                                        value={m.value} 
                                        onChange={(e) => setMeters({...meters, [m.id]: e.target.value})}
                                        placeholder={`Leitura ${m.label}`} 
                                        className="border-none bg-muted/40 h-11 rounded-xl font-black text-lg p-4 shadow-inner focus-visible:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* 3. SESSÃO: CHAVES */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Chaves</h3>
                    <div className="h-px bg-border/40 flex-1" />
                </div>
                <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 space-y-4">
                        {keys.length > 0 && (
                            <div className="grid gap-3">
                                {keys.map((k, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-muted/30 p-4 rounded-[1.5rem] border border-border/10">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Key className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm tracking-tight">{k.description}</p>
                                            <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">{k.quantity} un</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setKeys(keys.filter((_, i) => i !== idx))} className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button 
                            variant="outline" 
                            className="w-full h-14 rounded-2xl font-black border-dashed border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 shadow-sm gap-3"
                            onClick={() => {
                                const desc = prompt('Descrição da Chave:');
                                const qty = prompt('Quantidade:');
                                if (desc && qty) setKeys([...keys, { description: desc, quantity: parseInt(qty) || 1 }]);
                            }}
                        >
                            <Plus className="h-4 w-4" /> Nova Chave
                        </Button>
                    </div>
                </Card>
            </section>

            {/* 4. SESSÃO: TERMO */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Termo de Concordância</h3>
                    <div className="h-px bg-border/40 flex-1" />
                </div>
                <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
                    <div className="p-6">
                        <Textarea 
                            value={agreement}
                            onChange={(e) => setAgreement(e.target.value)}
                            placeholder="As partes declaram estar de acordo..."
                            className="min-h-[150px] rounded-2xl bg-muted/40 border-none p-6 font-medium italic shadow-inner focus-visible:ring-primary/20"
                        />
                    </div>
                </Card>
            </section>

            {/* Photo Upload Dialog (Shared) */}
            <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
                <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl max-w-sm mx-auto">
                    <DialogTitle className="text-2xl font-black tracking-tighter">Nova Foto</DialogTitle>
                    <DialogDescription className="text-xs font-medium italic opacity-60">Adicione uma imagem para este ambiente.</DialogDescription>
                    
                    <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                            <input 
                                type="file" 
                                id="env-photo-upload"
                                className="hidden" 
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={(e) => {
                                    if (targetedEnvId) {
                                        handlePhotoUpload(e, targetedEnvId);
                                        setIsPhotoModalOpen(false);
                                    }
                                }}
                            />
                            <Button 
                                className="h-16 rounded-[1.2rem] bg-primary text-white font-black text-lg gap-3 shadow-xl shadow-primary/20"
                                onClick={() => document.getElementById('env-photo-upload')?.click()}
                            >
                                <Camera className="h-7 w-7" /> Abrir Câmera
                            </Button>
                            <div className="text-center opacity-40">
                                <span className="text-[9px] font-black uppercase tracking-widest italic">Ou selecione fotos da galeria</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bottom Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 px-3 pb-6 pt-3 bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 w-full">
                <div className="max-w-xl mx-auto flex gap-4">
                    <Button 
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl font-black text-lg gap-3 border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all"
                        onClick={handleManualSave}
                        disabled={isSavingSupabase || !inspectionId}
                    >
                        {isSavingSupabase ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Salvar
                    </Button>
                    <Button 
                        className="flex-[2] h-14 rounded-2xl font-black text-lg gap-3 shadow-2xl shadow-emerald-500/20 transition-all active:scale-[0.98] bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={environments.length === 0 || isSavingSupabase || isFinishing} 
                        onClick={handleFinish}
                    >
                        {isFinishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck2 className="h-5 w-5" />}
                        Finalizar
                    </Button>
                </div>
            </div>

            {/* Add Env Modal */}
            <Dialog open={isAddEnvModalOpen} onOpenChange={setIsAddEnvModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-card">
                    <div className="bg-primary p-12 text-primary-foreground relative overflow-hidden group">
                        <div className="absolute -bottom-8 -right-8 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <DialogTitle className="text-3xl font-black tracking-tight leading-none">Onde estamos?</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 mt-3 text-sm font-medium italic">
                            Selecione o cômodo para iniciar a conferência.
                        </DialogDescription>
                    </div>
                    <div className="p-8 space-y-4 bg-card max-h-[70vh] overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 gap-3">
                            {availableTemplates.map((tmpl, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => { handleAddEnvironment(undefined, tmpl.nome); setIsAddEnvModalOpen(false); }}
                                    className="flex flex-col items-start justify-center p-4 bg-muted/40 hover:bg-primary/10 hover:text-primary rounded-2xl border border-border/40 transition-all gap-1 text-left"
                                >
                                    <span className="text-xs font-black tracking-tight leading-tight w-full truncate">{tmpl.nome}</span>
                                    <span className="text-[9px] font-bold opacity-50 uppercase tracking-widest">{tmpl.categorias?.length || 0} categorias</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    const name = prompt('Nome do ambiente:');
                                    if (name) { handleAddEnvironment(undefined, 'custom', name); setIsAddEnvModalOpen(false); }
                                }}
                                className="flex flex-col items-center justify-center p-4 bg-primary/5 hover:bg-primary/10 text-primary border-2 border-dashed border-primary/20 rounded-2xl transition-all gap-2"
                            >
                                <Plus className="h-6 w-6" />
                                <span className="text-[10px] font-black uppercase tracking-tight text-center leading-tight">Novo Ambiente</span>
                            </button>
                        </div>
                        <Button type="button" variant="ghost" className="w-full h-12 rounded-2xl font-bold opacity-60 hover:opacity-100 bg-muted/50" onClick={() => setIsAddEnvModalOpen(false)}>
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
