import {EventEmitter, Injectable} from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import * as _ from 'lodash';
import * as d3 from 'd3';
import {BarChartData} from '../graphics/bar-chart/bar-chart-config';
import {QuebecInfoService} from './quebec-info-service.service';

export const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const MONTHS = _.range(12);

export interface HourlyAccident {
  /** Numéro du mois entre 0 et 11. */
  month: number;
  /** Jour du mois entre 1 et 31 (dépendamment du mois). */
  day: number;
  /** Jour de la semaine entre 0 et 6 débutant le dimanche. */
  weekday: number;
  /** Heure du jour entre 0 et 23. */
  hour: number;
  /** Nombre d'accidents total */
  val: number;
  /** Ensemble d'accidents. */
  accidents: Accident[];
}

export interface DailyAccident {
  /** Numéro du mois entre 0 et 11. */
  month: number;
  /** Jour du mois entre 1 et 31 (dépendamment du mois). */
  day: number;
  /** Jour de la semaine entre 0 et 6 débutant le dimanche. */
  weekday: number;
  /** Nombre d'accidents total */
  val: number;
  /** Ensemble d'accidents. */
  accidents: Accident[];
}

export interface RAAccident {
  code: number;
  name: string;
  population: number;
  totalAccidents: number;
  mrcs: MRCAccident[];
  /** Ensemble d'accidents. */
  accidents: Accident[];
}
export interface MRCAccident {
  code: number;
  name: string;
  population: number;
  totalAccidents: number;
  /** Ensemble d'accidents. */
  accidents: Accident[];
}

export interface EntityAccident {
  id: number;
  name: string;
  totalAccidents: number;
  /** Ensemble d'accidents. */
  accidents: Accident[];
}

export interface Accident {
  /** Numéro du mois entre 0 et 11. */
  month: number;

  /** Jour du mois entre 1 et 31 (dépendamment du mois). */
  day: number;

  /** Jour de la semaine entre 0 et 6 débutant le dimanche. */
  weekday: number;

  /** Heure du jour entre 0 et 23. */
  hour: number;

  /**
   *  Gravité de l'accident
   *  0 - Dommages matériels seulement
   *  1 - Léger
   *  2 - Grave
   *  3 - Mortel
   */
  gravity: number;

  /** Région administrative */
  region: string;

  /** Code de la région administrative. */
  regionCode: number;

  /** MRC */
  mrc: string;

  /** Code du MRC. */
  mrcCode: number;

  /** La condition météo */
  weather: number;

  /** Le type de l'accident */
  type: number;

  /** La zone où s'est produit l'accident */
  zone: number;

  /** Le nombre impliqué pour chacune des entités. */
  entities: number[];

  /** Le nombre de personnes décédés */
  dead: number;
}

/**
 * Définit le service responsable de la gestion des différentes données des accidents.
 */
@Injectable()
export class AccidentService {

  // Évènements
  onDataLoaded: EventEmitter<any> = new EventEmitter();
  onDataChanged: EventEmitter<any> = new EventEmitter();

  // Données
  accidents: Promise<Accident[]>;
  accidentsFiltered: Promise<Accident[]>;

  // Quand?
  accidentsPerDaysOfTheWeek: Promise<BarChartData[]>;
  accidentsPerMonths: Promise<BarChartData[]>;

  dailyAccidents: Promise<DailyAccident[]>;
  dailyAccidentsFiltered: Promise<DailyAccident[]>;

  hourlyAccidents: Promise<HourlyAccident[]>;
  hourlyAccidentsFiltered: Promise<HourlyAccident[]>;

  // Où?
  accidentsByRA: Promise<RAAccident[]>;
  accidentsByRAFiltered: Promise<RAAccident[]>;
  accidentsByRegions: Promise<BarChartData[]>;

  // Qui?
  accidentsByEntity: Promise<EntityAccident[]>;
  accidentsByEntityFiltered: Promise<EntityAccident[]>;

