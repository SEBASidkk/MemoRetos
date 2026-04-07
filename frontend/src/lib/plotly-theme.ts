import type * as Plotly from 'plotly.js';

export const UNAE_LAYOUT: Partial<Plotly.Layout> = {
  paper_bgcolor: 'transparent',
  plot_bgcolor:  'transparent',
  font: { color: '#94a3b8', family: 'Inter, system-ui, sans-serif', size: 12 },
  margin: { t: 24, r: 20, b: 48, l: 52 },
  xaxis: {
    gridcolor:     '#1e293b',
    zerolinecolor: '#334155',
    tickfont:      { color: '#64748b', size: 11 },
    linecolor:     '#334155',
  },
  yaxis: {
    gridcolor:     '#1e293b',
    zerolinecolor: '#334155',
    tickfont:      { color: '#64748b', size: 11 },
    linecolor:     '#334155',
  },
  legend: {
    bgcolor:     'transparent',
    bordercolor: '#334155',
    font:        { color: '#94a3b8', size: 11 },
  },
};
