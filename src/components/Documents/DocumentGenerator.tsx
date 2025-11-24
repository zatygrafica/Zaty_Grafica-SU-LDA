import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import documentTemplates from '../../data/documentTemplates';
import { useDocumentStore } from '../../store/useDocumentStore';
import type { DocumentTemplate, GeneratedDocument } from '../../types';
import { supabaseDataProvider } from '../../services/supabaseDataProvider';

type DocumentField = DocumentTemplate['fields'][number];

const sanitizeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');

const normalizeDefault = (field: DocumentField) => {
  if (field.type === 'section_toggle') {
    if (typeof field.defaultValue === 'boolean') return field.defaultValue;
    if (typeof field.defaultValue === 'string') {
      return field.defaultValue.toLowerCase() === 'true';
    }
    return true;
  }

  if (field.type === 'checklist' || field.type === 'list') {
    if (Array.isArray(field.defaultValue)) return field.defaultValue;
    if (typeof field.defaultValue === 'string') return [field.defaultValue];
    return [];
  }

  if (field.type === 'repeatable' || field.type === 'language_grid') {
    return Array.isArray(field.defaultValue) ? field.defaultValue : [];
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

const formatValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (typeof entry === 'object' && entry) {
          return Object.values(entry as Record<string, unknown>)
            .map(formatValue)
            .filter(Boolean)
            .join(' • ');
        }
        return `${entry ?? ''}`;
      })
      .filter(Boolean)
      .join('<br/>');
  }

  if (typeof value === 'object' && value) {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `<strong>${key}:</strong> ${formatValue(val)}`)
      .join('<br/>');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  return value ? String(value) : '';
};

const generateDocumentHtml = (template: DocumentTemplate, values: Record<string, any>) => {
  const tokenRegex = /{{(.*?)}}/g;
  const html = template.template.replace(tokenRegex, (_, token: string) => {
    const key = token.trim();
    return formatValue(values[key] ?? '');
  });
  return sanitizeHtml(html);
};

const createEmptyRow = (field: DocumentField) => {
  if (field.type === 'language_grid') {
    return { language: '', reading: '', speaking: '', writing: '' };
  }

  if (field.type === 'repeatable' && Array.isArray(field.subFields)) {
    return field.subFields.reduce<Record<string, string>>((acc, subField) => {
      acc[subField.name] = '';
      return acc;
    }, {});
  }

  return '';
};

const formatDate = (value: string) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('pt-PT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const fontOptions = [
  { label: 'Times New Roman', value: '"Times New Roman", Georgia, serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Merriweather', value: '"Merriweather", Georgia, serif' },
  { label: 'Montserrat', value: '"Montserrat", system-ui, sans-serif' },
];

const lineHeightOptions = [
  { label: '1.4', value: '1.4' },
  { label: '1.6', value: '1.6' },
  { label: '1.8', value: '1.8' },
];

