import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTemplate, DocumentField } from '../../types';
import { useDocumentStore } from '../../store/useDocumentStore';
import { ArrowLeft, Save } from 'lucide-react';
import Button from '../Common/Button';
import Textarea from '../Common/Textarea';

interface TemplateEditorProps {
  template: DocumentTemplate;
  onBack: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onBack }) => {
  const { t } = useTranslation();
  const { updateTemplate } = useDocumentStore();
  const [htmlContent, setHtmlContent] = useState(template.template);
  const [fieldsJson, setFieldsJson] = useState(JSON.stringify(template.fields, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const parsedFields = JSON.parse(fieldsJson) as DocumentField[];
      setJsonError(null);
      await updateTemplate(template.id, {
        template: htmlContent,
        fields: parsedFields,
      });
      onBack();
    } catch (error) {
      setJsonError('JSON dos campos é inválido. Verifique a sintaxe.');
    }
  };

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>Voltar</Button>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Editar Template: {t(`documents.${template.id}`)}
        </h1>
        <Button onClick={handleSave} icon={Save}>Salvar Template</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Template HTML</h3>
          <Textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            rows={25}
            className="font-mono text-xs"
          />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Campos (JSON)</h3>
          <Textarea
            value={fieldsJson}
            onChange={(e) => setFieldsJson(e.target.value)}
            rows={25}
            className="font-mono text-xs"
            error={jsonError || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
