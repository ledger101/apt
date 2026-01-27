import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SpinnerComponent } from './components/spinner/spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, SpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'APT';
}
