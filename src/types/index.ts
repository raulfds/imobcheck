export interface TemplateCategory {
  nome: string;
  itens: string[];
}

export interface RoomTemplate {
  nome: string;
  categorias: TemplateCategory[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  userLimit: number;
  inspectionLimit: number;
  photoStorageDays: number;
  price: number;
  features: string[];
}

export type UserRole = 'SUPER_ADMIN' | 'CLIENT_ADMIN' | 'INSPECTOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string; // Null if Super Admin
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  adminName?: string;
  phone?: string;
  status: 'active' | 'inactive';
  plan: string;
  acquisitionDate?: string;
  planId?: string;
  cnpj?: string;
  address?: string;
  logo?: string;
  billingCycle?: 'monthly' | 'annual';
  firstLoginAt?: string;
  expiresAt?: string;
}

export interface Property {
  id: string;
  tenantId: string;
  address: string;
  description: string;
}

export interface Landlord {
  id: string;
  tenantId: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email: string;
}

export interface InspectionEnvironment {
  id: string;
  name: string;
  items: InspectionItem[];
  generalPhotos?: string[];
}

export interface InspectionItem {
  id: string;
  name: string;
  category?: string;
  status: 'ok' | 'not_ok' | 'pending';
  defect?: string;
  observation?: string;
  photo?: string;
}

export interface Inspection {
  id: string;
  tenantId: string;
  propertyId: string;
  clientId: string;
  type: 'entry' | 'exit';
  status: 'ongoing' | 'completed';
  date: string;
  environments: InspectionEnvironment[];
}
