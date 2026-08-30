import { HttpException, HttpStatus } from '@nestjs/common';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'EVENT_TYPE_NOT_FOUND'
  | 'EVENT_TYPE_ALREADY_EXISTS'
  | 'OUTSIDE_BOOKING_WINDOW'
  | 'SLOT_UNAVAILABLE';

export function apiError(status: HttpStatus, code: ApiErrorCode, message: string): never {
  throw new HttpException({ code, message }, status);
}
