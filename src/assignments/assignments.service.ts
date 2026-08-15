import { Injectable } from '@nestjs/common';

/**
 * Devoirs universitaires.
 *
 * Le schéma Prisma universitaire actuel ne contient pas encore de modèle
 * Assignment. L’endpoint renvoie donc un tableau vide honnête jusqu’à la
 * migration du modèle, plutôt qu’un jeu de données de démonstration.
 */
@Injectable()
export class AssignmentsService {
  findMine(): [] {
    return [];
  }
}
