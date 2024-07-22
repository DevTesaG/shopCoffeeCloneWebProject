import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';
import { BehaviorSubject, Observable,catchError,from,map,of,switchMap,take,tap, throwError } from 'rxjs';
import { Usuario } from '../../models/usuario/usuario.model';
import { FirebaseApp } from '@angular/fire/app/firebase';
import { initializeApp } from '@firebase/app';
import { getAuth, UserCredential } from '@angular/fire/auth';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { where } from '@angular/fire/firestore';

@Injectable( 
  {providedIn: 'root'}
)
export class UsuariosService {


  private usuariosSub$:BehaviorSubject<Usuario[]> = new BehaviorSubject([new Usuario])
  private firebaseConfig = {
    apiKey: "AIzaSyCFTgjTqfk5xl0IxynyJG423zR38vephzA",
    authDomain: "shopcafe-a72f8.firebaseapp.com",
    projectId: "shopcafe-a72f8",
    storageBucket: "shopcafe-a72f8.appspot.com",
    messagingSenderId: "12019644909",
    appId: "1:12019644909:web:faf367513789256a1e0fe4",
    measurementId: "G-NT4VNH2TRS",
  };

  usuarios$:Observable<Usuario[]> = this.usuariosSub$?.asObservable()
  ruta:string = 'usuario'

  constructor(private crud: CrudService) { 
    this.crud.setRuta('usuario')
  }


  async crearUsuarioIniApp(email:string):Promise<UserCredential>{
    const appSecundaria = initializeApp(this.firebaseConfig, "Secundaria")
    const auth = getAuth(appSecundaria)
    return await  createUserWithEmailAndPassword(auth, email, crypto.randomUUID())
  }
  
  crearUsuario(usuario:Usuario): Observable<string>{
    if(!usuario.email) return of('')

    const crearUsuario$ = (u:Usuario)=> this.crud.crear<Usuario>(u).pipe(tap({next: (nuevoId)=>{
      const usuarios = this.usuariosSub$?.getValue() ?? []
      console.log(usuarios)
      u.id = nuevoId
      usuarios.push(u)
      this.usuariosSub$?.next(usuarios)
      console.log(usuarios, this.usuariosSub$.getValue())
    }}))


    return from(this.crearUsuarioIniApp(usuario.email)).pipe(
      take(1),
      map((credencial:UserCredential)=> {
        console.log(credencial.user)
        usuario.uid = credencial.user.uid
        return usuario
      }),
      switchMap(usuario => !!usuario.uid ? crearUsuario$(usuario): throwError(()=> new Error('Error al generar UID. Intente de nuevo...'))),
      catchError(e => of('')) 
    ) 
  }  

  obtenerUsuarios():Observable<Usuario[]>{
   return this.usuarios$.pipe(switchMap((v, idx) => !!(v[0].id) ? this.usuariosSub$.asObservable(): 
      this.crud.setRuta(this.ruta).obtenerTodos<Usuario>().pipe(tap({next: (usuarios: Usuario[]) => {
        console.log(usuarios)
        this.usuariosSub$.next(usuarios)
      }})) 
    ))
  }
  
  obtenerUsuarioPorUid(uid:string):Observable<Usuario[]>{
   return this.crud.setRuta(this.ruta).obtenerTodos<Usuario>('uid', uid).pipe(tap({complete: ()=>console.log('Get uid Complete')}))
  }

  obtenerUsuariosPorFranquicia(franquiciaId:string):Observable<Usuario[]>{
   return this.usuarios$.pipe(switchMap((v, idx) => !!(v[0].id && v[0].franquiciaId == franquiciaId) ? this.usuariosSub$.asObservable():  
      this.crud.setRuta(this.ruta).obtenerTodos<Usuario>("franquiciaId", franquiciaId).pipe(tap({next: (usuarios: Usuario[]) => {
        if(usuarios.length == 0) return 
        this.usuariosSub$.next(usuarios)
        console.log(usuarios, this.usuariosSub$.getValue())
      }})) 
    ))
  }

  actualizarUsuario(nuevoUsuario: Usuario){
    return this.crud.actualizar<Usuario>(nuevoUsuario.id ?? '', nuevoUsuario).pipe(tap({next: () => {
      var usuarios = this.usuariosSub$.getValue()
      const idx = usuarios.findIndex(u => u.id === nuevoUsuario.id)
      usuarios.splice(idx, 1)
      usuarios.push(nuevoUsuario)
      this.usuariosSub$.next(usuarios)
    }}))
  }

  eliminarUsuario(id:string){
    return this.crud.eliminar<Usuario>(id).pipe(tap({next: ()=>{
        var usuarios = this.usuariosSub$.getValue()
        const idx = usuarios.findIndex(u=> u.id === id)
        console.log(idx)
        usuarios.splice(idx, 1)
        console.log(usuarios)
        this.usuariosSub$.next(usuarios)
        console.log(this.usuariosSub$.getValue())
      }}))
  }

  obtenerManagerAutorizado(email:string, contraseña:string, franquiciaId:string):Observable<Usuario[]>{
    return this.crud.setRuta(this.ruta).obtenerPorQuery([where('email','==',email), where('contraseña','==',contraseña),where('franquiciaId','==',franquiciaId),] ).pipe(take(1))
  }
}
