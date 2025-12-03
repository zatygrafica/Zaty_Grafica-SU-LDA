// Shared value objects
export type UserRole = 'admin' | 'user';
export type ClientType = 'individual' | 'company';
export type ServiceUnit = 'meter' | 'cm' | 'unit' | 'kg' | 'package' | 'roll';
export type MaterialUnit = 'meter' | 'roll' | 'unit' | 'kg' | 'package';
export type OrderStatus = 'pending' | 'in_production' | 'in_design' | 'completed';
export type OrderType = 'service' | 'material_sale';
export type DiscountType = 'none' | 'fixed' | 'percentage';
export type PaymentMethod = 'cash' | 'transfer' | 'mobile_money';
export type EmployeeRole =
  | 'security_day'
  | 'security_night'
  | 'production_manager'
  | 'production'
  | 'manager'
  | 'customer_service'
  | 'graphic_designer'
  | 'employee';
export type EmployeeDocumentType = 'bi' | 'passport' | 'voter_card' | 'drivers_license';
export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type DocumentTemplateType = 'client' | 'internal';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// Users & Access Control
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: string[];
  photoUrl?: string;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// CRM & Orders
export interface Client {
  id: string;
  clientType: ClientType;
  name: string;
  legalRepresentative?: string;
  email?: string;
  phone: string;
  address?: string;
  nuit?: string;
  transferredFrom?: string;
  transferredAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialConsumption {
  materialId: string;
  width?: number;
  length?: number;
  quantity?: number;
}

export interface ServiceVariation {
  id: string;
  name: string;
  price: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  unit: ServiceUnit;
  // meter-specific defaults
  defaultWidth?: number;
  defaultLength?: number;
  variations?: ServiceVariation[];
  materialsUsed?: MaterialConsumption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  variationId?: string;
  variationName?: string;
  description?: string;
  width?: number;
  length?: number;
  quantity: number;
  unit: ServiceUnit;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  status: OrderStatus;
  type: OrderType;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatAmount: number;
  total: number;
  notes?: string;
  invoiceGenerated: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  order: Order;
  vatRate: number;
  createdAt: Date;
}

// People & Attendance
export interface Employee {
  id: string;
  name: string;
  motherName?: string;
  photoUrl?: string;
  position: EmployeeRole;
  documentType?: EmployeeDocumentType;
  documentNumber?: string;
  nuit?: string;
  phone: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  salary?: number;
  startDate?: Date;
  paymentDate?: number;
  workSchedule: {
    start: string;
    end: string;
    totalHours: number;
  };
  documents: EmployeeDocument[];
  customTerm?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeDocument {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

interface BaseAttendanceEvent {
  id: string;
  employeeId: string;
  date: Date;
  deduction: number;
  status: 'present' | 'late';
  notes?: string;
  createdAt: Date;
}

export interface Absence extends BaseAttendanceEvent {
  type: 'absence';
  hours: number;
}

export interface Delay extends BaseAttendanceEvent {
  type: 'delay';
  actualArrivalTime: string;
  minutes: number;
}

export type AttendanceEvent = Absence | Delay;

// Inventory & Procurement
export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  defaultWidth?: number;
  pricePerUnit: number;
  sellingPrice?: number;
  isSellable?: boolean;
  currentStock: number;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  type: 'deduction_order' | 'addition_purchase' | 'manual_adjustment';
  referenceId: string;
  details?: string;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  date: Date;
  supplier?: string;
  createdBy?: string;
  createdAt: Date;
}

// Finance & Payments
export interface Expense {
  id: string;
  description: string;
  amount: number;
  type: 'salary' | 'purchase' | 'other' | 'business' | 'personal';
  date: Date;
  createdBy?: string;
  createdAt: Date;
  referenceId?: string;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: Date;
  paidAt?: Date;
  month: number;
  year: number;
  deductions: number;
  grossSalary: number;
  method: PaymentMethod;
  createdBy?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  orderId?: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  notes?: string;
  createdAt: Date;
}

// Notifications & Auditing
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  timestamp: Date;
}

// Documents & Templates
export interface DocumentField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'date'
    | 'number'
    | 'textarea'
    | 'select'
    | 'section_toggle'
    | 'list'
    | 'checklist'
    | 'language_grid'
    | 'repeatable';
  required: boolean;
  options?: string[];
  defaultValue?: string;
  sectionId?: string;
  dependsOn?: string;
  subFields?: DocumentField[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentTemplateType;
  template: string;
  fields: DocumentField[];
  version: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedDocument {
  id: string;
  templateId: string;
  template: DocumentTemplate;
  userId?: string;
  clientId?: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

// Productivity
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  isCompleted: boolean;
  relatedTo?: {
    type: 'client' | 'order';
    id: string;
    name: string;
  };
  createdBy?: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chat & Collaboration
export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'read';
  attachment?: ChatAttachment;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessageTimestamp: Date;
  unreadCount: number;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  payload: unknown;
  timestamp: Date;
}

// Settings
export interface CompanySettings {
  name: string;
  address?: string;
  nuit?: string;
  phone?: string;
}

export interface SupportSettings {
  phone?: string;
  email?: string;
  link?: string;
}

export interface AppSettings {
  deletionPassword?: string;
  vatRate: number;
  currency: string;
  timezone: string;
  popupFrequency: number;
  emailNotificationsEnabled: boolean;
  company: CompanySettings;
  support: SupportSettings;
}
