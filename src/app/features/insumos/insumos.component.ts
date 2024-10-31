import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ListComponent } from '../../shared/components/list/list.component';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../shared/components/form/form.component';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventarioService } from '../../api/ingredientes/inventario.service';
import { IngredienteInv } from '../../models/ingrediente-inv.model';
import { BehaviorSubject, Observable,of, switchMap } from 'rxjs';
import { CorteService } from '../../api/ventas/corte.service';
import { IngredientOrdersService } from '../../services/ingredient-orders.service';
import { Ingrediente } from '../../models/ingrediente.model';
import { IngredientOrder } from '../../models/ingredient-order.model';

enum unidades {
  kilos = 1000,
  litros = 1000,
  piezas = 1,
  docenas = 12
}

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [AsyncPipe, ListComponent, TypeaheadComponent, CommonModule, FormComponent, FormInputComponent, ReactiveFormsModule],

  templateUrl: './insumos.component.html',
  styleUrl: './insumos.component.css'
})
export class InsumosComponent {
  constructor(private inventarios: InventarioService, private balance:CorteService, private orders: IngredientOrdersService,  private fb: NonNullableFormBuilder){
  }


  @Input() id:string = ''
  order?: IngredientOrder;
  productoSub$:BehaviorSubject<Observable<any[]>> = new BehaviorSubject(of([]) as Observable<any[]>)
  ingredientesProdutcto$:Observable<IngredientOrder[] | Ingrediente[]> = this.productoSub$.asObservable().pipe(switchMap(o=>o))
  error?:string = undefined
  message?:string = undefined
  nuevoProducto = false
  ingrediente = false
  cargando = false
  alertColor = true
  esJarabe = false

  form: FormGroup<any> = this.fb.group({
    nombre: ["", [Validators.required, Validators.maxLength(50)]],
    fecha_emission: [new Date(), [Validators.required, Validators.maxLength(50)]],
    ingredientesAgregables: this.fb.array([] as FormGroup[]),
  });


  ngOnInit(){
    this.productoSub$.next(this.orders.obtenerOrdenes())
  }

  get ingredientesAgregables(){
    return this.form.get('ingredientesAgregables') as FormArray
  }

  get ingredientesBase(){
    return this.form.get('ingredientesBase') as FormArray
  }
  
  crearIngredienteForm({id, nombre, unidadConsumo, cantidad}: Ingrediente & {cantidad: number}){
    return this.fb.group({
      id: [id],
      nombre: [nombre],
      cantidad: [cantidad ?? 0, [Validators.min(0), Validators.pattern(/^[0-9]*$/)]],
      unidades: [unidadConsumo]
    })
  }


  removerIngrediente(coleccion:boolean, idx:number){
    this.ingredientesAgregables.removeAt(idx)
  }


  productoSeleccionado(ingredienteProducto: IngredientOrder | Ingrediente){
    if(!this.order){
      var ing = ingredienteProducto as Ingrediente
      this.ingredientesBase.push(this.crearIngredienteForm({cantidad:0, ...ing}))
    }else{
      const order = ingredienteProducto as IngredientOrder
      this.order = order
      this.nuevoProducto = false
      this.message = undefined
      console.log(order)
      this.form.patchValue(order)
      
      this.ingredientesAgregables.controls = []

      this.ingredientesAgregables.controls = order.ingredientes?.map(i => this.crearIngredienteForm(i)) ?? []
    }
  }

  eliminar(){
    // if(!this.producto) return 
    // this.cargando = true
    // if(this.producto.esJarabe){
    //   console.log(this.producto.id)
    //   this.pService.eliminarProducto(this.producto.id ?? '', true).pipe(
    //     switchMap(()=> this.ingredientes.eliminarIngrediente(this.producto?.id ?? ''))
    //     ).subscribe({
    //     complete: () => {this.message = "El Jarabe fue Eliminado"; this.alertColor= true; this.reset(); this.cargando = false},
    //     error: (e:Error)=> {this.cargando = false; this.alertColor=false; this.message = e.message ? e.message : "Error de conexion. Intente de nuevo"; }
    //   })
    // }else{

    //   this.pService.eliminarProducto(this.producto.id ?? '').subscribe({
    //     complete: () => {this.message = "El producto fue Eliminado"; this.alertColor= true; this.reset(); this.cargando = false},
    //     error: (e:Error)=> {this.cargando = false; this.alertColor=false; this.message = e.message ? e.message : "Error de conexion. Intente de nuevo"; }
    //   })
    // }
 
 
  }

  crearProducto(){
    this.reset()
    this.nuevoProducto = true
  }

  adminIngredientes(state:boolean){
    this.ingrediente = state;
    if(this.ingrediente){
      this.productoSub$.next(this.orders.obtenerOrdenes())
    }else{
      this.productoSub$.next(this.inventarios.inventarioConIngredientes$)
    }
  }

  reset(){
    this.nuevoProducto = false
    this.order = undefined
    this.form.reset()
    this.ingredientesAgregables.controls = []
    this.ingredientesBase.controls = []
  }

 
 crear(insumo: IngredienteInv){
  //  const {minPermitible:costo, ...inventario} = insumo
  //  if(!(this.inventario && this.inventario.disponible !=undefined && inventario.disponible != undefined) || this.loadingDisable) return
  //  this.loadingDisable = true
  //   this.inventario.disponible += (inventario.disponible * unidades[ this.inventario?.unidadInsumo as keyof typeof unidades] )

  //   const inv = {
  //     id: this.inventario.id,
  //     disponible : this.inventario.disponible,
  //     minPermitible: this.inventario.minPermitible ?? 0,
  //     minResurtir: this.inventario.minResurtir,
  //     resurtir: this.inventario.resurtir
  //   }

  //   this.inventarios.actualizarInventario(inv, this.id).pipe(switchMap(()=> this.balance.crearRegistroBlance(this.inventario.nombre,-(costo ?? 0)))).subscribe({
  //     complete: () => {
  //       this.message = "El insumo fue Actualizado"; 
  //       this.loadingDisable =false
  //       this.inventario = undefined; 
  //       this.form.get('disponible')?.patchValue(0); 
  //     },
  //     error: ()=> {this.loadingDisable = false; this.message = 'Error de conexion. Intente de nuevo'}
  //   })
  }
}