  /**
   * Permet d'obtenir le premier jour pour un mois spécifié.
   *
   * @param year    L'année du mois.
   * @param month   Le mois à utiliser.
   * @returns {number}
   */
  private static daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * Initialise une nouvelle instance de la classe AccidentService.
   *
   * @param http                Le service HTTP à utiliser.
   * @param quebecInfoService   Le service d'information à utiliser.
   */
  constructor(private http: Http, private quebecInfoService: QuebecInfoService) {
    this.accidents = this.accidentsFiltered = this.loadData();
    this.accidents.then(d => console.log('Nombre d\'entrées chargées: ' + d.length));

    this.initializeData();

    // On attend que toutes les données soient chargées.
    Promise.all([this.accidents,
                 this.accidentsFiltered,
                 this.accidentsPerDaysOfTheWeek,
                 this.accidentsPerMonths,
                 this.dailyAccidentsFiltered,
                 this.hourlyAccidentsFiltered,
                 this.accidentsByRAFiltered,
                 this.accidentsByRegions,
                 this.accidentsByEntityFiltered]).then(e => {
                   console.log('Données initialisées.');
                   this.onDataLoaded.emit();
                 });
  }

  /**
   * Applique des filtres aux accidents.
   *
   * @param filters   Le filtres à appliquer.
   */
  public applyFilters(filters: any) {
    let accidentFilter = (e: Accident) => {
      return (e.entities.find((f, i) => f > 0 && filters.entities[i]) !== undefined) &&
        (filters.criteria.zone == -1 || filters.criteria.zone == e.zone) &&
        (filters.criteria.type == -1 || filters.criteria.type == e.type) &&
        (filters.criteria.weather == -1 || filters.criteria.weather == e.weather) &&
        (filters.criteria.gravity == -1 || filters.criteria.gravity == e.gravity) &&
        (filters.location.region == -1 || filters.location.region == e.regionCode) &&
        (filters.location.mrc == -1 || filters.location.mrc == e.mrcCode);
    };
    this.accidentsFiltered = this.accidents.then(d => {
      return d.filter(accidentFilter);
    });
    this.updateData(accidentFilter);
    this.onDataChanged.emit();
  }

  /**
   * Initialise les données.
   */
  private initializeData() {
    this.hourlyAccidents = this.hourlyAccidentsFiltered  = this.loadHourlyAccidents();
    this.dailyAccidents = this.dailyAccidentsFiltered  = this.loadDailyAccidents(this.hourlyAccidents);
    this.accidentsByRA = this.accidentsByRAFiltered  = this.loadAccidentsByRA();
    this.accidentsPerDaysOfTheWeek = this.loadAccidentsPerDaysOfTheWeek();
    this.accidentsPerMonths = this.loadAccidentsPerMonths();
    this.accidentsByRegions = this.loadAccidentByRegions();
    this.accidentsByEntity = this.accidentsByEntityFiltered  = this.loadAccidentByEntities();
  }

  /**
   * Met à jour les données en fonction des valeurs des filtres spécifiés.
   *
   * @param accidentFilter    Les filtres à utiliser.
   */
  private updateData(accidentFilter) {
    this.accidentsPerDaysOfTheWeek = this.loadAccidentsPerDaysOfTheWeek();
    this.accidentsPerMonths = this.loadAccidentsPerMonths();

    this.dailyAccidentsFiltered = this.dailyAccidents.then(d => {
      return _.map(d, a => {
        let newA = _.clone(a);
        newA.accidents = _.filter(a.accidents, accidentFilter);
        newA.val = newA.accidents.length;
        return newA;
      });
    });
    this.hourlyAccidentsFiltered = this.hourlyAccidents.then(d => {
      return _.map(d, a => {
        let newA = _.clone(a);
        newA.accidents = _.filter(a.accidents, accidentFilter);
        newA.val = newA.accidents.length;
        return newA;
      });
    });
    this.accidentsByRAFiltered = this.accidentsByRA.then(d => {
      return _.map(d, a => {
        let newA = _.clone(a);
        newA.accidents = _.filter(a.accidents, accidentFilter);
        newA.totalAccidents = newA.accidents.length;
        newA.mrcs = newA.mrcs.map(mrc => {
          let newM = _.clone(mrc);
          newM.accidents = _.filter(mrc.accidents, accidentFilter);
          newM.totalAccidents = newM.accidents.length;
          return newM;
        });
        return newA;
      });
    });
    this.accidentsByEntityFiltered = this.accidentsByEntity.then(d => {
      return _.map(d, entityAccident => {
        let newEntityAccident = _.clone(entityAccident);
        newEntityAccident.accidents = _.filter(entityAccident.accidents, accidentFilter);
        newEntityAccident.totalAccidents = _(newEntityAccident.accidents)
          .map(a => a.entities[entityAccident.id])
          .sum();
        return newEntityAccident;
      });
    });
    this.accidentsByRegions = this.loadAccidentByRegions();
  }

