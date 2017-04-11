import {
  Component,
  OnInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';

import { DailyAccident, WEEKDAYS, MONTHS } from '../../services/accident.service';
import { buildSvg, createHeatMap, createLegend, updateLegend, createXLabel } from './heat-map';
import { createColorScale } from '../shared/color-scale';

import * as d3 from 'd3';
import * as d3Tip from 'd3-tip';

import * as _ from 'lodash';
import {showTooltip} from '../shared/d3-tip-util';

const daysPerWeek = 7;
const maxWeeksPerMonth = 6;

/**
 * Définit une carte de chaleur pour les différents jours de l'année.
 */
@Component({
  selector: 'heatmapday',
  template: `
    <div #container class="container"></div>
  `,
  styleUrls: ['heat-map.component.css']
})
export class HeatMapDayComponent implements OnInit, OnChanges {

  @ViewChild('container') element: ElementRef;

  @Input() dataset: DailyAccident[];

  // Initialisation des mesures
  private legendSize = { width: 80, height: 20 };
  private cardSize = { x: 30, y: 15 };
  private nbMonthsPerRow = 4;

  private hmMargin = { top: 20, right: 20, bottom: 20, left: 25 };
  private hmSvgWidth = this.cardSize.x * daysPerWeek +
                       this.hmMargin.left + this.hmMargin.right;
  private hmSvgHeight = (this.cardSize.y * maxWeeksPerMonth +
                         this.hmMargin.top + this.hmMargin.bottom);
  private svgWidth = this.hmSvgWidth * this.nbMonthsPerRow;

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

  ngOnInit() {
    let host = d3.select(this.element.nativeElement);
    let colorScale = createColorScale(this.dataset);

    let svgMargin = { top: 20, right: 0, bottom: 30, left: 0 };
    let width = this.hmSvgWidth * this.nbMonthsPerRow;
    let height = this.hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) + this.legendSize.height * 2 + 30;
    let [svg, g] = buildSvg(host, width, height, svgMargin);

    let svgs = g
      .selectAll('.dayheatmap')
      .data(MONTHS).enter()
      .append('g')
      .attr({
        'class': 'dayheatmap',
        'width': this.hmSvgWidth,
        'height': m => this.hmSvgHeight,
        'transform': m => {
          let x = (m % this.nbMonthsPerRow) * this.hmSvgWidth;
          let y = this.hmSvgHeight * Math.floor(m / this.nbMonthsPerRow);
          return 'translate(' + x + ',' + y + ')';
        }
      })
      .append('g')
      .attr('transform', 'translate(' + this.hmMargin.left + ',' + this.hmMargin.top + ')');

    createXLabel(svgs, this.hmSvgWidth - this.hmMargin.left - this.hmMargin.right, HeatMapDayComponent.getMonthLabel);

    let heatmaps = createHeatMap(svgs, this.getMonthDataset, this.cardSize, colorScale);
    heatmaps
      .attr({
        'transform': 'translate(' + 0 + ', ' + 5 + ')',
        'class': 'card bordered'
      });

    let legend = createLegend(g, 'Nombre d\'accidents', colorScale, this.legendSize);
    let legendWidth = this.legendSize.width * colorScale.quantiles().length;
    legend.attr('transform', 'translate(' + (this.svgWidth / 2 - legendWidth / 2) +
      ', ' + (this.hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) + 30) + ')');

    this.updateHeatMapTip(g, heatmaps);

    this.isInitialized = true;
  }

  /**
   * Survient lorsque les données associées au composant sont modifiées.
   */
  ngOnChanges() {
    if ((!this.dataset && this.dataset.length == 0) || !this.isInitialized) {
      return;
    }
    let host = d3.select(this.element.nativeElement);

    let colorScale = createColorScale(this.dataset);
    let svgs = d3.selectAll('.dayheatmap > g');
    let heatmaps = svgs
      .selectAll('.card')
      .data(this.getMonthDataset)
      .style('fill', d => colorScale(0));

    heatmaps.transition().duration(1000).style('fill', d => colorScale(d.val));
    this.updateHeatMapTip(host.select('svg'), heatmaps);

    let g = host.select('.gLegend');
    updateLegend(g, colorScale);
    let legendWidth = this.legendSize.width * colorScale.quantiles().length;
    let x = this.svgWidth / 2 - legendWidth / 2;
    let y = this.hmSvgHeight * Math.ceil(MONTHS.length / this.nbMonthsPerRow) + 30;
    g.attr('transform', 'translate(' + x + ', ' + y + ')');
  }

  /**
   * Permet d'obtenir les données pour un mois particulié.
   *
   * @param month     Le mois associé aux données recherchées.
   * @returns {any[]}
   */
  private getMonthDataset = month => {
    let specificMonth = _.filter(this.dataset, d => d.month === month);
    let fstOfMonth = _(specificMonth).sortBy('day').head();
    return _(specificMonth)
      .map(d => {
        return {
          month: month,
          day: d.day,
          row: d.weekday,
          col: Math.floor((d.day - 1 + fstOfMonth.weekday) / daysPerWeek),
          val: d.val
        };
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
    d3.selectAll('.dayheatmaptip').remove();
    let tip: any = d3Tip()
      .attr('class', 'd3-tip dayheatmaptip')
      .offset([-10, 0])
      .html(d => {
        return 'Date : ' + WEEKDAYS[d.row] +
               ' le ' + d.day +
               ' ' + HeatMapDayComponent.getMonthLabel(d.month) +
               ' ' + 2015 + '<br>' +
               'Nombre d\'accidents : ' + d.val;
      });
    heatmaps
      .on('mouseover', function(event) {
        showTooltip.call(this, event, tip);
      })
      .on('mouseout', tip.hide);
    svg.call(tip);

  }
}

