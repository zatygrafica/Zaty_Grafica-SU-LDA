import { useStore } from '../store/useStore';
import { generateId } from '../utils/id';

const showPlaceholderNotification = (serviceName: string) => {
  useStore.getState().addNotification({
    id: generateId(),
    type: 'info',
    title: 'Funcionalidade Futura',
    message: `A integração com a API de ${serviceName} será implementada futuramente.`,
    read: false,
    createdAt: new Date(),
  });
};

export const sendEmail = async (recipient: string, subject: string, body: string): Promise<boolean> => {
  console.log(`--- SIMULANDO ENVIO DE EMAIL ---`);
  console.log(`Para: ${recipient}`);
  console.log(`Assunto: ${subject}`);
  console.log(`Corpo: ${body}`);
  console.log(`-----------------------------`);
  showPlaceholderNotification('Email');
  return true;
};

export const sendSms = async (recipient: string, message: string): Promise<boolean> => {
  console.log(`--- SIMULANDO ENVIO DE SMS ---`);
  console.log(`Para: ${recipient}`);
  console.log(`Mensagem: ${message}`);
  console.log(`----------------------------`);
  showPlaceholderNotification('SMS');
  return true;
};

export const sendWhatsApp = async (recipient: string, message: string): Promise<boolean> => {
  console.log(`--- SIMULANDO ENVIO DE WHATSAPP ---`);
  console.log(`Para: ${recipient}`);
  console.log(`Mensagem: ${message}`);
  console.log(`---------------------------------`);
  showPlaceholderNotification('WhatsApp');
  return true;
};
