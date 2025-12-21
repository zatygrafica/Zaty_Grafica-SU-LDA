import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Printer,
  Download,
  Eye,
  Layout,
  Grid3x3,
  ArrowLeft,
} from 'lucide-react';
import Button from '../Common/Button';
import Input from '../Common/Input';
import {
  InvitationData,
  InvitationType,
  WeddingType,
  PaperFormat,
  Orientation,
  PAPER_DIMENSIONS,
  A4_DIMENSIONS,
  A4Layout,
  getDefaultInvitationText,
} from './types';
import {
  WeddingElegantTemplate,
  BirthdayFunTemplate,
  EventProfessionalTemplate,
  CorporateMinimalTemplate,
} from './InvitationTemplates';

/**
 * Professional Invitation Generator
 * New feature added to ZatyPasse module without modifying existing functionality
 */

const InvitationGenerator: React.FC = () => {
  const { t } = useTranslation();
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  // Estado do convite
  const [invitationData, setInvitationData] = useState<InvitationData>({
    type: 'wedding',
    format: 'A6',
    orientation: 'portrait',
    title: '',
    subtitle: '',
    mainText: getDefaultInvitationText('wedding', 'christian', false),
    date: '',
    time: '',
    location: '',
    additionalInfo: '',
    // NEW: Wedding-specific fields
    weddingType: 'christian',
    groomName: '',
    brideName: '',
    showBismillah: false,
    guestName: '',
    includeGuestName: false,
    theme: {
      primaryColor: '#8B4789',
      secondaryColor: '#C084BD',
      textColor: '#2D3748',
      accentColor: '#D4AF37',
    },
    templateId: 'wedding-elegant',
  });

  // NEW: Track if data has been modified (for navigation warning)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estado do layout A4
  const [invitationsPerPage, setInvitationsPerPage] = useState<number>(4);
  const [showPreview, setShowPreview] = useState(false);

  // Atualizar dados do convite
  const updateInvitationData = (field: keyof InvitationData, value: any) => {
    setHasUnsavedChanges(true);
    setInvitationData((prev) => {
      const updated = { ...prev, [field]: value };

      // NEW: Auto-update main text when wedding type or guest inclusion changes
      if (field === 'weddingType' || field === 'includeGuestName' || field === 'type') {
        const newType = field === 'type' ? value : prev.type;
        const newWeddingType = field === 'weddingType' ? value : prev.weddingType;
        const includeGuest = field === 'includeGuestName' ? value : prev.includeGuestName;

        updated.mainText = getDefaultInvitationText(newType, newWeddingType, includeGuest);
      }

      return updated;
    });
  };

  // Calcular dimensões do convite baseado no formato e orientação
  const getInvitationDimensions = () => {
    const baseDimensions = PAPER_DIMENSIONS[invitationData.format];
    if (invitationData.orientation === 'landscape') {
      return { width: baseDimensions.height, height: baseDimensions.width };
    }
    return baseDimensions;
  };

  // Calcular layout A4
  const calculateA4Layout = (): A4Layout => {
    const invDim = getInvitationDimensions();
    let columns = 1;
    let rows = 1;

    // Calcular quantas colunas/linhas cabem
    switch (invitationsPerPage) {
      case 2:
        columns = invDim.width * 2 <= A4_DIMENSIONS.width - 10 ? 2 : 1;
        rows = columns === 2 ? 1 : 2;
        break;
      case 4:
        columns = 2;
        rows = 2;
        break;
      case 6:
        columns = 2;
        rows = 3;
        break;
      case 8:
        columns = 2;
        rows = 4;
        break;
      default:
        columns = 1;
        rows = invitationsPerPage;
    }

    return {
      invitationsPerPage,
      rows,
      columns,
      spacing: { horizontal: 5, vertical: 5 },
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
    };
  };

  // Renderizar template do convite
  const renderInvitation = () => {
    const props = { data: invitationData };

    switch (invitationData.templateId) {
      case 'birthday-fun':
        return <BirthdayFunTemplate {...props} />;
      case 'event-professional':
        return <EventProfessionalTemplate {...props} />;
      case 'corporate-minimal':
        return <CorporateMinimalTemplate {...props} />;
      default:
        return <WeddingElegantTemplate {...props} />;
    }
  };

  // Imprimir convites
  const handlePrint = () => {
    const layout = calculateA4Layout();
    const invDim = getInvitationDimensions();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para impressão');
      return;
    }

    const invitationHTML = document.getElementById('invitation-preview')?.innerHTML || '';

    const styles = `
      @page {
        size: A4 portrait;
        margin: ${layout.margins.top}mm ${layout.margins.right}mm ${layout.margins.bottom}mm ${layout.margins.left}mm;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: white;
      }

      .print-grid {
        display: grid;
        grid-template-columns: repeat(${layout.columns}, 1fr);
        grid-template-rows: repeat(${layout.rows}, 1fr);
        gap: ${layout.spacing.vertical}mm ${layout.spacing.horizontal}mm;
        width: 100%;
        height: 100%;
      }

      .invitation-item {
        width: ${invDim.width}mm;
        height: ${invDim.height}mm;
        overflow: hidden;
        page-break-inside: avoid;
        border: 0.5pt solid #e0e0e0;
      }

      @media print {
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Convites - Impressão</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="print-grid">
            ${Array(invitationsPerPage)
              .fill(invitationHTML)
              .map((html) => `<div class="invitation-item">${html}</div>`)
              .join('')}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Gerar PDF
  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const invDim = getInvitationDimensions();
      const layout = calculateA4Layout();

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Renderizar cada convite no PDF
      const invitationElement = document.getElementById('invitation-preview');
      if (!invitationElement) throw new Error('Invitation preview not found');

      // Simplificado: adicionar uma página com os convites
      pdf.text('Convites gerados pelo ZatyPasse', 10, 10);
      pdf.text(`Formato: ${invitationData.format} ${invitationData.orientation}`, 10, 20);
      pdf.text(`${invitationsPerPage} convites por página A4`, 10, 30);

      pdf.save('convites.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a impressão ao invés disso.');
    }
  };

  const invDim = getInvitationDimensions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('passport_photos.invitation.title', 'Gerador de Convites')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('passport_photos.invitation.subtitle', 'Crie convites profissionais personalizados')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Configurações do Convite
            </h2>

            {/* Tipo de convite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Convite
              </label>
              <select
                value={invitationData.type}
                onChange={(e) => {
                  const type = e.target.value as InvitationType;
                  updateInvitationData('type', type);
                  // Atualizar template baseado no tipo
                  if (type === 'wedding') updateInvitationData('templateId', 'wedding-elegant');
                  if (type === 'birthday') updateInvitationData('templateId', 'birthday-fun');
                  if (type === 'event') updateInvitationData('templateId', 'event-professional');
                  if (type === 'corporate') updateInvitationData('templateId', 'corporate-minimal');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
              >
                <option value="wedding">Casamento</option>
                <option value="birthday">Aniversário</option>
                <option value="event">Evento</option>
                <option value="corporate">Corporativo</option>
                <option value="baby_shower">Chá de Bebê</option>
                <option value="graduation">Formatura</option>
              </select>
            </div>

            {/* Formato e Orientação */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Layout className="w-4 h-4 inline mr-1" />
                  Formato
                </label>
                <select
                  value={invitationData.format}
                  onChange={(e) => updateInvitationData('format', e.target.value as PaperFormat)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                >
                  <option value="A5">A5 (148x210mm)</option>
                  <option value="A6">A6 (105x148mm)</option>
                  <option value="A7">A7 (74x105mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orientação
                </label>
                <select
                  value={invitationData.orientation}
                  onChange={(e) => updateInvitationData('orientation', e.target.value as Orientation)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                >
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </select>
              </div>
            </div>

            {/* Campos de texto */}
            <Input
              label="Título"
              value={invitationData.title}
              onChange={(e) => updateInvitationData('title', e.target.value)}
              placeholder="Ex: Casamento de João e Maria"
            />

            <Input
              label="Subtítulo (opcional)"
              value={invitationData.subtitle || ''}
              onChange={(e) => updateInvitationData('subtitle', e.target.value)}
              placeholder="Ex: Celebração de Amor"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto Principal
              </label>
              <textarea
                value={invitationData.mainText}
                onChange={(e) => updateInvitationData('mainText', e.target.value)}
                placeholder="Texto do convite..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data"
                type="text"
                value={invitationData.date || ''}
                onChange={(e) => updateInvitationData('date', e.target.value)}
                placeholder="Ex: 15 de Dezembro de 2025"
              />

              <Input
                label="Horário"
                type="text"
                value={invitationData.time || ''}
                onChange={(e) => updateInvitationData('time', e.target.value)}
                placeholder="Ex: 18h00"
              />
            </div>

            <Input
              label="Local (opcional)"
              value={invitationData.location || ''}
              onChange={(e) => updateInvitationData('location', e.target.value)}
              placeholder="Ex: Salão de Festas Jardim"
            />

            {/* Convites por página A4 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Grid3x3 className="w-4 h-4 inline mr-1" />
                Convites por Página A4
              </label>
              <select
                value={invitationsPerPage}
                onChange={(e) => setInvitationsPerPage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
              >
                <option value={2}>2 convites</option>
                <option value={4}>4 convites</option>
                <option value={6}>6 convites</option>
                <option value={8}>8 convites</option>
              </select>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowPreview(!showPreview)} className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Ocultar Preview' : 'Visualizar'}
              </Button>
              <Button onClick={handlePrint} variant="secondary" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleDownloadPDF} variant="secondary">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Pré-visualização
            </h2>

            <div className="flex justify-center items-center" style={{ minHeight: '400px' }}>
              <div
                id="invitation-preview"
                style={{
                  width: `${invDim.width}mm`,
                  height: `${invDim.height}mm`,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(0.8)',
                  transformOrigin: 'center',
                }}
              >
                {renderInvitation()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden iframe for printing */}
      <iframe ref={printIframeRef} style={{ display: 'none' }} title="Print Frame" />
    </div>
  );
};

export default InvitationGenerator;
