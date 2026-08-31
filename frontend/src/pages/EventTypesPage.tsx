import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconArrowUpRight, IconClock, IconWorld } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { api, type EventType, type Owner } from '../api/client';
import { ErrorAlert, PageLoader } from '../components/ApiState';
import { formatDuration } from '../utils/date';

const MOSCOW_TZ = 'Europe/Moscow';

function formatMoscowTime(now: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: MOSCOW_TZ,
    hour: '2-digit',
    minute: '2-digit',
  }).format(now);
}

export function EventTypesPage() {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [moscowTime, setMoscowTime] = useState(() => formatMoscowTime(new Date()));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => setMoscowTime(formatMoscowTime(new Date())), []);

  useEffect(() => {
    tick();
    timerRef.current = setInterval(tick, 60_000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [tick]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([api.getOwner(), api.getEventTypes()])
      .then(([ownerData, eventData]) => {
        if (!active) return;
        setOwner(ownerData);
        setEvents(eventData.items);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Неизвестная ошибка');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reloadKey]);

  return (
    <>
      <Box className="hero">
        <Container size="lg" className="hero-inner">
          <Badge variant="outline" color="dark" size="lg" radius="xl">14 дней для выбора</Badge>
          <Title order={1} className="hero-title">
            Найдем полчаса,<br />чтобы поговорить.
          </Title>
          <Text className="hero-copy">
            Выберите тему и удобное время. Подтверждение займет меньше минуты.
          </Text>
          {owner && (
            <Group gap="xs" className="owner-line">
              <span className="owner-dot" />
              <Text size="sm">Календарь: <b>{owner.name}</b></Text>
              <IconWorld size={15} />
              <Text size="sm">{owner.timeZone}</Text>
            </Group>
          )}
          <Text size="lg" fw={600} className="moscow-clock" data-testid="moscow-clock">
            {moscowTime}
          </Text>
        </Container>
      </Box>

      <Container size="lg" py={{ base: 44, sm: 64 }}>
        <Group justify="space-between" align="end" mb="xl">
          <div>
            <Text tt="uppercase" fw={700} size="xs" c="forest.7" lts="0.12em">Форматы встречи</Text>
            <Title order={2} mt={6}>О чем созвонимся?</Title>
          </div>
          <Text c="dimmed" size="sm" visibleFrom="sm">Время указано в вашем часовом поясе</Text>
        </Group>

        {loading && <PageLoader />}
        {!loading && error && <ErrorAlert message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
        {!loading && !error && events.length === 0 && (
          <Paper className="empty-state">
            <Title order={3}>Пока нет доступных встреч</Title>
            <Text c="dimmed" mt="xs">Владелец календаря еще не опубликовал типы событий.</Text>
          </Paper>
        )}

        {!loading && !error && events.length > 0 && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {events.map((event, index) => (
              <Paper key={event.id} className="event-card" data-index={index % 3}>
                <Group justify="space-between" align="flex-start">
                  <ThemeIcon variant="light" color="forest" size={46} radius="xl">
                    <IconClock size={22} stroke={1.7} />
                  </ThemeIcon>
                  <Text className="event-number">0{index + 1}</Text>
                </Group>
                <Stack gap="xs" mt="xl" mb="xl">
                  <Title order={3}>{event.title}</Title>
                  <Text c="dimmed" lineClamp={3}>{event.description || 'Короткая встреча без заданной темы.'}</Text>
                </Stack>
                <Group justify="space-between">
                  <Badge color="forest" variant="light" size="lg">{formatDuration(event.durationMinutes)}</Badge>
                  <Button
                    component={Link}
                    to={`/events/${event.id}`}
                    variant="subtle"
                    color="dark"
                    rightSection={<IconArrowUpRight size={18} />}
                  >
                    Выбрать время
                  </Button>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </>
  );
}
