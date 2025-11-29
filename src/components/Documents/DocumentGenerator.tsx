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
  values.email_display = '';
  return values;
};

const applySectionVisibility = (html: string, template: DocumentTemplate, values: Record<string, any>) => {
  let output = html;
  const toggles = template.fields.filter((f) => f.type === 'section_toggle');

  toggles.forEach((field) => {
    const base = field.name.replace(/^section_/, '').replace(/^show_/, '');
    const targets = [
      { attr: 'section', id: base },
      { attr: 'field', id: base },
      { attr: 'field', id: `${base}_block` },
      { attr: 'section', id: `${base}_section` },
      { attr: 'section', id: field.name },
      { attr: 'field', id: field.name },
    ];

    targets.forEach(({ attr, id }) => {
      if (!id) return;
      const regex = new RegExp(`data-${attr}-id="${id}"(?:\\s+style="display:none;")?`, 'g');
      if (values[field.name] === false) {
        output = output.replace(regex, `data-${attr}-id="${id}" style="display:none;"`);
      } else {
        output = output.replace(regex, `data-${attr}-id="${id}"`);
      }
    });
  });

  return output;
};

const formatListItem = (item: string) => {
  // Captura prefixos como "2010-14", "2010-2014" ou "2022 – texto"
  const match = item.match(/^\s*([^-–]+)\s*[-–]\s*(.+)$/);
  if (match) {
    const [, prefix, rest] = match;
    return `<li><strong>${prefix.trim()}</strong> – ${rest.trim()}</li>`;
  }
  return `<li>${item}</li>`;
};

