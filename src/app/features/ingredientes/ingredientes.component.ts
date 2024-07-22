import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormComponent } from '../../shared/components/form/form.component';
import { TypeaheadComponent } from '../../shared/components/typeahead/typeahead.component';
import { ListComponent } from '../../shared/components/list/list.component';
import { AsyncPipe, CommonModule, UpperCasePipe } from '@angular/common';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { Observable, Subject, catchError, of, startWith, takeUntil, tap } from 'rxjs';
import { IngredienteService } from '../../api/ingredientes/ingrediente.service';
import { Ingrediente } from '../../models/ingrediente.model';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [AsyncPipe,UpperCasePipe, ListComponent, TypeaheadComponent, FormComponent, FormInputComponent, ReactiveFormsModule, CommonModule],
  templateUrl: './ingredientes.component.html',
  styleUrl: './ingredientes.component.css'
})
export class IngredientesComponent {
  constructor(private ingredientes: IngredienteService, private fb: NonNullableFormBuilder,  private cd: ChangeDetectorRef){
  }

  ingrediente?:Ingrediente = undefined;
  Ingredientes$?:Observable<Ingrediente[]>
  onDestroy$: Subject<boolean> = new Subject();

  form: FormGroup<any> = this.fb.group({
    nombre: ["", [Validators.required]],
    unidadConsumo: [ "mililitros", [Validators.required]],
    unidadInsumo: ["litros", [Validators.required]],
    topping: [false, [Validators.required]],
    cantidadTopping: [{value:0, disabled: true}, [Validators.required]],
    precioTopping: [{value:10, disabled: true}, [Validators.required]],
  });
  
  message?:string = undefined;
  error?:string = undefined;
  nuevoIngrediente = false;
  cargando = false
  alertColor = true
  
  
  ngOnInit(){
    this.Ingredientes$ = this.ingredientes.obtenerIngredientes().pipe(catchError((e)=>{this.error='Error de Conexion...';  return of([])}))
    this.form.get('topping')?.valueChanges.pipe(
      takeUntil(this.onDestroy$),
      startWith("false"),  
      tap(v=> {
        if(v == "true" || v === true){
          this.form.get('cantidadTopping')?.enable()
          this.form.get('precioTopping')?.enable()
        }else{
          this.form.get('cantidadTopping')?.disable()
          this.form.get('precioTopping')?.disable()
        }
      })
    ).subscribe()
  }

  ingredienteSeleccionado(ingrediente: Ingrediente){
    console.log(ingrediente)
    this.nuevoIngrediente = false
    this.resetEstado()
    this.ingrediente = ingrediente
    this.form.patchValue(ingrediente)
  }
 
  crearIngrediente(){
    this.nuevoIngrediente = true
    this.resetEstado()
  }

  resetEstado(){
    this.ingrediente = undefined
    this.message = undefined
    this.error = undefined
    this.form.reset()   
    this.form.get('cantidadTopping')?.disable()
    this.form.get('precioTopping')?.disable()
  }


 crear(nuevoIngrediente:Ingrediente){
   if(this.cargando) return

   nuevoIngrediente.topping = (nuevoIngrediente.topping as unknown) == "true"
   this.cargando = true
  


   if(!this.ingrediente) { 
      this.ingredientes.crearIngrediente(nuevoIngrediente).subscribe({
        complete: () => {
          this.message = "El Ingrediente fue Creado"; 
          this.nuevoIngrediente = false; 
          this.ingrediente = undefined;
          this.cargando = false
      },
      error: ()=> {
        this.message = 'Error de conexion. Intente de nuevo'
        this.cargando = false
      },
      })
    }else{
      Object.assign(this.ingrediente, nuevoIngrediente )
        this.ingredientes.actualizarIngrediente(this.ingrediente).subscribe({
        complete: () => {this.message = "El Ingrediente fue Actualizado"; this.cargando = false; this.ingrediente  =undefined},
        error: ()=> {this.cargando = false; this.message = 'Error de conexion. Intente de nuevo'}
      })
    }
  }

  eliminar(){
    if(!this.ingrediente || this.cargando) return;
    this.cargando = true
    this.ingredientes.eliminarIngrediente(this.ingrediente.id ?? '').subscribe({
      complete: ()=> {this.message = "El Ingrediente fue Eliminado"; this.alertColor =true; this.nuevoIngrediente = false; this.ingrediente = undefined; this.cargando=false; console.log('completed')},
      error: (e:Error) => {this.cargando = false; this.alertColor=false; this.message = e.message}
    })
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.unsubscribe();
  }
}
