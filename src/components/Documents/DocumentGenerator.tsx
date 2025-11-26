import React, { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { useDocumentStore } from '../../store/useDocumentStore';
import type { DocumentTemplate, GeneratedDocument } from '../../types';

type DocumentField = DocumentTemplate['fields'][number];

const normalizeDefault = (field: DocumentField) => {
  if (field.type === 'section_toggle') {
    if (typeof field.defaultValue === 'boolean') return field.defaultValue;
    if (typeof field.defaultValue === 'string') return field.defaultValue.toLowerCase() === 'true';
    return false;
  }
  if (field.type === 'checklist' || field.type === 'list') {
    if (Array.isArray(field.defaultValue)) return field.defaultValue;
    if (typeof field.defaultValue === 'string') return [field.defaultValue];
    return [];
  }
  return field.defaultValue ?? '';
};

const buildInitialValues = (template: DocumentTemplate) => {
  const values: Record<string, any> = {};
  template.fields.forEach((field) => {
    values[field.name] = normalizeDefault(field);
  });
  return values;
};

const replaceTokens = (template: string, values: Record<string, any>) =>
  template.replace(/{{(.*?)}}/g, (_, token: string) => {
    const key = token.trim();
    const value = values[key];
    if (Array.isArray(value)) {
      // array de strings => lista
      if (value.every((item) => typeof item === 'string')) {
        return value.map((item) => `<li>${item}</li>`).join('');
      }
      // array de objetos => concatena campos
      return value
        .map((entry) => {
          if (typeof entry === 'object' && entry) {
            const parts = Object.values(entry as Record<string, unknown>).filter(Boolean);
            return parts.length ? `<div>${parts.join(' - ')}</div>` : '';
          }
          return '';
        })
        .filter(Boolean)
        .join('');
    }
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    return value ?? '';
  });

const sanitize = (html: string) => DOMPurify.sanitize(html);

export const DocumentGenerator: React.FC = () => {
  const { templates, generatedDocs, addGeneratedDoc, deleteGeneratedDoc, loadTemplates, templatesLoadedOnce } =
    useDocumentStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Documento');

  useEffect(() => {
    if (!templatesLoadedOnce) {
      void loadTemplates();
    }
  }, [templatesLoadedOnce, loadTemplates]);

  useEffect(() => {
    if (templates.length && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  useEffect(() => {
    if (selectedTemplate) {
      const initial = buildInitialValues(selectedTemplate);
      setFormValues(initial);
      setPreviewHtml(sanitize(replaceTokens(selectedTemplate.template, initial)));
      setPreviewTitle(selectedTemplate.name);
      setError(null);
    }
  }, [selectedTemplate]);

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => {
      const next = { ...prev, [name]: value };
      if (selectedTemplate) {
        setPreviewHtml(sanitize(replaceTokens(selectedTemplate.template, next)));
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    setError(null);
    try {
      const html = sanitize(replaceTokens(selectedTemplate.template, formValues));
      const doc: GeneratedDocument = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        content: html,
        createdAt: new Date(),
        data: formValues,
      };
      addGeneratedDoc(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o documento.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: DocumentField) => {
    if (field.type === 'list') {
      const value: string[] = Array.isArray(formValues[field.name]) ? formValues[field.name] : [];
      return (
        <div key={field.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
            <button
              type="button"
              onClick={() => handleFieldChange(field.name, [...value, ''])}
              className="text-xs text-primary-600 hover:underline"
            >
              Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div key={`${field.name}-${idx}`} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...value];
                    next[idx] = e.target.value;
                    handleFieldChange(field.name, next);
                  }}
                  className="flex-1 rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = value.filter((_, i) => i !== idx);
                    handleFieldChange(field.name, next);
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              </div>
            ))}
            {value.length === 0 && <p className="text-xs text-slate-500 dark:text-white/60">Nenhum item. Clique em adicionar.</p>}
          </div>
        </div>
      );
    }

    if (field.type === 'repeatable' && Array.isArray(field.subFields)) {
      const value: Record<string, any>[] = Array.isArray(formValues[field.name]) ? formValues[field.name] : [];
      return (
        <div key={field.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
            <button
              type="button"
              onClick={() => handleFieldChange(field.name, [...value, {}])}
              className="text-xs text-primary-600 hover:underline"
            >
              Adicionar
            </button>
          </div>
          <div className="space-y-3">
            {value.map((entry, idx) => (
              <div key={`${field.name}-${idx}`} className="space-y-2 rounded border border-zinc-200 p-3 dark:border-white/10">
                {field.subFields!.map((sub) => (
                  <div key={`${sub.name}-${idx}`} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-white/70">{sub.label}</label>
                    <input
                      type={sub.type === 'date' ? 'date' : sub.type === 'number' ? 'number' : 'text'}
                      value={entry[sub.name] ?? ''}
                      onChange={(e) => {
                        const next = [...value];
                        next[idx] = { ...next[idx], [sub.name]: e.target.value };
                        handleFieldChange(field.name, next);
                      }}
                      className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const next = value.filter((_, i) => i !== idx);
                    handleFieldChange(field.name, next);
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remover
                </button>
              </div>
            ))}
            {value.length === 0 && <p className="text-xs text-slate-500 dark:text-white/60">Nenhum item. Clique em adicionar.</p>}
          </div>
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={field.name} className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
          <textarea
            value={formValues[field.name] ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={4}
            className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>
      );
    }

    if (field.type === 'checklist' && Array.isArray(field.options)) {
      const value: string[] = formValues[field.name] ?? [];
      return (
        <div key={field.name} className="space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</p>
          <div className="space-y-1">
            {field.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
                <input
                  type="checkbox"
                  checked={value.includes(opt)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...value, opt] : value.filter((v) => v !== opt);
                    handleFieldChange(field.name, next);
                  }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'section_toggle') {
      const value: boolean = formValues[field.name] ?? false;
      return (
        <label key={field.name} className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
          />
          {field.label}
        </label>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
        <input
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={formValues[field.name] ?? ''}
          onChange={(e) => handleFieldChange(field.name, e.target.value)}
          className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
          required={!!field.required}
        />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Modelo</label>
          <select
            value={selectedTemplateId ?? ''}
            onChange={(e) => setSelectedTemplateId(e.target.value || null)}
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedTemplate.name}</h3>
            {selectedTemplate.fields.map(renderField)}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={isSaving}
              className="rounded bg-primary-600 px-4 py-2 text-white text-sm font-semibold disabled:opacity-60"
            >
              {isSaving ? 'Gerando...' : 'Gerar documento'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Pré-visualização</h3>
            <button
              onClick={() => {
                const win = window.open('', '_blank', 'width=900,height=700');
                if (!win) return;
                win.document.write(`
                  <html>
                    <head>
                      <title>${previewTitle}</title>
                      <style>
                        body { font-family: "Times New Roman", Georgia, serif; line-height: 1.6; padding: 40px; }
                        ul { list-style: none; padding-left: 0; margin-left: 0; }
                        ul li { position: relative; margin-left: 16px; }
                        ul li::before { content: '➢'; position: absolute; left: -12px; }
                        h3, h4 { background: #d9d9d9; padding: 4px 8px; font-weight: 700; text-transform: uppercase; margin-top: 0; }
                      </style>
                    </head>
                    <body>${previewHtml}</body>
                  </html>
                `);
                win.document.close();
                win.focus();
                win.print();
              }}
              className="rounded bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Imprimir
            </button>
          </div>
          <div className="mt-3 min-h-[300px] max-h-[70vh] overflow-auto rounded border border-zinc-200 bg-white p-4 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
            <div
              className="prose prose-slate max-w-none dark:prose-invert"
              style={{ fontFamily: '"Times New Roman", Georgia, serif', lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <style>{`
              .prose ul { list-style: none; padding-left: 0; margin-left: 0; }
              .prose ul li { position: relative; margin-left: 18px; margin-bottom: 6px; }
              .prose ul li::before { content: '➢'; position: absolute; left: -14px; top: 0; }
              .prose h3, .prose h4 { background: #d9d9d9; padding: 4px 8px; font-weight: 700; text-transform: uppercase; margin-top: 0; border-bottom: 1px solid #999; }
            `}</style>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Histórico</h3>
          <div className="mt-3 space-y-2">
            {generatedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded border border-zinc-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{doc.templateName}</p>
                  <p className="text-xs text-slate-500 dark:text-white/60">
                    {new Date(doc.createdAt).toLocaleString('pt-PT')}
                  </p>
                </div>
                <button
                  onClick={() => deleteGeneratedDoc(doc.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Excluir
                </button>
              </div>
            ))}
            {generatedDocs.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-white/60">Nenhum documento gerado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;
