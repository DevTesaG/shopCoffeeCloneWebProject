import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, concatMap, filter, forkJoin, from, map, mergeAll, mergeMap, of, switchMap, take, tap, toArray } from 'rxjs';
import { IngredienteInv } from '../../models/ingrediente-inv.model';
import { CrudService } from '../../core/services/crud.service';
import { IngredienteService } from './ingrediente.service';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private inventarioSub$:BehaviorSubject<IngredienteInv[]> = new BehaviorSubject([new IngredienteInv])
  public inventariosMap$:BehaviorSubject<Map<string, IngredienteInv>> = new BehaviorSubject(new Map<string, IngredienteInv>())
  private franquiciaId:string = ''

  inventarios$:Observable<IngredienteInv[]> = this.inventarioSub$?.asObservable()
  ruta:string = 'inventarios'

  constructor(private crud: CrudService, private ingredientes: IngredienteService) { 
  }

  
  set setFranquiciaId(franquiciaId:string) {
    this.franquiciaId = franquiciaId
  }

  setRuta(){
    this.crud.setRuta(this.ruta, this.franquiciaId)
  }

  get inventariosJoinIngredientes$(){
    return forkJoin([this.hashMapInventarios$.pipe(take(1)), this.ingredientes.obtenerIngredientesMap$.pipe(take(1))]).pipe(
      switchMap(([invMap, ingMap])=> {
        return from(Array.from(new Set(Array.from(invMap.keys()).concat(Array.from(ingMap.keys()))))).pipe(
          mergeMap(id => {
            if(invMap.has(id) && ingMap.has(id)){
              console.info('Assigned')
              return of(Object.assign({...invMap.get(id)}, ingMap.get(id)))
            }else if(ingMap.has(id)){
              console.info('Inv added')
              return this.crearInventario(id).pipe(map(inv =>  
                  Object.assign({...ingMap.get(id)}, inv)
                ))
              }else{
                console.info('Inv deleted')
                return this.eliminarInventario(id).pipe(map(inv => 
                  undefined
                ))
            }
          }),
          filter(ing => !!ing),
          toArray(),
        )
      })
    )
  }

  get inventarioConIngredientes$(){
    return this.ingredientes.obtenerIngredientes().pipe(
      take(1),
      mergeAll(),
      concatMap(ing => {
        if(!ing.id) return of(null)
        return this.hashMapInventarios$.pipe(map(m => ({
      id: ing.id,
      nombre: ing.nombre, 
      unidad: ing.unidadConsumo,  
      unidadInsumo: ing.unidadInsumo,  
      ...m.get(ing.id ?? '')
    })))
  }),
      filter(v => !!v),
      mergeMap(ing => (ing?.disponible !=undefined) ? of(ing): this.crearInventario(ing?.id ?? '').pipe(
        map(inv => ({nombre: ing?.nombre, unidad: ing?.unidad, ...inv}))
        )),
      toArray(),
      )
  }
  
  crearInventario(id:string): Observable<string | any>{
    var inventario: IngredienteInv = { 
      minResurtir: 10*2,
      minPermitible: 10,
      resurtir: true,
      disponible: 0
    }
    return this.crud.setRuta(this.ruta).crear<IngredienteInv>(inventario, id, this.franquiciaId).pipe(
      map(() => ({id:id, ...inventario})),
      tap(p=> {
            console.info('Iventory created')
            const invs = this.inventarioSub$.getValue()
            invs.push(inventario)
            this.inventarioSub$.next(invs)
            const map = this.inventariosMap$.getValue()
            map.set(id, inventario)
            this.inventariosMap$.next(map)
          }
        )
      )
  }  

  obtenerInventario():Observable<IngredienteInv[]>{
   return this.inventarios$.pipe(
    switchMap((v, idx) => !!(v && v[0].id) ? of(v): 
      this.crud.setRuta(this.ruta, this.franquiciaId).obtenerTodos<IngredienteInv>().pipe(tap((ingredientes: IngredienteInv[]) => {
        if(!(ingredientes && ingredientes[0])) return
        this.inventarioSub$.next(ingredientes)
      })))
    )
    
  }
  
  get hashMapInventarios$(): Observable<Map<string, IngredienteInv>>{  
    return this.inventariosMap$.asObservable().pipe(take(1),
    switchMap(v=> (v.size!=0) ? of(v).pipe(tap(()=>console.log('From BSubject'))): 
    this.obtenerInventario().pipe(
      tap(()=>console.log('from Firebase')),
      switchMap(arr => {     
        if(arr.length != 0){
          this.inventariosMap$.next(new Map(arr.map(inv => [inv.id ?? '', inv])))
        }
        return this.inventariosMap$.asObservable()
      }), take(1))),
    tap({complete: ()=> {console.log('complete map');}, next: v => console.log(v)})
    )
  }

  actualizarInventario(nuevoInventario: IngredienteInv, franquiciaId:string){

    nuevoInventario.resurtir = (nuevoInventario.minResurtir ?? 10) >= (nuevoInventario.disponible ?? 0)

    const {id, ...inv} = nuevoInventario
    if(!id) return of()
    return this.crud.setRuta(this.ruta,franquiciaId).actualizar<IngredienteInv>(id, inv).pipe(tap({next: () => {
      var ingredientes = this.inventarioSub$.getValue()
      console.log(ingredientes)
      const idx = ingredientes.findIndex(u => u.id === nuevoInventario.id)
      ingredientes.splice(idx, 1)
      ingredientes.push(nuevoInventario)
      this.inventarioSub$.next(ingredientes)
      const map = this.inventariosMap$.getValue()
      map.set(id, inv)
      this.inventariosMap$.next(map)
    }})
    )
  }

  

  actualizarInventarioPorLote(nuevoInventario: IngredienteInv){

    nuevoInventario.resurtir = (nuevoInventario.minResurtir ?? 10) >= (nuevoInventario.disponible ?? 0)
    const {id, ...inv} = nuevoInventario
    var inventarios = this.inventarioSub$.getValue()
    const idx = inventarios.findIndex(u => u.id === nuevoInventario.id)
    inventarios.splice(idx, 1)
    inventarios.push(nuevoInventario)
    this.inventarioSub$.next(inventarios)
    if(id){
      const map = this.inventariosMap$.getValue()
      map.set(id, inv)
      this.inventariosMap$.next(map)
    }


    
  }



  eliminarInventario(id:string){
    return this.crud.setRuta(this.ruta, this.franquiciaId).eliminar<IngredienteInv>(id).pipe(tap({next: ()=>{
      var ingredientes = this.inventarioSub$.getValue()
      const idx = ingredientes.findIndex(u=> u.id === id)
      ingredientes.splice(idx, 1)
      this.inventarioSub$.next(ingredientes)
      const map = this.inventariosMap$.getValue()
      map.delete(id) 
      this.inventariosMap$.next(map)
    }})  
    )
  }

}
