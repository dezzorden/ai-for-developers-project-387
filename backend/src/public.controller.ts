import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CalendarService } from './domain/calendar.service';

@Controller()
export class PublicController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('owner')
  getOwner() {
    return this.calendar.getOwner();
  }

  @Get('event-types')
  listEventTypes() {
    return this.calendar.listEventTypes();
  }

  @Get('event-types/:eventTypeId/slots')
  listAvailableSlots(@Param('eventTypeId') eventTypeId: string) {
    return this.calendar.listAvailableSlots(eventTypeId);
  }

  @Post('bookings')
  createBooking(@Body() input: CreateBookingDto) {
    return this.calendar.createBooking(input);
  }
}
