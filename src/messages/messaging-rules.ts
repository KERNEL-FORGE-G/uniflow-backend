import { UserRole } from '@prisma/client';

const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'SECRETARIAT', 'ENSEIGNANT', 'DELEGUE', 'ETUDIANT',
];

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'DIRECTION', 'SECRETARIAT'];

// Clé = rôle de l'émetteur, valeur = rôles de destinataires autorisés (§1 du document).
export const MESSAGING_RULES: Record<UserRole, UserRole[]> = {
  ENSEIGNANT: [...ADMIN_ROLES, 'ETUDIANT', 'DELEGUE'],
  ETUDIANT: ['DELEGUE', 'ETUDIANT'],
  DELEGUE: ['ENSEIGNANT', 'ETUDIANT'],
  // L'administration n'est pas restreinte par la matrice (confirmé) — accès total.
  ADMIN: ALL_ROLES,
  SUPER_ADMIN: ALL_ROLES,
  DIRECTION: ALL_ROLES,
  SECRETARIAT: ALL_ROLES,
};

export function canSendMessage(senderRole: UserRole, receiverRole: UserRole): boolean {
  return MESSAGING_RULES[senderRole]?.includes(receiverRole) ?? false;
}