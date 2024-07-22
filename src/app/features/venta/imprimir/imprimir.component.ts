import { Component, Input, input } from '@angular/core';
import {ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { CajaService } from '../../../api/ventas/caja.service';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Observable, from, fromEvent, switchMap, tap} from 'rxjs';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';

@Component({
  selector: 'app-imprimir',
  standalone: true,
  imports: [RouterOutlet, CurrencyPipe, AsyncPipe, FormInputComponent],
  templateUrl: './imprimir.component.html',
  styleUrl: './imprimir.component.css'
})
export class ImprimirComponent {
  
  ordenId:string = ''
  @Input() set OrdenId(oId:string){
    console.log('setter ' ,oId)
    this.ordenId = oId
  }
  
  @Input() set EstadoCaja(estado:any){
    console.log('setter' ,estado)
    this.estadoCaja = estado
  }


  productosEnCaja:any[] = []
  total:number = 0
  tipo?:string = undefined
  justiciacion?:string = undefined
  imprimir$?:Observable<any>
  estadoCaja:any =  {estado: true, balanceInicial:0, ingreso: 0}
  constructor(private caja: CajaService, private router:Router, private route: ActivatedRoute){
    this.productosEnCaja = this.caja.ordenVenta.productos ?? []
    this.total = this.caja.ordenVenta.total ?? 0
    console.log(this.total, this.caja.ordenVenta, this.caja.ordenVenta.total)
  }

  ngOnInit(){
      this.tipo = this.caja.ordenVenta.tipoCondonacion
      this.justiciacion = this.caja.ordenVenta.justificacion
      
      fromEvent(window, 'beforeprint').pipe(
      switchMap(()=> fromEvent(window, 'afterprint')),
      switchMap(()=> from(this.router.navigate(['../ventas'], {relativeTo: this.route})))).subscribe()

  }

}
