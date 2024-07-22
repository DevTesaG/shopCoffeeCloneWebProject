import { Component } from '@angular/core';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, catchError, interval, map, mergeAll, of, switchMap, take, tap, toArray} from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Producto } from '../../models/producto.model';
import { Ingrediente } from '../../models/ingrediente.model';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../shared/components/form/form.component';
import { ProductService } from '../../api/product/product.service';
import { IngredienteService } from '../../api/ingredientes/ingrediente.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule, FormInputComponent, TypeaheadComponent, AsyncPipe, CommonModule, FormComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent {

  producto?: Producto;
  productoSub$:BehaviorSubject<Observable<any[]>> = new BehaviorSubject(of([]) as Observable<any[]>)
  ingredientesProdutcto$:Observable<Producto[] | Ingrediente[]> = this.productoSub$.asObservable().pipe(switchMap(o=>o))
  error?:string = undefined
  message?:string = undefined
  nuevoProducto = false
  ingrediente = false
  cargando = false
  alertColor = true
  esJarabe = false

  form: FormGroup<any> = this.fb.group({
    receta: ["", [Validators.required, Validators.maxLength(500)]],
    nombre: ["", [Validators.required, Validators.maxLength(50)]],
    descuento: [0, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(/^[0-9]+(.[0-9]{0,1})?$/)]],
    precio:[0, [Validators.required, Validators.min(0), Validators.max(200), Validators.pattern(/^[0-9]+(.[0-9]{0,1})?$/)]],
    esJarabe:[false, Validators.required],
    cantidadPorReceta:[0, [Validators.required, Validators.min(1)]],
    ingredientesAgregables: this.fb.array([] as FormGroup[]),
    ingredientesBase: this.fb.array([]),
  });

  constructor(private fb: NonNullableFormBuilder, private pService: ProductService, private ingredientes: IngredienteService){
  } 

  ingJoinProd$ = this.ingredientes.obtenerIngredientesMap$.pipe(tap(console.log), switchMap(m => this.pService.obtenerProductos().pipe(
    take(1),
    mergeAll(),
    tap(p => p.ingredientesBase?.map(ing => Object.assign(ing, m.get(ing.id ?? '')))),
    tap(p => p.ingredientesAgregables?.map(ing => Object.assign(ing, m.get(ing.id ?? '')))),
    toArray()
  ))
).pipe(catchError((e)=> {this.error = "Error de Conexión, Intente recargar"; return []}))
  
  ingJoinJarabe$ = this.ingredientes.obtenerIngredientesMap$.pipe(switchMap(m => this.pService.obtenerJarabes().pipe(
    take(1),
    mergeAll(),
    tap(p => p.ingredientesBase?.map(ing => Object.assign(ing, m.get(ing.id ?? '')))),
    tap(p => p.ingredientesAgregables?.map(ing => Object.assign(ing, m.get(ing.id ?? '')))),
    toArray(),
  ))
).pipe(catchError((e)=> {this.error = "Error de Conexión, Intente recargar"; return []}))


  ngOnInit(){
    this.productoSub$.next(this.ingJoinProd$)
  }

  get ingredientesAgregables(){
    return this.form.get('ingredientesAgregables') as FormArray
  }

  get ingredientesBase(){
    return this.form.get('ingredientesBase') as FormArray
  }
  
  crearIngredienteForm(id:string, nombre:string, unidades:string, cantidad?:number){
    return this.fb.group({
      id: [id],
      nombre: [nombre],
      cantidad: [cantidad ?? 0, [Validators.min(0), Validators.pattern(/^[0-9]*$/)]],
      unidades: [unidades]
    })
  }


  removerIngrediente(coleccion:boolean, idx:number){
    if(coleccion){
      this.ingredientesBase.removeAt(idx)
    }else{
      this.ingredientesAgregables.removeAt(idx)
    }
  }


  moverIngAgregables(ing: Ingrediente, idx?:number){
    const arr = this.ingredientesAgregables.value as any []  
    if( arr.findIndex((ingA)=> ingA.id == ing.id) != -1) return
    
    if(idx) this.removerIngrediente(true, idx)
    this.ingredientesAgregables.push(this.crearIngredienteForm(ing.id??'', ing.nombre ?? '', ing.unidadConsumo ?? ''))
  }

  moverIngBase(ing: Ingrediente, idx?:number){
    const arr = this.ingredientesBase.value as any []  
    if( arr.findIndex((ingA)=> ingA.id == ing.id) != -1) return 
    
    if(idx) this.removerIngrediente(false, idx)
    this.ingredientesBase.push(this.crearIngredienteForm(ing.id ?? '', ing.nombre ?? '', ing.unidadConsumo ?? ''))
  }

  productoSeleccionado(ingredienteProducto: Producto | Ingrediente){
    if(this.ingrediente){
      this.moverIngBase(ingredienteProducto as Ingrediente)
    }else{
      const pro = ingredienteProducto as Producto
      this.producto = pro
      this.nuevoProducto = false
      this.message = undefined
      console.log(pro)
      this.form.patchValue(pro)
      
      this.ingredientesAgregables.controls = []
      this.ingredientesBase.controls = []

      pro.ingredientesBase?.forEach((ing:any) => { 
        if(ing.id != pro.id){
          this.ingredientesBase.push(this.crearIngredienteForm(ing.id, ing.nombre, ing.unidadConsumo, ing.cantidad))
        }
      })
      pro.ingredientesAgregables?.forEach((ing:any) => {
        this.ingredientesAgregables.push(this.crearIngredienteForm(ing.id, ing.nombre, ing.unidadConsumo, ing.cantidad))
      })
    }
  }

  eliminar(){
    if(!this.producto) return 
    this.cargando = true
    if(this.producto.esJarabe){
      console.log(this.producto.id)
      this.pService.eliminarProducto(this.producto.id ?? '', true).pipe(
        switchMap(()=> this.ingredientes.eliminarIngrediente(this.producto?.id ?? ''))
        ).subscribe({
        complete: () => {this.message = "El Jarabe fue Eliminado"; this.alertColor= true; this.reset(); this.cargando = false},
        error: (e:Error)=> {this.cargando = false; this.alertColor=false; this.message = e.message ? e.message : "Error de conexion. Intente de nuevo"; }
      })
    }else{

      this.pService.eliminarProducto(this.producto.id ?? '').subscribe({
        complete: () => {this.message = "El producto fue Eliminado"; this.alertColor= true; this.reset(); this.cargando = false},
        error: (e:Error)=> {this.cargando = false; this.alertColor=false; this.message = e.message ? e.message : "Error de conexion. Intente de nuevo"; }
      })
    }
 
 
  }

  crearProducto(){
    this.reset()
    this.nuevoProducto = true
  }

  adminIngredientes(state:boolean){
    this.ingrediente = state;
    if(this.ingrediente){
      this.productoSub$.next(this.ingredientes.obtenerIngredientes())
    }else if(this.esJarabe){
      this.productoSub$.next(this.ingJoinJarabe$)
    }else{
      this.productoSub$.next(this.ingJoinProd$)
    }
  }

  reset(){
    this.nuevoProducto = false
    this.producto = undefined
    this.form.reset()
    this.ingredientesAgregables.controls = []
    this.ingredientesBase.controls = []
  }

  adminJarabes(esJarabe: boolean){
    this.esJarabe = esJarabe
    if(esJarabe){
      this.productoSub$.next(this.ingJoinJarabe$)
    }else{
      this.productoSub$.next(this.ingJoinProd$)
    }
  }

  crear(producto: Producto){
    this.cargando = true
    producto.ingredientesAgregables = producto.ingredientesAgregables?.map(mov => ({id:mov.id, cantidad: mov.cantidad}))
    producto.ingredientesBase =  producto.ingredientesBase?.map(mov => ({id:mov.id, cantidad: mov.cantidad}))

    
    
    if(!this.producto) {
      producto.esJarabe = (producto.esJarabe as unknown) == "true"

      if(producto.esJarabe){
        const ingrediente:Ingrediente = {
          nombre: producto.nombre,
          unidadConsumo: "mililitros",
          unidadInsumo: "litros",
          ingredienteAñadible: false,
          topping: false,
        }
        

        this.pService.crearJarabe(producto).pipe(
          take(1),
          tap(id => console.log('crear producto', id)),
          switchMap(id=> this.ingredientes.crearIngrediente(ingrediente, id))
        ).subscribe({
          complete: () => {this.message = "El producto fue Creado"; this.alertColor=true; this.reset(); this.cargando = false},
          error: ()=> {this.cargando = false; this.alertColor=false; this.message = 'Error de conexion. Intente de nuevo'}
        })
      }else{
        producto.cantidadPorReceta = 0
        this.pService.crearProducto(producto).subscribe({
          complete: () => {this.message = "El producto fue Creado"; this.alertColor=true; this.reset(); this.cargando = false},
          error: ()=> {this.cargando = false; this.alertColor=false; this.message = 'Error de conexion. Intente de nuevo'}
        })
      }
    }else{
      Object.assign(this.producto, producto)
      if(producto.esJarabe){
        this.pService.actualizarJarabe(this.producto).subscribe({
          complete: () => {this.message = "El producto fue Actualizado"; this.alertColor=true; this.reset(); this.cargando = false},
          error: ()=> {this.cargando = false; this.alertColor = false; this.message = 'Error de conexion. Intente de nuevo'}
        })
      }else{
        producto.cantidadPorReceta = 0
        this.pService.actualizarProducto(this.producto).subscribe({
          complete: () => {this.message = "El producto fue Actualizado"; this.alertColor=true; this.reset(); this.cargando = false},
          error: ()=> {this.cargando = false; this.alertColor = false; this.message = 'Error de conexion. Intente de nuevo'}
        })
      }
    }
  }
}