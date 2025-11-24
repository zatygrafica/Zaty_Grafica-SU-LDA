import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Task } from '../../types';
import { useTaskStore } from '../../store/useTaskStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Textarea from '../Common/Textarea';
import { format } from 'date-fns';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  relatedTo?: { type: 'client' | 'order'; id: string; name: string };
}

interface TaskFormData {
  title: string;
  description?: string;
  dueDate: Date;
}

const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, task, relatedTo }) => {
  const { t } = useTranslation();
  const { addTask, updateTask } = useTaskStore();

  const validationSchema = yup.object().shape({
    title: yup.string().required('O título é obrigatório'),
    description: yup.string().optional(),
    dueDate: yup.date().required('A data de vencimento é obrigatória').min(new Date(), 'A data não pode ser no passado.'),
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<TaskFormData>({
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || '',
          dueDate: new Date(task.dueDate),
        });
      } else {
        reset({
          title: '',
          description: '',
          dueDate: new Date(),
        });
      }
    }
  }, [task, isOpen, reset]);

  const onSubmit = async (data: TaskFormData) => {
    const taskData = {
      ...data,
      isCompleted: task?.isCompleted || false,
      relatedTo: task?.relatedTo || relatedTo,
    };
    if (task) {
      await updateTask(task.id, taskData);
    } else {
      await addTask(taskData);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Editar Lembrete' : 'Novo Lembrete'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Título"
          {...register('title')}
          error={errors.title?.message}
          required
        />
        <Textarea
          label="Descrição (Opcional)"
          {...register('description')}
          error={errors.description?.message}
        />
        <Controller
          name="dueDate"
          control={control}
          render={({ field }) => (
            <Input
              label="Data de Vencimento"
              type="date"
              value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
              onChange={(e) => field.onChange(new Date(e.target.value))}
              error={errors.dueDate?.message}
              required
            />
          )}
        />
        {relatedTo && (
          <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-md text-sm">
            Relacionado a: <span className="font-semibold">{relatedTo.name}</span>
          </div>
        )}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary">
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskForm;
