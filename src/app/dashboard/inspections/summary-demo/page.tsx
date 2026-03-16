'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InspectionEnvironment, Tenant } from '@/types';
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
    ArrowRight,
    ShieldCheck,
    Clock,
    Layout,
    Droplets,
    Zap,
    Flame,
    Key,
    UserCheck,
    FileCheck2
} from 'lucide-react';

/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */

export default function InspectionSummary() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadUrl, setUploadUrl] = useState<string | null>(null);

    // Mock data for demo - in production this would be loaded via fetch
    const inspection = {
        id: 'demo-123',
        tenantId: 'demo-tenant',
        propertyId: 'demo-property',
        clientId: 'demo-client',
        status: 'completed' as const,
        type: 'entry' as const,
        date: new Date().toISOString(),
        startTime: '14:30',
        environments: [
            // ... (previously defined environments)
            {
                id: 'e1',
                name: 'Sala de Estar',
                items: [
                    { id: 'i1', name: 'Piso Laminado', status: 'ok' as const },
                    { id: 'i2', name: 'Pintura Paredes', status: 'not_ok' as const, defect: 'Riscado', observation: 'Marca de móvel na parede sul.' },
                    { id: 'i3', name: 'Janelas', status: 'ok' as const }
                ]
            },
            {
                id: 'e2',
                name: 'Cozinha',
                items: [
                    { id: 'i4', name: 'Bancada Granito', status: 'ok' as const },
                    { id: 'i5', name: 'Torneira', status: 'ok' as const }
                ]
            }
        ] as InspectionEnvironment[],
        meters: { light: '045892', water: '001243', gas: '0894' },
        keys: [
            { description: 'Chave Principal (Porta)', quantity: 2 },
            { description: 'Controle Garagem', quantity: 1 }
        ],
        agreementTerm: 'As partes declaram que conferiram o imóvel e aceitam o estado de conservação descrito neste auto de vistoria para fins de locação.',
    };
    
    const tenant = { 
        id: 'demo-tenant',
        name: 'Imobiliária Silva LTDA',
        email: 'contato@silva.com.br',
        phone: '(11) 98765-4321',
        status: 'active' as const,
        plan: 'Premium',
        logo: undefined 
    } as Tenant;

    const handleDownloadPhotos = async () => {
        const success = await downloadAllPhotos(inspection.environments);
        if (!success) alert('Nenhuma foto encontrada para baixar.');
    };

    const handleGoogleDriveUpload = async () => {
        setIsUploading(true);
        try {
            const result = await uploadToGoogleDrive(new Blob(['mock pdf content']), `Vistoria-${inspection.id}.pdf`);
            setUploadUrl(result.url);
            alert('Relatório enviado para o Google Drive!');
        } catch {
            alert('Erro ao enviar para o Google Drive.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in zoom-in-95 duration-700">
            {/* Success Header */}
            <div className="text-center space-y-4 pt-10">
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
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid gap-8 md:grid-cols-2">
                <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden group">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Home className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tight">Imóvel Vistoriado</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex gap-4 items-start">
                            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-foreground text-lg leading-tight">Edifício Alpha Tower</p>
                                <p className="text-sm text-muted-foreground font-medium italic">Rua das Flores, 123 - Apt 42<br />São Paulo, SP</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden group">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tight">Locador (Proprietário)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex gap-4 items-start">
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 font-black">
                                JS
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-foreground text-lg leading-tight">João Silva de Souza</p>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                                    <ShieldCheck className="h-3 w-3" /> CPF: ***.***.123-45
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden group">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <User className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tight">Locatário (Inquilino)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex gap-4 items-start">
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0 font-black">
                                AO
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-foreground text-lg leading-tight">Ana Oliveira</p>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">
                                    <ShieldCheck className="h-3 w-3" /> CPF: ***.***.890-00
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Insurance Acceptance Proof */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-none shadow-lg bg-emerald-500/5 rounded-3xl p-6 flex items-center gap-4 border border-emerald-500/10">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Objetividade</p>
                        <p className="font-bold text-emerald-900 leading-tight">Laudo Técnico 100% Preenchido</p>
                    </div>
                </Card>
                <Card className="border-none shadow-lg bg-blue-500/5 rounded-3xl p-6 flex items-center gap-4 border border-blue-500/10">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Registro Temporal</p>
                        <p className="font-bold text-blue-900 leading-tight">Datado: {new Date().toLocaleDateString('pt-BR')} às {inspection.startTime}</p>
                    </div>
                </Card>
                <Card className="border-none shadow-lg bg-indigo-500/5 rounded-3xl p-6 flex items-center gap-4 border border-indigo-500/10">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Validade Jurídica</p>
                        <p className="font-bold text-indigo-900 leading-tight">Incontestável: Termo Assinado</p>
                    </div>
                </Card>
            </div>

            {/* Environments Summary */}
            <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-10 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight">Resumo por Ambiente</CardTitle>
                        <CardDescription className="text-sm font-bold uppercase tracking-widest opacity-70 mt-1">Checklist de conformidade técnica</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-foreground text-card border-none font-black text-xs uppercase tracking-widest px-6 py-2 rounded-full">
                        {inspection.environments.length} Áreas Verificadas
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/20">
                        {inspection.environments.map((env) => {
                            const defects = env.items.filter(i => i.status === 'not_ok');
                            const totalItems = env.items.length;
                            
                            return (
                                <div key={env.id} className="p-10 space-y-6 hover:bg-muted/10 transition-colors">
                                    <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                                                <Layout className="h-5 w-5" />
                                            </div>
                                            <span className="font-black text-xl tracking-tight text-foreground">{env.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic bg-muted/40 px-3 py-1 rounded-lg">
                                            {totalItems} it{totalItems === 1 ? 'em' : 'ens'}
                                        </span>
                                    </div>

                                    {defects.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                                            {defects.map(d => (
                                                <div key={d.id} className="flex gap-4 bg-red-500/5 p-4 rounded-2xl border border-red-500/10 items-center">
                                                    <div className="w-16 h-16 bg-muted rounded-xl shrink-0 overflow-hidden border-2 border-white shadow-md">
                                                        {d.photo ? <img src={d.photo} alt="Dano" className="w-full h-full object-cover" /> : <AlertTriangle className="h-full w-full p-4 text-red-500 opacity-20" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black uppercase tracking-widest text-red-700 flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> {d.name}
                                                        </p>
                                                        <p className="text-sm font-bold text-foreground leading-tight">{d.defect}</p>
                                                        {d.observation && <p className="text-[10px] text-muted-foreground font-medium italic">"{d.observation}"</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="ml-14 flex items-center gap-3 text-emerald-600 font-bold bg-emerald-500/5 px-4 py-2 rounded-xl w-fit">
                                            <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className="text-sm">Ambiente sem avarias identificadas.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Validation & Meters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Zap className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tight">Leitura de Medidores</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-3 gap-4">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center mx-auto">
                                <Zap className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Luz</p>
                            <p className="font-black text-lg">{inspection.meters.light}</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                                <Droplets className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Água</p>
                            <p className="font-black text-lg">{inspection.meters.water}</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                                <Flame className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Gás</p>
                            <p className="font-black text-lg">{inspection.meters.gas}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Key className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tight">Controle de Chaves</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-4">
                        {inspection.keys.map((k, i) => (
                            <div key={i} className="flex justify-between items-center bg-muted/30 p-3 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <Key className="h-4 w-4 opacity-40" />
                                    </div>
                                    <span className="font-bold text-sm text-foreground">{k.description}</span>
                                </div>
                                <Badge className="bg-primary text-primary-foreground font-black px-3 rounded-lg">{k.quantity} UN</Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Agreement Section */}
            <Card className="border-none shadow-2xl bg-foreground text-card rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <FileCheck2 className="h-32 w-32" />
                </div>
                <CardContent className="p-10 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                            <FileCheck2 className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight">Termo de Aceite do Laudo</CardTitle>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Validação Jurídica</p>
                        </div>
                    </div>
                    <p className="text-lg font-medium italic opacity-80 leading-relaxed border-l-4 border-primary/40 pl-6 py-2">
                        "{inspection.agreementTerm}"
                    </p>
                    <div className="flex flex-wrap gap-8 pt-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Vistoriador</p>
                            <p className="font-black flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" /> Assinado Digitalmente
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Locador</p>
                            <p className="font-black flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" /> Pendente Assinatura
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Locatário</p>
                            <p className="font-black flex items-center gap-2 text-primary">
                                <ArrowRight className="h-4 w-4" /> Coletar Assinatura Agora
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Export Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-2xl tracking-tight">Exportar Resultados</h3>
                    <div className="h-px bg-border flex-1" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PDFDownloadLink
                        document={<InspectionPDF inspection={inspection} tenant={tenant} />}
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

