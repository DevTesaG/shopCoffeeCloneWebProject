import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ListComponent } from '../../shared/components/list/list.component';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../shared/components/form/form.component';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioService } from '../../api/ingredientes/inventario.service';
import { IngredienteInv } from '../../models/ingrediente-inv.model';
import { Observable,of, switchMap } from 'rxjs';
import { CorteService } from '../../api/ventas/corte.service';

enum unidades {
  kilos = 1000,
  litros = 1000,
  piezas = 1,
  docenas = 12
}

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [AsyncPipe, ListComponent, TypeaheadComponent, FormComponent, FormInputComponent, ReactiveFormsModule],

  templateUrl: './insumos.component.html',
  styleUrl: './insumos.component.css'
})
export class InsumosComponent {
  constructor(private inventarios: InventarioService, private balance:CorteService,  private fb: NonNullableFormBuilder){
  }


  @Input() id:string = ''
  inventario?:IngredienteInv | any = undefined;
  inventarios$?:Observable<IngredienteInv[] | undefined> = of([])
  
  form: FormGroup<any> = this.fb.group({
    nombre: [{value: '', disabled: true}, [Validators.required], ],
    disponible: [0, [Validators.required, Validators.min(0)]],
    minPermitible: [0, [Validators.required, Validators.min(1)]],
  });
  
  message?:string = undefined;
  loadingDisable:boolean = false;

  
  
  ngOnInit(){
    this.inventarios.setFranquiciaId = this.id
    this.balance.setFranquiciaId = this.id
    this.inventarios$ = this.inventarios.inventarioConIngredientes$
  }

  inventarioSeleccionado(inventario: IngredienteInv){
    console.log(inventario)
    this.inventario = inventario
    this.message = undefined
    this.form.patchValue(inventario)
    this.form.get('minPermitible')?.patchValue(0)
    this.form.get('disponible')?.patchValue(0)
  }
 
 crear(insumo: IngredienteInv){
   const {minPermitible:costo, ...inventario} = insumo
   if(!(this.inventario && this.inventario.disponible !=undefined && inventario.disponible != undefined) || this.loadingDisable) return
   this.loadingDisable = true
    this.inventario.disponible += (inventario.disponible * unidades[ this.inventario?.unidadInsumo as keyof typeof unidades] )

    const inv = {
      id: this.inventario.id,
      disponible : this.inventario.disponible,
      minPermitible: this.inventario.minPermitible ?? 0,
      minResurtir: this.inventario.minResurtir,
      resurtir: this.inventario.resurtir
    }

    this.inventarios.actualizarInventario(inv, this.id).pipe(switchMap(()=> this.balance.crearRegistroBlance(this.inventario.nombre,-(costo ?? 0)))).subscribe({
      complete: () => {
        this.message = "El insumo fue Actualizado"; 
        this.loadingDisable =false
        this.inventario = undefined; 
        this.form.get('disponible')?.patchValue(0); 
      },
      error: ()=> {this.loadingDisable = false; this.message = 'Error de conexion. Intente de nuevo'}
    })
  }
}
