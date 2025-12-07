import { supabase } from './supabaseClient';
import { convertKeysToCamelCase, convertKeysToSnakeCase } from '../utils/case';

export type ResourceName =
  | 'profiles'
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

export interface ListOptions extends SelectOptions {
  // Filtros
  filter?: Record<string, unknown>;
  // Paginação
  limit?: number;
  offset?: number;
  // Ordenação
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  // Range personalizado
  range?: {
    from: number;
    to: number;
  };
}

export interface ListResponse<T> {
  data: T[];
  count?: number;
  hasMore?: boolean;
}

export interface DataProvider {
  list<T>(resource: ResourceName, options?: ListOptions): Promise<T[]>;
  listWithCount<T>(resource: ResourceName, options?: ListOptions): Promise<ListResponse<T>>;
  getById<T>(resource: ResourceName, id: string, options?: SelectOptions): Promise<T | undefined>;
  create<T>(resource: ResourceName, payload: T): Promise<T>;
  update<T>(resource: ResourceName, id: string, payload: Partial<T>): Promise<T | undefined>;
  delete(resource: ResourceName, id: string): Promise<void>;
}

const resourceTableMap: Partial<Record<ResourceName, string>> = {
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
    let query = table(resource).select(options?.select ?? '*');

    // Aplicar filtros
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (value === null) {
          query = query.is(snakeKey, null);
        } else if (Array.isArray(value)) {
          query = query.in(snakeKey, value);
        } else {
          query = query.eq(snakeKey, value);
        }
      });
    }

    // Aplicar ordenação
    if (options?.orderBy) {
      const snakeColumn = options.orderBy.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      query = query.order(snakeColumn, { ascending: options.orderBy.ascending ?? true });
    } else {
      // Ordenação padrão por created_at descendente
      query = query.order('created_at', { ascending: false });
    }

    // Aplicar paginação
    if (options?.range) {
      query = query.range(options.range.from, options.range.to);
    } else if (options?.limit !== undefined) {
      const from = options.offset ?? 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return convertKeysToCamelCase((data as T[]) ?? []);
  },

  async listWithCount<T>(resource, options) {
    let query = table(resource).select(options?.select ?? '*', { count: 'exact' });

    // Aplicar filtros
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (value === null) {
          query = query.is(snakeKey, null);
        } else if (Array.isArray(value)) {
          query = query.in(snakeKey, value);
        } else {
          query = query.eq(snakeKey, value);
        }
      });
    }

    // Aplicar ordenação
    if (options?.orderBy) {
      const snakeColumn = options.orderBy.column.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      query = query.order(snakeColumn, { ascending: options.orderBy.ascending ?? true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Aplicar paginação
    let from = 0;
    let to = 999999; // Default: sem limite

    if (options?.range) {
      from = options.range.from;
      to = options.range.to;
      query = query.range(from, to);
    } else if (options?.limit !== undefined) {
      from = options.offset ?? 0;
      to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const hasMore = count ? (to + 1) < count : false;

    return {
      data: convertKeysToCamelCase((data as T[]) ?? []),
      count: count ?? undefined,
      hasMore,
    };
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
