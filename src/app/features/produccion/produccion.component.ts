import { Component, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { FormComponent } from '../../shared/components/form/form.component';
import { RouterLink } from '@angular/router';
import { ImprimirComponent } from '../venta/imprimir/imprimir.component';
import { Observable, catchError, ignoreElements, map, mergeWith, switchMap } from 'rxjs';
import { Producto } from '../../models/producto.model';
import { ProductService } from '../../api/product/product.service';
import { CajaService } from '../../api/ventas/caja.service';
import { Movimiento } from '../../models/movimiento.model';
import { InventarioService } from '../../api/ingredientes/inventario.service';

@Component({
  selector: 'app-produccion',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    TypeaheadComponent, 
    AsyncPipe, 
    CommonModule, 
    FormInputComponent, 
    FormComponent, 
    CurrencyPipe, 
    RouterLink,
    ImprimirComponent,
  ],
  templateUrl: './produccion.component.html',
  styleUrl: './produccion.component.css'
})
export class ProduccionComponent {

  constructor(private fb: NonNullableFormBuilder, private pService: ProductService, private caja: CajaService){
  } 
  
  @Input() id = ''
  
  productos$?:Observable<Producto[]>
  productosEnCaja: Producto[] = []
  loadingDisable = false
  message?:string = undefined

  form: FormGroup<any> = this.fb.group({
    nombre: [0, [Validators.required, Validators.min(0)]],
    cantidadAProducir: [0, [Validators.required, Validators.min(0)]],
  });
  
  jarabe?:Producto = undefined
  
  error?:string = undefined

  ngOnInit(){
    this.caja.setFranquiciaId = this.id
    this.caja.resetearHashmapIngredientes()
    this.productos$ = this.pService.obtenerJarabes().pipe( 
      mergeWith(this.caja.initInventarios$), 
      catchError((e)=> {this.error = "Error de Conexión, Intente Recargar"; return []}))
  }


  get formStatus$(){
    return this.caja.validezOrden$.pipe(map(v => v && !this.form.invalid)) 
  }

  get total(){
    return this.form.get('total')
  }


  productoSeleccionado(jarabe:Producto){
    console.log(jarabe)
    this.form.patchValue(jarabe)
    this.jarabe = jarabe
  }


  limpiarValidacionActualizarForm(){
    this.form.clearValidators()
    this.form.updateValueAndValidity()
  }

  crear(jarabe:any){
    if(!this.jarabe?.cantidadPorReceta) return

    if(this.jarabe.cantidadPorReceta > jarabe.cantidadAProducir){
      alert("La cantidad a producir debe ser mayor que el minimo por receta y preferiblemente un multiplo de esta")
      return
    }
    
    const vecesAReducir  = jarabe.cantidadAProducir  / this.jarabe.cantidadPorReceta

    console.log(vecesAReducir)
    const jarabeTemp:Producto = this.jarabe

    jarabeTemp.ingredientesBase?.forEach(ing => ing.cantidad = (ing.cantidad ?? 0 )* vecesAReducir)
    this.caja.setHashMapIngredientes(this.jarabe.ingredientesBase ?? [])
 
    if(!this.caja.validezOrdenSub$.getValue()){
      this.form.get('cantidadAProducir')?.setErrors({'required': true})     
      this.caja.validezOrdenSub$.next(true)
      return
    } 

    
    this.caja.inventarioLotes$(true).subscribe({
      complete: () => { 
        this.message = "El insumo fue Actualizado"; 
        this.loadingDisable =false
        this.jarabe = undefined; 
        this.form.reset()
        this.caja.resetearHashmapIngredientes()
      },
      error: ()=> {this.loadingDisable = false; this.message = 'Error de conexion. Intente de nuevo'; 
      this.caja.resetearHashmapIngredientes()}
    })
  }


}
