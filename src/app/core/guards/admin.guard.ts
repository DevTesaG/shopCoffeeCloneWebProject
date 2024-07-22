import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlSegment } from '@angular/router';
import {map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  
  const auth:AuthService = inject(AuthService)
  const router: Router  = inject(Router) 
  
  console.log('Func')

  console.log(route.url[0].path)

  return auth.esAdmin$.pipe( 
    switchMap( a => a ? of(true): auth.franquicia$.pipe(tap(console.log),  map(fId => {
        console.log('Franquicias', fId)
        const treeNotAdmin = router.createUrlTree(['franquicias', fId])
          return treeNotAdmin
        }))
    )
  )
};

