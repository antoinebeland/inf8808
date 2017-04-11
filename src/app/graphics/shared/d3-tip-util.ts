import * as d3Tip from 'd3-tip';

/**
 * Permet d'afficher un tooltip, en contournant un problème d'affichage lié à Firefox.
 *
 * @param event   L'évènement "onmouseover"
 * @param tip     La tooltip à utiliser.
 */
export function showTooltip(event: any, tip: d3Tip) {
  let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  tip.show.call(this, event);

  // Workaround pour Firefox
  let top = parseInt(tip.style('top'), 10);
  while (top > height) {
    top = top - (height + 40);
  }
  tip.style('top', top + 'px');
}
