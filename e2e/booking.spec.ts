import { expect, test } from '@playwright/test';

test.describe('интеграционные сценарии записи на звонок', () => {
  test('гость бронирует слот, и встреча появляется у владельца', async ({ page }) => {
    const guestEmail = `guest-${Date.now()}@example.com`;

    await page.goto('/');
    await expect(page.getByText('Календарь:')).toBeVisible();

    const introCard = page.locator('.event-card').filter({ hasText: 'Знакомство' });
    await expect(introCard).toBeVisible();
    await introCard.getByRole('link', { name: 'Выбрать время' }).click();

    await expect(page.getByRole('heading', { name: 'Выберите день' })).toBeVisible();
    const firstSlot = page.locator('.slot-button').first();
    await expect(firstSlot).toBeVisible();
    await firstSlot.click();
    await page.getByLabel('Имя').fill('Интеграционный гость');
    await page.getByLabel('Email').fill(guestEmail);
    await page.getByRole('button', { name: /Записаться на/ }).click();

    await expect(page.getByText('Запись подтверждена')).toBeVisible();
    await page.goto('/admin');
    await expect(page.getByRole('table').getByText(guestEmail)).toBeVisible();
  });

  test('UI сообщает, если выбранный слот успел занять другой клиент', async ({ page, request }) => {
    await page.goto('/events/intro-call');
    const firstSlot = page.locator('.slot-button').first();
    await expect(firstSlot).toBeVisible();

    const availabilityResponse = await request.get('http://127.0.0.1:3000/event-types/intro-call/slots');
    expect(availabilityResponse.ok()).toBeTruthy();
    const availability = await availabilityResponse.json() as { items: Array<{ startAt: string }> };
    expect(availability.items.length).toBeGreaterThan(0);

    const competingBooking = await request.post('http://127.0.0.1:3000/bookings', {
      data: {
        eventTypeId: 'intro-call',
        startAt: availability.items[0].startAt,
        guestName: 'Конкурирующий гость',
        guestEmail: `competitor-${Date.now()}@example.com`,
      },
    });
    expect(competingBooking.status()).toBe(201);

    await firstSlot.click();
    await page.getByLabel('Имя').fill('Опоздавший гость');
    await page.getByLabel('Email').fill(`late-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /Записаться на/ }).click();

    await expect(page.getByText('Слот уже занят')).toBeVisible();
    await expect(page.getByText('Запись подтверждена')).not.toBeVisible();
  });

  test('владелец создает тип события, доступный в публичном каталоге', async ({ page }) => {
    const suffix = Date.now();
    const eventId = `architecture-review-${suffix}`;
    const eventTitle = `Разбор архитектуры ${suffix}`;

    await page.goto('/admin/event-types/new');
    await page.getByLabel('Идентификатор').fill(eventId);
    await page.getByLabel('Название').fill(eventTitle);
    await page.getByLabel('Описание').fill('Совместно разберем техническое решение.');
    await page.getByLabel('Длительность, минут').fill('45');
    await page.getByRole('button', { name: 'Создать событие' }).click();

    await expect(page.getByRole('heading', { name: 'Предстоящие встречи' })).toBeVisible();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
  });
});
