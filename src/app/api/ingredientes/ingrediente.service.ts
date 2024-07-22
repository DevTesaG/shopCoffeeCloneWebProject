import { ApplicationRef, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, first, from, map, mergeAll, of, switchMap, take, tap, throwError, } from 'rxjs';
import { Ingrediente } from '../../models/ingrediente.model';
import { CrudService } from '../../core/services/crud.service';
import { ProductService } from '../product/product.service';
  
@Injectable({
  providedIn: 'root'
})
export class IngredienteService {
  public ingredientesMap$:BehaviorSubject<Map<string, Ingrediente>> = new BehaviorSubject(new Map<string, Ingrediente>())
  private ingredientesSub$:BehaviorSubject<Ingrediente[]> = new BehaviorSubject([new Ingrediente])
  ingredientes$:Observable<Ingrediente[]> = this.ingredientesSub$?.asObservable()
  ruta:string = 'ingredientes'

  constructor(private crud: CrudService, private productoS: ProductService) { 
  }

  
  get obtenerIngredientesMap$(){
    return this.ingredientesMap$.asObservable().pipe(take(1),
      switchMap(m => m.size != 0 ? of(m): this.obtenerIngredientes().pipe(
        switchMap(ings => {
          this.ingredientesMap$.next(new Map(ings.map(ing => [ing.id ?? '', ing])))
          return this.ingredientesMap$.asObservable().pipe(take(1))})
      ))
    )
  }

  crearIngrediente(ingrediente:Ingrediente, id?:string): Observable<string>{
    console.log('crear ingred' , id)
    return this.crud.setRuta(this.ruta).crear<Ingrediente>(ingrediente, id).pipe(tap({next: (nuevoId)=>{
      const ingredientes = this.ingredientesSub$?.value ?? []
      ingrediente.id = nuevoId
      ingredientes.push(ingrediente)
      this.ingredientesSub$?.next(ingredientes)
      
    }}))
  }  

  obtenerIngredientes():Observable<Ingrediente[]>{
   return this.ingredientes$.pipe(switchMap((v, idx) => !!(v[0].id) ? this.ingredientesSub$.asObservable().pipe(map(a => a.slice())): 
      this.crud.setRuta(this.ruta).obtenerTodos<Ingrediente>().pipe(tap({next: (ingredientes: Ingrediente[]) => {
        if(!(ingredientes && ingredientes[0] && ingredientes[0].id)) return
        this.ingredientesSub$.next(ingredientes)
        }}),
      ) 
    ))
  }
  

  actualizarIngrediente(nuevoingrediente: Ingrediente){
    return this.crud.setRuta(this.ruta).actualizar<Ingrediente>(nuevoingrediente.id ?? '', nuevoingrediente).pipe(tap({next: () => {
      var ingredientes = this.ingredientesSub$.getValue()
      const idx = ingredientes.findIndex(u => u.id === nuevoingrediente.id)
      ingredientes.splice(idx, 1)
      ingredientes.push(nuevoingrediente)
      this.ingredientesSub$.next(ingredientes)
    }}))
  }

  eliminarIngrediente(id:string){
    return this.productoS.obtenerProductos().pipe(    
      map(arr => {
        var b = arr.flatMap(p => p.ingredientesBase?.concat(p.ingredientesAgregables ?? []))
        console.log(b)
        return b 
      }),
      first(),
      tap(console.log),
      switchMap((ings:any[]) => {   
        var p =ings?.find(ing=> ing?.id == id) != undefined
        return  p ?  
        throwError(()=> {
          const a = new Error('El ingrediente esta en uso en otros productos. No es posible eliminar')
          return a;
      }): this.crud.setRuta(this.ruta).eliminar<Ingrediente>(id).pipe(first(), tap(()=>{
        console.log('Eliminando completo', id)
        var ingredientes = this.ingredientesSub$.getValue()
        const idx = ingredientes.findIndex(u=> u.id === id)
        ingredientes.splice(idx, 1)
        this.ingredientesSub$.next(ingredientes)
      }))
      })
    )
  }

}
