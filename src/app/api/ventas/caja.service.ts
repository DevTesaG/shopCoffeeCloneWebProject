import {  Injectable } from '@angular/core';
import { InventarioService } from '../ingredientes/inventario.service';
import { BehaviorSubject, Observable, catchError, defer, forkJoin, from, ignoreElements, map,mergeMap,of, switchMap, take, tap, throwError, toArray } from 'rxjs';
import { Producto } from '../../models/producto.model';
import { Movimiento } from '../../models/movimiento.model';
import { Router } from '@angular/router';
import { CrudService } from '../../core/services/crud.service';
import { TicketVenta } from '../../models/ticket-venta.model';
import { Evento } from '../../models/evento.model';
import { CorteService } from './corte.service';
import { Timestamp, doc, firestoreInstance$, getFirestore, runTransaction, writeBatch } from '@angular/fire/firestore';
import { IngredienteService } from '../ingredientes/ingrediente.service';

@Injectable({
  providedIn: 'root'
})
export class CajaService {

  private franquiciaId:string = ''
  private hashMapIngredientes: Map<string, number> = new Map()  
  public validezOrdenSub$:BehaviorSubject<boolean> = new BehaviorSubject(true)
  public productosEnCaja:(Producto | Evento) [] = []
  public ordenVenta:TicketVenta = {}
  private estadoCaja:any = {estado: true, balanceInicial:0, ingreso: 0}

  constructor(private inventarios: InventarioService,  private ingredientes: IngredienteService,  private router: Router, private crud:CrudService, private balance:CorteService) { }

  set setFranquiciaId(franquiciaId:string) {
    this.inventarios.setFranquiciaId = franquiciaId
    this.franquiciaId = franquiciaId
  }
  
  get mapIngredientes(){
    return this.hashMapIngredientes
  }

  setHashMapIngredientes(ingredientes: Movimiento[], esCombo?:boolean){
    if(!ingredientes) return  
    if(this.hashMapIngredientes.size > 350){
      alert("No es posible agregar mas productos o ingredientes a esta orden, Favor de agregar este producto o ingrediente en una nueva orden")
      return 
    }
    ingredientes.forEach(ing => this.setIngrediente=ing)
    console.log([...this.hashMapIngredientes.entries()])

    if(!(this.validezOrdenSub$.getValue() || esCombo)){
      this.removeHashMapIngredientes = ingredientes // Rollback
    }
    
  }

  set setIngrediente(ingrediente: Movimiento){
    if(!(ingrediente.id && ingrediente.cantidad)) return
    if(this.hashMapIngredientes.size > 350){
      alert("No es posible agregar mas productos o ingredientes a esta orden, Favor de agregar este producto o ingrediente en una nueva orden")
      return 
    }    

    const cantidad =  this.hashMapIngredientes.get(ingrediente.id)
    const añadir = cantidad ===undefined ? ingrediente.cantidad : ingrediente.cantidad + cantidad
    const inv = this.inventarios.inventariosMap$.getValue().get(ingrediente.id)
    const cantidadActualizada = (inv?.disponible ?? 0) - añadir     
    console.log(cantidadActualizada, inv?.disponible, añadir,  inv?.minPermitible, inv) 
    this.hashMapIngredientes.set(ingrediente.id, añadir)
    if(cantidadActualizada <= (inv?.minPermitible ?? 10)){
      alert( `Ingredientes Insuficientes: Falta ${this.ingredientes.ingredientesMap$.getValue().get(ingrediente.id)?.nombre}` )
      this.validezOrdenSub$.next(false)
    }
  }

  set removeIngrediente(ingrediente: Movimiento){
    if(!ingrediente.id) return 
    var cantidad =  this.hashMapIngredientes.get(ingrediente.id)
    const nuevaCantidad = (cantidad ?? 0) - (ingrediente.cantidad ?? 0)
    if(nuevaCantidad > 0){
      this.hashMapIngredientes.set(ingrediente.id,  nuevaCantidad)
    }else{
      this.hashMapIngredientes.delete(ingrediente.id)
    }
  }

  set removeHashMapIngredientes(ingredientes: Movimiento[]){
    if(!ingredientes) return  
  
    ingredientes?.forEach(ing => this.removeIngrediente = ing)
    
    console.log([...this.hashMapIngredientes.entries()])
  }

  set setEstadoCaja(estado:boolean){
    this.estadoCaja.estado = estado
  }

  get EstadoCaja(){
    return this.estadoCaja
  }

  get validezOrden$(){
    return this.validezOrdenSub$.asObservable().pipe()
  }

  get initInventarios$(){
    // return this.inventarios.hashMapInventarios$.pipe(take(1), switchMap(v => this.ingredientes.obtenerIngredientesMap$.pipe(take(1))))
    return this.inventarios.inventariosJoinIngredientes$.pipe(ignoreElements())


  }

  

