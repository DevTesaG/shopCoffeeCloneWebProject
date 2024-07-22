import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';
import { BehaviorSubject, Observable, of, partition, switchMap, take, tap, toArray } from 'rxjs';
import { Evento } from '../../models/evento.model';

@Injectable({
  providedIn: 'root'
})
export class ComboService {

  private comboSub$:BehaviorSubject<Evento[]> = new BehaviorSubject([new Evento])
  combos$:Observable<Evento[]> = this.comboSub$?.asObservable()
  rutaCombos:string = 'combos'

  constructor(private crud: CrudService) { 

  }

  

  crearCombo(evento:Evento): Observable<string>{
    const {id, ...combo} = evento
    return this.crud.setRuta(this.rutaCombos).crear<Evento>(combo).pipe(tap({next: (nuevoId)=>{
      const eventos = this.comboSub$?.value ?? []
      evento.id = nuevoId
      eventos.push(evento)
      this.comboSub$?.next(eventos)
    }}))
  }  

  eliminarCombo(id:string){
    return this.crud.setRuta(this.rutaCombos).eliminar<Evento>(id).pipe(tap({next: ()=>{
      var combos = this.comboSub$.getValue()
      const idx = combos.findIndex(u=> u.id === id)
      combos.splice(idx, 1)
      this.comboSub$.next(combos)
    }}))
  }

  obtenerCombo(): Observable<Evento[]>{
    return this.combos$.pipe(switchMap((v, idx) => !!(v[0] && v[0].id) ? of(v): 
    this.crud.setRuta(this.rutaCombos).obtenerTodos<Evento>())).pipe(take(1), tap((combos)=>
      this.comboSub$?.next(combos)
    ))
  }

  actualizarProducto(nuevoCombo: Evento){
    const {id, ...combo} = nuevoCombo
    return this.crud.setRuta(this.rutaCombos).actualizar<Evento>(id ?? '', combo).pipe(tap({next: () => {
      var productos = this.comboSub$.getValue()
      const idx = productos.findIndex(u => u.id === nuevoCombo.id)
      productos.splice(idx, 1)
      productos.push(nuevoCombo)
      this.comboSub$.next(productos)
    }}))
  }
}