  /**
   * Charge les données à utiliser à partir d'un fichier CSV.
   *
   * @returns Les données chargées.
   */
  private loadData(): Promise<Accident[]> {
    const URL = 'assets/data/rapports-accident-reduit-2015.csv';
    const UNSPECIFIED = 'Non précisé';
    const ENTITIES_TYPES = [
      ['nb_bicyclette'],                                      // Bicyclette (0)
      ['nb_tous_autobus_minibus'],                            // Autobus (1)
      ['nb_automobile_camion_leger'],                         // Auto (2)
      ['nb_urgence'],                                         // Véhicule d'urgence (3)
      ['nb_cyclomoteur', 'nb_motocyclette'],                  // Moto (4)
      ['NB_VICTIMES_PIETON'],                                 // Piéton (5)
      ['nb_motoneige', 'nb_VHR'],                             // Véhicule récratif (6)
      ['nb_taxi'],                                            // Taxi (7)
      ['nb_camionLourd_tractRoutier', 'nb_outil_equipement'], // Camion (8)
      ['nb_autres_types', 'nb_veh_non_precise']               // Autres (9)
    ];
    const ACCIDENT_TYPES = [
      { id: 0, types: [31] }, // Collision véhicule
      { id: 1, types: [32] }, // Collision piéton
      { id: 2, types: [33] }, // Collision cycliste
      { id: 3, types: [34] }, // Collision train
      { id: 4, types: [35, 36, 37] }, // Collision animaux
      { id: 5, types: [40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 59] }, // Collision objet fixe
      { id: 6, types: [71, 72, 73, 74, 75, 99] }, // Sans collision
      { id: 7, types: [38, 39, ''] }, // Autres
    ];
    const ZONE_TYPES = [
      { id: 1, zones: [1] }, // Scolaire
      { id: 2, zones: [2] }, // Résidentiel
      { id: 3, zones: [3] }, // Affaires / commercial
      { id: 4, zones: [4] }, // Industriel / manufacturier
      { id: 5, zones: [5] }, // Rural
      { id: 6, zones: [6] }, // Forestier
      { id: 7, zones: [7] }, // Récréatif / parc / camping
      { id: 9, zones: [9, 0, ''] }, // Autres
    ];

    return this.http.get(URL).toPromise().then(res => {
      let data = res.text();
      return d3.csv.parse(data, d => {
        let format = d3.time.format('%Y-%m-%d-%H');
        let hour = d.heure_accdn.split(':')[0];
        if (hour === UNSPECIFIED) {
          // TODO Semble ajouter beaucoup de bruits à 00h pile.
          // hour = '00'; // Valeur par défaut pour l'heure
          d.DT_ACCDN = d.DT_ACCDN + '-' + '00';
        } else {
          d.DT_ACCDN = d.DT_ACCDN + '-' + hour;
        }
        let date = format.parse(d.DT_ACCDN);

        let locRegx = /(.+)\s?\((\d+)\s*\)/;
        let raRegxMatch = locRegx.exec(d.REG_ADM);
        let mrcRegxMatch = locRegx.exec(d.MRC);

        return {
          month: date.getMonth(),
          day: date.getDate(),
          weekday: date.getDay(),
          hour: hour === UNSPECIFIED ? null : date.getHours(),
          gravity: +d.gravite,
          region: raRegxMatch[1],
          regionCode: +raRegxMatch[2],
          mrc: mrcRegxMatch[1],
          mrcCode: +mrcRegxMatch[2],
          weather: +d.CD_COND_METEO,
          type: ACCIDENT_TYPES.find(e =>
            e.types.indexOf((d.CD_GENRE_ACCDN) ? +d.CD_GENRE_ACCDN : d.CD_GENRE_ACCDN) != -1).id,
          zone: ZONE_TYPES.find(e =>
            e.zones.indexOf((d.CD_ENVRN_ACCDN) ? +d.CD_ENVRN_ACCDN : d.CD_ENVRN_ACCDN) != -1).id,
          entities: ENTITIES_TYPES.map(e => d3.sum(e.map(f => +d[f]))),
          dead: +d.NB_MORTS
        };
      });
    });
  }

