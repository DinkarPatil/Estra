import type { BackendRole } from '@/lib/api/auth';
import type { UserRole } from '@/types/user';

// TEMPORARY mapping (added 2026-04-19).
//
// The backend currently models four roles: user | broker | admin | superadmin.
// The frontend exposes four dashboards: investor | broker | developer | admin.
//
// Per product direction, every self-registration collapses to backend "user"
// for now, and every backend "user" lands on the investor dashboard. This is
// a deliberate test-time simplification so the auth round-trip is verifiable
// end-to-end without blocking on backend role work.
//
// TODO: once the backend supports investor and developer roles, delete this
// module and pass the UI role straight through.
export function frontendToBackendRole(_role: UserRole): BackendRole {
  return 'user';
}

export function backendToFrontendRole(role: BackendRole): UserRole {
  switch (role) {
    case 'broker':
      return 'broker';
    case 'admin':
      return 'admin';
    case 'superadmin':
      return 'admin';
    case 'user':
    default:
      return 'investor';
  }
}
