// src/common/filters/http-exception.filter.ts
//
// Ce filtre intercepte TOUTES les exceptions HTTP de l'application (404, 401, 400, etc.)
// et les reformate dans l'enveloppe standardisée définie au §10.1 du cahier des charges :
//   { success: false, error: { code, message, timestamp, path } }
// Sans ce filtre, NestJS renverrait par défaut un format différent selon le type d'erreur,
// ce qui compliquerait la vie des équipes Mobile/Desktop/Web qui consomment l'API.

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;

    // exception.getResponse() peut être une string ou un objet (selon comment
    // l'exception a été levée dans le code), on normalise les deux cas.
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    response.status(status).json({
      success: false,
      error: {
        code: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}