import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormInputComponent } from '../../shared/components/form-input/form-input.component';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  spinnerHidden = true

  constructor(private auth: AuthService){

  }

  iniciarConGoogle(){
    this.spinnerHidden = false;
    this.auth.iniciarConGoogle().subscribe(()=> this.spinnerHidden = true)
  }

}
