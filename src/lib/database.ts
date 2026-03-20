/**
 * Database service layer for ImobCheck.
 * All Supabase DB calls go through here.
 * Tables use "agencies" for tenants to avoid Postgres reserved word conflicts.
 */
import { supabase, isSupabaseConfigured } from './supabase';
import {
    Tenant, Property, Landlord, Client, Inspection, InspectionEnvironment, RoomTemplate, SubscriptionPlan, User
} from '@/types';
import { adminSaveUser, adminResetPassword as serverAdminResetPassword } from '@/app/actions/auth-actions';
import { GLOBAL_ROOM_TEMPLATES } from './presets';

// ─── MOCK DATA (Fallback) ───────────────────────────────────────────────────
let MOCK_PLANS: SubscriptionPlan[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MOCK_USERS: any[] = [];

// ─── Type helpers (DB row → App type) ───────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToUser(row: any): User {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role as User['role'],
        tenantId: row.agency_id
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRoomTemplate(row: any): RoomTemplate {
    return {
        nome: row.name,
        categorias: row.categories,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPlan(row: any): SubscriptionPlan {
    return {
        id: row.id,
        name: row.name,
        userLimit: row.user_limit,
        inspectionLimit: row.inspection_limit,
        photoStorageDays: row.photo_storage_days,
        price: Number(row.price),
        features: row.features || [],
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTenant(row: any): Tenant {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        adminName: row.admin_name ?? undefined,
        phone: row.phone ?? undefined,
        status: row.status,
        plan: row.plan,
        acquisitionDate: row.acquisition_date ? new Date(row.acquisition_date).toISOString() : undefined,
        planId: row.plan_id ?? undefined,
        cnpj: row.cnpj ?? undefined,
        address: row.address ?? undefined,
        logo: row.logo_url ?? undefined,
        billingCycle: row.billing_cycle ?? 'monthly',
        firstLoginAt: row.first_login_at ?? undefined,
        expiresAt: row.expires_at ?? undefined,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProperty(row: any): Property {
    return { 
        id: row.id, 
        tenantId: row.agency_id, 
        address: row.address, 
        cep: row.cep ?? undefined,
        logradouro: row.logradouro ?? undefined,
        numero: row.numero ?? undefined,
        complemento: row.complemento ?? undefined,
        bairro: row.bairro ?? undefined,
        cidade: row.cidade ?? undefined,
        estado: row.estado ?? undefined,
        description: row.description ?? '' 
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLandlord(row: any): Landlord {
    return { 
        id: row.id, 
        tenantId: row.agency_id, 
        name: row.name, 
        cpf: row.cpf,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToClient(row: any): Client {
    return { 
        id: row.id, 
        tenantId: row.agency_id, 
        name: row.name, 
        cpf: row.cpf,
        email: row.email ?? undefined,
        phone: row.phone ?? undefined,
        primeiro_acesso: row.primeiro_acesso,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInspection(row: any): Inspection {
    return {
        id: row.id,
        tenantId: row.agency_id,
        propertyId: row.property_id ?? '',
        clientId: row.client_id ?? '',
        landlordId: row.landlord_id ?? undefined,
        type: row.type,
        status: row.status,
        date: row.date,
        startTime: row.start_time ?? undefined,
        environments: (row.environments ?? []) as InspectionEnvironment[],
        meters: row.meters ?? undefined,
        keys: row.keys ?? undefined,
        agreementTerm: row.agreement_term ?? undefined,
        signatures: row.signatures ?? undefined,
    };
}

// ─── Error helper ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbError(context: string, error: any): never {
    console.error(`[DB Error] ${context}:`, {
        message: error?.message,
        code: error?.code,
        hint: error?.hint,
        details: error?.details,
    });
    throw error;
}

// ─── AGENCIES (tenants) ───────────────────────────────────────────────────────

export async function fetchAgencies(): Promise<Tenant[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('agencies').select('*').order('created_at', { ascending: false });
    if (error) dbError('fetchAgencies', error);
    return (data ?? []).map(rowToTenant);
}

export async function fetchAgency(id: string): Promise<Tenant | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('agencies').select('*').eq('id', id).single();
    if (error) {
        console.error('fetchAgency error:', error);
        return null;
    }
    return data ? rowToTenant(data) : null;
}



// ─── ROOM TEMPLATES ──────────────────────────────────────────────────────────

export async function fetchRoomTemplates(agencyId?: string): Promise<RoomTemplate[]> {
    if (!isSupabaseConfigured) return GLOBAL_ROOM_TEMPLATES;
    
    let query = supabase.from('room_templates').select('*');
    
    if (agencyId) {
        // Fetch global (NULL) OR specific agency templates
        query = query.or(`agency_id.is.null,agency_id.eq.${agencyId}`);
    } else {
        // Only global
        query = query.is('agency_id', null);
    }
    
    const { data, error } = await query.order('name');
    if (error) return GLOBAL_ROOM_TEMPLATES;
    
    // If DB returned nothing (e.g. table empty), fall back to built-in presets
    const results = (data ?? []).map(rowToRoomTemplate);
    return results.length > 0 ? results : GLOBAL_ROOM_TEMPLATES;
}

export async function saveRoomTemplate(template: RoomTemplate, agencyId?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    
    const { error } = await supabase.from('room_templates').upsert({
        name: template.nome,
        agency_id: agencyId || null,
        categories: template.categorias,
        updated_at: new Date()
    }, { onConflict: 'name,agency_id' }); // Note: this requires a unique index that handles the NULL case if agencyId is null
    
    if (error) throw error;
}

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
    if (!isSupabaseConfigured) return MOCK_PLANS;
    const { data, error } = await supabase.from('subscription_plans').select('*').order('price');
    if (error) throw error;
    return (data ?? []).map(rowToPlan);
}

export async function savePlan(plan: Partial<SubscriptionPlan>): Promise<void> {
    if (!isSupabaseConfigured) {
        if (plan.id) {
            MOCK_PLANS = MOCK_PLANS.map(p => p.id === plan.id ? { ...p, ...plan } as SubscriptionPlan : p);
        } else {
            const newPlan = { ...plan, id: Math.random().toString(36).substr(2, 9) } as SubscriptionPlan;
            MOCK_PLANS.push(newPlan);
        }
        return;
    }
    
    // For Supabase, we use name as conflict target if id is missing
    const { error } = await supabase.from('subscription_plans').upsert({
        ...(plan.id && { id: plan.id }),
        name: plan.name,
        user_limit: plan.userLimit,
        inspection_limit: plan.inspectionLimit,
        photo_storage_days: plan.photoStorageDays,
        price: plan.price,
        features: plan.features,
        updated_at: new Date().toISOString()
    }, { onConflict: 'name' });
    
    if (error) {
        console.error('Supabase Upsert Error:', error);
        throw error;
    }
}

export async function deletePlan(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
        MOCK_PLANS = MOCK_PLANS.filter(p => p.id !== id);
        return;
    }
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (error) throw error;
}

// ─── PROPERTIES ───────────────────────────────────────────────────────────────

export async function fetchProperties(agencyId: string): Promise<Property[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('properties')
        .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToProperty);
}

export async function createProperty(prop: Omit<Property, 'id'>): Promise<Property> {
    const { data, error } = await supabase.from('properties').insert({
        agency_id: prop.tenantId, 
        address: prop.address, 
        cep: prop.cep || null,
        logradouro: prop.logradouro || null,
        numero: prop.numero || null,
        complemento: prop.complemento || null,
        bairro: prop.bairro || null,
        cidade: prop.cidade || null,
        estado: prop.estado || null,
        description: prop.description
    }).select().single();
    if (error) throw error;
    return rowToProperty(data);
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<void> {
    const { error } = await supabase.from('properties').update({
        ...(updates.address !== undefined && { address: updates.address }),
        ...(updates.cep !== undefined && { cep: updates.cep }),
        ...(updates.logradouro !== undefined && { logradouro: updates.logradouro }),
        ...(updates.numero !== undefined && { numero: updates.numero }),
        ...(updates.complemento !== undefined && { complemento: updates.complemento }),
        ...(updates.bairro !== undefined && { bairro: updates.bairro }),
        ...(updates.cidade !== undefined && { cidade: updates.cidade }),
        ...(updates.estado !== undefined && { estado: updates.estado }),
        ...(updates.description !== undefined && { description: updates.description }),
    }).eq('id', id);
    if (error) throw error;
}

export async function deleteProperty(id: string): Promise<void> {
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
}

// ─── SYSTEM USERS ─────────────────────────────────────────────────────────────

export async function fetchUsersByRole(role: User['role']): Promise<User[]> {
    if (!isSupabaseConfigured) {
        return MOCK_USERS.filter(u => u.role === role);
    }
    const { data, error } = await supabase.from('system_users').select('*').eq('role', role);
    if (error) throw error;
    return (data ?? []).map(rowToUser);
}

export async function fetchUsersByAgency(agencyId: string): Promise<User[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('system_users')
        .select('*')
        .eq('agency_id', agencyId)
        .order('name');
    if (error) throw error;
    return (data ?? []).map(rowToUser);
}

export async function saveSystemUser(user: Partial<User>): Promise<string | undefined> {
    if (!isSupabaseConfigured) {
        if (user.id) {
            MOCK_USERS = MOCK_USERS.map(u => u.id === user.id ? { ...u, ...user } : u);
        } else {
            MOCK_USERS.push({ ...user, id: Math.random().toString(36).substr(2, 9) } as User);
        }
        return undefined;
    }
    
    // For new users, we generate a temp password to allow the first login logic
    const isNew = !user.id;
    const tempPassword = isNew ? Math.random().toString(36).slice(-8) : undefined;

    // Utilize Server Action for administrative sync with Supabase Auth
    try {
        const result = await adminSaveUser({
            id: user.id,
            email: user.email?.toLowerCase() || '',
            name: user.name || '',
            role: user.role || 'CLIENT_ADMIN',
            agency_id: user.tenantId,
            temp_password: tempPassword
        });

        if (!result.success) {
            throw new Error(result.error);
        }
    } catch (err: unknown) {
        console.error('[DB] Erro ao sincronizar com Auth:', err);
        throw err;
    }

    
    return tempPassword;
}

export async function resetUserPassword(userId: string): Promise<string> {
    if (isSupabaseConfigured) {
        // Fetch user data first to get email and name for Server Action
        const { data: user, error: fetchError } = await supabase
            .from('system_users')
            .select('email, name')
            .eq('id', userId)
            .single();

        if (fetchError || !user) throw new Error('Usuário não encontrado para reset.');

        const result = await serverAdminResetPassword(userId, user.email, user.name);
        if (!result.success) throw new Error(result.error);
        
        return result.tempPassword!;
    } else {
        const tempPassword = Math.random().toString(36).slice(-8);
        MOCK_USERS = MOCK_USERS.map(u => u.id === userId ? { ...u, temp_password: tempPassword, must_change_password: true } : u);
        return tempPassword;
    }
}

export async function deleteSystemUser(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
        MOCK_USERS = MOCK_USERS.filter(u => u.id !== id);
        return;
    }
    const { error } = await supabase.from('system_users').delete().eq('id', id);
    if (error) throw error;
}

// ─── LANDLORDS ────────────────────────────────────────────────────────────────

export async function fetchLandlords(agencyId: string): Promise<Landlord[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('landlords')
        .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToLandlord);
}

export async function createLandlord(l: Omit<Landlord, 'id'>): Promise<Landlord> {
    const { data, error } = await supabase.from('landlords').insert({
        agency_id: l.tenantId, 
        name: l.name, 
        cpf: l.cpf,
        email: l.email || null,
        phone: l.phone || null
    }).select().single();
    if (error) throw error;
    return rowToLandlord(data);
}

export async function deleteLandlord(id: string): Promise<void> {
    const { error } = await supabase.from('landlords').delete().eq('id', id);
    if (error) throw error;
}

export async function fetchProperty(id: string): Promise<Property | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (error) return null;
    return rowToProperty(data);
}

export async function fetchClient(id: string): Promise<Client | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('inquilinos').select('*').eq('id', id).single();
    if (error) return null;
    return rowToClient(data);
}

export async function fetchLandlord(id: string): Promise<Landlord | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('landlords').select('*').eq('id', id).single();
    if (error) return null;
    return rowToLandlord(data);
}

// ─── CLIENTS (locatários) ─────────────────────────────────────────────────────

export async function fetchClients(agencyId: string): Promise<Client[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('inquilinos')
        .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToClient);
}

export async function createClient(c: Omit<Client, 'id'>): Promise<Client> {
    const { data, error } = await supabase.from('inquilinos').insert({
        agency_id: c.tenantId, 
        name: c.name, 
        cpf: c.cpf,
        email: c.email || null,
        phone: c.phone || null
    }).select().single();
    if (error) throw error;
    return rowToClient(data);
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
    const { error } = await supabase.from('inquilinos').update({
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.cpf !== undefined && { cpf: updates.cpf }),
        ...(updates.email !== undefined && { email: updates.email }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
    }).eq('id', id);
    if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from('inquilinos').delete().eq('id', id);
    if (error) throw error;
}

// ─── INSPECTIONS ──────────────────────────────────────────────────────────────

export async function fetchInspections(agencyId: string): Promise<Inspection[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('inspections')
        .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToInspection);
}

export async function fetchInspection(id: string): Promise<Inspection | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.from('inspections').select('*').eq('id', id).single();
    if (error) return null;
    return rowToInspection(data);
}

