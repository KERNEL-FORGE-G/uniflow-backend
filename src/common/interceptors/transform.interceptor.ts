// src/common/interceptors/transform.interceptor.ts
//
// Cet interceptor enveloppe TOUTES les réponses réussies dans le format standard
// { success: true, data, meta } défini au §10.1 du CDC.
// Ainsi, chaque contrôleur (auth, students, schedules, attendance...) peut simplement
// retourner ses données brutes — l'enveloppe est ajoutée automatiquement ici,
// une seule fois, pour toute l'application.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        // Si le contrôleur a déjà renvoyé un objet avec pagination
        // (ex. { items, page, pageSize, total, totalPages }), on sépare
        // automatiquement "items" comme data et le reste comme meta.
        if (data && typeof data === 'object' && 'items' in data) {
          const { items, ...meta } = data;
          return { success: true, data: items, meta };
        }
        return { success: true, data };
      }),
    );
  }
}