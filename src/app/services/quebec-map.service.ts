import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import * as topojson from 'topojson';

/**
 * Définit le service responsable de founir la carte des MRC.
 */
@Injectable()
export class QuebecMapService {

  mrcJson: Promise<Object>;

  /**
   * Initialise une nouvelle instance de la classe QuebecMapService.
   *
   * @param http  Le service HTTP à utiliser.
   */
  constructor(private http: Http) {
    this.mrcJson = this.loadQuebecMap();
  }

  /**
   * Charge la carte des MRC.
   *
   * @returns
   */
  loadQuebecMap(): Promise<Object> {
    const url = 'assets/data/mrc_poly.json';
    return this.http.get(url).toPromise().then(res => {
      let json = res.json();
      return topojson.feature(json, json.objects.mrc_poly);
    });
  }
}