  inventarioLotes$(prod?:boolean){
    
    const nuevosInventarios:any[] = []
    var ordenId:string = ''

    this.inventarios.setRuta() //Set route for inventories
    const lote = this.crud.obtenerNuevoLote

    return from(Array.from(this.hashMapIngredientes.keys())).pipe(
      mergeMap(id => this.inventarios.hashMapInventarios$.pipe(map(m => ({id, ...m.get(id)})))),
      tap(inv => {
        if(!(inv && inv.id && inv.disponible !=undefined)) return 
        inv.disponible-= this.hashMapIngredientes.get(inv.id) ?? 0
        inv.resurtir = (inv.minResurtir ?? 10) >= (inv.disponible ?? 0)
        const {id, ...inventario} = inv
        
        lote.set(doc(this.crud.ruta, id), {...inventario})
        nuevosInventarios.push(inv)
      }),
      
      toArray(),
      switchMap(a => prod ? from(a): this.estadoTurno().pipe(tap(e => (e.ingreso = ((this.ordenVenta.total ?? 0) + (e.ingreso ?? 0)))))),
      switchMap(estado => {
    
        this.crud.setRuta('tickets', this.franquiciaId)
        const ordenRef  = doc(this.crud.ruta)
        ordenId = ordenRef.id
        this.ordenVenta.id = ordenId
        lote.set(ordenRef, this.crearOrden())
        lote.set(doc(this.crud.firestoreInstancia, this.crud.rutaFranquicia, this.franquiciaId), estado)
    
        return from(lote.commit())
      }),
      tap({
        complete: ()=> {
          nuevosInventarios.forEach(inv => this.inventarios.actualizarInventarioPorLote(inv))
        }
      })
    )

  }

  get actualizarInventariosPorLote$(){
    
    return from(this.hashMapIngredientes.keys()).pipe( 
      switchMap((id:string) => this.inventarios.hashMapInventarios$.pipe(
        map(m => ({id, ...m.get(id)})), 
        switchMap(v => (v!= undefined && v.id!=undefined) ? of(v): throwError(()=>new Error('Inventario corrupto. Cancelando la operacion...'))),
        tap(inv => {
          console.log('e')
          if(!(inv && inv.id && inv.disponible)) return 
          inv.disponible-= this.hashMapIngredientes.get(inv.id) ?? 0
        })
      )),
      map(inv => ({ruta: 'inventarios', doc: inv})),
      tap(console.log),
      toArray(),
      switchMap(arr => this.crud.executeBatch(this.franquiciaId, arr))
    )
  }

  get actualizarInventarios$(){
    // if(this.hashMapIngredientes.size > 450) return throwError(()=> [])
    return this.inventarioLotes$

    // const atcualizar$  = (id:string) => of(id).pipe(
    //   take(1), 
    //   switchMap((id:string) => this.inventarios.hashMapInventarios$.pipe(
    //     map(m => ({id, ...m.get(id)})), 
    //     tap(console.log),
    //     switchMap(v => (v!= undefined && v.id!=undefined) ? of(v): throwError(()=>new Error('Inventario corrupto. Cancelando la operacion...'))),
    //     tap(inv => {
    //       if(!(inv && inv.id && inv.disponible)) return 
    //       inv.disponible-= this.hashMapIngredientes.get(inv.id) ?? 0
    //     }))),
    //     tap(console.log),

    //     // switchMap(newInv=> this.inventarios.actualizarInventario(newInv ?? new IngredienteInv(), this.franquiciaId))
    // )
    // var i = 0
    // return forkJoin(Array.from(this.hashMapIngredientes.keys()).map(ingId => atcualizar$(ingId))).pipe(
    //   // switchMap(()=> this.crearOrden()),
    //   switchMap(()=> this.actualizarIngreso()),
    //   catchError((e)=>{
    //     console.log(e); 
    //     alert('Error de Conexion Inesperado. Intente de nuevo'); 
    //     return of(undefined)})
    //   )  
  }

  resetearHashmapIngredientes(){
    this.hashMapIngredientes = new Map()  
  }
  
  comenzarTurno(balanceInicial:number){
    return this.crud.actualizarEstado(this.franquiciaId, {estado: true, balanceInicial: balanceInicial})
  }
  
  terminarTurno(){
    return this.crud.obtenerEstado(this.franquiciaId).pipe(
      tap( e => {this.estadoCaja = {...e}; this.estadoCaja.estado = false}), 
      tap(()=>console.log(this.estadoCaja)),
      switchMap(()=> this.crud.actualizarEstado(this.franquiciaId, {estado: false, balanceInicial: 0, ingreso: 0})),
    )
    
  }

  estadoTurno(){
    return this.crud.obtenerEstado(this.franquiciaId)
  }

  actualizarIngreso(){
    return this.estadoTurno().pipe(
      switchMap(e=> {
        e.ingreso = this.ordenVenta.total + (e.ingreso ?? 0)
        return this.crud.actualizarEstado(this.franquiciaId, e)
      }
      )
    )
  }

  crearOrden(){
    const orden = {...this.ordenVenta}
    orden.productos = this.ordenVenta.productos?.map(p => ({id: p.id, subTotal: p.subTotal}))
    var date = new Date()
    date.setHours(0,0,0,0)
    this.crud.setRuta('tickets', this.franquiciaId)
    return {ftimestamp: Timestamp.fromDate(date),  timestamp: new Date().toLocaleString(), ...orden}
    // return this.crud.setRuta('tickets', this.franquiciaId).crear<TicketVenta>({ftimestamp: Timestamp.fromDate(date),  timestamp: new Date().toLocaleString(), ...orden}).pipe(
    //   tap({next: oId => this.ordenVenta.id = oId})
    // )
  }
  
  crearTicketTerminoTurno(){
    var date = new Date()
    date.setHours(0,0,0,0)

    var orden = {
      productos: [] as any[]
    }
    orden.productos.push({id:'balanceInicial', subTotal: this.EstadoCaja.balanceInicial})
    orden.productos.push({id:'ingresos', subTotal: this.EstadoCaja.ingreso})
    return this.crud.setRuta('tickets', this.franquiciaId).crear<TicketVenta>({ftimestamp: Timestamp.fromDate(date),  timestamp: new Date().toLocaleString(), ...orden})
  }

  comprometerOrden(){
    return this.inventarioLotes$()
  }

}
