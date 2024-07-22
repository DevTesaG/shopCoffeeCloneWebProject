import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, ContentChildren, EventEmitter, Input, Output, QueryList, SimpleChanges, TemplateRef } from '@angular/core';
import { FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule,CommonModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.css'
})
export class FormComponent {

  @Input() form:FormGroup;
  @Input() soloLectura:boolean = false;
  @Output() formValue: EventEmitter<any> = new EventEmitter()
  counter = 0
  constructor(private fb: NonNullableFormBuilder) {
    this.form = this.fb.group({
      email: ["", [Validators.required]],
    });
  }

  @ContentChildren(TemplateRef) sections?:QueryList<TemplateRef<any>>;

  
  ngAfterContentInit(){
    this.counter = 0
    if(this.soloLectura){
      this.form.disable({emitEvent: !this.soloLectura})
    }
  }


  checarSiAlgunoDesactivado(){
    return Object.keys(this.form.controls).some(key => !!(this.form.controls[key].disable))
  }
  
  
  ngOnChanges(changes: SimpleChanges) {
    
    if(changes['soloLectura']){
      console.log('On changes triggeado')      
      if(changes['soloLectura'].currentValue){
        this.form.disable({emitEvent: false})
      }else{
        if(!(this.counter == 0 || this.checarSiAlgunoDesactivado()))
        this.form.enable()
      }
      this.counter = 1
    }

  }

  get f(){
    return this.form.controls
  }

  submit(){  
    if(this.form.invalid) return


    this.formValue.emit(this.form.value)
  }

  reset() {
    this.form.reset();
  }


}
