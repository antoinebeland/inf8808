import {NgModule, NO_ERRORS_SCHEMA}      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }    from '@angular/http';
import { FormsModule }   from '@angular/forms';
import { MnFullpageDirective, MnFullpageService } from 'ng2-fullpage';

import { AppComponent }  from './app.component';
import { BarChartComponent }  from './graphics/bar-chart/bar-chart.component';
import { HeatMapDayComponent }  from './graphics/heat-map/heat-map-day.component';
import { HeatMapHourComponent }  from './graphics/heat-map/heat-map-hour.component';
import { GeoMapComponent }  from './graphics/geo-map/geo-map.component';
import { AccidentService }  from './services/accident.service';
import { QuebecInfoService }  from './services/quebec-info-service.service';
import { QuebecMapService }  from './services/quebec-map.service';
import { HorizontalBarChartComponent } from './graphics/bar-chart/horizontal-bar-chart.component';
import { ImageGridComponent } from './graphics/image-grid/image-grid.component';
import { Ng2PageScrollModule } from 'ng2-page-scroll';
import { NavBarComponent } from './views/nav/nav-bar.component';
import { HomeViewComponent } from './views/home/home-view.component';
import { StatsViewComponent } from './views/stats/stats-view.component';
import { WhenViewComponent } from './views/when/when-view.component';
import { FiltersPanelComponent } from './views/filters/filters-panel.component';
import { WhereViewComponent } from './views/where/where-view.component';
import { WhoViewComponent } from './views/who/who-view.component';
import { TabsComponent } from './views/tabs/tabs.component';
import { TabComponent } from './views/tabs/tab.component';
import { LoadingViewComponent } from './views/loading/loading-view.component';
import { NumberFormattingPipe } from './pipes/number-formatting.pipe';
import { FinalViewComponent } from './views/final/final-view.component';
import {Ng2AutoCompleteModule} from 'ng2-auto-complete';

/**
 * Définit le module principal de l'application.
 */
@NgModule({
  imports:      [ BrowserModule, FormsModule, HttpModule, Ng2PageScrollModule.forRoot(), Ng2AutoCompleteModule ],
  declarations: [ AppComponent,
                  BarChartComponent,
                  FiltersPanelComponent,
                  FinalViewComponent,
                  GeoMapComponent,
                  HeatMapDayComponent,
                  HeatMapHourComponent,
                  HorizontalBarChartComponent,
                  HomeViewComponent,
                  ImageGridComponent,
                  LoadingViewComponent,
                  MnFullpageDirective,
                  NavBarComponent,
                  NumberFormattingPipe,
                  StatsViewComponent,
                  TabComponent,
                  TabsComponent,
                  WhenViewComponent,
                  WhereViewComponent,
                  WhoViewComponent
                ],
  providers:    [ AccidentService, QuebecInfoService, QuebecMapService, MnFullpageService ],
  bootstrap:    [ AppComponent ],
  schemas:      [ NO_ERRORS_SCHEMA ]
})
export class AppModule { }
