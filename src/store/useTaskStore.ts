import { create } from 'zustand';
import type { Task } from '../types';
import { resilientDataProvider as dataProvider } from '../services/resilientDataProvider';
import { useStore } from './useStore';
import { useClientStore } from './useClientStore';

type TaskInput = Omit<Task, 'id' | 'createdAt'>;

const normalizeTask = (task: Task): Task => ({
  ...task,
  createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
  dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
});

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setTasks: (tasks: Task[]) => void;
  listTasks: () => Promise<Task[]>;
  loadTasks: () => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  createTask: (task: TaskInput) => Promise<Task>;
  addTask: (task: TaskInput) => Promise<Task>;
  updateTaskById: (id: string, taskUpdate: Partial<Omit<Task, 'id'>>) => Promise<Task | undefined>;
  updateTask: (id: string, taskUpdate: Partial<Omit<Task, 'id'>>) => Promise<Task | undefined>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  deleteTaskById: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setTasks: (tasks) => set({ tasks }),

  listTasks: async () => {
    try {
      const tasks = await dataProvider.list<Task>('tasks');
      const normalized = tasks.map(normalizeTask);
      set({ tasks: normalized });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadTasks: async () => {
    if (get().hasLoaded || get().loading) return;
    set({ loading: true, error: null });
    try {
      await useClientStore.getState().loadClients?.();
      await get().listTasks();
      set({ loading: false, hasLoaded: true });
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
    }
  },

  getTaskById: (id) => get().tasks.find((task) => task.id === id),

  createTask: async (taskData) => {
    const { addAuditLog, currentUser } = useStore.getState();
    const payload: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      createdBy: taskData.createdBy ?? currentUser?.id,
      createdAt: new Date(),
    };
    try {
      const created = await dataProvider.create<Task>('tasks', payload);
      const normalized = normalizeTask(created);
      set((state) => ({ tasks: [normalized, ...state.tasks] }));
      addAuditLog({ action: 'create', resourceType: 'Task', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addTask: async (taskData) => get().createTask(taskData),

  updateTaskById: async (id, taskUpdate) => {
    const { addAuditLog } = useStore.getState();
    try {
      const updated = await dataProvider.update<Task>('tasks', id, taskUpdate);
      if (!updated) return undefined;
      const normalized = normalizeTask(updated);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === id ? normalized : task)),
      }));
      addAuditLog({ action: 'update', resourceType: 'Task', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateTask: async (id, taskUpdate) => get().updateTaskById(id, taskUpdate),

  toggleTaskCompletion: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    await get().updateTask(id, { isCompleted: !task.isCompleted });
  },

  deleteTaskById: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('tasks', id);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Task', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteTask: async (id) => get().deleteTaskById(id),
}));
