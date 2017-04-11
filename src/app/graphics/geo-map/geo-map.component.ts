import {
  Component,
  OnInit,
  OnChanges,
  ViewChild, ElementRef, Input
} from '@angular/core';

import { createLegend, updateLegend } from '../heat-map/heat-map';
import { MRCAccident } from '../../services/accident.service';
import { GeoMapConfig } from './geo-map-config';
import { showTooltip } from 'app/graphics/shared/d3-tip-util';

import * as d3 from 'd3';
import * as d3Tip from 'd3-tip';
import * as _ from 'lodash';
import * as colorbrewer from 'colorbrewer';
import * as L from 'leaflet';

@Component({
  selector: 'geomap',
  templateUrl: 'geo-map.component.html',
  styleUrls: ['geo-map.component.css']
})
export class GeoMapComponent implements OnInit, OnChanges {

  @ViewChild('map') element: ElementRef;

  @Input() json: any;
  @Input() config: GeoMapConfig;
  @Input() searchText: string;

  mrcList: string[];
  searchName: string;
  currentSelection: any;
  private isInitialized = false;

  /**
   * Associe D3 à Leaflet.
   *
   * @param map Carte Leaflet
   */
  private static linkD3toLeaflet(map) {
    let svg = d3.select(map.getPanes().overlayPane).append('svg');
    let g = svg.append('g').attr('class', 'leaflet-zoom-hide');

    return [svg, g];
  }

  /** Redimensionne et repositionne le SVG sur la carte lors d'une update. */
  private static positionSVG(svg, g, path, quebec) {

    let bounds = path.bounds(quebec);

    let topLeft = bounds[0],
      bottomRight = bounds[1];

    svg.attr('width', bottomRight[0] - topLeft[0])
      .attr('height', bottomRight[1] - topLeft[1])
      .style('left', topLeft[0] + 'px')
      .style('top', topLeft[1] + 'px');

    g.attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');

    return bounds;
  }

  /**
   * Mise à jour des éléments d3 sur la carte.
   *
   * @param quebec Éléments path delimitant le Quebec
   * @param path Projection des points sur la carte
   */
  private static featuresUpdate(quebec, path) {
    quebec.attr('d', path);
  }

  /**
   * Retourne une string sans espace ni point, tout en minuscule.
   *
   * @param name    Le nom non normalisé.
   */
  private static normalizeName(name: string) {
    return name.replace(/\s+/g, '').replace(/\.|\'/g, '').toLowerCase();
  }

  /**
   * Définit le texte associé à la légence.
   *
   * @param t     L'élément de base.
   * @param text  Le texte de la légende.
   */
  private static setLegendText(t, text) {
    t.style('opacity', 0)
      .text(text)
      .transition().duration(1000)
      .style('opacity', 1);
  }

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    let mrcs = this.config.dataset;
    this.mrcList = _(mrcs).map(mrc => mrc.name).uniq().value();

    let host = d3.select(this.element.nativeElement);
    host
      .attr('id', 'map')
      .style({
        'width': '100%',
        'height': '100%'
      });

    let map = this.linkDivToLeaflet('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}');
    let [svg, g] = GeoMapComponent.linkD3toLeaflet(map);

    let colors = _.tail(colorbrewer.Reds[9]);
    let colorScale = d3.scale.quantile<string>()
      .domain(_(mrcs).map(d => d.totalAccidents).sort().value())
      .range(colors);

    let path = this.createPath(map);

    let d3_mrc_quebec = host
      .select('svg g')
      .append('g')
      .attr('id', 'quebecmrc')
      .selectAll('path')
      .data(this.json.features)
      .enter().append('path')
      .attr({
        'class': (d: any) => {
          let mrc = _.find(mrcs, m => m.code === +d.properties.MRS_CO_MRC);
          return GeoMapComponent.normalizeName(mrc.name) + ' mrc';
        },
        'd': path,
        'fill': (d: any) => {
          let val = _.find(mrcs, m => m.code === +d.properties.MRS_CO_MRC).totalAccidents;
          return val ? colorScale(val) : colorScale(0);
        },
        'opacity': 0.8,
        'stroke': 'black',
        'stroke-width': 1,
        'stroke-opacity': 0.2,
        'data-mrc': (d: any) => {
          let a = _.find(mrcs, m => m.code === +d.properties.MRS_CO_MRC);
          return JSON.stringify(a);
        }
      });

    let tip: any = d3Tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function() {
        let current = d3.select(this);
        let infos = JSON.parse(current.attr('data-mrc'));
        return 'MRC : ' + infos.name + '<br>' +
          'Nombre d\'accidents : ' + infos.totalAccidents + '<br>' +
          'Nombre d\'habitants : ' + infos.population;
      });

    d3_mrc_quebec
      .on('mouseover', function(event) {
        showTooltip.call(this, event, tip);
      })
      .on('mouseout', tip.hide);
    svg.call(tip);

    // Mise à jour de la carte du Québec
    let update = (svg, g, path, quebec, json) => {
      let positionSVG = GeoMapComponent.positionSVG;
      let featuresUpdate = GeoMapComponent.featuresUpdate;
      return function() {
        // Redimensionnement et repositionnement du SVG
        positionSVG(svg, g, path, json);

        // Mise à jour élements SVG
        featuresUpdate(quebec, path);
      };
    };

