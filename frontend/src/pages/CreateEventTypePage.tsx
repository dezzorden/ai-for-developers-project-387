import { useState } from 'react';
import {
  Anchor,
  Button,
  Container,
  Group,
  NumberInput,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api/client';

type EventForm = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number | string;
};

export function CreateEventTypePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<EventForm>({
    initialValues: { id: '', title: '', description: '', durationMinutes: 30 },
    validate: {
      id: (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? null : 'Используйте латиницу, цифры и дефисы',
      title: (value) => value.trim() ? null : 'Введите название',
      durationMinutes: (value) => Number(value) >= 1 && Number(value) <= 1440 ? null : 'От 1 до 1440 минут',
    },
  });

  const submit = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.createEventType({
        id: values.id,
        title: values.title.trim(),
        description: values.description.trim(),
        durationMinutes: Number(values.durationMinutes),
      });
      notifications.show({ color: 'forest', icon: <IconCheck size={17} />, title: 'Тип события создан', message: 'Теперь он доступен гостям.' });
      navigate('/admin');
    } catch (reason) {
      const duplicate = reason instanceof ApiError && reason.code === 'EVENT_TYPE_ALREADY_EXISTS';
      if (duplicate) form.setFieldError('id', 'Такой идентификатор уже используется');
      notifications.show({ color: 'red', title: 'Не удалось создать событие', message: reason instanceof Error ? reason.message : 'Попробуйте еще раз.' });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="admin-surface">
      <Container size="sm" py={{ base: 36, sm: 64 }}>
        <Anchor component={Link} to="/admin" c="dimmed" size="sm">
          <Group gap={6}><IconArrowLeft size={16} /> К расписанию</Group>
        </Anchor>
        <Title order={1} mt="xl">Новый тип события</Title>
        <Text c="dimmed" mt="xs" mb="xl">Опишите формат встречи. После создания он сразу появится в публичном каталоге.</Text>

        <Paper className="event-form-panel">
          <form onSubmit={submit}>
            <Stack gap="lg">
              <TextInput
                label="Идентификатор"
                description="Например, product-demo. Изменить его после создания нельзя."
                placeholder="product-demo"
                maxLength={64}
                {...form.getInputProps('id')}
              />
              <TextInput label="Название" placeholder="Знакомство с продуктом" maxLength={120} {...form.getInputProps('title')} />
              <Textarea label="Описание" placeholder="Расскажите гостю, чему будет посвящена встреча" minRows={4} maxLength={2000} {...form.getInputProps('description')} />
              <NumberInput label="Длительность, минут" min={1} max={1440} {...form.getInputProps('durationMinutes')} />
              <Group justify="flex-end" mt="sm">
                <Button component={Link} to="/admin" variant="default">Отмена</Button>
                <Button type="submit" loading={submitting}>Создать событие</Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
