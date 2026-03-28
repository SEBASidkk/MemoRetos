import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loginGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  while (auth.loading) {
    await new Promise(r => setTimeout(r, 10));
  }

  if (auth.token) return router.createUrlTree(['/dashboard']);
  return true;
};
