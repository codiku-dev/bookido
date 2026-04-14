import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@api/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    switch (exception.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (exception.meta as { target?: string[] })?.['target'];
        const field = target?.[0] || 'field';
        status = HttpStatus.CONFLICT;
        message = `${field} already exists`;
        break;

      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
        break;

      case 'P2014':
        // Required relation violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation is missing';
        break;

      case 'P2000':
        // Value too long
        status = HttpStatus.BAD_REQUEST;
        message = 'Value is too long for the field';
        break;

      case 'P2001':
        // Record does not exist
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;

      default:
        console.error('Unhandled Prisma error:', exception.code, exception);
        message = 'Database error occurred';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: status === HttpStatus.NOT_FOUND ? 'Not Found' :
        status === HttpStatus.CONFLICT ? 'Conflict' : 'Bad Request',
    });
  }
}