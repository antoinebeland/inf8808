import {
  Component,
  OnInit,
  OnChanges,
  ViewChild, ElementRef, Input
} from '@angular/core';

import * as d3 from 'd3';
import * as d3Tip from 'd3-tip';

import {BarChartConfig} from './bar-chart-config';
import {showTooltip} from '../shared/d3-tip-util';

/**
 * Définit un bar chart générique.
 * @see http://bl.ocks.org/d3noob/8952219
 */
@Component({
  selector: 'barchart',
  template: `
    <div #container class='container'></div>
  `,
  styleUrls: ['bar-chart.component.css']
})
export class BarChartComponent implements OnInit, OnChanges {

  @ViewChild('container') element: ElementRef;
  @Input() config: BarChartConfig;

  private height: number;
  private xScale: any;
  private yScale: any;
  private xAxis: any;
  private yAxis: any;
  private g: any;

  private isInitialized = false;

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    let margin = this.config.margin;
    let width = this.config.width - margin.left - margin.right;
    this.height = this.config.height - margin.top - margin.bottom;

    this.g = d3.select(this.element.nativeElement)
               .append('svg')
               .attr({
                 'class': 'barchart',
                 width: '100%',
                 height: '100%',
                 viewBox: '0 0 ' + this.config.width + ' ' + this.config.height
               });

    if (this.config.title) {
      this.g.append('text')
            .text(this.config.title)
            .attr({
              'class': 'title',
              'x': this.config.width / 2,
              'text-anchor': 'middle'
            });
    }

    this.g = this.g.append('g')
                   .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    this.xScale = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
    this.yScale = d3.scale.linear().range([this.height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient('bottom');

    this.yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient('left')
        .tickFormat(d3.format('d'));

    this.updateDomains();

    let tip: any = d3Tip()
                  .attr('class', 'd3-tip')
                  .offset([-10, 0])
                  .html(d => d.name + ': ' + d.value);

    this.g.call(tip);

    this.g.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + this.height + ')')
          .call(this.xAxis)
          .selectAll('text')
          .data(this.config.dataset)
          .text(d => d.label);

    this.g.append('g')
          .attr('class', 'y axis')
          .call(this.yAxis);

    this.g.selectAll('rect')
          .data(this.config.dataset)
          .enter()
          .append('rect')
          .attr({
            'class': 'bar',
            x: d => this.xScale(d.id),
            y: d => this.yScale(d.value),
            width: this.xScale.rangeBand(),
            height: d => this.height - this.yScale(d.value)
          })
          .on('mouseover', function(event) {
            showTooltip.call(this, event, tip);
          })
          .on('mouseout', tip.hide);

    this.isInitialized = true;
  }

  /**
   * Survient lorsque les données associées au bar chart changent.
   */
  ngOnChanges() {
    if (!this.isInitialized) {
      return;
    }
    const ANIMATION_DURATION = 1000;

    this.updateDomains();
    this.g.selectAll('.y.axis')
      .transition()
      .duration(ANIMATION_DURATION)
      .call(this.yAxis);

    this.g.selectAll('rect')
          .data(this.config.dataset)
          .transition()
          .duration(ANIMATION_DURATION)
          .attr({
            y: d => this.yScale(d.value),
            height: d => this.height - this.yScale(d.value)
          });
  }

  /**
   * Met à jour les domaines du bar chart.
   */
  private updateDomains() {
    this.xScale.domain(this.config.dataset.map(d => d.id));
    this.yScale.domain([0, d3.max(this.config.dataset, d => d.value)]);
  }
}
