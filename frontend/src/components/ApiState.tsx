import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export function PageLoader({ label = 'Загружаем данные' }: { label?: string }) {
  return (
    <Center mih={280}>
      <Stack align="center" gap="sm">
        <Loader color="forest" />
        <Text c="dimmed" size="sm">{label}</Text>
      </Stack>
    </Center>
  );
}

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      color="red"
      variant="light"
      icon={<IconAlertCircle size={20} />}
      title="Не удалось получить данные"
    >
      <Text size="sm" mb={onRetry ? 'sm' : 0}>{message}</Text>
      {onRetry && (
        <Button
          size="xs"
          color="red"
          variant="light"
          leftSection={<IconRefresh size={15} />}
          onClick={onRetry}
        >
          Повторить
        </Button>
      )}
    </Alert>
  );
}