    // Permet de redessiner la carte du Québec à chaque fois que c'est nécessaire (ici : quand on zoom)
    map.on('zoom', update(svg, g, path, d3_mrc_quebec, this.json));
    update(svg, g, path, d3_mrc_quebec, this.json)();

    this.createMapLegend(colorScale, 'Nombre d\'accidents');

    this.isInitialized = true;
  }

  /**
   * Survient lorsque les données associées au composant sont modifiées.
   */
  ngOnChanges() {
    if (!this.json || !this.config || !this.isInitialized) {
      return;
    }
    let mrcs = this.config.dataset;

    let legendTitle = '';
    let allAccidents: number[] = [];
    if (this.config.view === 'absolute') {
      legendTitle = 'Nombre d\'accidents';
      allAccidents = _(mrcs).map(mrc => mrc.totalAccidents).sortBy().value();
    } else if (this.config.view === 'relative') {
      legendTitle = 'Nombre d\'accidents par 10 000 habitants';
      allAccidents = _(mrcs)
        .map(mrc => mrc.totalAccidents * 10000 / mrc.population)
        .sortBy().value();
    }

    let colors = _.tail(colorbrewer.Reds[9]);
    let colorScale = d3.scale.quantile<string>()
      .domain(allAccidents)
      .range(colors);
    this.updateMap(mrcs, colorScale, this.config.view);

    let g = d3.select('#svgLegend .gLegend');
    updateLegend(g, colorScale);

    GeoMapComponent.setLegendText(g.select('text'), legendTitle);
  }


  /**
   * Associe le fond de carte de l'url à la balise div précedemment créée.
   *
   * @param url Lien vers le fond de carthographie
   */
  private linkDivToLeaflet(url) {
    let copyright = 'Tiles courtesy of <a href=\'http://openstreetmap.se/=\' target=\'_blank\'>' +
      'OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a>';

    let bounds = new L.LatLngBounds(new L.LatLng(42.0, -85.0), new L.LatLng(60.0, -50.0));
    let layer = L.tileLayer(url, {
      attribution: copyright,
      maxZoom: 7,
      minZoom: 4,
      reset: false
    });
    let map = new L.Map('map', {
      zoom: 4.5,
      center:  bounds.getCenter(),
      layers: [layer],
      maxBounds: bounds,
      maxBoundsViscosity: 0.75
    });

    setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds);
    }, 300);
    return map;
  }

  /**
   * Survient lorsque le nom entré dans la barre de recherche est modifié.
   */
  searchNameChanged() {
    let mrc = GeoMapComponent.normalizeName(this.searchName);
    if (!mrc) {
      return;
    }
    if (this.currentSelection) {
      this.currentSelection.attr({
        'stroke': 'black',
        'stroke-width': 1,
        'stroke-opacity': 0.2
      });
    }
    this.currentSelection = d3.select(this.element.nativeElement.querySelector('.' + mrc));
    this.currentSelection.attr({
      'stroke': 'black',
      'stroke-width': 6,
      'stroke-opacity': 0.8
    });
  }

  /**
   * Création d'un path pour projeter l'ensemble des points de geoJSON sur Leaflet.
   *
   * @param map Carte Leaflet
   */
  private createPath(map) {
    let transform = d3.geo.transform({point: this.projectPoint(map)});
    return d3.geo.path().projection(transform);
  }

  /**
   * Permet de projeter un point CRS sur la carte.
   *
   * @param map Carte Leaflet
   */
  private projectPoint(map) {
    return function(x, y) {
      let point = map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    };
  }

  /**
   * Crée la légende associée à la carte.
   *
   * @param colorScale    L'échelle de couleur à utiliser.
   * @param text          Le texte à afficher avec la légende.
   */
  private createMapLegend(colorScale, text) {
    let hmMargin = { top: 30, right: 0, bottom: 10, left: 0 };
    let legendSize = { width: 55, height: 15 };
    let legendWidth = legendSize.width * (colorScale.quantiles().length + 1);
    let legendHeight = legendSize.height * 4;

    let g = d3
      .select(this.element.nativeElement.parentNode).select('.map')
      .append('svg')
      .attr({
        'id': 'svgLegend',
        // 'width': 960,
        'width': legendWidth + hmMargin.left + hmMargin.right,
        'height': legendHeight + hmMargin.top + hmMargin.bottom,
      })
      .append('g')
      .attr('transform', 'translate(' + hmMargin.left + ',' + hmMargin.top + ')');

    createLegend(g, text, colorScale, legendSize);
  }

  /**
   * Met à jour la carte.
   *
   * @param mrcs        La liste des MRC.
   * @param colorScale  L'échelle de couleur.
   * @param view        La vue à utiliser (absolue/relative).
   */
  private updateMap(mrcs, colorScale, view) {
    d3.selectAll('#quebecmrc path')
      .attr({
        'data-mrc': (d: any) => {
          let a = _.find(mrcs, (m: any) => m.code === +d.properties.MRS_CO_MRC);
          return JSON.stringify(a);
        }
      })
      .transition().duration(1000)
      .attr({
        'fill': (d: any) => {
          let mrc = _.find(mrcs, (m: MRCAccident) => m.code === +d.properties.MRS_CO_MRC);
          let val = 0;
          if (view === 'absolute') {
            val = mrc.totalAccidents;
          } else if (view === 'relative') {
            val = mrc.totalAccidents * 10000 / mrc.population;
          }
          return val ? colorScale(val) : colorScale(0);
        }
      });
  }
}

