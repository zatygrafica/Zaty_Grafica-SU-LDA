import React from 'react';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../../types';
import { useStore } from '../../store/useStore';
import { useClientStore } from '../../store/useClientStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer } from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ isOpen, onClose, invoice }) => {
  const { t } = useTranslation();
  const { settings } = useStore();
  const { clients } = useClientStore();
  const { company } = settings;

  const handlePrint = () => {
    window.print();
  };

  const { order } = invoice;
  const client = clients.find(c => c.id === order.clientId);
  const printDateTime = new Date().toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('invoices.preview')} size="2xl" showCloseButton={false} printable>
      <div className="printable-area">
        <div id="invoice-content" className="bg-white text-black text-xs p-4 flex flex-col printable-content w-full aspect-[210/148] print:block print:h-auto print:aspect-auto">
          {/* Header */}
          <header className="flex justify-between items-start pb-2">
            <div>
              <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain mb-2" />
              <div>
                <h1 className="font-bold text-lg">{company.name}</h1>
                <p>{company.address}</p>
                <p>NUIT: {company.nuit} | Tel: {company.phone}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <h2 className="font-bold text-2xl uppercase">Fatura</h2>
              <p><span className="font-semibold">{t('invoices.invoice_number')}:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-semibold">{t('invoices.invoice_date')}:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p><span className="font-semibold">{t('invoices.order_number')}:</span> {order.orderNumber}</p>
            </div>
          </header>

          {/* Client Info */}
          <section className="mt-1 mb-2 py-2 border-y border-black">
            <h3 className="font-semibold mb-1">Cliente:</h3>
            <p className="font-bold">{order.clientName}</p>
            <p>{client?.address || 'Endereço não informado'}</p>
            <p>Tel: {client?.phone}</p>
          </section>

          {/* Items Table */}
          <section className="flex-grow">
            <table className="w-full text-left border-collapse border-[0.2mm] border-black">
              <thead className="bg-gray-300 text-black">
                <tr>
                  <th className="p-1 font-bold border-[0.2mm] border-black">Serviço / Descrição</th>
                  <th className="p-1 font-bold text-center border-[0.2mm] border-black">Comp.</th>
                  <th className="p-1 font-bold text-center border-[0.2mm] border-black">Larg.</th>
                  <th className="p-1 font-bold text-center border-[0.2mm] border-black">Qtd.</th>
                  <th className="p-1 font-bold text-right border-[0.2mm] border-black">Preço Unit.</th>
                  <th className="p-1 font-bold text-right border-[0.2mm] border-black">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id} className="border-b-[0.2mm] border-black">
                    <td className="p-1 align-top border-x-[0.2mm] border-black">
                      <p className="font-semibold">{item.serviceName}{item.variationName ? ` – ${item.variationName}` : ''}</p>
                    </td>
                    <td className="p-1 text-center align-top border-x-[0.2mm] border-black">{(item.length || 0) > 0 ? `${(item.length || 0).toFixed(2)}m` : '-'}</td>
                    <td className="p-1 text-center align-top border-x-[0.2mm] border-black">{(item.width || 0) > 0 ? `${(item.width || 0).toFixed(2)}m` : '-'}</td>
                    <td className="p-1 text-center align-top border-x-[0.2mm] border-black">{item.quantity}</td>
                    <td className="p-1 text-right align-top border-x-[0.2mm] border-black">{item.unitPrice.toFixed(2)} {settings.currency}</td>
                    <td className="p-1 text-right font-semibold align-top border-x-[0.2mm] border-black">{item.total.toFixed(2)} {settings.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Footer */}
          <footer className="mt-auto pt-2 flex justify-between items-end">
            <div className="text-[8px] text-gray-600">
              <p>{printDateTime}</p>
              <p className="italic mt-1">{t('invoices.thank_you_message')}</p>
            </div>
            <div className="w-1/2 md:w-2/5 space-y-1">
              <div className="flex justify-between">
                <span>{t('common.subtotal')}</span>
                <span className="font-semibold">{order.subtotal.toFixed(2)} {settings.currency}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>{t('orders.form.discount')} ({order.discountType === 'percentage' ? `${order.discountValue}%` : 'Fixo'})</span>
                  <span className="font-semibold text-red-600">- {order.discountAmount.toFixed(2)} {settings.currency}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t('invoices.vat')} ({order.vatEnabled ? invoice.vatRate : 0}%)</span>
                <span className="font-semibold">{order.vatAmount.toFixed(2)} {settings.currency}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t-2 border-black pt-1">
                <span>{t('common.total')}</span>
                <span>{order.total.toFixed(2)} {settings.currency}</span>
              </div>
              <div className="text-right text-[8px] font-light leading-tight mt-2">
                <p className="font-bold">Tipografia & Serigrafia</p>
                <p className="italic">Sua imagem, nossa missão</p>
                <p>Endereço: Namicopo - Nampula, Moçambique</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 no-print">
        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
        <Button onClick={handlePrint} icon={Printer}>{t('invoices.print_invoice')}</Button>
      </div>
    </Modal>
  );
};

export default InvoicePreviewModal;
