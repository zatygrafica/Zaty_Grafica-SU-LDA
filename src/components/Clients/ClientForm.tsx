import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Client } from '../../types';
import { useClientStore } from '../../store/useClientStore';
import { useStore } from '../../store/useStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import Textarea from '../Common/Textarea';
import ConfirmationModal from '../Common/ConfirmationModal';
import { formatPhoneNumber, formatDigitsOnly } from '../../utils/formatting';

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'transferredFrom' | 'transferredAt' | 'createdBy'>;

const ClientForm: React.FC<ClientFormProps> = ({ isOpen, onClose, client }) => {
  const { t } = useTranslation();
  const { clients, addClient, updateClient } = useClientStore();
  const { setPendingOrderForClient } = useStore();
  const [isDuplicateConfirmOpen, setIsDuplicateConfirmOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);

  const validationSchema = yup.object().shape({
    clientType: yup.string().oneOf(['individual', 'company']).required(t('clients.form.clientType_required')),
    name: yup.string().required(t('clients.form.name_required')),
    legalRepresentative: yup.string().optional().nullable(),
    phone: yup.string()
      .required(t('clients.form.phone_required'))
      .matches(/^[0-9]{9}$/, t('clients.form.phone_invalid')),
    email: yup.string().email(t('clients.form.email_invalid')).optional().nullable(),
    nuit: yup.string().when('clientType', {
      is: 'company',
      then: (schema) => schema.required(t('clients.form.nuit_required_company')),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    address: yup.string().optional().nullable(),
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<ClientFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      clientType: client?.clientType || 'individual',
      name: client?.name ?? '',
      legalRepresentative: client?.legalRepresentative ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
      nuit: client?.nuit ?? '',
      address: client?.address ?? '',
    },
  });

  const clientType = watch('clientType');

  React.useEffect(() => {
    if (isOpen) {
      if (client) {
        reset({
          clientType: client.clientType,
          name: client.name,
          legalRepresentative: client.legalRepresentative ?? '',
          phone: client.phone,
          email: client.email ?? '',
          nuit: client.nuit ?? '',
          address: client.address ?? '',
        });
      } else {
        reset({
          clientType: 'individual',
          name: '',
          legalRepresentative: '',
          phone: '',
          email: '',
          nuit: '',
          address: '',
        });
      }
    }
  }, [client, isOpen, reset]);

  const onSubmit = async (data: ClientFormData) => {
    const existingClient = clients.find(c =>
      (c.name.toLowerCase() === data.name.toLowerCase() || c.phone === data.phone) &&
      c.id !== client?.id
    );

    if (existingClient) {
      setDuplicateClient(existingClient);
      setIsDuplicateConfirmOpen(true);
    } else {
      if (client) {
        await updateClient(client.id, { ...data, updatedAt: new Date() });
      } else {
        await addClient(data);
      }
      onClose();
    }
  };

  const handleCreateOrderForDuplicate = () => {
    if (!duplicateClient) return;
    setPendingOrderForClient(duplicateClient.id);
    setIsDuplicateConfirmOpen(false);
    onClose();
  };

  const clientTypeOptions = [
    { value: 'individual', label: t('clients.individual') },
    { value: 'company', label: t('clients.company') },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={client ? t('clients.edit_client') : t('clients.new_client')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="clientType"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('clients.client_type')}
                options={clientTypeOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.clientType?.message}
                required
              />
            )}
          />

          {clientType === 'company' ? (
            <>
              <Input
                label={t('clients.company_name')}
                {...register('name')}
                error={errors.name?.message}
                required
              />
              <Input
                label={t('clients.legal_representative')}
                {...register('legalRepresentative')}
                error={errors.legalRepresentative?.message}
              />
              <Controller
                name="nuit"
                control={control}
                render={({ field }) => (
                  <Input
                    label={t('common.nuit')}
                    {...field}
                    onChange={(e) => field.onChange(formatDigitsOnly(e.target.value))}
                    error={errors.nuit?.message}
                    required
                  />
                )}
              />
            </>
          ) : (
            <>
              <Input
                label={t('common.name')}
                {...register('name')}
                error={errors.name?.message}
                required
              />
              <Controller
                name="nuit"
                control={control}
                render={({ field }) => (
                  <Input
                    label={t('common.nuit')}
                    {...field}
                    onChange={(e) => field.onChange(formatDigitsOnly(e.target.value))}
                    error={errors.nuit?.message}
                  />
                )}
              />
            </>
          )}

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                label={t('common.phone')}
                type="tel"
                {...field}
                onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                error={errors.phone?.message}
                required
              />
            )}
          />
          <Input
            label={t('common.email')}
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Textarea
            label={t('common.address')}
            {...register('address')}
            error={errors.address?.message}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmationModal
        isOpen={isDuplicateConfirmOpen}
        onClose={() => setIsDuplicateConfirmOpen(false)}
        onConfirm={handleCreateOrderForDuplicate}
        title={t('clients.form.duplicate_title')}
        message={t('clients.form.duplicate_message')}
        confirmText={t('clients.form.duplicate_action')}
      />
    </>
  );
};

export default ClientForm;
