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

  test.describe('границы 14-дневного окна записи', () => {
    test('гость записывается на слот последнего дня окна', async ({ page }) => {
      await page.goto('/events/intro-call');

      const lastDay = page.locator('.day-button').last();
      await expect(lastDay).toBeVisible();
      await lastDay.click();
      await expect(lastDay).toHaveAttribute('data-active', 'true');

      const lastSlot = page.locator('.slot-button').last();
      await expect(lastSlot).toBeVisible();
      await lastSlot.click();

      await page.getByLabel('Имя').fill('Гость на границе окна');
      await page.getByLabel('Email').fill(`edge-${Date.now()}@example.com`);
      await page.getByRole('button', { name: /Записаться на/ }).click();

      await expect(page.getByText('Запись подтверждена')).toBeVisible();
    });

    test('UI не подтверждает запись за пределами окна и показывает ошибку', async ({ page, request }) => {
      const availabilityResponse = await request.get('http://127.0.0.1:3000/event-types/intro-call/slots');
      expect(availabilityResponse.ok()).toBeTruthy();
      const availability = await availabilityResponse.json() as {
        windowEnd: string;
        items: Array<{ eventTypeId: string; startAt: string; endAt: string }>;
      };

      const injectedOutsideSlot = {
        eventTypeId: 'intro-call',
        startAt: availability.windowEnd,
        endAt: new Date(Date.parse(availability.windowEnd) + 30 * 60 * 1000).toISOString(),
      };

      await page.route('**/event-types/intro-call/slots', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...availability, items: [...availability.items, injectedOutsideSlot] }),
        });
      });

      await page.goto('/events/intro-call');

      const outsideDay = page.locator('.day-button').last();
      await expect(outsideDay).toBeVisible();
      await outsideDay.click();
      await expect(outsideDay).toHaveAttribute('data-active', 'true');

      const outsideTime = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(availability.windowEnd));
      const outsideButton = page.getByRole('button', { name: outsideTime });
      await expect(outsideButton).toBeVisible();
      await outsideButton.click();
      await page.getByLabel('Имя').fill('Гость за пределами окна');
      await page.getByLabel('Email').fill(`outside-${Date.now()}@example.com`);
      await page.getByRole('button', { name: /Записаться на/ }).click();

      await expect(page.getByText('Не удалось забронировать')).toBeVisible();
      await expect(page.getByText(/вне 14-дневного окна записи/)).toBeVisible();
      await expect(page.getByText('Запись подтверждена')).not.toBeVisible();
    });
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
