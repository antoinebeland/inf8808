import { Pipe, PipeTransform } from '@angular/core';

/**
 * Définit un filtre permettant d'afficher des nombres dans le format canadien.
 */
@Pipe({name: 'numberFormatting'})
export class NumberFormattingPipe implements PipeTransform {
  transform(value: number): string {
    return new Intl.NumberFormat('fr-CA').format(value);
  }
}
