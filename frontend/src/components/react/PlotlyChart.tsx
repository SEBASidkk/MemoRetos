import { useEffect, useRef } from 'react';
import { UNAE_LAYOUT } from '../../lib/plotly-theme';
import type * as Plotly from 'plotly.js';

interface Props {
  data: Plotly.Data[];
  layout?: Partial<Plotly.Layout>;
  title?: string;
  height?: number;
}

export default function PlotlyChart({ data, layout = {}, title = 'Gráfica', height = 320 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<typeof import('plotly.js-cartesian-dist') | null>(null);

  useEffect(() => {
    if (!data.length) return;

    async function render() {
      if (!plotlyRef.current) {
        const mod = await import('plotly.js-cartesian-dist') as unknown as { default: typeof import('plotly.js-cartesian-dist') };
        plotlyRef.current = mod.default ?? (mod as unknown as typeof import('plotly.js-cartesian-dist'));
      }
      if (!containerRef.current) return;

      const mergedLayout: Partial<Plotly.Layout> = {
        ...UNAE_LAYOUT,
        ...layout,
        height,
        xaxis: { ...UNAE_LAYOUT.xaxis as object, ...(layout as { xaxis?: object }).xaxis },
        yaxis: { ...UNAE_LAYOUT.yaxis as object, ...(layout as { yaxis?: object }).yaxis },
      };

      (plotlyRef.current as { react: (el: HTMLElement, data: Plotly.Data[], layout: Partial<Plotly.Layout>, config: object) => void }).react(
        containerRef.current,
        data,
        mergedLayout,
        { displayModeBar: false, responsive: true }
      );
    }

    render();
  }, [data, layout, height]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={title}
      style={{ width: '100%', minHeight: `${height}px` }}
    />
  );
}