export const DocumentGenerator = () => {
  const {
    templates,
    generatedDocs,
    addGeneratedDoc,
    deleteGeneratedDoc,
    templatesLoading,
    templatesError,
    templatesLoadedOnce,
    loadTemplates,
    createTemplate,
  } = useDocumentStore();

  const previewRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<'generate' | 'history'>('generate');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewDocTitle, setPreviewDocTitle] = useState('Selecione um documento');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedHistoryDocId, setSelectedHistoryDocId] = useState<string | null>(null);
  const [previewFontFamily, setPreviewFontFamily] = useState(fontOptions[0].value);
  const [previewLineHeight, setPreviewLineHeight] = useState(lineHeightOptions[1].value);
  const [isSaving, setIsSaving] = useState(false);

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateFormError, setTemplateFormError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'client',
    description: '',
    fieldsJson: JSON.stringify(documentTemplates[0]?.fields ?? [], null, 2),
    templateHtml: '',
  });

  useEffect(() => {
    if (!templatesLoadedOnce) {
      loadTemplates();
    }
  }, [templatesLoadedOnce, loadTemplates]);

  useEffect(() => {
    if (templates.length && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    const template = templates.find((tpl) => tpl.id === selectedTemplateId);
    if (template) {
      setFormValues(buildInitialValues(template));
      setPreviewDocTitle(template.name);
      setErrorMessage(null);
      if (!previewHtml) {
        setPreviewHtml(template.template);
      }
    }
  }, [selectedTemplateId, templates, previewHtml]);

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const templatesByType = useMemo(() => {
    return templates.reduce<Record<string, DocumentTemplate[]>>((acc, template) => {
      const type = template.type ?? 'outros';
      if (!acc[type]) acc[type] = [];
      acc[type].push(template);
      return acc;
    }, {});
  }, [templates]);

  const historySelection = useMemo(
    () => generatedDocs.find((doc) => doc.id === selectedHistoryDocId) ?? null,
    [generatedDocs, selectedHistoryDocId],
  );

  const previewStyles = useMemo(
    () => ({
      fontFamily: previewFontFamily,
      fontSize: '14px',
      lineHeight: previewLineHeight,
    }),
    [previewFontFamily, previewLineHeight],
  );

  useEffect(() => {
    if (previewRef.current && previewRef.current.innerHTML !== (previewHtml || '')) {
      previewRef.current.innerHTML = previewHtml || '';
    }
  }, [previewHtml]);

  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedTemplate || isSaving) return;
    setIsSaving(true);
    try {
      const html = generateDocumentHtml(selectedTemplate, formValues);
      const payload = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        content: html,
        createdAt: new Date().toISOString(),
        data: formValues,
      } as GeneratedDocument;

      let savedDoc: GeneratedDocument = payload;
      try {
        const response = await supabaseDataProvider.create('generated_documents', payload);
        savedDoc = Array.isArray(response?.data)
          ? response.data?.[0] ?? payload
          : (response?.data as GeneratedDocument) ?? payload;
      } catch (dbError) {
        console.error('Erro ao salvar documento no Supabase', dbError);
      }

      addGeneratedDoc(savedDoc);
      setSelectedHistoryDocId(savedDoc.id);
      setPreviewHtml(html);
      setPreviewDocTitle(selectedTemplate.name);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível gerar o documento.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [selectedTemplate, formValues, addGeneratedDoc, isSaving]);

  const handleHistoryPreview = useCallback((doc: GeneratedDocument) => {
    setView('history');
    setSelectedHistoryDocId(doc.id);
    setPreviewHtml(doc.content ?? '');
    setPreviewDocTitle(doc.templateName ?? 'Documento');
  }, []);

  const handleApplyBold = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !previewRef.current) return;
    const anchor = selection.anchorNode;
    const focus = selection.focusNode;
    if (!anchor || !focus) return;
    if (
      !previewRef.current.contains(anchor) ||
      !previewRef.current.contains(focus) ||
      selection.isCollapsed
    ) {
      return;
    }

    const range = selection.getRangeAt(0);
    const strongElement = document.createElement('strong');
    strongElement.appendChild(range.cloneContents());
    range.deleteContents();
    range.insertNode(strongElement);
    selection.removeAllRanges();

    setPreviewHtml(previewRef.current.innerHTML);
  }, []);

  const handlePreviewInput = useCallback(() => {
    if (previewRef.current) {
      setPreviewHtml(previewRef.current.innerHTML);
    }
  }, []);

  const openPrintWindow = useCallback(
    (title: string) => {
      if (!previewRef.current) return;
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                font-family: ${previewStyles.fontFamily};
                font-size: ${previewStyles.fontSize};
                line-height:${previewStyles.lineHeight};
                padding: 40px;
              }
            </style>
          </head>
          <body>${previewRef.current.innerHTML}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      return win;
    },
    [previewStyles],
  );

  const handlePrint = useCallback(() => {
    const win = openPrintWindow(previewDocTitle);
    if (win) {
      win.print();
    }
  }, [previewDocTitle, openPrintWindow]);

  const handleDownloadPdf = useCallback(() => {
    const win = openPrintWindow(`${previewDocTitle} - PDF`);
    if (win) {
      win.print();
    }
  }, [previewDocTitle, openPrintWindow]);

  const handleTemplateFormChange = (field: keyof typeof templateForm, value: string) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === 'string') {
        setTemplateForm((prev) => ({ ...prev, templateHtml: text }));
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSubmitTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    setTemplateFormError(null);
    if (!templateForm.name.trim()) {
      setTemplateFormError('Informe um nome para o modelo.');
      return;
    }
    if (!templateForm.templateHtml.trim()) {
      setTemplateFormError('Cole ou carregue o HTML do modelo.');
      return;
    }
    let parsedFields: DocumentField[] = [];
    try {
      const parsed = JSON.parse(templateForm.fieldsJson);
      if (!Array.isArray(parsed)) {
        throw new Error();
      }
      parsedFields = parsed;
    } catch {
      setTemplateFormError('O campo de campos deve conter um JSON válido (array).');
      return;
    }

    setSavingTemplate(true);
    try {
      const saved = await createTemplate({
        name: templateForm.name.trim(),
        type: templateForm.type || 'client',
        description: templateForm.description || '',
        fields: parsedFields,
        template: templateForm.templateHtml,
        active: true,
      });
      if (saved) {
        setShowTemplateForm(false);
        setTemplateForm({
          name: '',
          type: 'client',
          description: '',
          fieldsJson: JSON.stringify(parsedFields, null, 2),
          templateHtml: '',
        });
        setSelectedTemplateId(saved.id);
        setPreviewHtml(saved.template);
        setPreviewDocTitle(saved.name);
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const renderSimpleInput = (field: DocumentField, type = 'text') => (
    <div key={field.name} className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
      <input
        type={type}
        value={formValues[field.name] ?? ''}
        onChange={(event) => handleFieldChange(field.name, event.target.value)}
        className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
        required={!!field.required}
      />
    </div>
  );

  const renderTextArea = (field: DocumentField) => (
    <div key={field.name} className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</label>
      <textarea
        value={formValues[field.name] ?? ''}
        onChange={(event) => handleFieldChange(field.name, event.target.value)}
        rows={4}
        className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
    </div>
  );

  const renderChecklist = (field: DocumentField) => {
    const value: string[] = formValues[field.name] ?? [];
    if (!Array.isArray(field.options)) {
      return renderTextArea(field);
    }
    return (
      <div key={field.name} className="space-y-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-white/80">{field.label}</p>
        <div پنهنجي... (truncated due to length)*** End Patch
