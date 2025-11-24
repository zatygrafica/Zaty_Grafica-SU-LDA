import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AttendanceEvent, Absence, Delay } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase } from '../utils/case';
import { useStore } from './useStore';
import { useEmployeeStore } from './useEmployeeStore';

type AbsenceInput = Omit<Absence, 'id' | 'createdAt'>;
type DelayInput = Omit<Delay, 'id' | 'createdAt'>;

const normalizeEvent = (event: AttendanceEvent): AttendanceEvent => ({
  ...event,
  date: event.date ? new Date(event.date) : new Date(),
  createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
});

let attendanceChannel: RealtimeChannel | null = null;
let attendanceSubscribers = 0;

interface AttendanceState {
  events: AttendanceEvent[];
  loading: boolean;
  error: string | null;
  setEvents: (events: AttendanceEvent[]) => void;
  listAttendanceEvents: () => Promise<AttendanceEvent[]>;
  getAttendanceEventById: (eventId: string) => AttendanceEvent | undefined;
  createAbsence: (absence: AbsenceInput) => Promise<Absence>;
  addAbsence: (absence: AbsenceInput) => Promise<Absence>;
  createDelay: (delay: DelayInput) => Promise<Delay>;
  addDelay: (delay: DelayInput) => Promise<Delay>;
  deleteEventById: (eventId: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventsForMonth: (employeeId: string, date: Date) => AttendanceEvent[];
  subscribeToRealtime: () => () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  setEvents: (events) => set({ events }),

  listAttendanceEvents: async () => {
    set({ loading: true, error: null });
    try {
      const events = await dataProvider.list<AttendanceEvent>('attendanceEvents');
      const normalized = events.map(normalizeEvent);
      set({ events: normalized, loading: false });
      return normalized;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  getAttendanceEventById: (eventId) => get().events.find((event) => event.id === eventId),

  createAbsence: async (absenceData) => {
    const { addAuditLog } = useStore.getState();
    const absence: Absence = {
      id: crypto.randomUUID(),
      employeeId: absenceData.employeeId,
      type: 'absence',
      status: absenceData.status ?? 'present',
      date: new Date(absenceData.date ?? new Date()),
      deduction: absenceData.deduction,
      hours: absenceData.hours,
      notes: absenceData.notes,
      createdAt: new Date(),
    };
    try {
      const created = await dataProvider.create<AttendanceEvent>('attendanceEvents', absence);
      const normalized = normalizeEvent(created);
      set((state) => ({
        events: [normalized, ...state.events.filter((event) => event.id !== normalized.id)],
      }));
      addAuditLog({
        action: 'add_attendance',
        resourceType: 'Employee',
        resourceId: normalized.employeeId,
        changes: { type: 'absence', date: normalized.date },
      });
      return normalized as Absence;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addAbsence: async (absenceData) => get().createAbsence(absenceData),

  createDelay: async (delayData) => {
    const { addAuditLog } = useStore.getState();
    const delay: Delay = {
      id: crypto.randomUUID(),
      employeeId: delayData.employeeId,
      type: 'delay',
      status: delayData.status ?? 'late',
      date: new Date(delayData.date ?? new Date()),
      actualArrivalTime: delayData.actualArrivalTime,
      minutes: delayData.minutes,
      deduction: delayData.deduction,
      notes: delayData.notes,
      createdAt: new Date(),
    };
    try {
      const created = await dataProvider.create<AttendanceEvent>('attendanceEvents', delay);
      const normalized = normalizeEvent(created);
      set((state) => ({
        events: [normalized, ...state.events.filter((event) => event.id !== normalized.id)],
      }));
      addAuditLog({
        action: 'add_attendance',
        resourceType: 'Employee',
        resourceId: normalized.employeeId,
        changes: { type: 'delay', date: normalized.date },
      });
      return normalized as Delay;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addDelay: async (delayData) => get().createDelay(delayData),

  deleteEventById: async (eventId) => {
    const event = get().events.find((e) => e.id === eventId);
    if (!event) return;
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('attendanceEvents', eventId);
      set((state) => ({
        events: state.events.filter((e) => e.id !== eventId),
      }));
      addAuditLog({
        action: 'delete_attendance',
        resourceType: 'Employee',
        resourceId: event.employeeId,
        changes: { date: event.date },
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteEvent: async (eventId) => get().deleteEventById(eventId),

  getEventsForMonth: (employeeId, date) => {
    const { events } = get();
    const year = date.getFullYear();
    const month = date.getMonth();

    return events.filter(
      (event) =>
        event.employeeId === employeeId &&
        new Date(event.date).getFullYear() === year &&
        new Date(event.date).getMonth() === month
    );
  },
  subscribeToRealtime: () => {
    if (!attendanceChannel) {
      const handlePayload = (payload: { new: Record<string, unknown> | null }) => {
        if (!payload.new) return;
        const camel = convertKeysToCamelCase(payload.new) as AttendanceEvent;
        const normalized = normalizeEvent(camel);
        set((state) => {
          const exists = state.events.some((event) => event.id === normalized.id);
          const events = exists
            ? state.events.map((event) => (event.id === normalized.id ? normalized : event))
            : [normalized, ...state.events];
          return { events };
        });
      };

      attendanceChannel = supabase
        .channel('attendance-events')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'attendance_events' },
          handlePayload
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'attendance_events' },
          handlePayload
        )
        .subscribe();
      attendanceSubscribers = 1;
      return () => {
        if (attendanceChannel) {
          void supabase.removeChannel(attendanceChannel);
        }
        attendanceChannel = null;
        attendanceSubscribers = 0;
      };
    }

    attendanceSubscribers += 1;
    return () => {
      attendanceSubscribers = Math.max(0, attendanceSubscribers - 1);
      if (attendanceChannel && attendanceSubscribers === 0) {
        void supabase.removeChannel(attendanceChannel);
        attendanceChannel = null;
      }
    };
  },
}));

// Ensure employees are loaded so that attendance operations have context
useEmployeeStore.getState().loadEmployees?.();
