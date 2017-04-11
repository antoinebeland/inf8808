import {
  Component, OnInit,
} from '@angular/core';
import { AccidentService } from '../../services/accident.service';
import { QuebecMapService } from '../../services/quebec-map.service';

import * as _ from 'lodash';

/**
 * Définit la vue "Où"
 */
@Component({
  selector: 'where-view',
  templateUrl: 'where-view.component.html',
  styleUrls: ['where-view.component.css'],
  providers: [ QuebecMapService ]
})
export class WhereViewComponent implements OnInit {

  barChartConfig;
  mrcJson;
  geoMapConfig;

  view = 'absolute';
  mrcView = 'absolute';

  /**
   * Initialise une nouvelle instance de la classe WhereViewComponent.
   *
   * @param quebecMapService  Le service de carte.
   * @param accidentService   Le service d'accident à utiliser.
   */
  constructor(private quebecMapService: QuebecMapService,
              private accidentService: AccidentService) {}

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    this.initializeGraphics();
    this.accidentService.onDataChanged.subscribe(this.initializeGraphics.bind(this));
  }

  private initializeGraphics() {
    this.quebecMapService.mrcJson.then(json => this.mrcJson = json);
    this.setMRCActiveView(this.mrcView);
    this.setRAActiveView(this.view);
  }

  /**
   * Met à jour la vue à afficher pour le bar chart des régions administratives.
   *
   * @param view  La vue à utiliser.
   */
  setRAActiveView(view: string) {
    this.view = view;

    this.accidentService.accidentsByRAFiltered.then(accs => {
      let legendText = '';
      let d = [];
      if (view === 'absolute') {
        legendText = 'Nombre d\'accidents';
        d = _(accs).map(r => {
            return {
              id: r.code,
              label: r.name,
              name: r.name,
              value: r.totalAccidents
            };
          }).orderBy('id', 'asc').value();
      } else if (view === 'relative') {
        legendText = 'Nombre d\'accidents par 10 000 habitants';
        d = _(accs).map(r => {
            return {
              id: r.code,
              label: r.name,
              name: r.name,
              value:  Math.round(r.totalAccidents * 10000 / r.population)
            };
          }).orderBy('id', 'asc').value();
      }

      this.barChartConfig = {
        height: 600,
        width: 1000,
        margin: {
          top: 20,
          right: 40,
          bottom: 100,
          left: 250
        },
        dataset: d
      };

    });
  }

  /**
   * Met à jour la vue à afficher pour la carte des MRC.
   *
   * @param view  La vue à utiliser.
   */
  setMRCActiveView(view: string) {
    this.mrcView = view;

    this.accidentService.accidentsByRAFiltered.then(accs => {
      this.geoMapConfig = {
        view: view,
        dataset: _.flatMap(accs, a => a.mrcs)
      };
    });
  }
}

