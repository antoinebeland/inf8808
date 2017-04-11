import * as d3 from 'd3';

/**
 * Définit la configuration d'une carte de chaleur.
 */
export interface HeatMapConfig {
  settings: HeatMapSettings;
  dataset: Array<HeatMapData>;
}

/**
 * Définit les réglages possibles pour une carte de chaleur.
 */
export interface HeatMapSettings {
  gridSize: { x: number, y: number, nx: number, ny: number };
  labels: { x: Array<string>, y: Array<string>};
  margin: Margin;
  colorScale: d3.scale.Quantile<string>,
  legendSize: { width: number, height: number };
}

/**
 * Définit une donnée qui est utilisée par une carte de chaleur.
 */
export interface HeatMapData {
  row: number;
  col: number;
  val: number;
}
