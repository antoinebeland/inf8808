import {
  Component, Input, OnInit
} from '@angular/core';
import {AccidentService} from '../../services/accident.service';
import {QuebecInfoService} from '../../services/quebec-info-service.service';
import * as d3 from 'd3';

/**
 * Définit le composant responsable de gérer les filtres.
 */
@Component({
  selector: 'filters-panel',
  templateUrl: 'filters-panel.component.html',
  styleUrls: ['filters-panel.component.css']
})
export class FiltersPanelComponent implements OnInit {

  accidentsCount: number;

  private regionsList: any[];
  regionsListFiltered: any[];

  private mrcList: any[];
  mrcListFiltered: any[];

  @Input()
  set currentIndex(index: number) {
    this.visible = index >= 3 && index <= 5;
  }

  visible: boolean;
  filters = {
    entities: [
      true, // Bicyclette (0)
      true, // Autobus (1)
      true, // Auto (2)
      true, // Véhicule d'urgence (3)
      true, // Moto (4)
      true, // Piéton (5)
      true, // Véhicule récratif (6)
      true, // Taxi (7)
      true, // Camion (8)
      true  // Autres (9)
    ],
    criteria: {
      type: -1,
      gravity: -1,
      weather: -1,
      zone: -1
    },
    location: {
      region: -1,
      mrc: -1
    }
  };

  /**
   * Initialise une nouvelle instance du FiltersPanelComponent.
   *
   * @param accidentService     Le service accident à utiliser.
   * @param quebecInfoService   Le service d'information à utiliser.
   */
  constructor(private accidentService: AccidentService, private quebecInfoService: QuebecInfoService) {}

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    this.regionsList = this.quebecInfoService.regions.sort((a, b) => d3.ascending(a.name, b.name));
    this.regionsListFiltered = this.regionsList;

    this.quebecInfoService.mrcPopulation.then(d => {
      this.mrcList = d.sort((a, b) => d3.ascending(a.mrc, b.mrc));
      this.mrcListFiltered = this.mrcList;
    });

    this.updateCount();
    this.accidentService.onDataChanged.subscribe(this.updateCount.bind(this));
  }

  /**
   * Met à jour le compte d'accidents.
   */
  updateCount() {
    this.accidentService.accidentsFiltered.then(d => this.accidentsCount = d.length);
  }

  /**
   * Survient lorsque les valeurs associées aux filtres sont modifiées.
   */
  onValueChanged() {
    this.mrcListFiltered = this.mrcList
      .filter(d => this.filters.location.region == -1
      || d.raCode == this.filters.location.region);

    this.regionsListFiltered = this.regionsList
      .filter(d => this.filters.location.mrc == -1
      || d.code == this.mrcList.find(e => e.mrcCode == this.filters.location.mrc).raCode);

    this.accidentService.applyFilters(this.filters);
  }
}
