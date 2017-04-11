/**
 * Définit la configuration à utiliser avec un bar chart.
 */
export interface BarChartConfig {
  width: number;
  height: number;
  margin: Margin;
  title?: string;
  dataset: Array<BarChartData>;
}

/**
 * Définit une donnée d'un bar chart.
 */
export interface BarChartData {
  id: number;
  name: string;
  label: string;
  value: number;
}
