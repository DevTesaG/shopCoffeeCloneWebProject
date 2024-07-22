import { Timestamp } from "@angular/fire/firestore"
import { Producto } from "./producto.model"

export class Evento {

    id?:string
    nombre?:string
    fechaInicio?:Timestamp
    fechaFin?:string
    promocion?:Producto[]
    precio?:number
    esCombo?:boolean
}
