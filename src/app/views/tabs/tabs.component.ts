import {
  AfterContentInit, Component, ContentChildren, QueryList,
} from '@angular/core';

import {TabComponent} from './tab.component';

/**
 * Définit un composant pouvant agir comme une vue possédant des onglets.
 *
 * Le code a été réutilisé du site suivants:
 * @see https://juristr.com/blog/2016/02/learning-ng2-creating-tab-component/
 * @see https://plnkr.co/edit/afhLA8wHw9LRnzwwTT3M
 */
@Component({
  selector: 'tabs',
  templateUrl: 'tabs.component.html',
  styleUrls: ['tabs.component.css']
})
export class TabsComponent implements AfterContentInit {

  @ContentChildren(TabComponent) tabs: QueryList<TabComponent>;

  ngAfterContentInit() {
    let activeTabs = this.tabs.filter(tab => tab.active);
    if (activeTabs.length === 0) {
      this.selectTab(this.tabs.first);
    }
  }

  selectTab(tab: TabComponent) {
    this.tabs.toArray().forEach(t => t.active = t == tab);
  }
}
