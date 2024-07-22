import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../core/components/navbar/navbar.component';
import { AdminNavbarComponent } from '../../core/components/admin-navbar/admin-navbar.component';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [RouterOutlet, AdminNavbarComponent],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.css'
})
export class AdminHomeComponent {

}
