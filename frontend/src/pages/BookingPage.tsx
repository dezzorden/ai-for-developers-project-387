import { useEffect, useState } from 'react';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconCalendarCheck, IconClock, IconInfoCircle } from '@tabler/icons-react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, api, type AvailableSlotList, type EventType, type Owner, type Slot } from '../api/client';
import { ErrorAlert, PageLoader } from '../components/ApiState';
import { dateKey, formatDay, formatDuration, formatTime } from '../utils/date';

type BookingForm = { guestName: string; guestEmail: string };

export function BookingPage() {
  const { eventTypeId = '' } = useParams();
  const [event, setEvent] = useState<EventType | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [availability, setAvailability] = useState<AvailableSlotList | null>(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const form = useForm<BookingForm>({
    initialValues: { guestName: '', guestEmail: '' },
    validate: {
      guestName: (value) => value.trim() ? null : 'Введите имя',
      guestEmail: (value) => /^\S+@\S+\.\S+$/.test(value) ? null : 'Введите корректный email',
    },
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([api.getOwner(), api.getEventTypes(), api.getSlots(eventTypeId)])
      .then(([ownerData, eventsData, slotsData]) => {
        if (!active) return;
        const selectedEvent = eventsData.items.find((item) => item.id === eventTypeId);
        if (!selectedEvent) throw new Error('Тип встречи не найден');
        setOwner(ownerData);
        setEvent(selectedEvent);
        setAvailability(slotsData);
        const firstSlot = slotsData.items[0];
        if (firstSlot) setSelectedDay(dateKey(firstSlot.startAt, ownerData.timeZone));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Неизвестная ошибка');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [eventTypeId, reloadKey]);

  const timeZone = owner?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const groupedSlots = new Map<string, Slot[]>();
  availability?.items.forEach((slot) => {
    const key = dateKey(slot.startAt, timeZone);
    groupedSlots.set(key, [...(groupedSlots.get(key) ?? []), slot]);
  });
  const days = [...groupedSlots.entries()];

  const submit = form.onSubmit(async (values) => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await api.createBooking({
        eventTypeId,
        startAt: selectedSlot.startAt,
        guestName: values.guestName.trim(),
        guestEmail: values.guestEmail.trim(),
      });
      setCompleted(true);
      notifications.show({ color: 'forest', title: 'Встреча забронирована', message: 'Время закреплено за вами.' });
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === 'SLOT_UNAVAILABLE') {
        setSelectedSlot(null);
        notifications.show({ color: 'orange', title: 'Слот уже занят', message: 'Обновите расписание и выберите другое время.' });
      } else {
        notifications.show({ color: 'red', title: 'Не удалось забронировать', message: reason instanceof Error ? reason.message : 'Попробуйте еще раз.' });
      }
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) return <Container size="lg" py={80}><PageLoader /></Container>;
  if (error) return <Container size="sm" py={80}><ErrorAlert message={error} onRetry={() => setReloadKey((key) => key + 1)} /></Container>;
  if (!event || !availability) return null;

  if (completed && selectedSlot) {
    return (
      <Container size="sm" py={{ base: 48, sm: 96 }}>
        <Paper className="success-panel">
          <IconCalendarCheck size={56} stroke={1.4} />
          <Text tt="uppercase" fw={700} size="xs" lts="0.14em">Запись подтверждена</Text>
          <Title order={1}>{event.title}</Title>
          <Text size="lg">
            {formatDay(selectedSlot.startAt, timeZone).date}, {formatTime(selectedSlot.startAt, timeZone)}
          </Text>
          <Text c="dimmed">Детали встречи сохранены. До скорого!</Text>
          <Button component={Link} to="/" color="dark" mt="md">На главную</Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py={{ base: 28, sm: 56 }}>
      <Anchor component={Link} to="/" c="dimmed" size="sm">
        <Group gap={6}><IconArrowLeft size={16} /> Все форматы</Group>
      </Anchor>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing={{ base: 28, md: 48 }} mt="xl">
        <Stack gap="lg" className="booking-summary">
          <Text tt="uppercase" fw={700} size="xs" c="forest.7" lts="0.12em">Вы выбрали</Text>
          <Title order={1}>{event.title}</Title>
          <Text c="dimmed">{event.description}</Text>
          <Divider />
          <Group gap="xs"><IconClock size={18} /><Text fw={600}>{formatDuration(event.durationMinutes)}</Text></Group>
          <Text size="sm" c="dimmed">Часовой пояс календаря: {timeZone}</Text>
        </Stack>

        <Box className="booking-flow">
          <div className="step-heading">
            <span>1</span>
            <div><Title order={3}>Выберите день</Title><Text c="dimmed" size="sm">Доступность на ближайшие 14 дней</Text></div>
          </div>

          {days.length === 0 ? (
            <Alert icon={<IconInfoCircle size={18} />} color="gray" mt="lg">
              Свободных слотов пока нет. Попробуйте вернуться позже.
            </Alert>
          ) : (
            <>
              <div className="day-strip">
                {days.map(([key, slots]) => {
                  const label = formatDay(slots[0].startAt, timeZone);
                  return (
                    <button
                      type="button"
                      key={key}
                      className="day-button"
                      data-active={selectedDay === key}
                      onClick={() => { setSelectedDay(key); setSelectedSlot(null); }}
                    >
                      <span>{label.weekday}</span>
                      <strong>{label.date}</strong>
                    </button>
                  );
                })}
              </div>

              <div className="step-heading compact">
                <span>2</span>
                <div><Title order={3}>Выберите время</Title></div>
              </div>
              <div className="slot-grid">
                {(groupedSlots.get(selectedDay) ?? []).map((slot) => (
                  <button
                    type="button"
                    key={slot.startAt}
                    className="slot-button"
                    data-active={selectedSlot?.startAt === slot.startAt}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatTime(slot.startAt, timeZone)}
                  </button>
                ))}
              </div>
            </>
          )}

          <Divider my="xl" />
          <div className="step-heading compact">
            <span>3</span>
            <div><Title order={3}>Ваши контакты</Title></div>
          </div>
          <form onSubmit={submit}>
            <Stack mt="lg">
              <TextInput label="Имя" placeholder="Как к вам обращаться" {...form.getInputProps('guestName')} />
              <TextInput label="Email" type="email" placeholder="you@example.com" {...form.getInputProps('guestEmail')} />
              <Button type="submit" size="md" color="forest" disabled={!selectedSlot} loading={submitting}>
                {selectedSlot ? `Записаться на ${formatTime(selectedSlot.startAt, timeZone)}` : 'Сначала выберите время'}
              </Button>
            </Stack>
          </form>
        </Box>
      </SimpleGrid>
    </Container>
  );
}
