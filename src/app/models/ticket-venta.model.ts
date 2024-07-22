import { Timestamp } from "@angular/fire/firestore";

export class TicketVenta {
    id?:string
    productos?: {id?:string, subTotal?:number}[]
    total?:number
    tipoCondonacion?: string
    justificacion?:string
    timestamp?:string
    ftimestamp?:Timestamp
}
