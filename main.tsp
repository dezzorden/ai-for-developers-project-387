import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Call Booking API" })
namespace CallBooking;

@doc("Identifier supplied by the owner. It is unique across event types.")
@minLength(1)
@maxLength(64)
@pattern("^[a-z0-9]+(?:-[a-z0-9]+)*$")
scalar EventTypeId extends string;

@doc("A predefined calendar owner. There is exactly one owner in the system.")
@example(#{ id: "owner-1", name: "Алексей Морозов", timeZone: "Europe/Moscow" })
model Owner {
  id: string;

  @minLength(1)
  @maxLength(100)
  name: string;

  @doc("IANA time zone used to calculate calendar dates and the booking window.")
  timeZone: string;
}

@doc("A meeting template published by the owner.")
@example(#{
  id: "intro-call",
  title: "Знакомство",
  description: "Обсудим вашу задачу и поймем, чем можем быть полезны друг другу.",
  durationMinutes: 30,
  createdAt: utcDateTime.fromISO("2026-08-01T09:00:00Z"),
})
model EventType {
  id: EventTypeId;

  @minLength(1)
  @maxLength(120)
  title: string;

  @maxLength(2000)
  description: string;

  @doc("Meeting duration in minutes. Slot start times follow the 30-minute grid.")
  @minValue(1)
  @maxValue(1440)
  durationMinutes: int32;

  createdAt: utcDateTime;
}

model CreateEventTypeRequest {
  id: EventTypeId;

  @minLength(1)
  @maxLength(120)
  title: string;

  @maxLength(2000)
  description: string;

  @minValue(1)
  @maxValue(1440)
  durationMinutes: int32;
}

@doc("A currently available interval calculated for a selected event type.")
model Slot {
  eventTypeId: EventTypeId;
  startAt: utcDateTime;
  endAt: utcDateTime;
}

@doc("A confirmed meeting. Event title is captured when the booking is created.")
@example(#{
  id: "booking-1",
  eventTypeId: "intro-call",
  eventTitle: "Знакомство",
  startAt: utcDateTime.fromISO("2026-08-28T09:00:00Z"),
  endAt: utcDateTime.fromISO("2026-08-28T09:30:00Z"),
  guestName: "Мария Волкова",
  guestEmail: "maria@example.com",
  createdAt: utcDateTime.fromISO("2026-08-26T08:00:00Z"),
})
model Booking {
  id: string;
  eventTypeId: EventTypeId;
  eventTitle: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
  guestName: string;
  guestEmail: string;
  createdAt: utcDateTime;
}

model CreateBookingRequest {
  eventTypeId: EventTypeId;

  @doc("Start of a slot previously returned by the availability endpoint. The server derives endAt.")
  startAt: utcDateTime;

  @minLength(1)
  @maxLength(100)
  guestName: string;

  @format("email")
  @maxLength(254)
  guestEmail: string;
}

@example(#{
  items: #[
    #{
      id: "intro-call",
      title: "Знакомство",
      description: "Обсудим вашу задачу и поймем, чем можем быть полезны друг другу.",
      durationMinutes: 30,
      createdAt: utcDateTime.fromISO("2026-08-01T09:00:00Z"),
    },
    #{
      id: "product-demo",
      title: "Демонстрация продукта",
      description: "Покажем возможности продукта на вашем сценарии.",
      durationMinutes: 60,
      createdAt: utcDateTime.fromISO("2026-08-02T09:00:00Z"),
    },
  ],
})
model EventTypeList {
  items: EventType[];
}

@example(#{
  eventTypeId: "intro-call",
  windowStart: utcDateTime.fromISO("2026-08-26T00:00:00Z"),
  windowEnd: utcDateTime.fromISO("2026-09-09T00:00:00Z"),
  items: #[
    #{ eventTypeId: "intro-call", startAt: utcDateTime.fromISO("2026-08-28T09:00:00Z"), endAt: utcDateTime.fromISO("2026-08-28T09:30:00Z") },
    #{ eventTypeId: "intro-call", startAt: utcDateTime.fromISO("2026-08-28T09:30:00Z"), endAt: utcDateTime.fromISO("2026-08-28T10:00:00Z") },
    #{ eventTypeId: "intro-call", startAt: utcDateTime.fromISO("2026-08-29T11:00:00Z"), endAt: utcDateTime.fromISO("2026-08-29T11:30:00Z") },
  ],
})
model AvailableSlotList {
  eventTypeId: EventTypeId;

  @doc("Inclusive start of the 14-day booking window, represented in UTC.")
  windowStart: utcDateTime;

  @doc("Exclusive end of the 14-day booking window, represented in UTC.")
  windowEnd: utcDateTime;

  items: Slot[];
}

