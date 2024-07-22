import { Movimiento } from "./movimiento.model"

export class Producto {
    id?:string
    nombre?:string
    precio?:number
    descuento?:number
    ingredientesBase?:Movimiento[]
    ingredientesAgregables?:Movimiento[]
    receta?:string    
    esJarabe?:boolean
    cantidadPorReceta?:number
}
