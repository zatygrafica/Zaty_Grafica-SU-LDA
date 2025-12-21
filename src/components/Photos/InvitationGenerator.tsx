import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Printer,
  Download,
  Eye,
  Layout,
  Grid3x3,
  ArrowLeft,
  Heart,
  User,
  Users,
  Edit3,
  PenTool,
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
  WeddingNikahTemplate,
  WeddingNikahGoldTemplate,
  BirthdayFunTemplate,
  EventProfessionalTemplate,
  CorporateMinimalTemplate,
} from './InvitationTemplates';

/**
 * Professional Invitation Generator
 * New feature added to ZatyPasse module without modifying existing functionality
 */

interface InvitationGeneratorProps {
  onBack?: () => void;
}

// Guest name mode types
type GuestNameMode = 'none' | 'auto' | 'manual';

const InvitationGenerator: React.FC<InvitationGeneratorProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const printIframeRef = useRef<HTMLIFrameElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Estado do convite
  const [invitationData, setInvitationData] = useState<InvitationData>({
    type: 'wedding',
    format: 'A6',
    orientation: 'portrait',
    title: 'Casamento',
    subtitle: 'Celebração de Amor',
    mainText: getDefaultInvitationText('wedding', 'christian', false),
    date: '',
    time: '',
    location: '',
    additionalInfo: '',
    // Wedding-specific fields
    weddingType: 'christian',
    groomName: '',
    brideName: '',
    showBismillah: true,
    guestName: '',
    includeGuestName: false,
    // NEW: Manual guest name field
    showManualGuestField: false,
    theme: {
      primaryColor: '#8B4789',
      secondaryColor: '#C084BD',
      textColor: '#2D3748',
      accentColor: '#D4AF37',
    },
    templateId: 'wedding-elegant',
  });

  // Guest name mode state
  const [guestNameMode, setGuestNameMode] = useState<GuestNameMode>('none');

  // Track if data has been modified (for navigation warning)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Estado do layout A4
  const [invitationsPerPage, setInvitationsPerPage] = useState<number>(4);

  // Handler para voltar com confirmação
  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Você tem alterações não salvas. Deseja realmente sair?'
      );
      if (!confirmed) return;
    }
    onBack?.();
  };

  // Atualizar dados do convite
  const updateInvitationData = (field: keyof InvitationData, value: any) => {
    setHasUnsavedChanges(true);
    setInvitationData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-update main text when wedding type or guest inclusion changes
      if (field === 'weddingType' || field === 'includeGuestName' || field === 'type') {
        const newType = field === 'type' ? value : prev.type;
        const newWeddingType = field === 'weddingType' ? value : prev.weddingType;
        const includeGuest = field === 'includeGuestName' ? value : prev.includeGuestName;

        updated.mainText = getDefaultInvitationText(newType, newWeddingType, includeGuest);
      }

      // Update template based on wedding type
      if (field === 'weddingType') {
        updated.templateId = value === 'nikah' ? 'wedding-nikah' : 'wedding-elegant';
        // Update colors for Nikah
        if (value === 'nikah') {
          updated.theme = {
            primaryColor: '#1B5E20',
            secondaryColor: '#4CAF50',
            textColor: '#1B5E20',
            accentColor: '#D4AF37',
          };
        } else {
          updated.theme = {
            primaryColor: '#8B4789',
            secondaryColor: '#C084BD',
            textColor: '#2D3748',
            accentColor: '#D4AF37',
          };
        }
      }

      return updated;
    });
  };

  // Handle guest name mode change
  const handleGuestNameModeChange = (mode: GuestNameMode) => {
    setGuestNameMode(mode);
    setHasUnsavedChanges(true);

    if (mode === 'none') {
      updateInvitationData('includeGuestName', false);
      updateInvitationData('showManualGuestField', false);
      updateInvitationData('guestName', '');
    } else if (mode === 'auto') {
      updateInvitationData('includeGuestName', true);
      updateInvitationData('showManualGuestField', false);
    } else if (mode === 'manual') {
      updateInvitationData('includeGuestName', true);
      updateInvitationData('showManualGuestField', true);
      updateInvitationData('guestName', '');
    }
  };

  // Calcular dimensões do convite baseado no formato e orientação
  const getInvitationDimensions = () => {
    const baseDimensions = PAPER_DIMENSIONS[invitationData.format];
    if (invitationData.orientation === 'landscape') {
      return { width: baseDimensions.height, height: baseDimensions.width };
    }
    return baseDimensions;
  };

  // Obter quantidade máxima de convites por formato
  const getMaxInvitationsForFormat = (format: PaperFormat): number => {
    switch (format) {
      case 'A5': return 2;  // A5 = máximo 2 convites por A4
      case 'A6': return 4;  // A6 = máximo 4 convites por A4
      case 'A7': return 8;  // A7 = máximo 8 convites por A4
      default: return 1;
    }
  };

  // Obter opções de quantidade disponíveis para o formato atual
  const getAvailableQuantityOptions = (): number[] => {
    const max = getMaxInvitationsForFormat(invitationData.format);
    switch (max) {
      case 2: return [2];
      case 4: return [2, 4];
      case 8: return [2, 4, 6, 8];
      default: return [1];
    }
  };

  // Calcular layout A4 fixo baseado no formato
  const calculateA4Layout = (): A4Layout => {
    const invDim = getInvitationDimensions();
    const format = invitationData.format;
    const margin = 10; // mm
    const gap = 5; // mm

    let columns = 1;
    let rows = 1;
    let actualCount = invitationsPerPage;

    // Layout fixo por formato para garantir distribuição uniforme
    if (format === 'A5') {
      // A5: 2 convites lado a lado ou empilhados
      if (invitationData.orientation === 'portrait') {
        columns = 1;
        rows = 2;
      } else {
        columns = 2;
        rows = 1;
      }
      actualCount = 2;
    } else if (format === 'A6') {
      // A6: máximo 4 convites (2x2)
      columns = 2;
      rows = Math.min(Math.ceil(invitationsPerPage / 2), 2);
      actualCount = Math.min(invitationsPerPage, 4);
    } else if (format === 'A7') {
      // A7: máximo 8 convites (2x4)
      columns = 2;
      rows = Math.min(Math.ceil(invitationsPerPage / 2), 4);
      actualCount = Math.min(invitationsPerPage, 8);
    }

    return {
      invitationsPerPage: actualCount,
      rows,
      columns,
      spacing: { horizontal: gap, vertical: gap },
      margins: { top: margin, right: margin, bottom: margin, left: margin },
    };
  };

  // Calcular escala para o preview responsivo
  const calculatePreviewScale = useMemo(() => {
    const invDim = getInvitationDimensions();
    const layout = calculateA4Layout();

    // Calcular tamanho total da grade em mm
    const gridWidth = (layout.columns * invDim.width) + ((layout.columns - 1) * layout.spacing.horizontal);
    const gridHeight = (layout.rows * invDim.height) + ((layout.rows - 1) * layout.spacing.vertical);

    // Página A4 completa
    const a4Width = A4_DIMENSIONS.width;
    const a4Height = A4_DIMENSIONS.height;

    // Escala para caber no container de preview (máx 600px largura)
    const maxPreviewWidth = 500;
    const scale = maxPreviewWidth / a4Width;

    return {
      scale,
      a4Width,
      a4Height,
      gridWidth,
      gridHeight,
      invWidth: invDim.width,
      invHeight: invDim.height,
      layout,
    };
  }, [invitationData.format, invitationData.orientation, invitationsPerPage]);

  // Renderizar template do convite com escala responsiva
  const renderInvitation = (scale: number = 1) => {
    const props = {
      data: {
        ...invitationData,
        // For manual mode, show placeholder line
        guestName: guestNameMode === 'manual' ? '' : invitationData.guestName,
        showManualGuestField: guestNameMode === 'manual',
      }
    };

    switch (invitationData.templateId) {
      case 'wedding-nikah':
        return <WeddingNikahTemplate {...props} />;
      case 'wedding-nikah-gold':
        return <WeddingNikahGoldTemplate {...props} />;
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
  const handlePrint = async () => {
    const layout = calculateA4Layout();
    const invDim = getInvitationDimensions();

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para impressão');
      return;
    }

    const singleInvitation = document.getElementById('single-invitation-preview')?.innerHTML || '';

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Amiri:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
      
      @page {
        size: A4 portrait;
        margin: 0;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html, body {
        width: 210mm;
        height: 297mm;
      }

      body {
        font-family: system-ui, -apple-system, sans-serif;
        background: white;
        padding: ${layout.margins.top}mm;
      }

      .print-container {
        width: calc(210mm - ${layout.margins.left + layout.margins.right}mm);
        height: calc(297mm - ${layout.margins.top + layout.margins.bottom}mm);
        display: grid;
        grid-template-columns: repeat(${layout.columns}, ${invDim.width}mm);
        grid-template-rows: repeat(${layout.rows}, ${invDim.height}mm);
        gap: ${layout.spacing.vertical}mm ${layout.spacing.horizontal}mm;
        justify-content: center;
        align-content: start;
      }

      .invitation-item {
        width: ${invDim.width}mm;
        height: ${invDim.height}mm;
        overflow: hidden;
        page-break-inside: avoid;
        border: 0.25pt solid #e0e0e0;
      }

      .invitation-item > * {
        width: 100%;
        height: 100%;
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
          <div class="print-container">
            ${Array(invitationsPerPage)
        .fill(singleInvitation)
        .map((html) => `<div class="invitation-item">${html}</div>`)
        .join('')}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // Gerar PDF usando html2canvas
  const handleDownloadPDF = async () => {
    try {
      const previewElement = document.getElementById('a4-preview-container');
      if (!previewElement) {
        alert('Preview não encontrado');
        return;
      }

      // Import libraries dynamically
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasModule.default;

      // Render the A4 preview to canvas at high resolution
      const canvas = await html2canvas(previewElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Create PDF A4
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');

      // Add image to fill entire A4 page
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

      pdf.save('convites-zatypasse.pdf');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente usar a impressão.');
    }
  };

  const invDim = getInvitationDimensions();
  const previewData = calculatePreviewScale;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-neutral-900 dark:to-neutral-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar ao ZatyPasse</span>
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('passport_photos.invitation.title', 'Gerador de Convites')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('passport_photos.invitation.subtitle', 'Crie convites profissionais personalizados')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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

            {/* WEDDING SPECIFIC SECTION */}
            {invitationData.type === 'wedding' && (
              <div className="space-y-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-neutral-700 dark:to-neutral-700 rounded-lg border border-pink-200 dark:border-neutral-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Detalhes do Casamento
                </h3>

                {/* Tipo de Casamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Cerimónia
                  </label>
                  <select
                    value={invitationData.weddingType}
                    onChange={(e) => updateInvitationData('weddingType', e.target.value as WeddingType)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                  >
                    <option value="christian">Casamento Cristão</option>
                    <option value="nikah">Casamento Muçulmano (Nikah)</option>
                  </select>
                </div>

                {/* Bismillah Toggle - Only for Nikah */}
                {invitationData.weddingType === 'nikah' && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Exibir Bismillah em Árabe
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invitationData.showBismillah}
                        onChange={(e) => updateInvitationData('showBismillah', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                )}

                {/* Template selector for Nikah */}
                {invitationData.weddingType === 'nikah' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Modelo do Convite
                    </label>
                    <select
                      value={invitationData.templateId}
                      onChange={(e) => updateInvitationData('templateId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                    >
                      <option value="wedding-nikah">Nikah Clássico (Verde)</option>
                      <option value="wedding-nikah-gold">Nikah Elegante (Dourado)</option>
                    </select>
                  </div>
                )}

                {/* Nomes dos Noivos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Nome do Noivo
                    </label>
                    <input
                      type="text"
                      value={invitationData.groomName || ''}
                      onChange={(e) => updateInvitationData('groomName', e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Nome da Noiva
                    </label>
                    <input
                      type="text"
                      value={invitationData.brideName || ''}
                      onChange={(e) => updateInvitationData('brideName', e.target.value)}
                      placeholder="Ex: Maria Santos"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GUEST NAME SECTION - Separate with clear options */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-700 dark:to-neutral-700 rounded-lg border border-blue-200 dark:border-neutral-600">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Nome do Convidado
              </h3>

              {/* Radio options for guest name mode */}
              <div className="space-y-3">
                {/* Option 1: None */}
                <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/50 dark:hover:bg-neutral-600/50 transition-colors">
                  <input
                    type="radio"
                    name="guestNameMode"
                    checked={guestNameMode === 'none'}
                    onChange={() => handleGuestNameModeChange('none')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sem nome do convidado
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Convite genérico para todos
                    </p>
                  </div>
                </label>

                {/* Option 2: Auto fill */}
                <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/50 dark:hover:bg-neutral-600/50 transition-colors">
                  <input
                    type="radio"
                    name="guestNameMode"
                    checked={guestNameMode === 'auto'}
                    onChange={() => handleGuestNameModeChange('auto')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Preenchimento automático
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Digite o nome que aparecerá impresso
                    </p>
                    {guestNameMode === 'auto' && (
                      <input
                        type="text"
                        value={invitationData.guestName || ''}
                        onChange={(e) => updateInvitationData('guestName', e.target.value)}
                        placeholder="Nome do convidado..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white text-sm"
                      />
                    )}
                  </div>
                </label>

                {/* Option 3: Manual field */}
                <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/50 dark:hover:bg-neutral-600/50 transition-colors">
                  <input
                    type="radio"
                    name="guestNameMode"
                    checked={guestNameMode === 'manual'}
                    onChange={() => handleGuestNameModeChange('manual')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Preenchimento manual (caneta)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Espaço em branco para preencher à mão
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Formato e Orientação */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Layout className="w-4 h-4 inline mr-1" />
                  Formato do Convite
                </label>
                <select
                  value={invitationData.format}
                  onChange={(e) => {
                    const newFormat = e.target.value as PaperFormat;
                    updateInvitationData('format', newFormat);
                    // Ajustar quantidade automaticamente ao máximo do formato
                    const maxForFormat = getMaxInvitationsForFormat(newFormat);
                    if (invitationsPerPage > maxForFormat) {
                      setInvitationsPerPage(maxForFormat);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white"
                >
                  <option value="A5">A5 (148×210mm) - máx 2/página</option>
                  <option value="A6">A6 (105×148mm) - máx 4/página</option>
                  <option value="A7">A7 (74×105mm) - máx 8/página</option>
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

            {/* Convites por página A4 - Opções dinâmicas baseadas no formato */}
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
                {getAvailableQuantityOptions().map((qty) => (
                  <option key={qty} value={qty}>{qty} convites</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Formato {invitationData.format}: máximo {getMaxInvitationsForFormat(invitationData.format)} convites
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handlePrint} variant="primary" className="flex-1">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleDownloadPDF} variant="secondary" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Preview A4 Page */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Pré-visualização A4
              <span className="text-sm font-normal text-gray-500">
                ({invitationsPerPage} convites - {previewData.layout.columns}x{previewData.layout.rows})
              </span>
            </h2>

            {/* A4 Preview Container */}
            <div
              className="flex justify-center items-center bg-gray-100 dark:bg-neutral-700 rounded-lg p-6"
              style={{ minHeight: '500px' }}
            >
              {/* A4 Page representation */}
              <div
                id="a4-preview-container"
                className="bg-white shadow-2xl border border-gray-300 relative"
                style={{
                  width: `${previewData.a4Width * previewData.scale}px`,
                  height: `${previewData.a4Height * previewData.scale}px`,
                }}
              >
                {/* Page margins visualization */}
                <div
                  style={{
                    position: 'absolute',
                    top: `${previewData.layout.margins.top * previewData.scale}px`,
                    left: `${previewData.layout.margins.left * previewData.scale}px`,
                    right: `${previewData.layout.margins.right * previewData.scale}px`,
                    bottom: `${previewData.layout.margins.bottom * previewData.scale}px`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${previewData.layout.columns}, ${previewData.invWidth * previewData.scale}px)`,
                    gridTemplateRows: `repeat(${previewData.layout.rows}, ${previewData.invHeight * previewData.scale}px)`,
                    gap: `${previewData.layout.spacing.vertical * previewData.scale}px`,
                    justifyContent: 'center',
                    alignContent: 'start',
                  }}
                >
                  {Array(invitationsPerPage).fill(0).map((_, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-400 shadow-sm overflow-hidden"
                      style={{
                        width: `${previewData.invWidth * previewData.scale}px`,
                        height: `${previewData.invHeight * previewData.scale}px`,
                      }}
                    >
                      {/* Scaled invitation content */}
                      <div
                        style={{
                          width: `${previewData.invWidth * 3}px`,
                          height: `${previewData.invHeight * 3}px`,
                          transform: `scale(${previewData.scale / 3})`,
                          transformOrigin: 'top left',
                        }}
                      >
                        {renderInvitation()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* A4 label */}
                <div
                  className="absolute text-gray-400 font-medium"
                  style={{
                    bottom: '4px',
                    right: '8px',
                    fontSize: '10px',
                  }}
                >
                  A4 (210×297mm)
                </div>
              </div>
            </div>

            {/* Hidden single invitation for printing */}
            <div id="single-invitation-preview" style={{ position: 'absolute', left: '-9999px', width: '105mm', height: '148mm' }}>
              {renderInvitation()}
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
