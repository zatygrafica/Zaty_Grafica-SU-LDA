/**
 * Types and interfaces for Photo modules
 * Includes both PassportPhoto and InvitationGenerator
 */

// ============================================
// PASSPORT PHOTO TYPES (existing functionality)
// ============================================

export interface Photo {
  id: string;
  file: File;
  preview: string;
  edited?: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  };
  copyCount?: number; // 1 a 5 cópias
}

// ============================================
// INVITATION GENERATOR TYPES (new functionality)
// ============================================

export type InvitationType = 'wedding' | 'birthday' | 'event' | 'corporate' | 'baby_shower' | 'graduation';

export type WeddingType = 'christian' | 'nikah';

export type PaperFormat = 'A5' | 'A6' | 'A7';

export type Orientation = 'portrait' | 'landscape';

export interface PaperDimensions {
  width: number; // mm
  height: number; // mm
}

export const PAPER_DIMENSIONS: Record<PaperFormat, PaperDimensions> = {
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  A7: { width: 74, height: 105 },
};

export const A4_DIMENSIONS: PaperDimensions = {
  width: 210,
  height: 297,
};

export interface InvitationData {
  type: InvitationType;
  format: PaperFormat;
  orientation: Orientation;

  // Informações básicas do convite
  title: string;
  subtitle?: string;
  mainText: string;
  date?: string;
  time?: string;
  location?: string;
  additionalInfo?: string;

  // NEW: Wedding-specific fields
  weddingType?: WeddingType;
  groomName?: string;
  brideName?: string;
  showBismillah?: boolean; // Para Nikah
  guestName?: string;
  includeGuestName?: boolean;

  // Configurações visuais
  theme: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    accentColor: string;
  };

  // Template selecionado
  templateId: string;
}

export interface InvitationTemplate {
  id: string;
  name: string;
  type: InvitationType;
  description: string;
  thumbnail: string;
  defaultTheme: InvitationData['theme'];

  // Componente de renderização
  render: (data: InvitationData) => JSX.Element;
}

export interface A4Layout {
  invitationsPerPage: number; // 2 a 8
  rows: number;
  columns: number;
  spacing: {
    horizontal: number; // mm
    vertical: number; // mm
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface InvitationPrintConfig {
  data: InvitationData;
  layout: A4Layout;
  copies: number;
}

// ============================================
// UTILITY FUNCTIONS FOR ADAPTIVE TEXT
// ============================================

export const getDefaultInvitationText = (type: InvitationType, weddingType?: WeddingType, includeGuest?: boolean): string => {
  if (type === 'wedding') {
    if (weddingType === 'nikah') {
      return includeGuest
        ? `Com grande alegria, convidamos ${includeGuest ? 'você' : 'a todos'} para celebrar a união sagrada através do Nikah.

A cerimônia será realizada conforme as tradições islâmicas, e sua presença honrará este momento especial em nossas vidas.`
        : `Com grande alegria, convidamos a todos para celebrar a união sagrada através do Nikah.

A cerimônia será realizada conforme as tradições islâmicas, e sua presença honrará este momento especial em nossas vidas.`;
    }

    return includeGuest
      ? `Com imensa alegria, convidamos você para celebrar a união de nossos corações.

Será uma honra compartilhar este momento especial ao seu lado.`
      : `Com imensa alegria, convidamos a todos para celebrar a união de nossos corações.

Será uma honra compartilhar este momento especial com vocês.`;
  }

  if (type === 'birthday') {
    return includeGuest
      ? `Você está convidado para uma celebração especial!

Venha comemorar conosco este dia inesquecível.`
      : `Todos estão convidados para uma celebração especial!

Venham comemorar conosco este dia inesquecível.`;
  }

  if (type === 'event') {
    return includeGuest
      ? `É com grande satisfação que convidamos você para participar deste evento.

Sua presença será muito importante para nós.`
      : `É com grande satisfação que convidamos a todos para participar deste evento.

A presença de todos será muito importante para nós.`;
  }

  return 'Texto do convite...';
};
