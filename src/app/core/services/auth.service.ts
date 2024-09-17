import { Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable,filter,from, map, merge, of, shareReplay,switchMap,take,tap } from 'rxjs';
import {  onAuthStateChanged, signInWithPopup, GoogleAuthProvider, getAuth,Auth, signOut, User } from "@angular/fire/auth";
import { inMemoryPersistence, setPersistence} from "firebase/auth";
import { UsuariosService } from '../../api/usuario/usuarios.service';
import { Usuario } from '../../models/usuario/usuario.model';
import { CrudService } from './crud.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  auth: Auth; 
  i = 0
  private authStatusSub:BehaviorSubject<any> = new BehaviorSubject(null);
  private currentUser$ = this.authStatusSub.asObservable().pipe(
    switchMap((user:User) => {
      this.i++;
      this.userChanged = user
      console.log(this.i, user)
      if(!(!!user?.uid)) return of(undefined);
      if(user.uid == this.currentUser?.uid) of(this.currentUser)
      return this.usuarios.obtenerUsuarioPorUid(user.uid)
    }),
    switchMap(u => {
      if(u && u[0]) return of(u[0])
      if(!!this.userChanged?.uid) return merge(from(this.userChanged.delete())).pipe(map(()=> undefined))
      return of(undefined)
    }),
    shareReplay(1),
    filter((v) => !this.intentoInicioSesion || (!!v)),
    tap(u => {this.currentUser = u; this.intentoInicioSesion = false}),
  )
  private currentUser?:Usuario = undefined;
  private userChanged:User = {} as User;
  private intentoInicioSesion = false
  sesionIniciada$:Observable<any> = this.currentUser$.pipe(map(v => !!v)); 
  // sesionIniciada$:Observable<any> = this.currentUser$.pipe(map(v => !(!!v))); 
  uid$:Observable<any> = this.currentUser$.pipe(map(v => v?.id)); 
  franquicia$:Observable<any> = this.currentUser$.pipe(map(v => v?.franquiciaId )); 
  // esAdmin$:Observable<any> = this.currentUser$.pipe(map(v => !(!!(v) && v.rol == 'ADMIN'))); 
  esAdmin$:Observable<any> = this.currentUser$.pipe(map(v => (!!(v) && v.rol == 'ADMIN'))); 
  esCajero$:Observable<any> = this.currentUser$.pipe(map(v => (!!(v) && v.rol == 'CAJERO'))); 
  esGerente$:Observable<any> = this.currentUser$.pipe(map(v => (!!(v) && v.rol == 'GERENTE'))); 
  esBarista$:Observable<any> = this.currentUser$.pipe(map(v => (!!(v) && v.rol == 'BARISTA'))); 
  

  constructor(private router: Router, private authFire: FirebaseApp, private usuarios: UsuariosService, private crud: CrudService){
    console.log(authFire.name)
    this.auth = getAuth(authFire)  
    onAuthStateChanged(this.auth, user =>{
      if(user){
        this.authStatusSub.next(user);
        console.log('User is logged in');
      }
      else{
        this.currentUser = undefined;
        this.authStatusSub.next(null);
        console.log('User is logged out');
      }
    })
  }

  
  iniciarConGoogle() {
    this.intentoInicioSesion = true
    return from(setPersistence(this.auth, inMemoryPersistence)).pipe(
    take(1),
    switchMap(()=> signInWithPopup(this.auth, new GoogleAuthProvider())),
    map(res=>  res.user),
    tap({complete: ()=> console.log('Login Completed')}),  
    )
 } 

  async cerrarSesion(){
    await signOut(this.auth).then(()=>this.router.navigate(['/login']))
  }

}
