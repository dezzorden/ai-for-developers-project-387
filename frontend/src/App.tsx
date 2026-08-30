import { useState } from 'react';
import {
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  Text,
} from '@mantine/core';
import { IconCalendarEvent, IconSettings } from '@tabler/icons-react';
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { EventTypesPage } from './pages/EventTypesPage';
import { BookingPage } from './pages/BookingPage';
import { AdminBookingsPage } from './pages/AdminBookingsPage';
import { CreateEventTypePage } from './pages/CreateEventTypePage';

const links = [
  { to: '/', label: 'Записаться', icon: IconCalendarEvent },
  { to: '/admin', label: 'Управление', icon: IconSettings },
];

export function App() {
  const [menuOpened, setMenuOpened] = useState(false);
  const location = useLocation();

  return (
    <AppShell header={{ height: 72 }} padding={0}>
      <AppShell.Header className="site-header">
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Link to="/" className="brand" onClick={() => setMenuOpened(false)}>
              <span className="brand-mark">30</span>
              <span>
                <Text fw={700} lh={1.05}>Время созвона</Text>
                <Text size="xs" c="dimmed">простое бронирование</Text>
              </span>
            </Link>

            <Group gap="xs" visibleFrom="sm">
              {links.map(({ to, label, icon: Icon }) => (
                <Button
                  key={to}
                  component={NavLink}
                  to={to}
                  variant={location.pathname === to ? 'light' : 'subtle'}
                  color="forest"
                  leftSection={<Icon size={17} stroke={1.8} />}
                >
                  {label}
                </Button>
              ))}
            </Group>

            <Burger
              hiddenFrom="sm"
              opened={menuOpened}
              onClick={() => setMenuOpened((opened) => !opened)}
              aria-label="Открыть меню"
            />
          </Group>
        </Container>
      </AppShell.Header>

      {menuOpened && (
        <nav className="mobile-menu">
          {links.map(({ to, label }) => (
            <Button
              key={to}
              component={NavLink}
              to={to}
              fullWidth
              variant="subtle"
              onClick={() => setMenuOpened(false)}
            >
              {label}
            </Button>
          ))}
        </nav>
      )}

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<EventTypesPage />} />
          <Route path="/events/:eventTypeId" element={<BookingPage />} />
          <Route path="/admin" element={<AdminBookingsPage />} />
          <Route path="/admin/event-types/new" element={<CreateEventTypePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
