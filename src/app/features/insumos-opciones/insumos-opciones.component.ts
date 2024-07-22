import { Component, Input } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { FormComponent } from '../../shared/components/form/form.component';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { ListComponent } from '../../shared/components/list/list.component';
import { AsyncPipe } from '@angular/common';
import { IngredienteInv } from '../../models/ingrediente-inv.model';
import { InventarioService } from '../../api/ingredientes/inventario.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-insumos-opciones',
  standalone: true,
  imports:  [AsyncPipe, ListComponent, TypeaheadComponent, FormComponent, FormInputComponent, ReactiveFormsModule],
  templateUrl: './insumos-opciones.component.html',
  styleUrl: './insumos-opciones.component.css'
})
export class InsumosOpcionesComponent {
  constructor(private inventarios: InventarioService,  private fb: NonNullableFormBuilder){
  }


  @Input() id:string = ''
  inventario?:IngredienteInv | any = undefined;
  inventarios$?:Observable<IngredienteInv[] | undefined> = of([])
  
  form: FormGroup<any> = this.fb.group({
    nombre: [{value: '', disabled: true}, [Validators.required], ],
    minResurtir: [0, [Validators.required, Validators.min(1)]],
    minPermitible: [0, [Validators.required, Validators.min(1)]],
  });
  
  message?:string = undefined;
  cargando = false
  
  
  ngOnInit(){
    this.inventarios.setFranquiciaId = this.id
    this.inventarios$ = this.inventarios.inventarioConIngredientes$
  }

  inventarioSeleccionado(inventario: IngredienteInv){
    this.inventario = inventario
    this.message = undefined
    this.form.patchValue(inventario)
  }
 
 crear(insumo: IngredienteInv){
   if(!(this.inventario && this.inventario.disponible !=undefined) || this.cargando) return
   
   this.cargando = true

    const inv = {
      id: this.inventario.id,
      disponible : this.inventario.disponible,
      minPermitible: insumo.minPermitible ?? this.inventario.minPermitible,
      minResurtir: insumo.minResurtir ?? this.inventario.minResurtir,
      resurtir: this.inventario.resurtir,
    } as IngredienteInv

    this.inventarios.actualizarInventario(inv, this.id).subscribe({
      complete: () => {
        this.message = "El insumo fue Actualizado"; 
        this.inventario = undefined; 
        this.cargando = false
      },
      error: ()=> {this.cargando = false; this.message = 'Error de conexion. Intente de nuevo'}
    })
  }
}
