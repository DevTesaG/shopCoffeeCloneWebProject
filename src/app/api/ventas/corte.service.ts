import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';
import { Observable, of, take } from 'rxjs';
import { Timestamp, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CorteService {
  constructor(private crud: CrudService) { }

  franquiciaId:string = ''
  ruta:string = '/balances'
  rutaEgresos:string = '/tickets'
  set setFranquiciaId(franquiciaId:string) {
    this.franquiciaId = franquiciaId
  }

  crearRegistroBlance(nombre:string, cantidad:number):Observable<any>{
    if(!cantidad) return of()
    return this.crud.setRuta(this.ruta, this.franquiciaId).crear({nombre, cantidad, timestamp: new Date()})
  }
  
  crearRegistroEgreso(nombre:string, cantidad:number):Observable<any>{
    if(!cantidad) return of()
    return this.crud.setRuta(this.rutaEgresos, this.franquiciaId).crear({nombre, cantidad, timestamp: new Date().toLocaleString()})
  }

  obtenerRegistrosBalances():Observable<any[]>{
    var date = new Date()
    date.setHours(0,0,0,0)
    // return this.crud.setRuta(this.ruta, this.franquiciaId).obtenerTodos().pipe(take(1))
    return this.crud.setRuta(this.ruta, this.franquiciaId).obtenerPorQuery([where("timestamp", ">=", date)])
  }
  
  obtenerRegistrosEgresos():Observable<any[]>{
    var date = new Date()
    date.setHours(0,0,0,0)
    return this.crud.setRuta(this.rutaEgresos, this.franquiciaId).obtenerPorCampo('ftimestamp', Timestamp.fromDate(date)).pipe(take(1))
  }


}
