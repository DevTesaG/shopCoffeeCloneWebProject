import { AsyncPipe, UpperCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, AsyncPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  sesionIniciada$ = this.auth.sesionIniciada$
  isAdmin$ = this.auth.esAdmin$
  esGerente$ = this.auth.esGerente$
  franquicia$ = this.auth.franquicia$

  constructor(private auth: AuthService){
  }

  cerrarSession(){
    this.auth.cerrarSesion()
  }
}
