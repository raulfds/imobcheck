'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Building2, Mail, Phone, MapPin, Upload, Globe, ShieldCheck, Plus, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/lib/supabase';
import { updateAgencySettings, uploadAgencyLogo } from '@/app/actions/settings-actions';
import { Tenant } from '@/types';
import InputMask from 'react-input-mask';

export default function AgencySettings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [agency, setAgency] = useState<Partial<Tenant>>({});
    const [originalAgency, setOriginalAgency] = useState<Partial<Tenant>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function loadAgency() {
            if (!user?.tenantId) return;
            
            const { data, error } = await supabase
                .from('agencies')
                .select('*')
                .eq('id', user.tenantId)
                .single();

            if (!error && data) {
                const agencyData = {
                    id: data.id,
                    name: data.name,
                    email: data.email || '',
                    phone: data.phone || '',
                    cnpj: data.cnpj || '',
                    address: data.address || '',
                    logo: data.logo_url || ''
                };
                setAgency(agencyData);
                setOriginalAgency(agencyData);
            }
            setLoading(false);
        }

        loadAgency();
    }, [user?.tenantId]);

    const hasChanges = () => {
        return JSON.stringify(agency) !== JSON.stringify(originalAgency);
    };

    const handleDiscard = () => {
        setAgency(originalAgency);
        // Não é estritamente necessário um alert para o descarte
    };

    const validateForm = () => {
        // Validar email
        if (agency.email && !/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(agency.email)) {
            alert('E-mail inválido. Por favor, insira um endereço de e-mail válido.');
            return false;
        }

        // Validar CNPJ (opcional, mas se preenchido deve ser válido)
        if (agency.cnpj) {
            const cleanCnpj = agency.cnpj.replace(/\D/g, '');
            if (cleanCnpj.length !== 14) {
                alert('CNPJ inválido. O CNPJ deve conter 14 dígitos.');
                return false;
            }
        }

        // Validar telefone
        if (agency.phone) {
            const cleanPhone = agency.phone.replace(/\D/g, '');
            if (cleanPhone.length < 10 || cleanPhone.length > 11) {
                alert('Telefone inválido. O telefone deve ter 10 ou 11 dígitos.');
                return false;
            }
        }

        return true;
    };

    const handleSave = async () => {
        if (!user?.tenantId) return;
        
        if (!validateForm()) return;
        
        setSaving(true);
        const result = await updateAgencySettings(user.tenantId, agency);
        
        if (result.success) {
            setOriginalAgency(agency);
            alert('Configurações salvas com sucesso!');
        } else {
            alert('Erro ao salvar: ' + (result.error || 'Ocorreu um erro ao salvar as configurações.'));
        }
        setSaving(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.tenantId) return;

        // Validar tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Formato não suportado. Use imagens nos formatos JPG, PNG ou WEBP.');
            return;
        }

        // Validar tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande. A imagem deve ter no máximo 5MB.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('logo', file);

        const result = await uploadAgencyLogo(user.tenantId, formData);
        
        if (result.success && result.url) {
            setAgency(prev => ({ ...prev, logo: result.url }));
            alert('Logo atualizada com sucesso!');
        } else {
            alert('Erro no upload: ' + (result.error || 'Não foi possível fazer o upload da imagem.'));
        }
        setUploading(false);
        
        // Limpar o input para permitir upload do mesmo arquivo novamente
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-10 animate-in fade-in duration-700">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-20" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/settings" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Configurações</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-none">Configurações</h1>
                        <p className="text-muted-foreground text-sm md:text-lg font-medium tracking-tight">Personalize as informações da sua imobiliária e identidade visual.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8">
                {/* Institutional Data Card */}
                <Card className="border-none shadow-xl bg-card overflow-hidden">
                    <CardHeader className="px-8 py-8 border-b border-border/40 bg-muted/20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Dados Institucionais</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">Informações que aparecerão nos laudos e documentos</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label htmlFor="corporateName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Razão Social <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                    id="corporateName" 
                                    value={agency.name || ''} 
                                    onChange={(e) => setAgency({ ...agency, name: e.target.value })}
                                    placeholder="Ex: Imobiliária Silva LTDA" 
                                    className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CNPJ</Label>
                                <InputMask
                                    mask="99.999.999/9999-99"
                                    value={agency.cnpj || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgency({ ...agency, cnpj: e.target.value })}
                                >
                                    {(inputProps: any) => (
                                        <Input 
                                            {...inputProps}
                                            id="cnpj" 
                                            placeholder="00.000.000/0000-00" 
                                            className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" 
                                        />
                                    )}
                                </InputMask>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Contato</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        disabled
                                        value={agency.email || ''} 
                                        onChange={(e) => setAgency({ ...agency, email: e.target.value })}
                                        placeholder="contato@empresa.com.br" 
                                        className="h-14 pl-12 pr-6 rounded-2xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone Principal</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                    <InputMask
                                        mask="(99) 99999-9999"
                                        value={agency.phone || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgency({ ...agency, phone: e.target.value })}
                                    >
                                        {(inputProps: any) => (
                                            <Input 
                                                {...inputProps}
                                                id="phone" 
                                                placeholder="(00) 00000-0000" 
                                                className="h-14 pl-12 pr-6 rounded-2xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20" 
                                            />
                                        )}
                                    </InputMask>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço de Matriz</Label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input 
                                    id="address" 
                                    value={agency.address || ''} 
                                    onChange={(e) => setAgency({ ...agency, address: e.target.value })}
                                    placeholder="Av. Exemplo, 123 - Cidade, UF" 
                                    className="h-14 pl-12 pr-6 rounded-2xl bg-muted/50 border-none shadow-inner font-bold focus-visible:ring-primary/20" 
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 py-6 bg-muted/10 border-t border-border/40 flex justify-end gap-3">
                        <Button 
                            variant="ghost" 
                            className="h-12 px-6 rounded-xl font-bold opacity-60 hover:opacity-100"
                            onClick={handleDiscard}
                            disabled={saving || !hasChanges()}
                        >
                            Descartar
                        </Button>
                        <Button 
                            className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all min-w-[160px]"
                            onClick={handleSave}
                            disabled={saving || !hasChanges()}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Branding Card */}
                <Card className="border-none shadow-xl bg-card overflow-hidden">
                    <CardHeader className="px-8 py-8 border-b border-border/40">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight">Identidade Visual</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">Sua logo aparecerá nos relatórios para seus clientes</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/jpeg,image/jpg,image/png,image/webp" 
                                    onChange={handleFileChange} 
                                />
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-40 h-40 rounded-[2.5rem] border-4 border-dashed border-border/60 flex flex-col items-center justify-center bg-muted/30 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all cursor-pointer overflow-hidden relative"
                                >
                                    {agency.logo ? (
                                        <img src={agency.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Upload className="h-8 w-8 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-center">Fazer Upload</span>
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary rounded-2xl shadow-lg border-4 border-card flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform"
                                >
                                    <Plus className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div className="space-y-1">
                                    <h3 className="font-black text-lg">Logotipo da Organização</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Recomendamos uma imagem quadrada de pelo menos 512x512px.</p>
                                    <p className="text-xs text-muted-foreground">Formatos aceitos: JPG, PNG, WEBP (máx. 5MB)</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">PNG</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/5 text-blue-600 border border-blue-500/10">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">JPG</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/5 text-purple-600 border border-purple-500/10">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">WEBP</span>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground italic max-w-sm">Dica: Use logotipos com fundo transparente para um visual mais profissional nos laudos.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}