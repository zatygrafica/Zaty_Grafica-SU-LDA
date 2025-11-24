import type { AppSettings } from '../types';

export const createDefaultSettings = (): AppSettings => ({
  deletionPassword: 'delete123!',
  vatRate: 17,
  currency: 'MZN',
  timezone: 'Africa/Maputo',
  popupFrequency: 15,
  emailNotificationsEnabled: false,
  company: {
    name: 'ZATY GRAFICA, SU, LTD',
    address: 'Bairro Namicopo (proximo. 3a Esquadra), Nampula, Mocambique',
    nuit: '401974687',
    phone: '834847306',
  },
  support: {
    phone: '',
    email: '',
    link: '',
  },
});
