import React, { useState, useMemo } from 'react';
import { useTaskStore } from '../../store/useTaskStore';
import { Task } from '../../types';
import { Plus, Edit, Trash2, ClipboardCheck, Check, Clock, Calendar } from 'lucide-react';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { pt } from 'date-fns/locale';
import { clsx } from 'clsx';
import Button from '../Common/Button';
import TaskForm from './TaskForm';
import ConfirmationModal from '../Common/ConfirmationModal';
import ModuleDataState from '../Common/ModuleDataState';
import { useLoadTasksOnMount } from '../../hooks/useModuleLoaders';
import { StackedListSkeleton } from '../Common/SkeletonLoaders';

type TaskGroups = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  completed: Task[];
};

const TasksModule: React.FC = () => {
  const { tasks, toggleTaskCompletion, deleteTask } = useTaskStore();
  const {
    loading: tasksLoading,
    error: tasksError,
    hasLoaded: tasksLoaded,
    reload: reloadTasks,
  } = useLoadTasksOnMount();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const handleOpenForm = (task: Task | null = null) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask(taskToDelete);
    }
    setIsConfirmOpen(false);
    setTaskToDelete(null);
  };

  const groupedTasks = useMemo<TaskGroups>(() => {
    const filtered = tasks.filter(task => {
      if (filter === 'pending') return !task.isCompleted;
      if (filter === 'completed') return task.isCompleted;
      return true;
    });

    const groups: TaskGroups = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: [],
    };

    if (filter === 'completed') {
      groups.completed = filtered
        .filter(task => task.isCompleted)
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      return groups;
    }

    groups.overdue = filtered.filter(t => !t.isCompleted && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
    groups.today = filtered.filter(t => isToday(new Date(t.dueDate)));
    groups.upcoming = filtered.filter(t => isFuture(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));

    return groups;
  }, [tasks, filter]);

  const renderTaskItem = (task: Task) => (
    <div key={task.id} className="flex items-start gap-4 p-4 bg-white dark:bg-neutral-900/80 rounded-lg border border-gray-200 dark:border-white/20">
      <button onClick={async () => { await toggleTaskCompletion(task.id); }} className="mt-1">
        <div className={clsx(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          task.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
        )}>
          {task.isCompleted && <Check className="w-4 h-4 text-white" />}
        </div>
      </button>
      <div className="flex-1">
        <p className={clsx("font-medium text-gray-900 dark:text-white", task.isCompleted && "line-through text-gray-500 dark:text-gray-400")}>
          {task.title}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: pt })}</span>
          {task.relatedTo && (
            <span className="flex items-center gap-1.5"><ClipboardCheck size={14} /> {task.relatedTo.name}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenForm(task)} />
        <Button size="sm" variant="ghost" icon={Trash2} className="text-red-500" onClick={() => handleDeleteClick(task.id)} />
      </div>
    </div>
  );

  const renderTaskGroup = (title: string, tasks: Task[]) => {
    if (tasks.length === 0) return null;
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
          <Clock size={18} /> {title}
        </h3>
        <div className="space-y-3">
          {tasks.map(renderTaskItem)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Lembretes (Tarefas)
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-1 rounded-lg">
            <Button size="sm" variant={filter === 'pending' ? 'primary' : 'ghost'} onClick={() => setFilter('pending')}>Pendentes</Button>
            <Button size="sm" variant={filter === 'completed' ? 'primary' : 'ghost'} onClick={() => setFilter('completed')}>Concluídas</Button>
            <Button size="sm" variant={filter === 'all' ? 'primary' : 'ghost'} onClick={() => setFilter('all')}>Todas</Button>
          </div>
          <Button onClick={() => handleOpenForm()} icon={Plus}>
            Novo Lembrete
          </Button>
        </div>
      </div>

      <ModuleDataState
        loading={tasksLoading}
        hasLoaded={tasksLoaded}
        error={tasksError}
        onRetry={reloadTasks}
        skeleton={<StackedListSkeleton rows={6} />}
      >
        <div className="space-y-8">
          {filter !== 'completed' && renderTaskGroup('Atrasadas', groupedTasks.overdue || [])}
          {filter !== 'completed' && renderTaskGroup('Para Hoje', groupedTasks.today || [])}
          {filter !== 'completed' && renderTaskGroup('Próximas', groupedTasks.upcoming || [])}
          {filter !== 'pending' && renderTaskGroup('Concluídas', groupedTasks.completed || [])}
          
          {tasks.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 border border-gray-200 dark:border-white/20">
                <ClipboardCheck className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">Nenhum lembrete encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Crie um novo lembrete para começar a organizar suas tarefas.</p>
            </div>
          )}
        </div>
      </ModuleDataState>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        task={selectedTask}
      />
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Lembrete"
        message="Tem certeza que deseja excluir este lembrete?"
      />
    </div>
  );
};

export default TasksModule;
