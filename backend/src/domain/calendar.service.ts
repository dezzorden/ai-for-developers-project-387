import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { apiError } from '../common/api-error';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { CreateEventTypeDto } from '../dto/create-event-type.dto';
import type { Booking, EventType, Owner, Slot } from './types';

const BOOKING_WINDOW_DAYS = 14;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 18;
const SLOT_STEP_MINUTES = 30;

@Injectable()
export class CalendarService {
  private readonly owner: Owner = {
    id: 'owner-1',
    name: 'Алексей Морозов',
    timeZone: 'Europe/Moscow',
  };

  private readonly eventTypes: EventType[] = [
    {
      id: 'intro-call',
      title: 'Знакомство',
      description: 'Обсудим вашу задачу и поймем, чем можем быть полезны друг другу.',
      durationMinutes: 30,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'product-demo',
      title: 'Демонстрация продукта',
      description: 'Покажем возможности продукта на вашем сценарии.',
      durationMinutes: 60,
      createdAt: new Date().toISOString(),
    },
  ];

  private readonly bookings: Booking[] = [];

  getOwner(): Owner {
    return this.owner;
  }

  listEventTypes(): { items: EventType[] } {
    return { items: [...this.eventTypes] };
  }

  createEventType(input: CreateEventTypeDto): EventType {
    if (this.eventTypes.some((eventType) => eventType.id === input.id)) {
      apiError(HttpStatus.CONFLICT, 'EVENT_TYPE_ALREADY_EXISTS', 'Тип события с таким id уже существует');
    }

    const eventType: EventType = {
      ...input,
      createdAt: new Date().toISOString(),
    };
    this.eventTypes.push(eventType);
    return eventType;
  }

  listAvailableSlots(eventTypeId: string): {
    eventTypeId: string;
    windowStart: string;
    windowEnd: string;
    items: Slot[];
  } {
    const eventType = this.findEventType(eventTypeId);
    const now = DateTime.now();
    const { windowStart, windowEnd } = this.getBookingWindow(now);
    const items: Slot[] = [];

    for (let dayOffset = 0; dayOffset < BOOKING_WINDOW_DAYS; dayOffset += 1) {
      const day = windowStart.setZone(this.owner.timeZone).plus({ days: dayOffset });
      let candidate = day.plus({ hours: DAY_START_HOUR });
      const dayEnd = day.plus({ hours: DAY_END_HOUR });

      while (candidate.plus({ minutes: eventType.durationMinutes }) <= dayEnd) {
        const candidateEnd = candidate.plus({ minutes: eventType.durationMinutes });
        if (candidate > now && !this.hasOverlap(candidate, candidateEnd)) {
          items.push({
            eventTypeId,
            startAt: this.toUtcIso(candidate),
            endAt: this.toUtcIso(candidateEnd),
          });
        }
        candidate = candidate.plus({ minutes: SLOT_STEP_MINUTES });
      }
    }

    return {
      eventTypeId,
      windowStart: this.toUtcIso(windowStart),
      windowEnd: this.toUtcIso(windowEnd),
      items,
    };
  }

  createBooking(input: CreateBookingDto): Booking {
    const eventType = this.findEventType(input.eventTypeId);
    const now = DateTime.now();
    const start = DateTime.fromISO(input.startAt, { setZone: true });
    const end = start.plus({ minutes: eventType.durationMinutes });
    const { windowStart, windowEnd } = this.getBookingWindow(now);

    if (start < windowStart || start >= windowEnd) {
      apiError(HttpStatus.BAD_REQUEST, 'OUTSIDE_BOOKING_WINDOW', 'Начало встречи находится вне 14-дневного окна записи');
    }

    if (start <= now || !this.isInConfiguredAvailability(start, end)) {
      apiError(HttpStatus.CONFLICT, 'SLOT_UNAVAILABLE', 'Выбранное время недоступно для бронирования');
    }

    if (this.hasOverlap(start, end)) {
      apiError(HttpStatus.CONFLICT, 'SLOT_UNAVAILABLE', 'Выбранный слот уже занят');
    }

    const booking: Booking = {
      id: randomUUID(),
      eventTypeId: eventType.id,
      eventTitle: eventType.title,
      startAt: this.toUtcIso(start),
      endAt: this.toUtcIso(end),
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      createdAt: new Date().toISOString(),
    };

    this.bookings.push(booking);
    return booking;
  }

  listUpcomingBookings(): { generatedAt: string; items: Booking[] } {
    const now = Date.now();
    return {
      generatedAt: new Date(now).toISOString(),
      items: this.bookings
        .filter((booking) => Date.parse(booking.startAt) > now)
        .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt)),
    };
  }

  private findEventType(eventTypeId: string): EventType {
    const eventType = this.eventTypes.find((item) => item.id === eventTypeId);
    if (!eventType) {
      apiError(HttpStatus.NOT_FOUND, 'EVENT_TYPE_NOT_FOUND', 'Тип события не найден');
    }
    return eventType;
  }

  private getBookingWindow(now: DateTime): { windowStart: DateTime; windowEnd: DateTime } {
    const windowStart = now.setZone(this.owner.timeZone).startOf('day');
    return {
      windowStart,
      windowEnd: windowStart.plus({ days: BOOKING_WINDOW_DAYS }),
    };
  }

  private isInConfiguredAvailability(start: DateTime, end: DateTime): boolean {
    const localStart = start.setZone(this.owner.timeZone);
    const localEnd = end.setZone(this.owner.timeZone);
    const dayStart = localStart.startOf('day').plus({ hours: DAY_START_HOUR });
    const dayEnd = localStart.startOf('day').plus({ hours: DAY_END_HOUR });
    const followsGrid =
      (localStart.minute === 0 || localStart.minute === 30) &&
      localStart.second === 0 &&
      localStart.millisecond === 0;

    return followsGrid && localStart >= dayStart && localEnd <= dayEnd;
  }

  private hasOverlap(start: DateTime, end: DateTime): boolean {
    return this.bookings.some((booking) => {
      const existingStart = DateTime.fromISO(booking.startAt);
      const existingEnd = DateTime.fromISO(booking.endAt);
      return start < existingEnd && end > existingStart;
    });
  }

  private toUtcIso(value: DateTime): string {
    const iso = value.toUTC().toISO({ suppressMilliseconds: true });
    if (!iso) throw new Error('Unable to serialize date');
    return iso;
  }
}
