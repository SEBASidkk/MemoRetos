import { atom } from 'nanostores';
import type { User } from '../lib/types';

export const $user = atom<User | null>(null);
export const $authLoading = atom<boolean>(false);

export function logout() {
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).finally(() => {
    $user.set(null);
    window.location.href = '/';
  });
}
