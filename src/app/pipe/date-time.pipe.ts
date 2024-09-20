import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateTimeDisplay',
  standalone: true
})
export class DateTimePipe implements PipeTransform {

  transform(value: Date | string) : string {
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
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      day: '2-digit',
      month: '2-digit',
    };

    if (isToday) {
      return date.toLocaleString('pl-PL', options);
    } else {
      return date.toLocaleString('pl-PL', options2);
    }
  }

}
