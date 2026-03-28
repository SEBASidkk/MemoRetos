import {
  Component,
  ChangeDetectionStrategy,
  input,
  effect,
  ElementRef,
  viewChild,
  afterNextRender,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Plotly from 'plotly.js';

// Tema UNAE Digital para Plotly (light)
export const UNAE_LAYOUT: Partial<Plotly.Layout> = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor:  '#f8f2f8',
  font: { color: '#53424b', family: "'Inter', system-ui, sans-serif", size: 11 },
  xaxis: {
    gridcolor: '#d8c0cb',
    zerolinecolor: '#d8c0cb',
    tickfont: { color: '#85727b' },
  } as any,
  yaxis: {
    gridcolor: '#d8c0cb',
    zerolinecolor: '#d8c0cb',
    tickfont: { color: '#85727b' },
  } as any,
  legend: { bgcolor: 'transparent', font: { color: '#53424b' } },
  margin: { t: 30, r: 20, b: 50, l: 55 },
  colorway: ['#550042', '#feae1e', '#002a57', '#76135d', '#825500', '#00407e', '#f884cf', '#ffb94e', '#82adf3'],
};

@Component({
  selector: 'app-plotly-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'plotly-chart-host' },
  template: `
    <div #container class="plotly-container" role="img" [attr.aria-label]="title()"></div>
  `,
  styles: `
    :host { display: block; }
    .plotly-container { width: 100%; min-height: 300px; }
  `,
})
export class PlotlyChartComponent {
  data   = input<Plotly.Data[]>([]);
  layout = input<Partial<Plotly.Layout>>({});
  title  = input('Gráfica');
  height = input(320);

  private container = viewChild<ElementRef<HTMLDivElement>>('container');
  private platformId = inject(PLATFORM_ID);
  private plotly: typeof import('plotly.js-cartesian-dist') | null = null;

  constructor() {
    afterNextRender(() => this.loadAndRender());

    effect(() => {
      const d = this.data();
      const l = this.layout();
      if (this.plotly && this.container()?.nativeElement && d.length) {
        this.render();
      }
    });
  }

  private async loadAndRender() {
    if (!isPlatformBrowser(this.platformId)) return;
    const mod = await import('plotly.js-cartesian-dist') as any;
    this.plotly = mod.default ?? mod;
    this.render();
  }

  private render() {
    const el = this.container()?.nativeElement;
    if (!el || !this.plotly || !this.data().length) return;

    const mergedLayout: Partial<Plotly.Layout> = {
      ...UNAE_LAYOUT,
      ...this.layout(),
      height: this.height(),
      xaxis: { ...UNAE_LAYOUT.xaxis as any, ...(this.layout() as any).xaxis },
      yaxis: { ...UNAE_LAYOUT.yaxis as any, ...(this.layout() as any).yaxis },
    };

    (this.plotly as any).react(el, this.data(), mergedLayout, {
      displayModeBar: false,
      responsive: true,
    });
  }
}
