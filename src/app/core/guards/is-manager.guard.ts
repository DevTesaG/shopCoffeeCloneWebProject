import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import {of, switchMap } from 'rxjs';

export const isManagerGuard: CanActivateFn = (route, state) => {
  const auth:AuthService = inject(AuthService)
  
  return auth.esAdmin$.pipe(switchMap(a => a ? of(true): auth.esGerente$))
};
