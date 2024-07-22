import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, debounceTime, distinctUntilChanged, filter,  mergeAll, mergeMap, of, refCount, shareReplay, startWith, switchMap, take, tap, toArray } from 'rxjs';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-typeahead',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ListComponent,AsyncPipe],
  templateUrl: './typeahead.component.html',
  styleUrl: './typeahead.component.css'
})
export class TypeaheadComponent {
  



  @Input() key:string ="name"
  @Output() elementoActivado:EventEmitter<Object>= new EventEmitter();

  form: FormGroup;
  indicieActivo?:number = -1;
  elementoActivo?:any;
  

constructor(private fb: NonNullableFormBuilder, private cd: ChangeDetectorRef){
  
  this.form = this.fb.group({
    search: ["", [Validators.required]]
  })
}

// dataSave$:BehaviorSubject<string[]> = new BehaviorSubject(this.data)
changes$:BehaviorSubject<any[]> = new BehaviorSubject([{}])

getRegex = (s:string = '') => this.changes$.asObservable().pipe(
  take(1),
  mergeAll(),
  filter((a:any)=> a[this.key].match(new RegExp(s, 'i'))), 
  toArray<string>(),
  )
  
  search$:Observable<any[]> = this.changes$.asObservable().pipe( 
    switchMap(()=> this.form.get('search')?.valueChanges.pipe(startWith('')) ?? of([])),
    debounceTime(300),
    distinctUntilChanged((curr, prev)=> curr ==prev && curr!=''), 
    switchMap(this.getRegex),
    ) ?? of([])
  
    // @Input() set data(d:any[]) {
    //   console.log('new array', d)
    //   this.changes$.next(d) 
    //   this.cdref.detectChanges()
    // }
  
    @Input() data:any[] = ['cargando']

    ngOnInit(){
    }
  
  ngOnChanges(changes: SimpleChanges) {
    console.log('typeahead',changes['data'].currentValue.length,changes['data'].currentValue)
    if(changes['data']){
      this.changes$.next(changes['data'].currentValue)
    }
    if(changes['key']){
      this.key = changes['key'].currentValue
    }

  }

  activarElemento(elemento: any, indicie: number) {
    this.indicieActivo = indicie;
    this.elementoActivo = elemento;

    this.elementoActivado.emit(elemento)
  }
}
