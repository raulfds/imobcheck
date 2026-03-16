'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Building2, Mail, Phone, MapPin, Upload, Globe, ShieldCheck, Plus } from 'lucide-react';

export default function AgencySettings() {
    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-10 animate-in fade-in duration-700">
            {/* Header section with refined breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Breadcrumb className="mb-4">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard" className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="opacity-30" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard/settings" className="text-xs font-bold uppercase tracking-widest text-primary">Configurações</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Configurações</h1>
                    <p className="text-muted-foreground font-medium mt-1 italic">Personalize as informações da sua imobiliária e identidade visual.</p>
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
                                <Label htmlFor="corporateName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Razão Social</Label>
                                <Input id="corporateName" defaultValue="Imobiliária Silva LTDA" className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CNPJ</Label>
                                <Input id="cnpj" defaultValue="12.345.678/0001-90" className="h-14 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">E-mail de Contato</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                    <Input id="email" type="email" defaultValue="contato@silva.com.br" className="h-14 pl-12 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone Principal</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                    <Input id="phone" defaultValue="(11) 98765-4321" className="h-14 pl-12 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço de Matriz</Label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input id="address" defaultValue="Av. Paulista, 1000, 15º Andar - São Paulo, SP" className="h-14 pl-12 rounded-2xl bg-muted/50 border-none shadow-inner font-bold px-6 focus-visible:ring-primary/20" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 py-6 bg-muted/10 border-t border-border/40 flex justify-end gap-3">
                        <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold opacity-60 hover:opacity-100">Descartar</Button>
                        <Button className="h-12 px-8 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Salvar Alterações</Button>
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
                                <div className="w-40 h-40 rounded-[2.5rem] border-4 border-dashed border-border/60 flex flex-col items-center justify-center bg-muted/30 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all cursor-pointer overflow-hidden">
                                    <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-8 w-8 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Fazer Upload</span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary rounded-2xl shadow-lg border-4 border-card flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                                    <Plus className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <div className="space-y-1">
                                    <h3 className="font-black text-lg">Logotipo da Organização</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Recomendamos uma imagem quadrada de pelo menos 512x512px.</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 text-emerald-600 border border-emerald-500/10">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">PNG Suportado</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/5 text-blue-600 border border-blue-500/10">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">JPG Suportado</span>
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


