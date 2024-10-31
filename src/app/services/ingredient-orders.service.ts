import { Injectable } from '@angular/core';
import { CrudService } from '../core/services/crud.service';
import { IngredientOrder } from '../models/ingredient-order.model';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IngredientOrdersService {
  
  
  constructor(private crud: CrudService) { }

  franquiciaId:string = ''
  ruta:string = '/ordenes'
  
  set setFranquiciaId(franquiciaId:string) {
    this.franquiciaId = franquiciaId
  }

  obtenerOrdenes(){
    console.log(this.franquiciaId)
    return this.crud.setRuta(this.ruta, this.franquiciaId).obtenerTodos()
  }
  
  crearOrden(order:IngredientOrder, id?:string){
      console.log(order , id)
    return this.crud.setRuta(this.ruta, this.franquiciaId).crear(order, id, this.franquiciaId)
  }

  


}
