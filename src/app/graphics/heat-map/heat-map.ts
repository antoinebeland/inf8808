/**
 * Construit une balise SVG dans le DOM.
 *
 * @param host      La balise hôte du SVG.
 * @param width     La largeur du contexte SVG.
 * @param height    La hauteur du contexte SVG.
 * @param margin    La marge à utiliser.
 * @returns {[any,any]}
 */
export function buildSvg(host, width, height, margin) {
  let svg = host.append('svg');
  let g = svg.append('g');
  updateSvg(svg, width, height, margin);
  return [svg, g];
}

/**
 * Met à jour la balise SVG.
 *
 * @param svg       La balise associée au contexte SVG.
 * @param width     La largeur du contexte SVG.
 * @param height    La hauteur du contexte SVG.
 * @param margin    La marge à utiliser.
 */
export function updateSvg(svg, width, height, margin) {
  return svg
    .attr({
      width: '100%',
      height: '100%',
      viewBox: '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom)
    })
    .select('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
}

/**
 * Crée une carte de chaleur.
 *
 * @param svg           Le contexte SVG à utiliser.
 * @param data          Les données à utiliser.
 * @param gridSize      La taille de la grille.
 * @param colorScale    L'échelle de couleur.
 * @returns {selection.Update<NewDatum>}
 */
export function createHeatMap(svg, data, gridSize, colorScale) {
  let cards = svg.selectAll('.card')
                 .data(data);

  cards.enter()
       .append('rect')
       .attr({
         'x': d => d.row * gridSize.x,
         'y': d => d.col * gridSize.y,
         'rx': 4,
         'ry': 4,
         'class': 'card bordered',
         'width': gridSize.x,
         'height': gridSize.y
       })
       .style('fill', colorScale(0));

  cards.transition()
       .duration(1000)
       .style('fill', d => colorScale(d.val));

  cards.exit().remove();
  return cards;
}

/**
 * Crée une légende associée à la heat map.
 *
 * @param svg           Le contexte SVG à utiliser.
 * @param text          Le texte associé à la légende.
 * @param colorScale    L'échelle de couleur.
 * @param legendSize    La taille de la légende.
 * @returns {any}
 */
export function createLegend(svg, text, colorScale, legendSize) {
  let numberQuantiles = colorScale.quantiles().length;
  let g = svg.append('g').attr('class', 'gLegend');

  g.append('text')
    .text(text)
    .attr({
      'x': legendSize.width * numberQuantiles / 2,
      'y': 0,
      'class': 'legend-title'
    })
    .style('text-anchor', 'middle');

  let gLegend = g.selectAll('.legend')
                 .data([0].concat(colorScale.quantiles()))
                 .enter()
                 .append('g')
                 .attr('class', 'legend');

  gLegend.append('rect')
         .attr({
           'x': (d, i) => legendSize.width * i,
           'y': legendSize.height,
           'width': legendSize.width,
           'height': legendSize.height
         });

  gLegend.append('text')
         .attr({
           'x': (d, i) => legendSize.width * i + legendSize.width / 2,
           'y': legendSize.height * 2 + 15,
           'class': 'label'
         })
         .style('text-anchor', 'middle');

  updateLegend(g, colorScale);
  return g;
}

/**
 * Met à jour la légende
 *
 * @param g           Le groupe G associé à la légende.
 * @param colorScale  L'échelle de couleur à utiliser.
 */
export function updateLegend(g, colorScale) {
  let legend = g.selectAll('.legend')
                .data([0].concat(colorScale.quantiles()));
  legend.select('rect')
        .attr('fill', d => colorScale(d));

  legend.select('text')
        .text(d => '≥ ' + Math.round(d));
}

/**
 * Crée un XLabel.
 *
 * @param svg     Le contexte SVG à utiliser.
 * @param width   La largeur.
 * @param label   Le texte associé à l'étiquette.
 */
export function createXLabel(svg, width, label) {
  svg
    .append('text')
    .text(label)
    .style({
      'text-anchor': 'middle',
      'text-transform': 'capitalize',
      'font-weight': 'bold'
    })
    .attr({
      'x': 0,
      'y': 0,
      'transform': 'translate(' + width / 2 + ', -6)',
      'class': 'label'
    });
}
