import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ProductService } from '../../../api/product/product.service';
import {  FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, catchError,debounceTime, delay, map,  mergeWith, of, startWith, switchMap, take, takeUntil, tap, } from 'rxjs';
import { Producto } from '../../../models/producto.model';
import { FormComponent } from '../../../shared/components/form/form.component';
import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { TypeaheadComponent } from '../../../shared/components/typeahead/typeahead.component';
import { CajaService } from '../../../api/ventas/caja.service';
import { RouterLink } from '@angular/router';
import { ComboService } from '../../../api/ventas/combo.service';
import { Evento } from '../../../models/evento.model';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { UsuariosService } from '../../../api/usuario/usuarios.service';
import { ImprimirComponent } from '../imprimir/imprimir.component';

@Component({
  selector: 'app-venta',
  standalone: true,
  imports:  [
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
  templateUrl: './venta.component.html',
  styleUrl: './venta.component.css',
})
export class VentaComponent {
  constructor(private fb: NonNullableFormBuilder, private pService: ProductService, private caja: CajaService, private comboService:ComboService, private usuario:UsuariosService){
  } 
  
  @Input() id = ''
  
  productoSub$:BehaviorSubject<Observable<any[]>> = new BehaviorSubject(of([]) as Observable<any[]>)
  productos$:Observable<any[]> = this.productoSub$.asObservable().pipe(switchMap(o => o), tap(p => {
    if(!this.esCombo) this.productos = p
    else this.combos = p
  }))
  productosEnCaja: Producto[] = []
 


  form: FormGroup<any> = this.fb.group({
    total: [0, [Validators.required, Validators.min(0)]],
    descuentos: this.fb.array([] as FormControl[], Validators.required),
  });
  
  formInicioTurno: FormGroup<any> = this.fb.group({
    balanceInicial: ["", [Validators.required, Validators.min(0)]],
  });

  formGerente: FormGroup<any> = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    contraseña: ["", [Validators.required]],
  });

  formCondo: FormGroup<any> = this.fb.group({
    condonacion: ["", Validators.required],
    justificacion: ["", Validators.required],
  });
  
  onDestroy$: Subject<boolean> = new Subject();
  productos:Producto[] = []
  combos:Evento[] = []
  
  esCombo: boolean = false;
  contadorCombosEnCaja = 0
  ticketCondonado:boolean = false
  advertenciaFecha:boolean = false

  authGerente: boolean = false;
  authMessage?:string = undefined
  error?:string = undefined

  inicioTurno: boolean = true;
  estadoCaja: any = {estado: true, balanceInicial:0, ingreso: 0}

  @ViewChild('modal') modal?: ElementRef;

  ngOnInit(){
    this.caja.setFranquiciaId = this.id
    this.caja.estadoTurno().subscribe(e => this.inicioTurno = !(e.estado))
    console.log('Inicio TUrno', this.inicioTurno)
    this.caja.resetearHashmapIngredientes()
    this.productoSub$.next(this.pService.obtenerProductos().pipe( 
      mergeWith(this.caja.initInventarios$), 
      catchError((e)=> {this.error = "Error de Conexión, Intente Recargar"; return []})).pipe(tap(console.log),  
      ) )
  }


  get formStatus$(){
    return this.caja.validezOrden$.pipe(map(v => v && !this.form.invalid)) 
  }

  get total(){
    return this.form.get('total')
  }
  
  get descuentos(){
    return this.form.get('descuentos') as FormArray
  }

  comenzarTurno(){
    const ft = this.formInicioTurno.value
    this.caja.comenzarTurno(ft.balanceInicial).subscribe({complete: ()=> this.inicioTurno = false})
  }
  terminarTurno(){
    this.caja.terminarTurno().pipe(tap(()=> 
    this.estadoCaja = this.caja.EstadoCaja), 
    switchMap(()=> this.caja.crearTicketTerminoTurno()),
    delay(30)).subscribe({complete: ()=> {this.inicioTurno = true; window.print()}})
    this.formInicioTurno.reset()
  }

  calcularSubTotal(producto:Producto){
    
    if(producto.precio==undefined) return producto as (Producto & {subTotal:number, idCaja:string})
    const prod = producto as (Producto & {subTotal:number, idCaja:string}) ?? {...new Producto(), subTotal: 0}
    Object.assign(prod, producto) 
    prod.descuento = 0
    var parcial =  (producto.precio*(1 - ((producto.descuento ?? 0)/100)))
    prod.subTotal = this.esCombo ? producto.precio: Math.round(((parcial+Number.EPSILON) *100)/100)
    console.log(parcial, parcial + Number.EPSILON, Math.round((parcial + Number.EPSILON) * 100) / 100, prod.subTotal)
    return prod
  }

  agregarDescuento(producto:Producto){
    var desc = this.fb.group({
      id: [producto.id],
      esCombo: [this.esCombo],
      nombre: [producto.nombre],
      precio: [producto.precio],
      descuento: [{value:0, disabled: this.esCombo},[Validators.min(0), Validators.max(100)]],
      subTotal: [producto.precio],
    })
    
    if(!this.esCombo){
      desc.get('descuento')?.valueChanges.pipe(
        takeUntil(this.onDestroy$),
        switchMap(v=> of(v)),
        tap(()=> this.authGerente =  this.ticketCondonado ? false : true), 
        startWith(-1),
        debounceTime(200),
        tap(d => this.total?.patchValue(this.total.value - (d == -1 ? 0: (desc.get('subTotal')?.value ?? producto.precio ?? 0)))),
        tap(d => {if(d == undefined){desc.get('descuento')?.patchValue(0)}}),
        map(d => d ==-1 ? 0: d),
        tap(d =>{
          var parcial = ((producto.precio ?? 0)*(1 - ((d ?? 0)/100)))
          // console.log( parcial, Math.round(((parcial+Number.EPSILON) *100)/100))
          console.log( parcial, )
          // desc.get('subTotal')?.patchValue( Math.round(((parcial+Number.EPSILON) *100)/100))
          desc.get('subTotal')?.patchValue(  Math.round(parcial *100)/100)
        }),
        tap(() => {if(!this.ticketCondonado)this.total?.patchValue(this.total.value + desc.get('subTotal')?.value)}),
        tap(d => this.authGerente = !(d ==0 || d==-1))
        
        ).subscribe()
    }
  
    return desc
  }

  removerProducto(idx:number){
    if(! this.descuentos.at(idx).value || this.ticketCondonado) return
    
    
    if(this.descuentos.at(idx).get('esCombo')?.value){
      console.log('Removing Combo')
      const {id} = this.descuentos.at(idx).value as (Evento & {subTotal:number, idCaja:string}) ?? {...new Evento(), subTotal: 0}
      this.removerCombo(id ?? '', idx)  
    }else{
      const {id} =  this.descuentos.at(idx).value as (Producto & {subTotal:number, idCaja:string}) ?? {...new Producto(), subTotal: 0}
      const prod = this.productos.find(p=> p.id == id)
      if(!prod) return
      this.caja.removeHashMapIngredientes =  prod.ingredientesBase ?? []
      this.total?.patchValue(this.total?.value - this.descuentos.at(idx).get('subTotal')?.value)
      this.productosEnCaja.splice(idx, 1);
    }
    this.descuentos.removeAt(idx)

  }

  productoSeleccionado(producto:Producto){
    if(this.ticketCondonado || this.inicioTurno) return
    this.advertenciaFecha = false
    var productosCombo:Producto[] = []
    const combo = producto as Evento
    if(this.esCombo){
      this.advertenciaFecha = !!(new Date(combo.fechaFin ?? '') < new Date())
      if(this.advertenciaFecha) return

      productosCombo = this.comboSeleccionado(combo)
    }else{
      this.caja.setHashMapIngredientes(producto.ingredientesBase ?? [])
    }
    
    if(this.caja.validezOrdenSub$.getValue()){
      if(this.esCombo){
        this.descuentos.push(this.agregarDescuento(combo))
        this.total?.patchValue(this.total.value + combo.precio)  
        this.productosEnCaja = this.productosEnCaja.concat(productosCombo)     
      }else{
        this.productosEnCaja.push(this.calcularSubTotal(producto))     
        this.descuentos.push(this.agregarDescuento(producto))
      }
    }else{
      this.total?.setErrors({'required': true})
      this.caja.validezOrdenSub$.next(true)
    }


  }


  empujarProductoCaja(producto:Producto){
     if(this.caja.validezOrdenSub$.getValue()){
      
      if(!this.esCombo){
        this.descuentos.push(this.agregarDescuento(producto))
      }

      this.productosEnCaja.push(this.calcularSubTotal(producto))     
    }else{
      this.total?.setErrors({'required': true})
      this.caja.validezOrdenSub$.next(true)
    }
  }

  comboSeleccionado(combo: Evento){
    console.log(combo)
    var productosCombo:Producto[] = [] 
    this.contadorCombosEnCaja += 1
    combo.promocion?.forEach(p => {
      var prod =this.productos.find(prod => prod.id == p.id ) ?? {}
      console.log('Producto combo', prod, this.productos)
      this.caja.setHashMapIngredientes(prod?.ingredientesBase ?? [], true)
      productosCombo.push(prod)
    })

    if(!this.caja.validezOrdenSub$.getValue()){
      combo.promocion?.forEach(p  => {
        var prod =this.productos.find(prod => prod.id == p.id ) ?? {}
        console.log('Producto combo', prod, this.productos)
        this.caja.removeHashMapIngredientes = prod?.ingredientesBase ?? []
        
      })
      productosCombo = []
      this.contadorCombosEnCaja-=1
    }
    return productosCombo
  }

  removerCombo(id:string, idx:number){
    const combo = this.combos.find(c => c.id == id)
    if(!combo || this.ticketCondonado) return


    combo.promocion?.forEach(p => {
      var idx =this.productosEnCaja.findIndex(prod => prod.id == p.id ) ?? {}
      var prod =this.productos.find(prod => prod.id == p.id ) ?? {} // TODO: Substitute for productoEnCaja[idx]
      this.caja.removeHashMapIngredientes = prod.ingredientesBase ?? []
      this.productosEnCaja.splice(idx, 1);
    })
    this.total?.patchValue(this.total?.value - (combo.precio ?? 0))
    this.contadorCombosEnCaja -=1
  }


  aplicarCondo(){
    if(this.formCondo.invalid) return
    this.ticketCondonado=true
    this.descuentos.controls.forEach(c => c.patchValue({descuento: 100, subTotal: c.get('precio')?.value}))
    // this.total?.patchValue(0)
  }


  adminCombos(esCombo: boolean){
    this.esCombo = esCombo
    if(esCombo){
      this.productoSub$.next(this.comboService.obtenerCombo())
    }else{
      this.productoSub$.next(this.pService.obtenerProductos())
    }
  }

  autorizarDescuento(){
    console.log('AUTORIZACION')
    if(this.formGerente.invalid) return
    const credencial = this.formGerente.value

    this.usuario.obtenerManagerAutorizado(credencial.email, credencial.contraseña, this.id).pipe(
      take(1),
      map(u => !!(u[0] !=undefined)),
      tap(()=> this.authGerente = false)
    ).subscribe(
      f => {
      if(f) {
        this.crear();
        this.authMessage = 'Autorizacion Exitosa'
        this.formCondo.reset()
        this.ticketCondonado = false
      }
      else{
        this.form.get('total')?.setErrors({'required': true}) 
        this.formCondo.reset()
        this.authMessage = 'Credenciales incorrectas. Intente de nuevo'
        this.ticketCondonado = false
      }}
    )

  }

  limpiarValidacionActualizarForm(){
    this.form.clearValidators()
    this.form.updateValueAndValidity()
  }

  crear(){
    const f = this.form.value

    if(!this.formCondo.invalid){
      this.caja.ordenVenta.tipoCondonacion = this.formCondo.get('condonacion')?.value
      this.caja.ordenVenta.justificacion = this.formCondo.get('justificacion')?.value
    }
    this.caja.ordenVenta.total = this.total?.value
    this.caja.ordenVenta.productos = f.descuentos
    this.caja.productosEnCaja = this.productosEnCaja
    console.log(this.productosEnCaja)
  
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.unsubscribe();
  }

}
