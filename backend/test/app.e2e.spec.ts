import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

type Slot = { startAt: string; endAt: string; eventTypeId: string };

describe('Call Booking API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the owner, event types and a 14-day availability window', async () => {
    const owner = await request(app.getHttpServer()).get('/owner').expect(200);
    expect(owner.body).toMatchObject({ id: 'owner-1', timeZone: 'Europe/Moscow' });

    const eventTypes = await request(app.getHttpServer()).get('/event-types').expect(200);
    expect(eventTypes.body.items).toHaveLength(2);

    const availability = await request(app.getHttpServer())
      .get('/event-types/intro-call/slots')
      .expect(200);
    expect(availability.body.eventTypeId).toBe('intro-call');
    expect(availability.body.items.length).toBeGreaterThan(0);
    expect(Date.parse(availability.body.windowEnd) - Date.parse(availability.body.windowStart))
      .toBe(14 * 24 * 60 * 60 * 1000);
  });

  it('atomically rejects a concurrent booking of the same slot', async () => {
    const availability = await request(app.getHttpServer()).get('/event-types/intro-call/slots');
    const slot = availability.body.items[0] as Slot;
    const payload = {
      eventTypeId: 'intro-call',
      startAt: slot.startAt,
      guestName: 'Мария',
      guestEmail: 'maria@example.com',
    };

    const responses = await Promise.all([
      request(app.getHttpServer()).post('/bookings').send(payload),
      request(app.getHttpServer()).post('/bookings').send(payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    const conflict = responses.find((response) => response.status === 409);
    expect(conflict?.body).toEqual({ code: 'SLOT_UNAVAILABLE', message: 'Выбранный слот уже занят' });
  });

  it('rejects an overlap between different event types', async () => {
    const availability = await request(app.getHttpServer()).get('/event-types/product-demo/slots');
    const slot = availability.body.items[0] as Slot;

    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        eventTypeId: 'product-demo',
        startAt: slot.startAt,
        guestName: 'Первый гость',
        guestEmail: 'first@example.com',
      })
      .expect(201);

    const overlappingStart = new Date(Date.parse(slot.startAt) + 30 * 60 * 1000).toISOString();
    const conflict = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        eventTypeId: 'intro-call',
        startAt: overlappingStart,
        guestName: 'Второй гость',
        guestEmail: 'second@example.com',
      })
      .expect(409);

    expect(conflict.body.code).toBe('SLOT_UNAVAILABLE');
  });

  it('creates event types and reports duplicate identifiers', async () => {
    const payload = {
      id: 'architecture-review',
      title: 'Разбор архитектуры',
      description: 'Обсудим техническое решение.',
      durationMinutes: 45,
    };

    const created = await request(app.getHttpServer())
      .post('/admin/event-types')
      .send(payload)
      .expect(201);
    expect(created.body).toMatchObject(payload);

    const duplicate = await request(app.getHttpServer())
      .post('/admin/event-types')
      .send(payload)
      .expect(409);
    expect(duplicate.body.code).toBe('EVENT_TYPE_ALREADY_EXISTS');
  });

  it('returns contract errors for invalid data and dates outside the window', async () => {
    const validation = await request(app.getHttpServer())
      .post('/bookings')
      .send({ eventTypeId: 'intro-call' })
      .expect(400);
    expect(validation.body.code).toBe('VALIDATION_ERROR');

    const availability = await request(app.getHttpServer()).get('/event-types/intro-call/slots');
    const outside = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        eventTypeId: 'intro-call',
        startAt: availability.body.windowEnd,
        guestName: 'Мария',
        guestEmail: 'maria@example.com',
      })
      .expect(400);
    expect(outside.body.code).toBe('OUTSIDE_BOOKING_WINDOW');
  });

  it('lists all future bookings ordered by start time', async () => {
    const availability = await request(app.getHttpServer()).get('/event-types/intro-call/slots');
    const slots = availability.body.items as Slot[];

    for (const slot of [slots[1], slots[0]]) {
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          eventTypeId: 'intro-call',
          startAt: slot.startAt,
          guestName: 'Гость',
          guestEmail: 'guest@example.com',
        })
        .expect(201);
    }

    const upcoming = await request(app.getHttpServer()).get('/admin/bookings/upcoming').expect(200);
    expect(upcoming.body.items).toHaveLength(2);
    expect(Date.parse(upcoming.body.items[0].startAt)).toBeLessThan(Date.parse(upcoming.body.items[1].startAt));
  });
});