const replaceTokens = (template: string, values: Record<string, any>) =>
  template.replace(/{{(.*?)}}/g, (_, token: string) => {
    const key = token.trim();
    if (key === 'email_display') {
      return values.show_email === false ? 'display:none;' : '';
    }
    const value = values[key];
    if (Array.isArray(value)) {
      // array de strings => lista
      if (value.every((item) => typeof item === 'string')) {
        return value.map((item) => formatListItem(item)).join('');
      }
      // array de objetos => concatena campos
      return value
        .map((entry) => {
          if (typeof entry === 'object' && entry) {
            const obj = entry as Record<string, unknown>;
            // Caso formação acadêmica (period/degree/institution), deixa o período em negrito
            if (obj.period) {
              const period = `<strong>${obj.period}</strong>`;
              const rest = Object.entries(obj)
                .filter(([k]) => k !== 'period')
                .map(([, v]) => v)
                .filter(Boolean);
              const cells = [period, ...rest].map((p) => `<td>${p ?? ''}</td>`).join('');
              return `<tr>${cells}</tr>`;
            }

            const parts = Object.values(obj).filter(Boolean);
            return parts.length ? `<tr>${parts.map((p) => `<td>${p}</td>`).join('')}</tr>` : '';
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
      const rendered = replaceTokens(selectedTemplate.template, initial);
      const withVisibility = applySectionVisibility(rendered, selectedTemplate, initial);
      setPreviewHtml(sanitize(withVisibility));
      setPreviewTitle(selectedTemplate.name);
      setError(null);
    }
  }, [selectedTemplate]);

  const handleFieldChange = (name: string, value: any) => {
    setFormValues((prev) => {
      const next = { ...prev, [name]: value };
      if (selectedTemplate) {
        const rendered = replaceTokens(selectedTemplate.template, next);
        const withVisibility = applySectionVisibility(rendered, selectedTemplate, next);
        setPreviewHtml(sanitize(withVisibility));
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsSaving(true);
    setError(null);
    try {
      const rendered = replaceTokens(selectedTemplate.template, formValues);
      const withVisibility = applySectionVisibility(rendered, selectedTemplate, formValues);
      const html = sanitize(withVisibility);
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
                    {sub.type === 'select' && Array.isArray(sub.options) ? (
                      <select
                        value={entry[sub.name] ?? ''}
                        onChange={(e) => {
                          const next = [...value];
                          next[idx] = { ...next[idx], [sub.name]: e.target.value };
                          handleFieldChange(field.name, next);
                        }}
                        className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
                      >
                        <option value="">Selecione</option>
                        {sub.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
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
                    )}
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

    if (field.type === 'email') {
      const showEmail = formValues.show_email !== false;
      return (
        <div key={field.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
            <button
              type="button"
              onClick={() => {
                handleFieldChange('show_email', !showEmail);
              }}
              className="text-xs text-primary-600 hover:underline"
            >
              {showEmail ? 'Ocultar' : 'Exibir'}
            </button>
          </div>
          <input
            type="email"
            value={formValues[field.name] ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
            disabled={!showEmail}
          />
        </div>
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
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800"
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
                        body { font-family: "Times New Roman", Georgia, serif; line-height: 1.3; font-size: 12px; padding: 40px; }
                        h1, h2, h3, h4 { font-size: 14px; line-height: 1.3; text-transform: uppercase; margin: 8px 0 6px 0; }
                        h1 { text-align: center; font-size: 16px; }
                        p { text-align: justify; }
                        .cv-doc p { text-align: initial; }
                        .signature, .assinatura, .assinaturas, .local, .data { text-align: center; display: block; margin: 6px 0; }
                        .signature hr, .assinatura hr, .assinaturas hr { width: 40%; margin: 12px auto 0 auto; border: 0; border-top: 1px solid #000; }
                        .signature-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
                        .signature-wrapper .signature-line { text-align: center; min-width: 40%; }
                        /* Fundo apenas para CV com leve transpar��ncia e desfoque */
                        .cv-doc h2, .cv-doc h3, .cv-doc h4 {
                          background: rgba(217, 217, 217, 0.65);
                          background-color: rgba(217, 217, 217, 0.65);
                          padding: 3px 8px;
                          font-weight: 700;
                          border-bottom: 1px solid #777;
                          display: block;
                          width: 100%;
                          backdrop-filter: blur(3px);
                          -webkit-backdrop-filter: blur(3px);
                        }
                        .dark .cv-doc h2, .dark .cv-doc h3, .dark .cv-doc h4 {
                          background: rgba(15, 23, 42, 0.7) !important;
                          background-color: rgba(15, 23, 42, 0.7) !important;
                          border-bottom-color: #1f2937;
                          color: #fff;
                          backdrop-filter: blur(3px);
                          -webkit-backdrop-filter: blur(3px);
                        }
                        ul { list-style: none; padding-left: 0; margin-left: 0; }
                        ul li { margin-bottom: 4px; padding-left: 0; text-align: justify; }
                        ul li::before { content: none; }
                        [data-section-id="social_skills"] ul { list-style: none; padding-left: 0; margin-left: 0; }
                        [data-section-id="social_skills"] ul li { position: relative; margin-left: 20px; margin-bottom: 6px; padding-left: 6px; }
                        [data-section-id="social_skills"] ul li::before { content: '➢'; position: absolute; left: -14px; top: 0; }
                        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                        th, td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
                        th { background: none; font-weight: 700; }
                        .dark th { background: none !important; color: #fff; border-color: #444; }
                        .signature, .assinatura, .assinaturas, .local, .data { text-align: center; display: block; margin: 6px 0; }
                        .signature-block { text-align: center; margin: 4px 0; }
                        .signature-block .local, .signature-block .data { display: inline-block; margin: 0 2px; }
                        .signature hr, .assinatura hr, .assinaturas hr { width: 40%; margin: 12px auto 0 auto; border: 0; border-top: 1px solid #000; }
                        .signature-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
                        .signature-wrapper .signature-line { text-align: center; min-width: 40%; }
                        .ident-table { border-collapse: collapse; width: 100%; margin-top: 4px; }
                        .ident-table td { border: none; padding: 2px 6px; }
                        .ident-table td.label { width: 180px; font-weight: 700; }
                        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
              style={{ fontFamily: '"Times New Roman", Georgia, serif', lineHeight: 1.3, fontSize: '12px' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <style>{`
              .prose { font-size: 12px; }
              .prose p { text-align: justify; }
              .prose .cv-doc p { text-align: initial; }
              .prose .signature, .prose .assinatura, .prose .assinaturas, .prose .local, .prose .data {
                text-align: center;
                display: block;
                margin: 6px 0;
              }
              .prose .signature-block { text-align: center; margin: 4px 0; }
              .prose .signature-block .local, .prose .signature-block .data { display: inline-block; margin: 0 2px; }
              .prose .signature hr, .prose .assinatura hr, .prose .assinaturas hr { width: 40%; margin: 12px auto 0 auto; border: 0; border-top: 1px solid #000; }
              .prose .signature-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; }
              .prose .signature-wrapper .signature-line { text-align: center; min-width: 40%; }
              .prose .signature hr,
              .prose .assinatura hr,
              .prose .assinaturas hr {
                width: 40%;
                margin: 12px auto 0 auto;
                border: 0;
                border-top: 1px solid #000;
              }
              .prose .signature-wrapper {
                display: flex;
                justify-content: center;
                gap: 40px;
                flex-wrap: wrap;
              }
              .prose .signature-wrapper .signature-line {
                text-align: center;
                min-width: 40%;
              }
              .prose h1, .prose h2, .prose h3, .prose h4 {
                font-size: 14px;
                line-height: 1.3;
                margin: 8px 0 6px 0;
                text-transform: uppercase;
              }
              .prose h1 { text-align: center; font-size: 16px; }
              /* Cabeçalhos com fundo apenas no CV */
              .cv-doc h2, .cv-doc h3, .cv-doc h4 {
                background: rgba(217, 217, 217, 0.65);
                background-color: rgba(217, 217, 217, 0.65);
                padding: 3px 8px;
                font-weight: 700;
                border-bottom: 1px solid #777;
                display: block;
                width: 100%;
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
              }
              .dark .cv-doc h2, .dark .cv-doc h3, .dark .cv-doc h4 {
                background: rgba(15, 23, 42, 0.7);
                background-color: rgba(15, 23, 42, 0.7);
                border-bottom-color: #1f2937;
                color: #fff;
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
              }
              /* Títulos gerais para outros documentos sem fundo */
              .prose h2:not(.cv-doc h2), .prose h3:not(.cv-doc h3), .prose h4:not(.cv-doc h4) {
                font-weight: 700;
              }
              .prose p { margin: 6px 0; text-align: justify; }
              .prose ul { list-style: none; padding-left: 0; margin-left: 0; }
              .prose ul li { margin-bottom: 4px; padding-left: 0; }
              .prose ul li::before { content: none; }
              .prose [data-section-id="social_skills"] ul { list-style: none; padding-left: 0; margin-left: 0; }
              .prose [data-section-id="social_skills"] ul li { position: relative; margin-left: 20px; margin-bottom: 6px; padding-left: 6px; }
              .prose [data-section-id="social_skills"] ul li::before { content: '➢'; position: absolute; left: -14px; top: 0; }
              .prose table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              .prose th, .prose td { border: 1px solid #000; padding: 4px 6px; text-align: left; vertical-align: top; }
              .prose th { background: none; color: inherit; font-weight: 700; }
              .prose .ident-table { border-collapse: collapse; width: 100%; margin-top: 4px; }
              .prose .ident-table td { border: none; padding: 2px 6px; }
              .prose .ident-table td.label { width: 180px; font-weight: 700; }
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
