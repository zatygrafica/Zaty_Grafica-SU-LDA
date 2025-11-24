import { create } from 'zustand';
import type { DocumentTemplate, GeneratedDocument } from '../types';
import documentTemplates from '../data/documentTemplates';
import { useStore } from './useStore';
import { supabaseDataProvider } from '../services/supabaseDataProvider';

const seedTemplates: DocumentTemplate[] = documentTemplates.map((template) => ({
  ...template,
}));

const mergeTemplates = (
  base: DocumentTemplate[],
  extra: DocumentTemplate[],
): DocumentTemplate[] => {
  const map = new Map<string, DocumentTemplate>();
  base.forEach((template) => {
    map.set(template.id, template);
  });
  extra.forEach((template) => {
    const id = template.id ?? crypto.randomUUID?.() ?? String(Date.now());
    map.set(id, { ...template, id });
  });
  return Array.from(map.values());
};

interface DocumentState {
  templates: DocumentTemplate[];
  generatedDocs: GeneratedDocument[];
  templatesLoading: boolean;
  templatesError: string | null;
  templatesLoadedOnce: boolean;
  setTemplates: (templates: DocumentTemplate[]) => void;
  loadTemplates: () => Promise<void>;
  createTemplate: (
    template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'> &
      Partial<Pick<DocumentTemplate, 'id'>>,
  ) => Promise<DocumentTemplate | null>;
  updateTemplate: (
    id: string,
    templateUpdate: Partial<Omit<DocumentTemplate, 'id'>>,
  ) => void;
  addGeneratedDoc: (doc: GeneratedDocument) => void;
  deleteGeneratedDoc: (id: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  templates: seedTemplates,
  generatedDocs: [],
  templatesLoading: false,
  templatesError: null,
  templatesLoadedOnce: false,

  setTemplates: (templates) => set({ templates }),

  loadTemplates: async () => {
    set({ templatesLoading: true, templatesError: null });
    try {
      const response = await supabaseDataProvider.list('document_templates');
      const remoteTemplates: DocumentTemplate[] = Array.isArray(response?.data)
        ? response?.data ?? []
        : response?.data
        ? [response.data as DocumentTemplate]
        : [];
      set((state) => ({
        templates: mergeTemplates(seedTemplates, remoteTemplates),
        templatesLoading: false,
        templatesLoadedOnce: true,
      }));
    } catch (error) {
      console.error('Erro ao carregar templates do Supabase', error);
      set({
        templatesError:
          'Não foi possível carregar os modelos personalizados. Tente novamente mais tarde.',
        templatesLoading: false,
        templatesLoadedOnce: true,
      });
    }
  },

  createTemplate: async (template) => {
    const payload = {
      ...template,
      id: template.id ?? crypto.randomUUID?.() ?? String(Date.now()),
      createdAt: template.createdAt ?? new Date().toISOString(),
      updatedAt: template.updatedAt ?? new Date().toISOString(),
    } as DocumentTemplate;

    try {
      const response = await supabaseDataProvider.create('document_templates', payload);
      const saved: DocumentTemplate = Array.isArray(response?.data)
        ? response?.data?.[0] ?? payload
        : (response?.data as DocumentTemplate) ?? payload;

      set((state) => ({
        templates: mergeTemplates(state.templates, [saved]),
      }));
      return saved;
    } catch (error) {
      console.error('Erro ao criar template no Supabase', error);
      set((state) => ({
        templates: mergeTemplates(state.templates, [payload]),
      }));
      return payload;
    }
  },

  updateTemplate: (id, templateUpdate) => {
    useStore
      .getState()
      .addAuditLog({ action: 'update', resourceType: 'DocumentTemplate', resourceId: id });

    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === id ? { ...template, ...templateUpdate, updatedAt: new Date() } : template,
      ),
    }));
  },

  addGeneratedDoc: (doc) => {
    useStore
      .getState()
      .addAuditLog({ action: 'create', resourceType: 'GeneratedDocument', resourceId: doc.id });

    set((state) => ({ generatedDocs: [doc, ...state.generatedDocs] }));
  },

  deleteGeneratedDoc: (id) => {
    useStore
      .getState()
      .addAuditLog({ action: 'delete', resourceType: 'GeneratedDocument', resourceId: id });

    set((state) => ({
      generatedDocs: state.generatedDocs.filter((doc) => doc.id !== id),
    }));
  },
}));
