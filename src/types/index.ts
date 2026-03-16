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
  address: string; // Keep for backward compatibility/display
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  description: string;
}

export interface Landlord {
  id: string;
  tenantId: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  cpf: string;
  email?: string;
  phone?: string;
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

export type InspectionType = 'entry' | 'exit' | 'verification';

export interface MeterReading {
  light: string;
  water: string;
  gas: string;
}

export interface KeyRecord {
  description: string;
  quantity: number;
}

export interface Inspection {
  id: string;
  tenantId: string;
  propertyId: string;
  clientId: string; // Locatário
  landlordId?: string; // Locador
  type: InspectionType;
  status: 'ongoing' | 'completed';
  date: string;
  startTime?: string;
  environments: InspectionEnvironment[];
  
  // Footer Info (Insurance Requirements)
  meters?: MeterReading;
  keys?: KeyRecord[];
  agreementTerm?: string;
  signatures?: {
    inspector: boolean;
    landlord: boolean;
    tenant: boolean;
  };
}
