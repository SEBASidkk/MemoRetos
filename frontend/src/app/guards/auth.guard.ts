import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization to complete
  while (auth.loading) {
    await new Promise(r => setTimeout(r, 10));
  }

  if (auth.token) return true;
  return router.createUrlTree(['/']);
};