  /**
   * Charge les données associées aux accidents pour chacun des jours de la semaine.
   *
   * @returns {Promise<Accident[]>}
   */
  private loadAccidentsPerDaysOfTheWeek(): Promise<BarChartData[]> {
    let daysOfTheWeekLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    let daysOfTheWeekNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    let defaults = _.range(7).map(e => {
       return {
         id: e,
         label: daysOfTheWeekLabels[e],
         name: daysOfTheWeekNames[e],
         value: 0
       };
    });

    return this.accidentsFiltered.then(d => {
      return _(d).groupBy(e => e.weekday)
                 .toPairs()
                 .map((e: any) => {
                   return {
                     id: +e[0],
                     label: daysOfTheWeekLabels[+e[0]],
                     name: daysOfTheWeekNames[+e[0]],
                     value: +e[1].length
                   };
                 })
                 .unionBy(defaults, 'id')
                 .orderBy('id', 'asc')
                 .value();
    });
  }

  /**
   * Charge les données associées aux accidents pour chacun des mois.
   *
   * @returns {Promise<Accident[]>}
   */
  private loadAccidentsPerMonths(): Promise<BarChartData[]> {
    let monthsLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    let monthsNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
      'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    let defaults = _.range(12).map(e => {
      return {
        id: e,
        label: monthsLabels[e],
        name: monthsNames[e],
        value: 0
      };
    });

    return this.accidentsFiltered.then(d => {
      return _(d).groupBy(e => e.month)
                 .toPairs()
                 .map((e: any) => {
                   return {
                     id: +e[0],
                     label: monthsLabels[+e[0]],
                     name: monthsNames[+e[0]],
                     value: +e[1].length
                   };
                 })
                 .unionBy(defaults, 'id')
                 .orderBy('id', 'asc')
                 .value();
    });
  }

  /**
   * Charge les données associées aux accidents pour chaque jours.
   *
   * @param hap
   * @returns {Promise<HourlyAccident[]>}
   */
  private loadDailyAccidents(hap: Promise<HourlyAccident[]>): Promise<DailyAccident[]> {
    return hap.then(ha => {
      return _(ha)
        .groupBy(d => d.month + '-' + d.day + '-' + d.weekday)
        .toPairs()
        .map((d: [string, HourlyAccident[]]) => {
          let [month, day, weekday] = d[0].split('-');
          let newVal = _.reduce(d[1], (sum, a) => sum + a.val, 0);
          let newAccidents = _(d[1]).map(e => e.accidents).flatten().value();
          return {
            month: +month,
            day: +day,
            weekday: +weekday,
            val: newVal,
            accidents: newAccidents
          };
        })
        .sortBy(['month', 'day'])
        .value();
    });
  }

  /**
   * Charge les données liées aux accidents pour chaque heure.
   *
   * @returns {Promise<Accident[]>}
   */
  private loadHourlyAccidents(): Promise<HourlyAccident[]> {
    let months = _.range(12);
    let hours = _.range(24);

    let defaults = _.flatMap(months, m => {
      let days = _.range(1, AccidentService.daysInMonth(2015, m + 1) + 1);
      return _.flatMap(days, d => {
        return _.map(hours, h => {
          return {
            month: m,
            day: d,
            hour: h,
            weekday: new Date(2015, m, d).getDay(),
            val: 0,
            accidents: []
          };
        });
      });
    });

    return this.accidentsFiltered.then(d => {
      let accidents = _(d)
        .filter(e => e.month != null && e.day != null && e.hour != null)
        .groupBy(e => {
          let d = new Date(2015, e.month, e.day, e.hour);
          return d.getMonth() + '-' + d.getDate() + '-' + d.getDay() + '-' + d.getHours();
        })
        .toPairs()
        .map((e: [string, Accident[]]) => {
          let [month, day, weekday, hour] = e[0].split('-');
          return {
            month: +month,
            day: +day,
            weekday: +weekday,
            hour: +hour,
            val: e[1].length,
            accidents: e[1]
          };
        })
        .unionBy(defaults, d => d.month + '-' + d.day + '-' + d.hour)
        .sortBy(['month', 'day', 'hour'])
        .value();

      return accidents;
    });
  }

  /**
   * Charge les accidents pour chaque région administrative.
   *
   * @returns {Promise<Accident[][]>}
   */
  loadAccidentsByRA(): Promise<RAAccident[]> {
    return Promise
      .all([this.accidentsFiltered, this.loadMRCPopulationData()])
      .then(values => {
        let t: RAAccident[] = d3
          .nest()
          .key((e: any) => {
            return JSON.stringify({ region: e.region, regionCode: e.regionCode });
          })
          .entries(values[0])
          .map(ra => {
            let raKey = JSON.parse(ra.key);
            let mrcs: MRCAccident[] = d3
              .nest()
              .key((e: any) => {
                return JSON.stringify({ region: e.region, regionCode: e.regionCode, mrc: e.mrc, mrcCode: e.mrcCode });
              })
              .entries(ra.values)
              .map(mrc => {
                let mrcKey = JSON.parse(mrc.key);
                let v: MRCAccident = {
                  code: mrcKey.mrcCode,
                  name: mrcKey.mrc,
                  population: _
                    .find(values[1], (v: any) => v.mrcCode === mrcKey.mrcCode)
                    .population2015,
                  totalAccidents: mrc.values.length,
                  accidents: mrc.values
                };
                return v;
              });
            let v: RAAccident = {
              code: raKey.regionCode,
              name: raKey.region,
              population: _(mrcs).flatMap(mrc => mrc.population).sum(),
              totalAccidents: _(mrcs).flatMap(mrc => mrc.totalAccidents).sum(),
              mrcs: _.flatten(mrcs),
              accidents: ra.values
            };
            return v;
          });
        return t;
      });
  }

  /**
   * Charge les données associées aux statistiques concernant la population de chaque MRC.
   */
  private loadMRCPopulationData(): Promise<any> {
    const URL = 'assets/data/population_mrc.csv';
    return this.http.get(URL).toPromise().then(res => {
      return d3.csv.parse(res.text(), d => {
        return { mrcCode: +d.CodeMRC, population2015: +d.Population2015 };
      });
    });
  }

  /**
   * Charge les accidents pour chaque région.
   *
   * @returns {Promise<Accident[]>}
   */
  private loadAccidentByRegions(): Promise<BarChartData[]> {
    let regions = this.quebecInfoService.regions;
    let defaults = _.range(17).map(e => {
      return {
        id: e + 1,
        label: regions[e].name,
        name: regions[e].name,
        value: 0
      };
    });

    return this.accidentsFiltered.then(d => {
      return _(d).groupBy(e => e.regionCode)
                 .toPairs()
                 .map((e: any) => {
                   let name = regions[+e[0] - 1].name;
                   return {
                     id: +e[0],
                     label: name,
                     name: name,
                     value: +e[1].length
                   };
                 })
                .unionBy(defaults, 'id')
                .orderBy('id', 'asc')
                .value();
    });
  }

  /**
   * Charge les accidents pour chaque type d'entité possible.
   *
   * @returns {Promise<Accident[]>}
   */
  private loadAccidentByEntities(): Promise<EntityAccident[]> {
    let entities = ['Bicyclette', 'Autobus', 'Automobile', 'Véhicule d\'urgence',
      'Moto', 'Piéton', 'Véhicule récréatif', 'Taxi', 'Camion', 'Autres'];
    return this.accidentsFiltered.then(d => {
      return _(d)
        .map(a => a.entities.map((v, i) => {
          return { id: i, totalAccidents: v, accident: a };
        }))
        .flatten()
        .groupBy((e: any) => e.id)
        .toPairs()
        .map((e: any) => {
          let headEntity = _.head(e);
          return {
            id: +e[0],
            name: entities[+e[0]],
            totalAccidents: d3.sum(e[1], (v: any) => v.totalAccidents),
            accidents: e[1].map((v: any) => v.accident)
          };
        })
        .value();
    });
  }
}

