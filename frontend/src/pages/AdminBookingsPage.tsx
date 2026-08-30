import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCalendarPlus, IconClockHour4, IconMail, IconPlus, IconUser } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { api, type Booking } from '../api/client';
import { ErrorAlert, PageLoader } from '../components/ApiState';
import { formatDateTime } from '../utils/date';

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.getUpcomingBookings()
      .then((data) => {
        if (!active) return;
        setBookings(data.items);
        setGeneratedAt(data.generatedAt);
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
    <div className="admin-surface">
      <Container size="lg" py={{ base: 36, sm: 64 }}>
        <Group justify="space-between" align="flex-end" mb="xl">
          <div>
            <Text tt="uppercase" fw={700} size="xs" c="forest.7" lts="0.12em">Панель владельца</Text>
            <Title order={1} mt={6}>Предстоящие встречи</Title>
            {generatedAt && <Text c="dimmed" size="sm" mt={5}>Обновлено {formatDateTime(generatedAt)}</Text>}
          </div>
          <Button component={Link} to="/admin/event-types/new" leftSection={<IconPlus size={18} />}>
            Новый тип события
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="xl">
          <Paper className="metric-card">
            <ThemeIcon color="forest" variant="light" size={42}><IconCalendarPlus size={21} /></ThemeIcon>
            <div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Всего встреч</Text><Text fz={30} fw={700}>{bookings.length}</Text></div>
          </Paper>
          <Paper className="metric-card accent">
            <ThemeIcon color="orange" variant="light" size={42}><IconClockHour4 size={21} /></ThemeIcon>
            <div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Ближайшая</Text><Text fw={700}>{bookings[0] ? formatDateTime(bookings[0].startAt) : 'Нет встреч'}</Text></div>
          </Paper>
        </SimpleGrid>

        {loading && <PageLoader label="Собираем расписание" />}
        {!loading && error && <ErrorAlert message={error} onRetry={() => setReloadKey((key) => key + 1)} />}
        {!loading && !error && bookings.length === 0 && (
          <Paper className="empty-state">
            <Title order={3}>В календаре пока тихо</Title>
            <Text c="dimmed" mt="xs">Новые записи появятся здесь автоматически.</Text>
          </Paper>
        )}
        {!loading && !error && bookings.length > 0 && (
          <>
            <Paper className="booking-table" visibleFrom="sm">
              <Table verticalSpacing="md" horizontalSpacing="lg">
                <Table.Thead>
                  <Table.Tr><Table.Th>Дата и время</Table.Th><Table.Th>Встреча</Table.Th><Table.Th>Гость</Table.Th></Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookings.map((booking) => (
                    <Table.Tr key={booking.id}>
                      <Table.Td><Text fw={600}>{formatDateTime(booking.startAt)}</Text></Table.Td>
                      <Table.Td><Badge variant="light" color="forest">{booking.eventTitle}</Badge></Table.Td>
                      <Table.Td>
                        <Text fw={600}>{booking.guestName}</Text>
                        <Text size="sm" c="dimmed">{booking.guestEmail}</Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
            <Stack hiddenFrom="sm">
              {bookings.map((booking) => (
                <Paper key={booking.id} className="mobile-booking-card">
                  <Badge variant="light" color="forest" mb="md">{booking.eventTitle}</Badge>
                  <Group gap="xs" mb="xs"><IconClockHour4 size={17} /><Text fw={600}>{formatDateTime(booking.startAt)}</Text></Group>
                  <Group gap="xs"><IconUser size={17} /><Text>{booking.guestName}</Text></Group>
                  <Group gap="xs" mt={4}><IconMail size={17} /><Text size="sm" c="dimmed">{booking.guestEmail}</Text></Group>
                </Paper>
              ))}
            </Stack>
          </>
        )}
      </Container>
    </div>
  );
}
