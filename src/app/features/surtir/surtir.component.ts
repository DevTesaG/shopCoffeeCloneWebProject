import { Component, Input } from '@angular/core';
import { InventarioService } from '../../api/ingredientes/inventario.service';
import { CorteService } from '../../api/ventas/corte.service';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IngredienteInv } from '../../models/ingrediente-inv.model';
import { BehaviorSubject, catchError, from, map, mergeMap, Observable, of, switchMap, tap } from 'rxjs';
import { AsyncPipe, CommonModule, UpperCasePipe } from '@angular/common';
import { ListComponent } from '../../shared/components/list/list.component';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../shared/components/form/form.component';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { IngredientOrdersService } from '../../services/ingredient-orders.service';
import { IngredientOrder } from '../../models/ingredient-order.model';
import { Ingrediente } from '../../models/ingrediente.model';


enum unidades {
  kilos = 1000,
  litros = 1000,
  piezas = 1,
  docenas = 12
}

@Component({
  selector: 'app-surtir',
  standalone: true,
  imports: [AsyncPipe, ListComponent, TypeaheadComponent, CommonModule, FormComponent, FormInputComponent, ReactiveFormsModule, UpperCasePipe],
  templateUrl: './surtir.component.html',
  styleUrl: './surtir.component.css'
})
export class SurtirComponent {
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
  entregar = false
  
  form: FormGroup<any> = this.fb.group({
    nombre: ["", [Validators.required, Validators.maxLength(50)]],
    fecha_emision: [this.formatDate(new Date()), [Validators.required, Validators.maxLength(50)]],
    estatus: [{value:"espera", disabled:true}, [Validators.required]],
    ingredientes: this.fb.array([] as FormGroup[], Validators.required),
  });


  ngOnInit(){
    var id_route = this.id.split('_')
    console.log(id_route)
    if(id_route.length > 1 ){
      this.id = id_route[0]
      this.entregar = true
    }
    
    this.orders.franquiciaId = this.id
    this.inventarios.setFranquiciaId = this.id
    this.productoSub$.next(this.orders.obtenerOrdenes())
  }

  get ingredientes(){
    return this.form.get('ingredientes') as FormArray
  }
  
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

  crearIngredienteForm({id, nombre, unidadInsumo, cantidad}: Ingrediente & {cantidad: number}){
    return this.fb.group({
      id: [id],
      nombre: [nombre],
      cantidad: [cantidad ?? 0, [Validators.min(1), Validators.pattern(/^[0-9]*$/)]],
      unidades: [unidadInsumo]
    })
  }


  removerIngrediente(coleccion:boolean, idx:number){
    this.ingredientes.removeAt(idx)
  }


  productoSeleccionado(ingredienteProducto: IngredientOrder | Ingrediente){
    if(this.ingrediente){
      var ing = ingredienteProducto as Ingrediente
       
      if(this.ingredientes.controls.findIndex(c => c.get('id')?.value == ing.id) != -1) return
      this.ingredientes.push(this.crearIngredienteForm({cantidad:0, ...ing}))
    }else{
      const order = ingredienteProducto as IngredientOrder
      this.order = order
      this.nuevoProducto = false
      this.message = undefined
      console.log(order)
      this.form.patchValue(order)
      
      this.ingredientes.controls = []

      this.ingredientes.controls = order.ingredientes?.map(i => this.crearIngredienteForm(i)) ?? []
    }
  }


  marcarSalida(){
    if(!this.order?.id) return

    var {id, ...order} = this.order
    
    order.estatus = 'en_progreso'
    this.orders.crearOrden(order, id).subscribe({ complete: () => {
      this.message = "Orden Creada"; 
      this.reset(); 
     },
    error: ()=> {this.message = 'Error de conexion. Intente de nuevo'}
})

  }

  eliminar(){
    if(!this.order?.id) return
    
    if(this.entregar){
      this.marcarSalida()
      return
    }


    this.productoSub$.next(this.inventarios.inventarioConIngredientes$)

    var {id, ...order} = this.order
    order.estatus = 'entregada'
    this.orders.crearOrden(order, id).pipe(
      switchMap(()=> {
        return from(this.order?.ingredientes ?? []).pipe(
        mergeMap(ing => this.productoSub$.getValue().pipe(switchMap(invs => {
          const {disponible, ...inv} = invs.find(inv => inv.id == ing.id)
          console.log(inv, id,  disponible)

          if(inv){
            return this.inventarios.actualizarInventario({disponible: disponible + ing.cantidad, ...inv}, this.id) 
          }
          return of(null)
        })))
        )
      }),
      catchError(err => {
        console.error('Error updating inventory:', err);
        return of(null); // Handle error appropriately
      })
    ).subscribe({ complete: () => {
      this.productoSub$.next(this.orders.obtenerOrdenes())
      this.message = "Orden Entregada"; 
      this.reset(); 
    },
    error: ()=> {this.message = 'Error de conexion. Intente de nuevo'}
})

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
    if(!this.ingrediente){
      this.productoSub$.next(this.orders.obtenerOrdenes())
    }else{
      this.productoSub$.next(this.inventarios.inventarioConIngredientes$)
    }
  }

  reset(){
    this.nuevoProducto = false
    this.order = undefined
    this.form.reset()
    this.ingredientes.controls = []
  }

 



 crear(order: IngredientOrder){
  if(!this.nuevoProducto && !this.order?.id) return


  if(this.order!=undefined && this.order.estatus != 'espera'){
    alert('Esta orden ya fue procesada. No es posible modificar')
    return
  }
  
  
  order.estatus = 'espera'
  order.ingredientes?.forEach(ing => ing.cantidad = ing.cantidad * unidades[ing.unidades as keyof typeof unidades])

this.orders.crearOrden(order, this.order?.id).subscribe({ complete: () => {
          this.message = "Orden Creada"; 
          this.reset(); 
         },
        error: ()=> {this.message = 'Error de conexion. Intente de nuevo'}
  })


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



 actualizarInventario(insumo: IngredienteInv){
  //  var {minPermitible:costo, ...inventario} = insumo
  //  if(!(this.inventario && this.inventario.disponible !=undefined && inventario.disponible != undefined) || this.loadingDisable) return
  //  this.loadingDisable = true
  //  if(this.modoEntrega){
  //    this.inventario.disponible -= (inventario.disponible * unidades[ this.inventario?.unidadInsumo as keyof typeof unidades] )
  //   }else{
  //     costo = -(costo ?? 0)
  //     this.inventario.disponible += (inventario.disponible * unidades[ this.inventario?.unidadInsumo as keyof typeof unidades] )
  //   }

  //   const inv = {
  //     id: this.inventario.id,
  //     disponible : this.inventario.disponible,
  //     minPermitible: this.inventario.minPermitible ?? 0,
  //     minResurtir: this.inventario.minResurtir,
  //     resurtir: this.inventario.resurtir
  //   }

  //   this.inventarios.actualizarInventario(inv).pipe(
  //     switchMap(()=> this.balance.crearRegistroBlance(this.inventario.nombre, +(costo ?? 0)))
  //   ).subscribe({
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
