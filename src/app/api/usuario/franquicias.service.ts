import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, mergeAll, mergeMap, switchMap, tap } from 'rxjs';
import { CrudService } from '../../core/services/crud.service';
import { Franquicia } from '../../models/usuario/franquicia.model';
import { IngredienteService } from '../ingredientes/ingrediente.service';
import { InventarioService } from '../ingredientes/inventario.service';

@Injectable({
  providedIn: 'root'
})
export class FranquiciasService {


  private franquiciasSub$:BehaviorSubject<Franquicia[]> = new BehaviorSubject([{} as Franquicia])
  franquicias$:Observable<Franquicia[]> = this.franquiciasSub$?.asObservable()
  ruta:string = 'franquicia'

  constructor(private crud: CrudService, private ingredientes: IngredienteService, private inventarios: InventarioService) { 
    this.crud.setRuta('franquicia')
  }

  
  crearfranquicia(franquicia: Franquicia): Observable<string>{
    var fId:string
    return this.crud.crear<Franquicia>(franquicia).pipe(tap({next: (nuevoId)=>{
      const franquicias = this.franquiciasSub$?.value ?? []
      franquicia.id = nuevoId
      this.inventarios.setFranquiciaId = nuevoId
      franquicias.push(franquicia)
      this.franquiciasSub$?.next(franquicias)
    }}),
      tap(_fId => fId = _fId),
      switchMap(()=> this.ingredientes.obtenerIngredientes()),
      mergeAll(),
      mergeMap(ing => this.inventarios.crearInventario(ing.id ?? '')),
    )
  }  

  obtenerfranquicias():Observable<Franquicia[]>{
   return this.franquicias$.pipe(switchMap((v, idx) =>{
     return !!(v[0].id) ? this.franquiciasSub$.asObservable(): 
     this.crud.setRuta(this.ruta).obtenerTodos<Franquicia>().pipe(tap({next: (franquicias: Franquicia[]) => {
       this.franquiciasSub$.next(franquicias)
      }}))
   } 
    ))
  }

  actualizarfranquicia(nuevofranquicia: Franquicia){
    return this.crud.setRuta(this.ruta).actualizar<Franquicia>(nuevofranquicia.id ?? '', nuevofranquicia).pipe(tap({next: () => {
      var franquicias = this.franquiciasSub$.getValue()
      const idx = franquicias.findIndex(u => u.id === nuevofranquicia.id)
      franquicias.splice(idx, 1)
      franquicias.push(nuevofranquicia)
      this.franquiciasSub$.next(franquicias)
    }}))
  }

  eliminarfranquicia(id:string){
    return this.crud.eliminar<Franquicia>(id).pipe(tap({next: ()=>{
      var franquicias = this.franquiciasSub$.getValue()
      const idx = franquicias.findIndex(u=> u.id === id)
      franquicias.splice(idx, 1)
      this.franquiciasSub$.next(franquicias)
    }}))
  }
}
