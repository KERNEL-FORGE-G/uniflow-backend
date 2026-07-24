// src/common/guards/roles.guard.ts
//
// Squelette du guard RBAC (§9.2 et §5.1 du CDC).
// ⚠️ Ce guard suppose que `request.user` est déjà peuplé par un AuthGuard JWT
// (module auth, pris en charge par Dev A). Pour l'instant, il compile et
// laisse tout passer si aucun rôle n'est requis — la vérification stricte
// sera activée une fois le module auth livré (dépendance §15.7 du CDC).

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Pas de restriction de rôle sur cet endpoint -> accès libre
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // TODO (une fois module auth livré) : lever une exception explicite
    // si `user` est absent, plutôt que de laisser passer silencieusement.
    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}