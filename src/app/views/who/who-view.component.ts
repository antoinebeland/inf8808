import {
  Component, OnInit,
} from '@angular/core';

import { AccidentService, EntityAccident } from '../../services/accident.service';

import * as _ from 'lodash';

/**
 * Définit la vue "Qui"
 */
@Component({
  selector: 'who-view',
  templateUrl: 'who-view.component.html',
  styleUrls: ['who-view.component.css']
})
export class WhoViewComponent implements OnInit {

  accidentsCount: number;
  entitiesAccidentDataset: EntityAccident[];

  private isDatasetEmpty = true;

  /**
   * Initialise une nouvelle instance de la classe WhoViewComponent.
   *
   * @param accidentService   Le service d'accident à utiliser.
   */
  constructor(private accidentService: AccidentService) {}

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    this.initializeGraphics();
    this.accidentService.onDataChanged.subscribe(this.initializeGraphics.bind(this));
  }

  /**
   * Initialise ou met à jour les différentes visualisations dans la vue courante.
   */
  private initializeGraphics() {
    this.accidentService.accidentsByEntityFiltered.then(d => {
      console.log(d);
      this.entitiesAccidentDataset = d;
      this.isDatasetEmpty = !_.some(d, v => v.totalAccidents > 0);
    });
    this.accidentService.accidentsFiltered.then(d => this.accidentsCount = d.length);
  }
}
