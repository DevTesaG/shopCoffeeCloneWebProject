import { Component } from '@angular/core';
import { FormComponent } from '../../../shared/components/form/form.component';
import { FormArray, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { Observable, catchError, filter, from, of, tap} from 'rxjs';
import { AsyncPipe, CommonModule } from '@angular/common';
import { TypeaheadComponent } from '../../../shared/components/typeahead/typeahead.component';
import { ProductService } from '../../../api/product/product.service';
import { Producto } from '../../../models/producto.model';
import { IngredienteService } from '../../../api/ingredientes/ingrediente.service';
import { Ingrediente } from '../../../models/ingrediente.model';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [ReactiveFormsModule, FormInputComponent, TypeaheadComponent, AsyncPipe, CommonModule, FormComponent],
  templateUrl: './recetas.component.html',
  styleUrl: './recetas.component.css'
})
export class RecetasComponent {

  producto?: Producto;
  ingredientesProdutcto$:Observable<Producto[] | Ingrediente[]> = of([])
  error?:string = undefined
  message?:string = undefined
  nuevoProducto = false
  ingrediente = false

  form: FormGroup<any> = this.fb.group({
    receta: ["", [Validators.required]],
    });

  constructor(private fb: NonNullableFormBuilder, private pService: ProductService, private ingredientes: IngredienteService){
  } 

  ngOnInit(){
    this.ingredientesProdutcto$ =  this.pService.obtenerProductos().pipe(catchError((e)=> {this.error = "Error de Conexión"; return []}))
  }


  productoSeleccionado(ingredienteProducto: Producto){
    this.producto = ingredienteProducto
    this.form.get('receta')?.patchValue(this.producto.receta)
  }
}
