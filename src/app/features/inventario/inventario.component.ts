import { Component, Input } from '@angular/core';
import { Observable, catchError, filter, forkJoin, from, interval, map, mergeAll, mergeMap, of, retry, switchMap, take, tap, toArray,} from 'rxjs';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { AsyncPipe } from '@angular/common';
import { InventarioService } from '../../api/ingredientes/inventario.service';
import { IngredienteInv } from '../../models/ingrediente-inv.model';
import { IngredienteService } from '../../api/ingredientes/ingrediente.service';
import { TicketsService } from '../../api/ventas/tickets.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [AsyncPipe, TypeaheadComponent],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent {
  constructor(private inventarios: InventarioService, private ingredientes:IngredienteService, private tickets: TicketsService){
  }


  @Input() id:string = ''
  inventario?:IngredienteInv = undefined;
  inventarios$?:Observable<any[]>
  jsonRef:any
  message?:string = undefined;

  
  
  ngOnInit(){
    this.inventarios.setFranquiciaId = this.id
    this.inventarios$  =this.inventarios.inventariosJoinIngredientes$.pipe(
      catchError(e => {this.message = 'Error de conexion. Intente de nuevo'; return of([])})
    )
  }

  eliminar(inventario:any){
    if(inventario.nombre){
      alert('Inventario en uso, no es posible elimnarlo.')
      return
    }
    this.inventarios.eliminarInventario(inventario.id).subscribe({complete: ()=> alert('Inventario Eliminado')})
  }

  descargarCSV(){
    this.jsonRef = this.tickets.ticketsCSV().subscribe()
  }
}
