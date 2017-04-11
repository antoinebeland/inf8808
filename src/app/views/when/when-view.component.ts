import {
  Component, OnInit,
} from '@angular/core';

import {BarChartConfig} from '../../graphics/bar-chart/bar-chart-config';
import {AccidentService, HourlyAccident, DailyAccident} from '../../services/accident.service';

/**
 * Définit la vue "Quand"
 */
@Component({
  selector: 'when-view',
  templateUrl: 'when-view.component.html',
  styleUrls: ['when-view.component.css']
})
export class WhenViewComponent implements OnInit {

  hourlyAccidentDataset: Array<HourlyAccident>;
  dailyAccidentDataset: Array<DailyAccident>;

  barChartMonthConfig: BarChartConfig;
  barChartDaysOfTheWeekConfig: BarChartConfig;

  /**
   * Initialise une nouvelle instance de la classe WhenViewComponent.
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

    this.accidentService.accidentsPerMonths.then(d => {
      this.barChartMonthConfig = {
        height: 250,
        width: 500,
        margin: {
          top: 25,
          right: 40,
          bottom: 40,
          left: 80
        },
        title: 'Accidents par mois',
        dataset: d
      };
    });

    this.accidentService.accidentsPerDaysOfTheWeek.then(d => {
      this.barChartDaysOfTheWeekConfig = {
        height: 250,
        width: 500,
        margin: {
          top: 25,
          right: 20,
          bottom: 40,
          left: 60
        },
        title: 'Accidents par jours de la semaine',
        dataset: d
      };
    });

    this.accidentService.hourlyAccidentsFiltered
      .then(accidents => {
        this.hourlyAccidentDataset = accidents;
      });

    this.accidentService.dailyAccidentsFiltered
      .then(accidents => {
        this.dailyAccidentDataset = accidents;
      });
  }
}

