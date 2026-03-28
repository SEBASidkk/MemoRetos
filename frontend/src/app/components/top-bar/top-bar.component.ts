import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  template: `
    <div class="app-topbar" style="border-bottom:none;padding:0 0 1rem">
      <div class="app-topbar-left">
        @if (back) {
          <button class="topbar-back-btn" (click)="goBack()" title="Volver">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
        }
        <h2 class="app-topbar-title">{{ title }}</h2>
      </div>
    </div>
  `,
})
export class TopBarComponent {
  @Input() title = '';
  @Input() back = true;

  constructor(private location: Location) {}

  goBack() { this.location.back(); }
}
