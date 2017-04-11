import {
  Component,
  OnInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';

import { HourlyAccident, WEEKDAYS, MONTHS } from '../../services/accident.service';
import { buildSvg, updateSvg, createHeatMap, createLegend, updateLegend, createXLabel } from './heat-map';
import { createColorScale } from '../shared/color-scale';

import * as d3 from 'd3';
import * as d3Tip from 'd3-tip';
import * as _ from 'lodash';
import {showTooltip} from '../shared/d3-tip-util';

const maxDaysPerMonth = 31;

/**
 * Définit une carte de chaleur pour toutes les heures de l'années.
 */
@Component({
  selector: 'heatmaphour',
  template: `
    <div #container class='container heatmaphour'></div>
  `,
  styleUrls: ['heat-map.component.css']
})
export class HeatMapHourComponent implements OnInit, OnChanges {

  @ViewChild('container') element: ElementRef;
  @Input() dataset: Array<HourlyAccident>;

  // Initialisation des mesures
  private legendSize = { width: 80, height: 20 };
  private cardSize = { x: 5, y: 5 };
  private nbMonthsPerRow = 6;
  private hmMargin = { top: 20, right: 20, bottom: 20, left: 25 };
  private svgMargin = { top: 20, right: 0, bottom: 20, left: 0 };

  private isInitialized = false;

  /**
   * Permet d'obtenir une étiquette associée à un mois particulié.
   *
   * @param month       Le numéro associé au mois.
   * @returns {string}
   */
  private static getMonthLabel(month) {
    return new Date(2015, month).toLocaleString('fr', { month: 'long' });
  }

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    let host = d3.select(this.element.nativeElement);

    let colorScale = createColorScale(this.dataset);
    let hmSvgWidth = this.cardSize.x * this.getHoursPerDay().length +
      this.hmMargin.left + this.hmMargin.right;
    let hmSvgHeight = this.cardSize.y * maxDaysPerMonth +
      this.hmMargin.top + this.hmMargin.bottom;

    let svgWidth = hmSvgWidth * this.nbMonthsPerRow;
    let svgMargin = { top: 20, right: 0, bottom: 30, left: 0 };
    let width = hmSvgWidth * this.nbMonthsPerRow;
    let height = hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) + this.legendSize.height * 2 + 30;
    let [svg, g] = buildSvg(host, width, height, svgMargin);

    let svgs = g
      .selectAll('g')
      .data(MONTHS).enter()
      .append('g')
      .attr({
        'class': 'hourheatmap',
        'width': hmSvgWidth,
        'height': hmSvgHeight,
        'transform': m => {
          let x = (m % this.nbMonthsPerRow) * hmSvgWidth;
          let y = hmSvgHeight * Math.floor(m / this.nbMonthsPerRow);
          return 'translate(' + x + ',' + y + ')';
        }
      })
      .append('g')
      .attr('transform', 'translate(' + this.hmMargin.left + ',' + this.hmMargin.top + ')');

    createXLabel(svgs, hmSvgWidth - this.hmMargin.left - this.hmMargin.bottom, HeatMapHourComponent.getMonthLabel);

    let heatmaps = createHeatMap(svgs, this.getMonthDataset, this.cardSize, colorScale);
    heatmaps
      .attr({
        'transform': 'translate(' + 0 + ', ' + 5 + ')',
        'class': 'card bordered'
      });

    let legend = createLegend(g, 'Nombre d\'accidents', colorScale, this.legendSize);
    let legendWidth = this.legendSize.width * colorScale.quantiles().length;
    legend.attr('transform', 'translate(' + (svgWidth / 2 - legendWidth / 2) + ', '
      + (hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) + 30) + ')');

    this.updateHeatMapTip(g, heatmaps);

    this.isInitialized = true;
  }

  /**
   * Survient lorsque les données associées au composant changent.
   */
  ngOnChanges() {
    if ((!this.dataset && this.dataset.length == 0) || !this.isInitialized) {
      return;
    }
    let host = d3.select(this.element.nativeElement);

    let hmSvgWidth = this.cardSize.x * this.getHoursPerDay().length +
      this.hmMargin.left + this.hmMargin.right;
    let hmSvgHeight = this.cardSize.y * maxDaysPerMonth +
      this.hmMargin.top + this.hmMargin.bottom;
    let svgWidth = hmSvgWidth * this.nbMonthsPerRow;
    let svgHeight = hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) +
      this.legendSize.height * 2 + 30;

    updateSvg(host.select('svg'), svgWidth, svgHeight, this.svgMargin);

    let colorScale = createColorScale(this.dataset);
    let svgs = d3.selectAll('.hourheatmap > g');
    let heatmaps = svgs
      .selectAll('.card')
      .data(this.getMonthDataset)
      .style('fill', d => colorScale(0));
    heatmaps.transition().duration(1000).style('fill', d => colorScale(d.val));

    let g = host.select('.gLegend');
    updateLegend(g, colorScale);
    let legendWidth = this.legendSize.width * colorScale.quantiles().length;
    let x = svgWidth / 2 - legendWidth / 2;
    let y = hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) + 30;
    g.attr('transform', 'translate(' + x + ', ' + y + ')');
  }

  /**
   * Permet d'obtenir les données pour un mois particulié.
   *
   * @param month     Le mois associé aux données recherchées.
   * @returns {any[]}
   */
  private getMonthDataset = m => {
    return _(this.dataset)
      .filter(d => d.month === m)
      .map(d => {
        return { month: m, row: d.hour, col: d.day - 1, val: d.val };
      })
      .value();
  }

  /**
   * Met à jour le tooltip associé à la heat map courante.
   *
   * @param svg       Le contexte SVG à utiliser.
   * @param heatmaps  Les différentes heat maps.
   */
  private updateHeatMapTip(svg, heatmaps) {
    let tip: any = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(d => {
        return 'Date : ' + WEEKDAYS[new Date(2015, d.month, (d.col + 1)).getDay()] +
          ' le ' + (d.col + 1) +
          ' ' + HeatMapHourComponent.getMonthLabel(d.month) +
          ' ' + 2015 +
          ' à ' + d.row + 'h' + '<br>' +
          'Nombre d\'accidents : ' + d.val;
      });
    heatmaps
      .on('mouseover', function(event) {
        showTooltip.call(this, event, tip);
      })
      .on('mouseout', tip.hide);
    svg.call(tip);
  }

  /**
   * Obtenir un tableau de string qui représente les heures d'une journée
   * prétraitées.
   *
   * @return Tableau de string des heures d'une journée
   */
  private getHoursPerDay() {
    let zero = d3.format('02d');
    let hours = _.range(24);
    return _.map(hours, h => zero(h) + 'h');
  }
}

