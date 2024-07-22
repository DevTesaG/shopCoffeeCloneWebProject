import { Component } from '@angular/core';
import { CajaService } from '../../../api/ventas/caja.service';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../../models/producto.model';
import { TypeaheadComponent } from '../../../shared/components/typeahead/typeahead.component';
import { Movimiento } from '../../../models/movimiento.model';
import { RouterLink } from '@angular/router';
import { ImprimirComponent } from '../imprimir/imprimir.component';
import {BehaviorSubject, Observable, Subject, delay,  filter,  of,  pairwise,  startWith,  switchMap,  take, takeUntil, tap } from 'rxjs';
import { IngredienteService } from '../../../api/ingredientes/ingrediente.service';
import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { Ingrediente } from '../../../models/ingrediente.model';

@Component({
  selector: 'app-preparacion-productos',
  standalone: true,
  imports: [ReactiveFormsModule, TypeaheadComponent, RouterLink, ImprimirComponent, CurrencyPipe, AsyncPipe, CommonModule],
  templateUrl: './preparacion-productos.component.html',
  styleUrl: './preparacion-productos.component.css'
})
export class PreparacionProductosComponent {
  constructor(private fb: NonNullableFormBuilder, private caja: CajaService, private ingredientes: IngredienteService){}

  productoSub$:BehaviorSubject<Observable<any[]>> = new BehaviorSubject(of([]) as Observable<any[]>)
  productos$:Observable<any[]> = this.productoSub$.asObservable().pipe(switchMap(o => o))
  onDestroy$: Subject<boolean> = new Subject();

  productosEnCaja:(Producto & {idCaja:string})[] = []
  indiceProductoSeleccionado:number = 0
  ordenId:string = ''
  ordenTotal=0
  esTopping = false
  toppings:any[] = []
  
  form: FormGroup<any> = this.fb.group({
    ingredientesAgregablesProductos: this.fb.array([] as any, Validators.required),
  });

  getIngredientesAgregables(idx: number){
    return this.ingredientesAgregablesProductos.at(idx) as FormArray
  }
  
  get ingredientesAgregablesProductos(){

    return this.form.get('ingredientesAgregablesProductos') as any
  }

  ngOnInit(){
      this.ordenTotal = this.caja.ordenVenta.total ?? 0
      this.ingredientes.obtenerIngredientesMap$.pipe(take(1), switchMap(()=> this.ingredientes.obtenerIngredientes().pipe(
       take(1)
      ))).subscribe( ing => {
        this.toppings =  ing.filter(ing => ing.topping)
        console.log(this.toppings)
      })
      this.productosEnCaja = this.caja.productosEnCaja.map( (p, idx) =>{ 
        const prod = {...p} as Producto & {idCaja:string}; 
        prod.idCaja = ''+idx; 
        
        return prod
      })
      this.initForm()
  }

  adminTopping(checked:boolean){
    this.esTopping = checked
  }


  crearIngredienteAgregable(ingrediente:any){
    var form = this.fb.group({
      id: [ingrediente.id],
      topping: [!!(ingrediente.topping)],
      cantidadTopping: [!!(ingrediente.topping) ? ingrediente.cantidadTopping: 0],
      nombre: [ingrediente.nombre],
      cantidad: [0, [Validators.required, Validators.min(0), Validators.max(ingrediente.topping ? 5:ingrediente.cantidad), Validators.pattern(/^[0-9]*$/)]],
      max: [!!(ingrediente.topping) ? 5: ingrediente.cantidad],
      unidades: [!!(ingrediente.topping) ? 'extras': ingrediente.unidades],
      costo: [!!(ingrediente.topping) ? ingrediente.precioTopping: 0],
    })

    if(ingrediente.topping){
      form.get('cantidad')?.valueChanges.pipe(
        takeUntil(this.onDestroy$),
        startWith(0),
        pairwise(),  
        tap(([prev, next])=> {
          if(prev) this.ordenTotal -= prev*ingrediente.precioTopping
          if(next) this.ordenTotal += next*ingrediente.precioTopping
        })
      ).subscribe()
    }

    return form
  }

  initForm(){
    this.productosEnCaja.forEach((p:(Producto & {idCaja:string})) => {
      const arr = this.fb.array([] as FormGroup[])
      
      p.ingredientesAgregables?.forEach(ing => {
        arr.push(this.crearIngredienteAgregable(Object.assign(ing, this.ingredientes.ingredientesMap$.getValue().get(ing.id ?? ''))))
      })  

      this.ingredientesAgregablesProductos.push(arr)
    })
  }

  toppingSeleccionado(top:Ingrediente, ){
    this.getIngredientesAgregables(this.indiceProductoSeleccionado).push(this.crearIngredienteAgregable(top))
  }

  removerTopping(idx:number){
    const ing = this.getIngredientesAgregables(this.indiceProductoSeleccionado).at(idx)
    var costo = ing.get('costo')?.value ?? 10 
    var cantidad = ing.get('canitdad')?.value ?? 0
    
    this.ordenTotal -= costo*cantidad

    this.getIngredientesAgregables(this.indiceProductoSeleccionado).removeAt(idx)
  }

  productoSeleccionado(prod:Producto){
    const producto = prod as Producto & {idCaja:string}
    this.indiceProductoSeleccionado = this.productosEnCaja.findIndex(p => p.idCaja === producto.idCaja)
  }


  actualizarIngredientes(ingredientesAgregables: any[], pIdx:number){

    ingredientesAgregables.forEach((ing, idx) => {
      if(ing.topping){
        ing.cantidad *= ing.cantidadTopping
      }
      this.caja.setIngrediente = ing
      if(!this.caja.validezOrdenSub$.getValue()){
        this.caja.validezOrdenSub$.next(true)
        this.getIngredientesAgregables(pIdx).at(idx).get('cantidad')?.setErrors({'max': true})
      }
    })
  }
  
  crearOrden(){
    if(this.form.invalid) return
    this.ingredientesAgregablesProductos.value.forEach((ingredientes:any[], pIdx:number) =>  this.actualizarIngredientes(ingredientes, pIdx))
    if(this.form.invalid){
      alert('Ingredientes Insuficientes')
      return
    }
    // this.caja.comprometerOrden().pipe(
    //   tap(()=>this.ordenId = this.caja.ordenVenta.id ?? ''), 
    //   delay(50)).subscribe({
    //   complete: ()=>window.print(),
    //   error: (e)=> alert('Error de conexión inesperado. Intente de nuevo')
    // })
  } 
  
  
  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.unsubscribe();
  }


}
