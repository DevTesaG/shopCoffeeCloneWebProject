import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { CorteService } from '../../../api/ventas/corte.service';
import { AsyncPipe, CurrencyPipe, Time } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.css'
})
export class BalanceComponent {


  constructor(private balance: CorteService){
  }


  @Input() id:string = ''
  balances$?:Observable<any[]>
  egresos$?:Observable<any[]>
    

  getLocalDate(date:Timestamp){
    var a = date.toDate()
    return a.toLocaleString()
  }
  ngOnInit(){
    this.balance.setFranquiciaId = this.id
    this.balances$  = this.balance.obtenerRegistrosBalances()
    this.egresos$  = this.balance.obtenerRegistrosEgresos()
  }
}
