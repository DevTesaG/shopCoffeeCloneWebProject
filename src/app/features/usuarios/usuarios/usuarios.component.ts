import { Component, Input} from '@angular/core';
import { UsuariosService } from '../../../api/usuario/usuarios.service';
import { Usuario } from '../../../models/usuario/usuario.model';
import { Observable, catchError, of, take, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ListComponent } from '../../../shared/components/list/list.component';
import { TypeaheadComponent } from '../../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../../shared/components/form/form.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [AsyncPipe, ListComponent, TypeaheadComponent, FormComponent, FormInputComponent, ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css',
  providers: []
})
export class UsuariosComponent {
  
  constructor(private usuarios: UsuariosService, private auth: AuthService,  private fb: NonNullableFormBuilder){
  }


  @Input() id:string = ''
  uIdUsuario:string = ''
  esGerente:boolean = false
  esAdmin:boolean = false
  usuario?:Usuario = new Usuario();
  usuarios$?:Observable<Usuario[]>
  isAdmin$:Observable<any> = this.auth.esAdmin$;
  


  form: FormGroup<any> = this.fb.group({
    nombre: ["", [Validators.required]],
    rol: ["CAJERO", [Validators.required]],
    email: ["", [Validators.required, Validators.email] ],
    contraseña: [{value: "", disabled: true} , [Validators.required] ]
  });
  
  message?:string = undefined;
  error?:string = undefined
  nuevoUsuario = false;
  cargando = false

  ngOnInit(){
    this.form.disable()
    this.auth.uid$.pipe(take(1)).subscribe(u => this.uIdUsuario = u) 
    this.auth.esGerente$.pipe(take(1)).subscribe(g => this.esGerente = g) 
    this.auth.esAdmin$.pipe(take(1)).subscribe(g => this.esAdmin = g) 
    this.usuarios$ = this.usuarios.obtenerUsuariosPorFranquicia(this.id).pipe(tap(console.log), catchError((e)=> {this.error = 'Error de Conexion...'; return of([])}))
  }

  usuarioSeleccionado(usuario: Usuario){
    this.form.reset()
    this.usuario = usuario
    this.nuevoUsuario = false
    this.message = undefined
    this.form.get('email')?.disable()
    this.form.get('nombre')?.disable()
    this.form.get('contraseña')?.disable()
    this.form.get('rol')?.enable()
    if((this.usuario?.uid == this.uIdUsuario && this.esGerente) || this.esAdmin){
      this.form.get('contraseña')?.enable()
    }
 
    this.form.patchValue(usuario)
  }
  
  crearUsuario(){    
    this.form.get('nombre')?.enable()
    this.form.get('email')?.enable()
    this.nuevoUsuario = true
    this.message = undefined
    this.usuario = undefined
    this.form.reset()
  }


 crear(usuario: Usuario){
    if(this.cargando) return
    
    if(!this.usuario) {
      usuario.franquiciaId = this.id;
      this.usuarios.crearUsuario(usuario).subscribe({
        complete: () => {this.message = "El usuario fue Creado"; this.nuevoUsuario = false},
        error: ()=> {this.cargando = false; this.message = 'Error de conexion. Intente de nuevo'}
      })
    }else{
      Object.assign(this.usuario, usuario)
      this.usuarios.actualizarUsuario(this.usuario).subscribe({
        complete: () => {this.message = "El usuario fue Actualizado"; this.usuario = undefined},
        error: ()=> {this.cargando = false; this.message = 'Error de conexion. Intente de nuevo'}
      })
    }
  }

  eliminar(){
    if(!this.usuario || this.cargando) return;
    this.usuarios.eliminarUsuario(this.usuario.id ?? '').subscribe({
      complete: ()=> {this.message = "El usuario fue eliminado"; this.usuario = undefined},
      error: ()=> {this.cargando = false; this.message = 'Error de conexion. Intente de nuevo'}
    })
  }
}
