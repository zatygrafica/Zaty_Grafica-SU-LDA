import { supabase } from './supabaseClient';
import { convertKeysToCamelCase, convertKeysToSnakeCase } from '../utils/case';

export type ResourceName =
  | 'profiles'
  | 'users'
  | 'clients'
  | 'orders'
  | 'services'
  | 'materials'
  | 'stockMovements'
  | 'purchases'
  | 'expenses'
  | 'salaryPayments'
  | 'payments'
  | 'tasks'
  | 'notes'
  | 'attendanceEvents'
  | 'documentTemplates'
  | 'generatedDocuments'
  | 'conversations'
  | 'messages'
  | 'employees'
  | 'invoices'
  | 'settings';

interface SelectOptions {
  select?: string;
}

export interface DataProvider {
  list<T>(resource: ResourceName, options?: SelectOptions): Promise<T[]>;
  getById<T>(resource: ResourceName, id: string, options?: SelectOptions): Promise<T | undefined>;
  create<T>(resource: ResourceName, payload: T): Promise<T>;
  update<T>(resource: ResourceName, id: string, payload: Partial<T>): Promise<T | undefined>;
  delete(resource: ResourceName, id: string): Promise<void>;
}

const resourceTableMap: Partial<Record<ResourceName, string>> = {
  users: 'profiles',
  stockMovements: 'stock_movements',
  salaryPayments: 'salary_payments',
  documentTemplates: 'document_templates',
  generatedDocuments: 'generated_documents',
  attendanceEvents: 'attendance_events',
};

const tableName = (resource: ResourceName) => resourceTableMap[resource] ?? resource;
const table = (resource: ResourceName) => supabase.from(tableName(resource));

export const supabaseDataProvider: DataProvider = {
  async list<T>(resource, options) {
    const { data, error } = await table(resource).select(options?.select ?? '*');
    if (error) throw error;
    return convertKeysToCamelCase((data as T[]) ?? []);
  },
  async getById<T>(resource, id, options) {
    const { data, error } = await table(resource).select(options?.select ?? '*').eq('id', id).maybeSingle();
    if (error) throw error;
    return convertKeysToCamelCase((data as T) ?? undefined);
  },
  async create<T>(resource, payload) {
    const snakePayload = convertKeysToSnakeCase(payload);
    const { data, error } = await table(resource).insert(snakePayload).select().single();
    if (error) throw error;
    return convertKeysToCamelCase(data as T);
  },
  async update<T>(resource, id, payload) {
    const snakePayload = convertKeysToSnakeCase(payload);
    const { data, error } = await table(resource).update(snakePayload).eq('id', id).select().single();
    if (error) throw error;
    return convertKeysToCamelCase((data as T) ?? undefined);
  },
  async delete(resource, id) {
    const { error } = await table(resource).delete().eq('id', id);
    if (error) throw error;
  },
};
