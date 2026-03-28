import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: number;
  name: string;
  lastname: string;
  username: string;
  email: string;
  rol: string;
  total_score: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSubject = new BehaviorSubject<string>(localStorage.getItem('jwt') || '');
  private userSubject = new BehaviorSubject<User | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);

  token$ = this.tokenSubject.asObservable();
  user$ = this.userSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  get token(): string { return this.tokenSubject.value; }
  get user(): User | null { return this.userSubject.value; }
  get loading(): boolean { return this.loadingSubject.value; }

  constructor(private api: ApiService) {
    this.init();
  }

  private async init() {
    const token = this.tokenSubject.value;
    if (token) {
      const res = await this.api.getMe(token);
      if (res.status === 200) {
        this.userSubject.next(res.data);
      } else {
        this.logout();
      }
    }
    this.loadingSubject.next(false);
  }

  saveAuth(token: string, user: User) {
    localStorage.setItem('jwt', token);
    this.tokenSubject.next(token);
    this.userSubject.next(user);
  }

  logout() {
    localStorage.removeItem('jwt');
    this.tokenSubject.next('');
    this.userSubject.next(null);
  }

  setUser(user: User) {
    this.userSubject.next(user);
  }
}
