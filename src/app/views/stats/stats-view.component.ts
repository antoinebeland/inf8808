import {
  Component, OnInit,
} from '@angular/core';

import {AccidentService} from '../../services/accident.service';
import * as d3 from 'd3';

/**
 * Définit la vue des statistiques.
 */
@Component({
  selector: 'stats-view',
  templateUrl: 'stats-view.component.html',
  styleUrls: ['stats-view.component.css']
})
export class StatsViewComponent implements OnInit {

  accidentsCount: number;
  fatalAccidentsCount: number;
  deadCount: number;

  /**
   * Initialise une nouvelle instance de la classe StatsViewComponent.
   *
   * @param accidentService   Le service d'accident à utiliser.
   */
  constructor(private accidentService: AccidentService) {}

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    this.accidentService.accidents.then(d => {
      this.accidentsCount = d.length;
      this.fatalAccidentsCount = d.filter(e => e.gravity == 3).length;
      this.deadCount = d3.sum(d.map(e => e.dead));
    });
  }
}

