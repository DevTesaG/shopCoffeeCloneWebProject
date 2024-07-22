import { UpperCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [RouterLink, UpperCasePipe],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.css'
})
export class AdminNavbarComponent {

  sesionIniciada$ = this.auth.sesionIniciada$
  isAdmin$ = this.auth.esAdmin$
  franquicia$ = this.auth.franquicia$

  constructor(private auth: AuthService){
  }

  cerrarSession(){
    this.auth.cerrarSesion()
  }  
}
