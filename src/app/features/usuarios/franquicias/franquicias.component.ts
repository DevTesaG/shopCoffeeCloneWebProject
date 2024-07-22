import { Component } from '@angular/core';
import { FranquiciasService } from '../../../api/usuario/franquicias.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Franquicia } from '../../../models/usuario/franquicia.model';
import { Observable, catchError, of, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { TypeaheadComponent } from '../../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../../shared/components/form/form.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-franquicias',
  standalone: true,
  imports: [AsyncPipe, TypeaheadComponent, FormComponent,RouterModule, ReactiveFormsModule, FormInputComponent],
  templateUrl: './franquicias.component.html',
  styleUrl: './franquicias.component.css'
})
export class FranquiciasComponent {
  
  constructor(private franquicias: FranquiciasService, private auth: AuthService, private router:Router ,private fb: NonNullableFormBuilder){
  }

  franquicia?:Franquicia = new Franquicia()
  franquicias$?:Observable<Franquicia[]>
  isAdmin$:Observable<any> = this.auth.esAdmin$;
  
  form: FormGroup<any> = this.fb.group({
    nombre: ["", [Validators.required, Validators.maxLength(30)]],
    direccion: ["", [Validators.required]],
    codigoPostal: ["", [Validators.required]],
    email: ["", [Validators.required, Validators.email]],
    tel: ["", [Validators.required, Validators.pattern(/[()0-9]{4} [0-9]{4} [0-9]{4}/)]]
  });
  
  message?:string = undefined;  
  error?:string = undefined;  
  nuevafranquicia = false;

  
  
  ngOnInit(){
    this.franquicias$ = this.franquicias.obtenerfranquicias().pipe(catchError(e => {this.error='Error de Conexion...'; return of([])}) )
  }

  franquiciaSeleccionada(franquicia: Franquicia){
    this.nuevafranquicia = false
    this.franquicia = franquicia
    this.message = undefined
    this.form.patchValue(franquicia)
  }
 
  crearFranquicia(){
    this.nuevafranquicia = true
    this.franquicia = undefined
    this.form.reset()
  }


 crear(franquicia: Franquicia){
    if(!this.franquicia) {
      this.franquicias.crearfranquicia(franquicia).subscribe({
        complete: () => {this.message = "El franquicia fue Creada"},
        next: id=> this.franquicia ? this.franquicia.id = id : this.franquicia = undefined
      })
    }else{
      Object.assign(this.franquicia, franquicia)
      this.franquicias.actualizarfranquicia(this.franquicia).subscribe({
        complete: () => {this.message = "El franquicia fue Actualizada"; this.franquicia = undefined}
      })
    }
  }

  eliminar(){
    if(!this.franquicia) return;
    this.franquicias.eliminarfranquicia(this.franquicia.id ?? '').subscribe({
      complete: ()=> this.message = "El franquicia fue eliminada"
    })
  }
}
