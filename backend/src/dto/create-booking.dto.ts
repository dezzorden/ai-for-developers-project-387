import { IsEmail, IsISO8601, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(64)
  eventTypeId!: string;

  @IsISO8601({ strict: true })
  startAt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  guestName!: string;

  @IsEmail()
  @MaxLength(254)
  guestEmail!: string;
}
