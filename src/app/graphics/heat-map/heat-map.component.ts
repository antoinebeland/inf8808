import {
  Component,
  OnChanges,
  ViewChild,
  ElementRef,
  Input
} from '@angular/core';
import { HeatMapConfig } from './heat-map-config';
import { buildSvg, createHeatMap } from './heat-map';

import * as d3 from 'd3';

/**
 * Définit une carte de chaleur.
 */
@Component({
  selector: 'heatmap',
  template: `
    <div #container class="container"></div>
  `,
  styleUrls: ['heat-map.component.css']
})
export class HeatMapComponent implements  OnChanges {

  @ViewChild('container') element: ElementRef;
  @Input() config: HeatMapConfig;

  /**
   * Survient lorsque les données associées au composant changent.
   */
  ngOnChanges() {
    if (!this.config) {
      return;
    }

    let gridSize = this.config.settings.gridSize;
    let margin = this.config.settings.margin;
    let colorScale = this.config.settings.colorScale;

    let width = gridSize.x * gridSize.nx;
    let height = gridSize.y * gridSize.ny;

    let host = d3.select(this.element.nativeElement);
    let svg = buildSvg(host, width, height, margin);

    createHeatMap(svg, this.config.dataset, gridSize, colorScale);
  }
}