export async function createInspection(inspection: Omit<Inspection, 'id'>): Promise<Inspection> {
    console.log('createInspection - dados recebidos:', inspection);
    
    const { data, error } = await supabase
        .from('inspections')
        .insert({
            agency_id: inspection.tenantId,
            property_id: inspection.propertyId || null,
            client_id: inspection.clientId || null,
            landlord_id: inspection.landlordId || null,
            inspector_id: inspection.inspectorId || null, // NOVO: ID do inspetor
            tenant_name: inspection.tenantName || null, // NOVO: Nome do inquilino
            type: inspection.type,
            status: inspection.status,
            date: inspection.date,
            environments: inspection.environments || []
        })
        .select()
        .single();
        
    if (error) {
        console.error('createInspection - erro:', error);
        throw error;
    }
    
    console.log('createInspection - sucesso:', data);
    return rowToInspection(data);
}

export async function updateInspection(id: string, updates: Partial<Inspection>): Promise<void> {
    const { error } = await supabase.from('inspections').update({
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.environments !== undefined && { environments: updates.environments }),
        ...(updates.propertyId !== undefined && { property_id: updates.propertyId }),
        ...(updates.clientId !== undefined && { client_id: updates.clientId }),
        ...(updates.landlordId !== undefined && { landlord_id: updates.landlordId }),
        ...(updates.meters !== undefined && { meters: updates.meters }),
        ...(updates.keys !== undefined && { keys: updates.keys }),
        ...(updates.agreementTerm !== undefined && { agreement_term: updates.agreementTerm }),
        ...(updates.signatures !== undefined && { signatures: updates.signatures }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.date !== undefined && { date: updates.date }),
    }).eq('id', id);
    if (error) throw error;
}

export async function saveInspectionEnvironments(id: string, environments: InspectionEnvironment[]): Promise<void> {
    const { error } = await supabase.from('inspections')
        .update({ environments, status: 'ongoing' }).eq('id', id);
    if (error) throw error;
}

export async function completeInspection(id: string, environments: InspectionEnvironment[]): Promise<void> {
    const { error } = await supabase.from('inspections')
        .update({ environments, status: 'completed' }).eq('id', id);
    if (error) throw error;
}

export async function deleteInspection(id: string): Promise<void> {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) throw error;
}
