import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { from, map, of, switchMap } from 'rxjs';

export const loggedInGuard: CanActivateFn = (route, state) => {
  
  const router:Router = inject(Router)
  const auth:AuthService = inject(AuthService)
  const treeAdmin =router.parseUrl('franquicias')
  treeAdmin.queryParams['intentUrl'] = state.url 
  
  return auth.sesionIniciada$.pipe(switchMap(i => i ? of(true): from(auth.cerrarSesion()).pipe(map(()=> router.parseUrl('/login')))))
  // return auth.sesionIniciada$
};
