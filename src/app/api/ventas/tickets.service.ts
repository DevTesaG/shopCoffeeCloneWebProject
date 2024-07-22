import { Injectable } from '@angular/core';
import { CrudService } from '../../core/services/crud.service';
import { TicketVenta } from '../../models/ticket-venta.model';
import { Observable, take, tap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  constructor(private crud: CrudService, private sanitizer: DomSanitizer) { }


  obtenerTickets(){
    return this.crud.setRuta('productos').obtenerTodos<TicketVenta>().pipe(take(1))
  }

  ticketsCSV():Observable<any>{
    return this.obtenerTickets().pipe(
      tap( tickets => this.downloadFile(tickets)),
      tap( {complete: ()=> console.log('CSV COMPLETE')})
    )
  }

  downloadFile(data:any[], filename = 'tickets_' + new Date().toDateString()) {
    const a = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    
    let json = this.ConvertToCSV(data);
    let blob = new Blob([json],{type: 'text/json'});
    let dwldLink = document.createElement("a");
    let url = URL.createObjectURL(blob);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') !=
        -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {
        dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", filename + ".csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
  }

  ConvertToCSV(objArray:any[]) {
    return JSON.stringify(objArray);
  }
}