import {
  Component, OnInit
} from '@angular/core';
import {AccidentService} from '../../services/accident.service';

/**
 * Définit la vue à afficher lors du chargement des données.
 */
@Component({
  selector: 'loading-view',
  templateUrl: 'loading-view.component.html'
})
export class LoadingViewComponent implements OnInit {

  isVisible: boolean;

  /**
   * Initialise une nouvelle instance de la classe LoadingViewComponent.
   *
   * @param accidentService   Le service d'accident à utiliser.
   */
  constructor(private accidentService: AccidentService) {}

  /**
   * Initialise le composant.
   */
  ngOnInit() {
    this.isVisible = true;
    this.accidentService.onDataLoaded.subscribe(d => {
      this.isVisible = false;
    });
  }
}
