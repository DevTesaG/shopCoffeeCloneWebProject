import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, of, switchMap, take, tap, throwError } from 'rxjs';
import { CrudService } from '../../core/services/crud.service';
import { Producto } from '../../models/producto.model';
import { ComboService } from '../ventas/combo.service';
import { doc } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class ProductService {


  private productosSub$:BehaviorSubject<Producto[]> = new BehaviorSubject([new Producto])
  productos$:Observable<Producto[]> = this.productosSub$?.asObservable()
  ruta:string = 'productos'
  rutaJarabe:string = 'jarabes'

  constructor(private crud: CrudService, private combos:ComboService) { }

  
  crearProducto(producto:Producto): Observable<string>{
    return this.crud.setRuta(this.ruta).crear<Producto>(producto).pipe(tap({next: (nuevoId)=>{
      const productos = this.productosSub$?.value ?? []
      producto.id = nuevoId
      productos.push(producto)
      this.productosSub$?.next(productos)
    }}))
  }  

  obtenerProductos():Observable<Producto[]>{
   return this.productos$.pipe(switchMap((v, idx) => !!(v[0].id) ? this.productosSub$.asObservable().pipe(map(a => a.slice())): 
      this.crud.setRuta(this.ruta).obtenerTodos<Producto>().pipe(switchMap((productos: Producto[]) => {
        if(!productos) return []
        this.productosSub$.next(productos)
        return this.productosSub$.asObservable()
      })) 
      ), 
      take(1)
      )
  }
  
  crearJarabe(jarabe:Producto){
    this.crud.setRuta(this.rutaJarabe)
    var docref  = doc(this.crud.ruta)
    jarabe.cantidadPorReceta = +(jarabe.cantidadPorReceta ?? 0) // cast as number
    jarabe.ingredientesBase?.push({id: docref.id, cantidad: -(jarabe.cantidadPorReceta ?? 0)})
    console.log('jarabe', docref.id)
    return this.crud.crear<Producto>(jarabe, docref.id).pipe(take(1), map(()=> docref.id))
  }

  actualizarJarabe(jarabe:Producto){
    const {id, ...j } = jarabe
    return this.crud.setRuta(this.rutaJarabe).actualizar<Producto>(id ?? '', j)
  }

  obtenerJarabes():Observable<Producto[]>{
    return this.crud.setRuta(this.rutaJarabe).obtenerTodos<Producto>() 
  }

  actualizarProducto(nuevoproducto: Producto){
    return this.crud.setRuta(this.ruta).actualizar<Producto>(nuevoproducto.id ?? '', nuevoproducto).pipe(tap({next: () => {
      var productos = this.productosSub$.getValue()
      const idx = productos.findIndex(u => u.id === nuevoproducto.id)
      productos.splice(idx, 1)
      productos.push(nuevoproducto)
      this.productosSub$.next(productos)
    }}))
  }

  eliminarProducto(id:string, esJarabe?: boolean){
    if(esJarabe){
      this.crud.setRuta(this.rutaJarabe)
    }else{
      this.crud.setRuta(this.ruta)
    }

    const eliminarProducto$ = this.crud.eliminar<Producto>(id).pipe(tap({complete: ()=>{
      console.log('Eliminando Producto', id)
      if(esJarabe) return
        var productos = this.productosSub$.getValue()
        const idx = productos.findIndex(u=> u.id === id)
        productos.splice(idx, 1)
        this.productosSub$.next(productos)
        console.log(productos)
    }}))

    return eliminarProducto$

    return this.combos.obtenerCombo().pipe(
      map(arr => {
        var b = arr.flatMap(p => p.promocion)
        console.log(b)
        return b 
      }),
      take(1),
      switchMap(prods => {
        console.log(prods)
        var p =prods?.find(p=> p?.id == id) != undefined
        return  p ?  
        throwError(()=> {
          const a = new Error('El producto esta en uso en otros combos. No es posible eliminar')
          return a;
      }): eliminarProducto$
    })
    ) 
  }
}
