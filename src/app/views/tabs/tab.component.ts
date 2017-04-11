import { Component, Input } from '@angular/core';

/**
 * Définit un onglet.
 *
 * Le code a été réutilisé des sites suivants:
 * @see https://juristr.com/blog/2016/02/learning-ng2-creating-tab-component/
 * @see https://plnkr.co/edit/afhLA8wHw9LRnzwwTT3M
 */
@Component({
  selector: 'tab',
  styles: [`
    .pane{
      height: 100%;
    }
  `],
  template: `
    <div [hidden]="!active" class="pane">
      <ng-content></ng-content>
    </div>
  `
})
export class TabComponent {
  @Input('tabTitle') title: string;
  @Input() active = false;
}
