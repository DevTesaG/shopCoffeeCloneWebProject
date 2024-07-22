import { Component, ContentChildren, Input, QueryList, TemplateRef, ViewEncapsulation } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [],
  templateUrl: './form-input.component.html',
  styleUrl: './form-input.component.css',
})
export class FormInputComponent {

  @Input() control?:AbstractControl<any, any>;

}
