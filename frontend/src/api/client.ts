import type { components } from './schema';

export type Owner = components['schemas']['Owner'];
export type EventType = components['schemas']['EventType'];
export type Slot = components['schemas']['Slot'];
export type Booking = components['schemas']['Booking'];
export type CreateBookingRequest = components['schemas']['CreateBookingRequest'];
export type CreateEventTypeRequest = components['schemas']['CreateEventTypeRequest'];
export type AvailableSlotList = components['schemas']['AvailableSlotList'];
export type UpcomingBookingList = components['schemas']['UpcomingBookingList'];

const defaultApiUrl = import.meta.env.DEV ? 'http://127.0.0.1:3000' : '';
const apiUrl = (import.meta.env.VITE_API_URL ?? defaultApiUrl).replace(/\/$/, '');

type ApiErrorBody = {
  code?: string;
  message?: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    throw new ApiError(
      response.status,
      body.code ?? 'UNKNOWN_ERROR',
      body.message ?? 'Не удалось выполнить запрос',
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  getOwner: () => request<Owner>('/owner'),
  getEventTypes: () => request<{ items: EventType[] }>('/event-types'),
  getSlots: (eventTypeId: string) =>
    request<AvailableSlotList>(`/event-types/${encodeURIComponent(eventTypeId)}/slots`),
  createBooking: (payload: CreateBookingRequest) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getUpcomingBookings: () => request<UpcomingBookingList>('/admin/bookings/upcoming'),
  createEventType: (payload: CreateEventTypeRequest) =>
    request<EventType>('/admin/event-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
