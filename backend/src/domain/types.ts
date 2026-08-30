export type Owner = {
  id: string;
  name: string;
  timeZone: string;
};

export type EventType = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  createdAt: string;
};

export type Slot = {
  eventTypeId: string;
  startAt: string;
  endAt: string;
};

export type Booking = {
  id: string;
  eventTypeId: string;
  eventTitle: string;
  startAt: string;
  endAt: string;
  guestName: string;
  guestEmail: string;
  createdAt: string;
};
