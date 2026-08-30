import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AdminController } from './admin.controller';
import { CalendarService } from './domain/calendar.service';
import { PublicController } from './public.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: process.env.FRONTEND_DIST_PATH ?? join(process.cwd(), 'public'),
      exclude: ['/owner', '/event-types', '/event-types/*path', '/bookings', '/admin/*path'],
    }),
  ],
  controllers: [PublicController, AdminController],
  providers: [CalendarService],
})
export class AppModule {}