@example(#{
  generatedAt: utcDateTime.fromISO("2026-08-26T08:00:00Z"),
  items: #[#{
    id: "booking-1",
    eventTypeId: "intro-call",
    eventTitle: "Знакомство",
    startAt: utcDateTime.fromISO("2026-08-28T09:00:00Z"),
    endAt: utcDateTime.fromISO("2026-08-28T09:30:00Z"),
    guestName: "Мария Волкова",
    guestEmail: "maria@example.com",
    createdAt: utcDateTime.fromISO("2026-08-26T08:00:00Z"),
  }],
})
model UpcomingBookingList {
  generatedAt: utcDateTime;

  @doc("Future bookings of all event types, ordered by startAt ascending.")
  items: Booking[];
}

model BadRequestError {
  code: "VALIDATION_ERROR" | "OUTSIDE_BOOKING_WINDOW";
  message: string;
}

@error
model BadRequestResponse {
  @statusCode statusCode: 400;
  @body error: BadRequestError;
}

@error
model EventTypeNotFoundResponse {
  @statusCode statusCode: 404;
  @body error: {
    code: "EVENT_TYPE_NOT_FOUND";
    message: string;
  };
}

@error
model EventTypeAlreadyExistsResponse {
  @statusCode statusCode: 409;
  @body error: {
    code: "EVENT_TYPE_ALREADY_EXISTS";
    message: string;
  };
}

@error
model SlotUnavailableResponse {
  @statusCode statusCode: 409;
  @body error: {
    code: "SLOT_UNAVAILABLE";
    message: string;
  };
}

model CreatedEventTypeResponse {
  @statusCode statusCode: 201;
  @body eventType: EventType;
}

model CreatedBookingResponse {
  @statusCode statusCode: 201;
  @body booking: Booking;
}

@tag("Public")
@route("/owner")
interface PublicOwner {
  @get
  @summary("Get the predefined calendar owner")
  @opExample(#{ returnType: #{ id: "owner-1", name: "Алексей Морозов", timeZone: "Europe/Moscow" } })
  getOwner(): Owner;
}

@tag("Public")
@route("/event-types")
interface PublicEventTypes {
  @get
  @summary("List event types available to guests")
  @opExample(#{ returnType: #{ items: #[
    #{ id: "intro-call", title: "Знакомство", description: "Обсудим вашу задачу и поймем, чем можем быть полезны друг другу.", durationMinutes: 30, createdAt: utcDateTime.fromISO("2026-08-01T09:00:00Z") },
    #{ id: "product-demo", title: "Демонстрация продукта", description: "Покажем возможности продукта на вашем сценарии.", durationMinutes: 60, createdAt: utcDateTime.fromISO("2026-08-02T09:00:00Z") },
  ] } })
  listEventTypes(): EventTypeList;

  @get
  @route("/{eventTypeId}/slots")
  @summary("List available slots in the current 14-day window")
  @opExample(#{
    parameters: #{ eventTypeId: "intro-call" },
    returnType: #{
      eventTypeId: "intro-call",
      windowStart: utcDateTime.fromISO("2026-08-26T00:00:00Z"),
      windowEnd: utcDateTime.fromISO("2026-09-09T00:00:00Z"),
      items: #[
        #{ eventTypeId: "intro-call", startAt: utcDateTime.fromISO("2026-08-28T09:00:00Z"), endAt: utcDateTime.fromISO("2026-08-28T09:30:00Z") },
        #{ eventTypeId: "intro-call", startAt: utcDateTime.fromISO("2026-08-28T09:30:00Z"), endAt: utcDateTime.fromISO("2026-08-28T10:00:00Z") },
        #{ eventTypeId: "intro-call", startAt: utcDateTime.fromISO("2026-08-29T11:00:00Z"), endAt: utcDateTime.fromISO("2026-08-29T11:30:00Z") },
      ],
    },
  })
  listAvailableSlots(@path eventTypeId: EventTypeId): AvailableSlotList | EventTypeNotFoundResponse;
}

@tag("Public")
@route("/bookings")
interface PublicBookings {
  @post
  @summary("Book an available slot")
  createBooking(@body request: CreateBookingRequest):
    | CreatedBookingResponse
    | BadRequestResponse
    | EventTypeNotFoundResponse
    | SlotUnavailableResponse;
}

@tag("Admin")
@route("/admin/event-types")
interface AdminEventTypes {
  @post
  @summary("Create an event type")
  createEventType(@body request: CreateEventTypeRequest):
    | CreatedEventTypeResponse
    | BadRequestResponse
    | EventTypeAlreadyExistsResponse;
}

@tag("Admin")
@route("/admin/bookings/upcoming")
interface AdminBookings {
  @get
  @summary("List all upcoming bookings")
  @opExample(#{ returnType: #{
    generatedAt: utcDateTime.fromISO("2026-08-26T08:00:00Z"),
    items: #[#{
      id: "booking-1",
      eventTypeId: "intro-call",
      eventTitle: "Знакомство",
      startAt: utcDateTime.fromISO("2026-08-28T09:00:00Z"),
      endAt: utcDateTime.fromISO("2026-08-28T09:30:00Z"),
      guestName: "Мария Волкова",
      guestEmail: "maria@example.com",
      createdAt: utcDateTime.fromISO("2026-08-26T08:00:00Z"),
    }],
  } })
  listUpcomingBookings(): UpcomingBookingList;
}
