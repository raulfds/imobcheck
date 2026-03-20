'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Inspection, InspectionEnvironment, Property, Client, Landlord, Tenant, InspectionType } from '@/types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InspectionPDF } from '@/components/inspection/inspection-pdf';
import { downloadAllPhotos, uploadToGoogleDrive } from '@/lib/export-utils';
import {
    FileText, 
    CheckCircle2, 
    MapPin, 
    User, 
    Home,
    AlertTriangle, 
    Check, 
    ExternalLink, 
    Archive, 
    Cloud,
    ArrowLeft,
    ArrowRight,
    ShieldCheck,
    Clock,
    Layout,
    Droplets,
    Zap,
    Flame,
    Key,
    UserCheck,
    FileCheck2,
    Loader2,
    RotateCcw
} from 'lucide-react';
import { fetchInspection, fetchProperty, fetchClient, fetchLandlord, updateInspection, fetchAgency } from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */

export default function InspectionSummary() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { user } = useAuth();
    // CORREÇÃO: usar agency_id em vez de tenantId
    const agencyId = user?.agency_id ?? 't1';

    const [loading, setLoading] = useState(true);
    const [inspection, setInspection] = useState<Inspection | null>(null);
    const [property, setProperty] = useState<Property | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [landlord, setLandlord] = useState<Landlord | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);
    const [isReopening, setIsReopening] = useState(false);
    const [signAsAgency, setSignAsAgency] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        async function loadData() {
            if (!id) {
                console.error('ID da vistoria não fornecido');
                setLoading(false);
                return;
            }

            // Try Supabase first
            if (isSupabaseConfigured) {
                try {
                    console.log('🔍 Buscando vistoria com ID:', id);
                    const insp = await fetchInspection(id);
                    
                    if (insp) {
                        console.log('✅ Vistoria encontrada:', insp);
                        
                        // Verificar se a vistoria pertence à agência do usuário
                        if (insp.tenantId !== agencyId && insp.agency_id !== agencyId) {
                            console.error('❌ Vistoria não pertence à agência do usuário');
                            alert('Você não tem permissão para visualizar esta vistoria.');
                            router.push('/dashboard/inspections');
                            setLoading(false);
                            return;
                        }
                        
                        // Resolver URLs das fotos (se houver blobs)
                        const { getBlob } = await import('@/lib/db');
                        const { optimizeImage } = await import('@/lib/export-utils');

                        if (insp.environments) {
                            for (const env of insp.environments) {
                                // Processar fotos gerais do ambiente
                                if (env.generalPhotos) {
                                    for (let i = 0; i < env.generalPhotos.length; i++) {
                                        const photo = env.generalPhotos[i];
                                        if (photo && typeof photo === 'string') {
                                            if (photo.startsWith('blob-ref:')) {
                                                const blob = await getBlob(photo);
                                                if (blob) {
                                                    try {
                                                        const url = URL.createObjectURL(blob);
                                                        const base64 = await optimizeImage(url, 0.7, 800);
                                                        env.generalPhotos[i] = base64;
                                                        URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Erro ao converter foto para base64:', err);
                                                        const url = URL.createObjectURL(blob);
                                                        env.generalPhotos[i] = url;
                                                    }
                                                }
                                            } else if (photo.startsWith('http') || photo.startsWith('data:')) {
                                                env.generalPhotos[i] = photo;
                                            }
                                        }
                                    }
                                }
                                
                                // Processar fotos dos itens
                                if (env.items) {
                                    for (const item of env.items) {
                                        if (item.photo && typeof item.photo === 'string') {
                                            if (item.photo.startsWith('blob-ref:')) {
                                                const blob = await getBlob(item.photo);
                                                if (blob) {
                                                    try {
                                                        const url = URL.createObjectURL(blob);
                                                        const base64 = await optimizeImage(url, 0.7, 800);
                                                        item.photo = base64;
                                                        URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Erro ao converter foto do item para base64:', err);
                                                        item.photo = URL.createObjectURL(blob);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        setInspection(insp);
                        
                        // Buscar dados relacionados
                        console.log('🔍 Buscando dados relacionados...');
                        const [p, c, l, t] = await Promise.all([
                            insp.propertyId ? fetchProperty(insp.propertyId) : Promise.resolve(null),
                            insp.clientId ? fetchClient(insp.clientId) : Promise.resolve(null),
                            insp.landlordId ? fetchLandlord(insp.landlordId) : Promise.resolve(null),
                            fetchAgency(insp.tenantId || agencyId)
                        ]);
                        
                        setProperty(p);
                        setClient(c);
                        setLandlord(l);
                        if (t) setTenant(t);
                        
                        console.log('✅ Dados carregados com sucesso');
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.error('❌ Erro ao carregar do Supabase:', err);
                }
            }

            // Fallback: Tentar carregar do IndexedDB (modo demo)
            try {
                console.log('🔍 Tentando carregar do IndexedDB...');
                const { getDraft } = await import('@/lib/db');
                const draft = await getDraft(id);
                
                if (draft) {
                    console.log('✅ Draft encontrado no IndexedDB');
                    const mockInspection: Inspection = {
                        id: draft.id,
                        tenantId: draft.tenantId || agencyId,
                        agency_id: draft.agencyId || agencyId,
                        propertyId: draft.propertyId || '',
                        clientId: draft.clientId || '',
                        landlordId: draft.landlordId || '',
                        type: (draft.type as InspectionType) || 'entry',
                        status: 'completed',
                        date: draft.date || new Date().toISOString().split('T')[0],
                        environments: JSON.parse(JSON.stringify(draft.environments || [])),
                        meters: draft.meters || {},
                        keys: draft.keys || [],
                        agreementTerm: draft.agreement || '',
                        signatures: draft.signatures || { tenant: false, landlord: false, inspector: false },
                        startTime: draft.startTime,
                        createdAt: draft.createdAt,
                        updatedAt: draft.updatedAt
                    };

                    // Processar fotos do draft para base64
                    const { optimizeImage } = await import('@/lib/export-utils');
                    for (const env of mockInspection.environments) {
                        if (env.generalPhotos) {
                            for (let i = 0; i < env.generalPhotos.length; i++) {
                                const photo = env.generalPhotos[i];
                                if (photo && photo.startsWith('blob-ref:')) {
                                    const blob = await (await import('@/lib/db')).getBlob(photo);
                                    if (blob) {
                                        try {
                                            const url = URL.createObjectURL(blob);
                                            env.generalPhotos[i] = await optimizeImage(url, 0.7, 800);
                                            URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error(err);
                                            env.generalPhotos[i] = URL.createObjectURL(blob);
                                        }
                                    }
                                }
                            }
                        }
                        if (env.items) {
                            for (const item of env.items) {
                                if (item.photo && item.photo.startsWith('blob-ref:')) {
                                    const blob = await (await import('@/lib/db')).getBlob(item.photo);
                                    if (blob) {
                                        try {
                                            const url = URL.createObjectURL(blob);
                                            item.photo = await optimizeImage(url, 0.7, 800);
                                            URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error(err);
                                            item.photo = URL.createObjectURL(blob);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    setInspection(mockInspection);
                    
                    // Buscar dados relacionados se disponíveis
                    if (isSupabaseConfigured) {
                        const t = await fetchAgency(agencyId);
                        if (t) setTenant(t);
                    }
                } else {
                    console.log('❌ Nenhum draft encontrado');
                    alert('Vistoria não encontrada.');
                    router.push('/dashboard/inspections');
                }
            } catch (err) {
                console.error('❌ Erro ao carregar do IndexedDB:', err);
                alert('Erro ao carregar os dados da vistoria.');
            } finally {
                setLoading(false);
            }
        }
        
        if (id) {
            loadData();
        } else {
            console.error('ID da vistoria não fornecido');
            setLoading(false);
            alert('ID da vistoria não fornecido.');
            router.push('/dashboard/inspections');
        }
    }, [id, agencyId, router]);

    const displayTenant = tenant || { 
        id: agencyId,
        name: user?.agency_name || 'Imobiliária',
        status: 'active' as const,
        plan: 'Premium',
    } as Tenant;

    const handleDownloadPhotos = async () => {
        if (!inspection) return;
        const success = await downloadAllPhotos(inspection.environments);
        if (!success) alert('Nenhuma foto encontrada para baixar.');
    };

    const handleGoogleDriveUpload = async () => {
        if (!inspection) return;
        setIsUploading(true);
        try {
            const result = await uploadToGoogleDrive(
                new Blob(['mock pdf content']), 
                `Vistoria-${inspection.id}.pdf`
            );
            setUploadUrl(result.url);
            alert('Relatório enviado para o Google Drive!');
        } catch (err) {
            console.error('Erro no upload:', err);
            alert('Erro ao enviar para o Google Drive.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReopen = async () => {
        if (!id || isReopening) return;
        if (!confirm('Deseja reabrir esta vistoria? O status voltará para "em andamento".')) return;
        
        setIsReopening(true);
        try {
            await updateInspection(id, { status: 'ongoing' });
            router.push(`/dashboard/inspections/active-demo?id=${id}`);
        } catch (err) {
            console.error(err);
            alert('Erro ao reabrir vistoria.');
        } finally {
            setIsReopening(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Carregando dados da vistoria...</p>
            </div>
        );
    }

    if (!inspection) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
                <p className="text-xl font-black">Vistoria não encontrada.</p>
                <p className="text-sm text-muted-foreground">A vistoria que você está procurando pode ter sido excluída ou não existe.</p>
                <Button onClick={() => router.push('/dashboard/inspections')} className="mt-4">
                    Voltar para Lista
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in zoom-in-95 duration-700">
            {/* Success Header */}
            <div className="text-center space-y-4 pt-10 relative">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute left-0 top-10 rounded-xl font-bold gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/dashboard/inspections')}
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Lista
                </Button>
                
                <div className="relative inline-flex mb-4">
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                    <div className="relative h-24 w-24 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 rotate-3">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tight text-foreground">Laudo Finalizado!</h1>
                    <p className="text-muted-foreground font-medium text-lg italic max-w-lg mx-auto">
                        O relatório técnico e todas as evidências visuais já estão processados e prontos para exportação.
                    </p>
                    <Badge variant="outline" className="mt-4 bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                        {inspection.type === 'entry' ? 'Vistoria de Entrada' : inspection.type === 'exit' ? 'Vistoria de Saída' : 'Vistoria de Constatação'}
                    </Badge>
                </div>
            </div>

            {/* Unified Main Info Card */}
            <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden mb-8">
                <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-xl font-black tracking-tight">Informações Principais da Vistoria</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Imóvel */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Home className="h-3 w-3" /> Imóvel Vistoriado
                            </p>
                            <p className="font-bold text-base leading-tight">{property?.address || inspection.propertyAddress || 'Não informado'}</p>
                            <p className="text-xs text-muted-foreground font-medium italic">
                                {property?.cep ? `CEP: ${property.cep}` : ''} {property?.numero ? `Nº ${property.numero}` : ''}
                            </p>
                        </div>
                        
                        {/* Data */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Data e Hora
                            </p>
                            <p className="font-bold text-base leading-tight">
                                {inspection.date ? new Date(inspection.date).toLocaleDateString('pt-BR') : 'Data não informada'}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium italic">
                                Início: {inspection.startTime || '--:--'}
                            </p>
                        </div>

                        {/* Locador */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-3 w-3" /> Locador (Proprietário)
                            </p>
                            <p className="font-bold text-base leading-tight">{landlord?.name || 'Não informado'}</p>
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> CPF: {landlord?.cpf || 'Não informado'}
                            </p>
                        </div>

                        {/* Locatário */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <User className="h-3 w-3" /> Locatário (Inquilino)
                            </p>
                            <p className="font-bold text-base leading-tight">{client?.name || 'Não informado'}</p>
                            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> CPF: {client?.cpf || 'Não informado'}
                            </p>
                        </div>

                        {/* Medidores */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Zap className="h-3 w-3" /> Leitura de Medidores
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-yellow-500/10 text-yellow-700 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-yellow-500/20">
                                    <Zap className="h-3.5 w-3.5" />
                                    <div>
                                        <p className="text-[8px] font-black uppercase leading-none opacity-80 mb-0.5">Luz</p>
                                        <p className="font-bold text-xs leading-none">{inspection.meters?.light || '--'}</p>
                                    </div>
                                </div>
                                <div className="bg-blue-500/10 text-blue-700 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-blue-500/20">
                                    <Droplets className="h-3.5 w-3.5" />
                                    <div>
                                        <p className="text-[8px] font-black uppercase leading-none opacity-80 mb-0.5">Água</p>
                                        <p className="font-bold text-xs leading-none">{inspection.meters?.water || '--'}</p>
                                    </div>
                                </div>
                                <div className="bg-orange-500/10 text-orange-700 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-orange-500/20">
                                    <Flame className="h-3.5 w-3.5" />
                                    <div>
                                        <p className="text-[8px] font-black uppercase leading-none opacity-80 mb-0.5">Gás</p>
                                        <p className="font-bold text-xs leading-none">{inspection.meters?.gas || '--'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chaves */}
                        <div className="space-y-3 lg:col-span-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Key className="h-3 w-3" /> Controle de Chaves
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {!inspection.keys || inspection.keys.length === 0 ? (
                                    <p className="text-[10px] italic opacity-40">Nenhuma chave registrada</p>
                                ) : (
                                    inspection.keys.map((k, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/20">
                                            <span className="font-bold text-xs text-foreground">{k.description}</span>
                                            <Badge className="bg-primary h-5 text-[8px] font-black px-1.5 rounded-lg text-primary-foreground">
                                                {k.quantity} UN
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Environments Summary */}
            <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Resumo por Ambiente</CardTitle>
                        <CardDescription className="text-sm font-bold uppercase tracking-widest opacity-70 mt-1">
                            Checklist de conformidade técnica
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-foreground text-card border-none font-black text-xs uppercase tracking-widest px-6 py-2 rounded-full">
                        {inspection.environments?.length || 0} Áreas Verificadas
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {!inspection.environments || inspection.environments.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="text-muted-foreground italic">Nenhum ambiente registrado nesta vistoria.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20">
                            {inspection.environments.map((env) => {
                                const defects = env.items?.filter(i => i.status === 'not_ok') || [];
                                const totalItems = env.items?.length || 0;
                                
                                return (
                                    <div key={env.id} className="p-10 space-y-6 hover:bg-muted/10 transition-colors">
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                                                    <Layout className="h-5 w-5" />
                                                </div>
                                                <span className="font-black text-xl tracking-tight text-foreground">
                                                    {env.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {defects.length > 0 && (
                                                    <Badge variant="destructive" className="text-[9px] font-black">
                                                        {defects.length} Pendência{defects.length !== 1 ? 's' : ''}
                                                    </Badge>
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic bg-muted/40 px-3 py-1 rounded-lg">
                                                    {totalItems} it{totalItems === 1 ? 'em' : 'ens'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Environment Photos */}
                                        {env.generalPhotos && env.generalPhotos.length > 0 && (
                                            <div className="flex gap-4 overflow-x-auto pb-4 ml-4 no-scrollbar">
                                                {env.generalPhotos.map((photo, idx) => (
                                                    <div key={idx} className="w-40 h-40 shrink-0 rounded-2xl overflow-hidden border-2 border-white shadow-xl hover:scale-105 transition-transform">
                                                        <img src={photo} alt={`${env.name} - Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Items Status */}
                                        {env.items && env.items.length > 0 && (
                                            <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                {env.items.filter(item => item.status !== 'pending').map((item) => (
                                                    <div key={item.id} className="flex flex-col gap-1 border-b border-border/10 pb-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {item.status === 'ok' ? (
                                                                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                                                        <Check className="h-3 w-3" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-5 w-5 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
                                                                        <AlertTriangle className="h-3 w-3" />
                                                                    </div>
                                                                )}
                                                                <span className={`text-sm font-bold ${item.status === 'ok' ? 'text-foreground/80' : 'text-red-700'}`}>
                                                                    {item.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {(item.observation || item.defect) && (
                                                            <div className="ml-8">
                                                                <Badge variant="outline" className="text-[9px] font-bold text-red-700 border-red-200 bg-red-50 whitespace-normal text-left leading-tight py-1">
                                                                    Avaria: {item.observation || item.defect}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {item.photo && typeof item.photo === 'string' && (
                                                            <div className="ml-8 mt-1">
                                                                <img src={item.photo} alt={`Item ${item.name}`} className="h-16 w-16 rounded-lg object-cover border" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {env.items.filter(item => item.status !== 'pending').length === 0 && (
                                                    <p className="text-xs italic opacity-40 col-span-2">
                                                        Nenhum item verificado neste ambiente.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Termo de Acordo */}
            {inspection.agreementTerm && (
                <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <FileCheck2 className="h-5 w-5" />
                            Termo de Acordo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {inspection.agreementTerm}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Assinaturas */}
            {inspection.signatures && (
                <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Assinaturas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Locatário</p>
                                <Badge variant={inspection.signatures.tenant ? "success" : "secondary"}>
                                    {inspection.signatures.tenant ? "Assinado" : "Pendente"}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Locador</p>
                                <Badge variant={inspection.signatures.landlord ? "success" : "secondary"}>
                                    {inspection.signatures.landlord ? "Assinado" : "Pendente"}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vistoriador</p>
                                <Badge variant={inspection.signatures.inspector ? "success" : "secondary"}>
                                    {inspection.signatures.inspector ? "Assinado" : "Pendente"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Export Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-2xl tracking-tight">Exportar Resultados</h3>
                    <div className="h-px bg-border flex-1" />
                </div>
                
                {/* Agency Signature Toggle */}
                {displayTenant && (
                    <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                        <input
                            type="checkbox"
                            id="signAsAgencyToggle"
                            checked={signAsAgency}
                            onChange={(e) => setSignAsAgency(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-foreground focus:ring-foreground transition-all cursor-pointer accent-foreground"
                        />
                        <div className="flex gap-2 items-center">
                            <label htmlFor="signAsAgencyToggle" className="text-sm font-bold text-foreground cursor-pointer select-none">
                                Assinar como Imobiliária (por procuração)
                            </label>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground ml-2">
                                Locador será ignorado nas assinaturas
                            </span>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PDFDownloadLink
                        document={<InspectionPDF inspection={inspection} tenant={displayTenant} property={property} landlord={landlord} client={client} signAsAgency={signAsAgency} />}
                        fileName={`Relatório-Vistoria-${inspection.id}.pdf`}
                        className="w-full"
                    >
                        {({ loading }) => (
                            <button className="w-full group shadow-lg hover:shadow-2xl transition-all" disabled={loading}>
                                <div className="h-full rounded-[2rem] bg-foreground text-card p-8 flex flex-col items-center gap-4 group-hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                        <FileText className="h-20 w-20" />
                                    </div>
                                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <FileText className="h-7 w-7" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-lg uppercase tracking-widest">{loading ? 'Gerando...' : 'Gerar PDF'}</p>
                                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Laudo Profissional</p>
                                    </div>
                                </div>
                            </button>
                        )}
                    </PDFDownloadLink>

                    <button className="w-full group shadow-lg hover:shadow-2xl transition-all" onClick={handleDownloadPhotos}>
                        <div className="h-full rounded-[2rem] bg-card p-8 flex flex-col items-center gap-4 group-hover:scale-[1.02] active:scale-[0.98] transition-transform border-4 border-dashed border-border/60 hover:border-primary/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                                <Archive className="h-20 w-20" />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                                <Archive className="h-7 w-7" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg uppercase tracking-widest text-foreground">Baixar Fotos</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Arquivo ZIP Completo</p>
                            </div>
                        </div>
                    </button>

                    <button 
                        className="w-full group shadow-lg hover:shadow-2xl transition-all" 
                        onClick={handleGoogleDriveUpload}
                        disabled={isUploading}
                    >
                        <div className={`h-full rounded-[2rem] p-8 flex flex-col items-center gap-4 group-hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden ${isUploading ? 'bg-blue-200' : 'bg-blue-600 text-white shadow-blue-500/20'}`}>
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform text-white">
                                <Cloud className="h-20 w-20" />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                <Cloud className="h-7 w-7" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg uppercase tracking-widest">{isUploading ? 'Subindo...' : 'Google Drive'}</p>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">Backup na Nuvem</p>
                            </div>
                        </div>
                    </button>
                    
                    <button className="w-full group shadow-lg hover:shadow-2xl transition-all" onClick={handleReopen} disabled={isReopening}>
                        <div className="h-full rounded-[2rem] bg-orange-600 text-white p-8 flex flex-col items-center gap-4 group-hover:scale-[1.02] active:scale-[0.98] transition-transform relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-transform">
                                <RotateCcw className="h-20 w-20" />
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                                <RotateCcw className={`h-7 w-7 ${isReopening ? 'animate-spin' : ''}`} />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg uppercase tracking-widest">{isReopening ? 'Processando...' : 'Reabrir Vistoria'}</p>
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Voltar ao Checklist</p>
                            </div>
                        </div>
                    </button>
                </div>

                {uploadUrl && (
                    <div className="bg-emerald-500/5 border-2 border-emerald-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <ExternalLink className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-black text-emerald-900 tracking-tight">Cópia de Segurança Criada</p>
                                <p className="text-xs font-medium text-emerald-700/60 italic">Pasta no Google Drive pronta para acesso compartilhado.</p>
                            </div>
                        </div>
                        <Button className="rounded-xl h-12 px-6 font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 gap-2" onClick={() => window.open(uploadUrl || '#', '_blank')}>
                            Abrir Pasta <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer Branding */}
            <div className="text-center pt-12 border-t border-border/40">
                <div className="flex flex-col items-center gap-4 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Powered by</p>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-foreground rounded-lg flex items-center justify-center text-card font-black text-sm">V</div>
                        <span className="text-xl font-black text-foreground tracking-tighter italic">Vistorify</span>
                    </div>
                </div>
            </div>
        </div>
    );
}