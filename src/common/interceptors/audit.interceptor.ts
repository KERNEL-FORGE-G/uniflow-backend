import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;

    // Mutating HTTP methods to audit
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (!isMutating) {
      return next.handle();
    }

    const url = request.url || '';
    const user = request.user;
    const ip = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    // Derive action and resource from URL & method
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    const resource = urlParts[0] || 'global';
    const resourceId = urlParts.length > 1 ? urlParts[urlParts.length - 1] : undefined;
    const action = `${method}_${resource.toUpperCase()}`;

    // Clean body to avoid storing passwords or sensitive tokens
    const body = { ...request.body };
    if (body.password) delete body.password;
    if (body.refreshToken) delete body.refreshToken;
    if (body.apiSecret) delete body.apiSecret;

    return next.handle().pipe(
      tap({
        next: () => {
          this.auditLogsService.log({
            userId: user?.id || user?.userId,
            userRole: user?.role,
            action,
            resource,
            resourceId,
            ipAddress: ip,
            userAgent,
            statusCode: response.statusCode,
            details: body,
          });
        },
        error: (err) => {
          this.auditLogsService.log({
            userId: user?.id || user?.userId,
            userRole: user?.role,
            action: `${action}_FAILED`,
            resource,
            resourceId,
            ipAddress: ip,
            userAgent,
            statusCode: err.status || 500,
            details: { error: err.message, body },
          });
        },
      }),
    );
  }
}
