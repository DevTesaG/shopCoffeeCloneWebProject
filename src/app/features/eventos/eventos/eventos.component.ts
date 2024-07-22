import { Component, Input } from '@angular/core';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { TypeaheadComponent } from '../../../shared/components/typeahead/typeahead.component';
import { FormComponent } from '../../../shared/components/form/form.component';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ListComponent } from '../../../shared/components/list/list.component';
import { AsyncPipe} from '@angular/common';
import { Producto } from '../../../models/producto.model';
import { ProductService } from '../../../api/product/product.service';
import { ComboService } from '../../../api/ventas/combo.service';
import { Evento } from '../../../models/evento.model';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [AsyncPipe, ListComponent, TypeaheadComponent, FormComponent, FormInputComponent, ReactiveFormsModule],
  templateUrl: './eventos.component.html',
  styleUrl: './eventos.component.css'
})
export class EventosComponent {
 
  private destroy$ = new Subject();
  producto?: Producto;
  combo?: Producto[] = [];


  productoSub$:BehaviorSubject<Observable<any[]>> = new BehaviorSubject(of([]) as Observable<any[]>)
  productos$:Observable<any[]> = this.productoSub$.asObservable().pipe(switchMap(o => o))
  combos$:Observable<Evento[]> = of([])
  error?:string = undefined
  message?:string = undefined
  nuevo = false 
  advertenciaFecha = false
  cargando = false

  form: FormGroup<any> = this.fb.group({
    id:[""],
    nombre:[, Validators.required],
    fechaInicio:[this.toISOLocal(new Date()), Validators.required],
    fechaFin:[this.toISOLocal(new Date()), Validators.required],
    promocion: this.fb.array([] as FormGroup[]),
    precio:[0, [Validators.required, Validators.min(1)]]
  });

  constructor(private fb: NonNullableFormBuilder, private pService: ProductService, private eventoService: ComboService){
  } 

  toISOLocal(adate:any) {
    var localdt = new Date(adate - adate.getTimezoneOffset()*60000);
    localdt.setSeconds(0,0)
    return localdt.toISOString().slice(0, -1); 
  }

  ngOnInit(){ 
    this.combos$ = this.eventoService.obtenerCombo().pipe(tap(console.log),catchError((e)=> {this.error = "Error de Conexión"; return []}))
    this.productoSub$.next(this.combos$)
  }

  get promocion(){
    return this.form.get('promocion') as FormArray
  }
  

  agregarProductoPromo(producto:Producto){
    
    return this.fb.group({
      id: [producto.id],
      nombre: [producto.nombre],
      precio: [producto.precio],
      descuento: [{value: 0, disabled: true},[ Validators.min(1), Validators.max(100)]],
      subTotal: [producto.precio],
    })

  }

  removerProductoPromo(idx:number){
    this.promocion.removeAt(idx)
  }

  productoSeleccionado(producto: Producto){
    if(!this.nuevo){
      this.reset()
    }
    this.producto = producto
    const arr = this.promocion?.value as any []  

    if(!this.nuevo && arr.findIndex(p=> p.id === producto.id) != -1) return //Not new and not present in the list 
 
    if(!this.nuevo){
      const combo = producto as Evento
      this.advertenciaFecha = !!(new Date(combo.fechaFin ?? '') < new Date()) // if not new check if combo expired
      this.form.patchValue(combo)
      console.log('Combo Selected',combo)
      combo.promocion?.forEach(p => this.promocion.push(this.agregarProductoPromo(p)))
    }else{
      this.promocion.push(this.agregarProductoPromo(producto))
    }
  }

  eliminar(){
    if(!this.producto) return 
    this.eventoService.eliminarCombo(this.producto.id ?? '').subscribe({
      complete: () => {this.producto = undefined, this.message = "El producto fue Eliminado"},
      error: ()=> {this.message = "Error de conexion. Intente de nuevo"; this.cargando = false;}
    })
  }

  adminCombos(){
    this.reset()
    this.productoSub$.next(this.combos$) 
  }

  reset(){
    this.producto = undefined
    this.message = undefined
    this.promocion.controls = []
    this.form.reset()
    this.nuevo = false
    this.advertenciaFecha = false

  }

  nuevoCombo(){
    this.reset()
    this.nuevo = true
    this.productoSub$.next(this.pService.obtenerProductos())
  }

  marcarFormTocado(){
    this.form.markAllAsTouched()
  }

  crear(){
    if(this.cargando) return
    this.cargando = true
    const combo = this.form.value
    console.log(combo)

    if(this.nuevo) {
      this.eventoService.crearCombo(combo).subscribe({
        complete: () => {
          this.message = "El combo fue Creado"
          this.reset(); 
          this.adminCombos()
          this.cargando = false
        },
        error: ()=> {this.message = "Error de conexion. Intente de nuevo"; this.cargando = false}
      })
    }else{
      this.eventoService.actualizarProducto(combo).subscribe({
        complete: () => this.message = "El combo fue Actualizado",
        error: ()=> {this.message = "Error de conexion. Intente de nuevo"; this.cargando = false}
      })
    }
  }

  ngOnDestroy(){
    this.destroy$.next(undefined);
    this.destroy$.complete(); 
  }

}
