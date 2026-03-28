import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-content" style="max-width:600px">
      <div class="config-item">
        <span>Sonido</span>
        <div class="toggle-group">
          <button class="toggle-btn" [class.active]="sound === true" (click)="sound = true">ON</button>
          <button class="toggle-btn" [class.active]="sound === false" (click)="sound = false">OFF</button>
        </div>
      </div>

      <div class="config-item">
        <span>Máxima Suma</span>
        <input type="number" class="config-input" [(ngModel)]="maxSum" name="maxSum" min="10" max="100" />
      </div>

      <button class="btn" style="margin-top:1.5rem;width:100%;justify-content:center" (click)="handleSave()">
        {{ saved ? '¡Guardado!' : 'Guardar cambios' }}
      </button>
    </div>
  `,
})
export class ConfiguracionComponent {
  sound: boolean = localStorage.getItem('sound') !== 'false';
  maxSum: string = localStorage.getItem('maxSum') || '54';
  saved = false;

  handleSave() {
    localStorage.setItem('sound', String(this.sound));
    localStorage.setItem('maxSum', this.maxSum);
    this.saved = true;
    setTimeout(() => this.saved = false, 2000);
  }
}
