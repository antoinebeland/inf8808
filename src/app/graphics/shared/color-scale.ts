import * as colorbrewer from 'colorbrewer';
import * as d3 from 'd3';

/**
 * Définit quelque chose de quantifiable.
 */
interface Quantifiable {
  val: number;
}

/**
 * Permet de créer un échelle de couleur.
 *
 * @param dataset               Les données à utiliser.
 * @returns {Quantile<string>}
 */
export function createColorScale(dataset: Quantifiable[]) {
  let minVal = d3.min(dataset, d => d.val);
  let maxVal = d3.max(dataset, d => d.val);
  if (maxVal == 1) {
    maxVal = 1;
  }
  let colors = colorbrewer.Reds[9];

  return d3.scale.quantile<string>()
    .domain([minVal, colors.length - 1, maxVal])
    .range(colors);
}

