import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {




  @Input() lista:any[] | null = []
  @Output() elementoActivado?:EventEmitter<Object>= new EventEmitter();


  indicieActivo?:number = -1;
  elementoActivo?:any;
  

  ngOnInit(){
    console.log(this.lista)
  }

  constructor(){
    
  }
  
  activarElemento(elemento: any, indicie: number) {
    this.indicieActivo = indicie;
    this.elementoActivo = elemento;

    this.elementoActivado?.emit(this.elementoActivo)
  }
    

}
