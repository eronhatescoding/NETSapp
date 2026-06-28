import { Pipe, PipeTransform } from '@angular/core';
import { Transaction } from '../../models/transaction.model';

@Pipe({ name: 'filterReal',standalone: false })
export class FilterRealPipe implements PipeTransform {
  transform(transactions: Transaction[]): Transaction[] {
    return transactions.filter(t => !t.isPlanned);
  }
}

@Pipe({ name: 'filterPlanned',standalone: false })
export class FilterPlannedPipe implements PipeTransform {
  transform(transactions: Transaction[]): Transaction[] {
    return transactions.filter(t => !!t.isPlanned);
  }
}