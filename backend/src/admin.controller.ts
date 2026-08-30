import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { CalendarService } from './domain/calendar.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly calendar: CalendarService) {}

  @Post('event-types')
  createEventType(@Body() input: CreateEventTypeDto) {
    return this.calendar.createEventType(input);
  }

  @Get('bookings/upcoming')
  listUpcomingBookings() {
    return this.calendar.listUpcomingBookings();
  }
}
