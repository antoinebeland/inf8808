import {Injectable} from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import * as d3 from 'd3';

export interface MRCPopulation {
  mrcCode: number;
  mrc: string;
  raCode: number;
  population2015: number;
}

/**
 * Définit le service responsable de fournir des informations sur la province de Québec.
 */
@Injectable()
export class QuebecInfoService {

  regions = [
    {code: 1, name: 'Bas-Saint-Laurent'},
    {code: 2, name: 'Saguenay–Lac-Saint-Jean'},
    {code: 3, name: 'Capitale-Nationale'},
    {code: 4, name: 'Mauricie'},
    {code: 5, name: 'Estrie'},
    {code: 6, name: 'Montréal'},
    {code: 7, name: 'Outaouais'},
    {code: 8, name: 'Abitibi-Témiscamingue'},
    {code: 9, name: 'Côte-Nord'},
    {code: 10, name: 'Nord-du-Québec'},
    {code: 11, name: 'Gaspésie–Îles-de-la-Madeleine'},
    {code: 12, name: 'Chaudière-Appalaches'},
    {code: 13, name: 'Laval'},
    {code: 14, name: 'Lanaudière'},
    {code: 15, name: 'Laurentides'},
    {code: 16, name: 'Montérégie'},
    {code: 17, name: 'Centre-du-Québec'}
  ];

  mrcPopulation: Promise<[MRCPopulation]>;

  /**
   * Initialise une nouvelle instance de la classe QuebecInfoService.
   *
   * @param http  Le service HTTP à utiliser.
   */
  constructor(private http: Http) {
    this.mrcPopulation = this.loadMRCPopulationData();
  }

  /**
   * Charge le fichier CSV correspondant permettant d'obtenir la population pour chaque MRC.
   *
   * @returns
   */
  loadMRCPopulationData(): Promise<[MRCPopulation]> {
    const URL = 'assets/data/population_mrc.csv';

    return this.http.get(URL).toPromise().then(res => {
      let data = res.text();
      return d3.csv.parse(data, d => {

        return {
          mrcCode: +d.CodeMRC,
          mrc: d.MRC,
          raCode: +d.RA,
          population2015: +d.Population2015
        };
      });
    });
  }
}
