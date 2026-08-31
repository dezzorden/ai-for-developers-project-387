import { expect, test } from '@playwright/test';

test.describe('отображение текущего времени на главной странице', () => {
  test('часы показывают текущее время в часовом поясе Europe/Moscow', async ({ page }) => {
    const now = new Date();
    const expectedTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    await page.goto('/');
    const clock = page.getByTestId('moscow-clock');
    await expect(clock).toBeVisible();
    await expect(clock).toHaveText(expectedTime);
  });

  test('часы обновляются автоматически', async ({ page }) => {
    const baseTime = new Date('2026-08-31T09:00:00Z');
    const startTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    }).format(baseTime);

    await page.clock.install({ time: baseTime });
    await page.goto('/');
    const clock = page.getByTestId('moscow-clock');
    await expect(clock).toBeVisible();
    await expect(clock).toHaveText(startTime);

    await page.clock.runFor(61_000);
    const laterTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(baseTime.getTime() + 61_000));
    await expect(clock).toHaveText(laterTime);
  });
});
