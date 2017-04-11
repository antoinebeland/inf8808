import { Component } from '@angular/core';
import { AccidentService } from './services/accident.service';
import {MnFullpageOptions} from 'ng2-fullpage';

/**
 * Définit le composant principal de l'application.
 * Celui-ci est responsable d'initialiser les différentes vues.
 */
@Component({
  selector: 'app-root',
  template: `
    <loading-view></loading-view>
    <nav-bar></nav-bar>
    <div [mnFullpage]="options"
    [mnFullpageKeyboardScrolling]="true"
    [mnFullpageControlArrows]="false">
      <div class="section fp-section">
        <home-view></home-view>
      </div>
      <div class="section fp-section">
        <stats-view></stats-view>
      </div>
      <div class="section fp-section">
        <when-view></when-view>
      </div>
      <div class="section fp-section">
        <where-view></where-view>
      </div>
      <div class="section fp-section">
        <who-view></who-view>
      </div>
      <div class="section fp-section">
        <final-view></final-view>
      </div>
    </div>
    <filters-panel [currentIndex]="currentIndex"></filters-panel>
  `,
  providers: [AccidentService]
})
export class AppComponent {

  currentIndex: number;
  options: MnFullpageOptions = new MnFullpageOptions({
    scrollingSpeed: 1000,
    menu: '.navigation',
    css3: true,
    anchors: [
      'home', 'stats', 'when', 'where', 'who', 'final'
    ],
    onLeave: (index, nextIndex) => {
      this.currentIndex = nextIndex;
    }
  });
}
