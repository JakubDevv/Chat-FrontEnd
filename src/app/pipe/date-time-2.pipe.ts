import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateTime2Display',
  standalone: true
})
export class DateTime2Pipe implements PipeTransform {

  transform(value: Date | string | undefined) : string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const today = new Date();

    const isToday = date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const options2: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    if (isToday) {
      return date.toLocaleString('en-GB', options);
    } else {
      return date.toLocaleString('en-GB', options2);
    }
  }

}
