import type { AppSettings } from '../types';

export const createDefaultSettings = (): AppSettings => ({
  theme: 'light',
  language: 'pt',
  deletionPassword: 'delete123!',
  vatRate: 17,
  currency: 'MZN',
  timezone: 'Africa/Maputo',
  popupFrequency: 15,
  emailNotificationsEnabled: false,
  company: {
    name: 'ZATY GRAFICA, SU, LDA',
    address: 'Bairro Namicopo (proximo. 3a Esquadra), Nampula, Mocambique',
    nuit: '401974687',
    phone: '834847306',
  },
  support: {
    phone: '',
    email: '',
    link: '',
  },
  auditLogs: [],
});
