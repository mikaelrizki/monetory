import { Transaction } from '../types';

export interface CycleRange {
  startDate: Date;
  endDate: Date; // Exclusive end date (start of next cycle)
  label: string;
}

/**
 * Calculates the start, end, and readable label for the current billing cycle
 * based on the startDay preference (payday).
 */
export function getCycleRange(startDay: number = 1, refDate: Date = new Date()): CycleRange {
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-11
  const day = refDate.getDate();

  // Determine number of days in the current calendar month
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

  let cycleStartYear = year;
  let cycleStartMonth = month;

  // Capping startDay to the current month length if it exceeds it.
  // If the current day is past or equal to the threshold day of this month,
  // then the cycle started in this month.
  const thresholdDay = Math.min(startDay, daysInCurrentMonth);
  if (day >= thresholdDay) {
    cycleStartMonth = month;
  } else {
    cycleStartMonth = month - 1;
    if (cycleStartMonth < 0) {
      cycleStartMonth = 11;
      cycleStartYear = year - 1;
    }
  }

  // Get the start date of the cycle
  const daysInStartMonth = new Date(cycleStartYear, cycleStartMonth + 1, 0).getDate();
  const actualStartDay = Math.min(startDay, daysInStartMonth);
  const cycleStartDate = new Date(cycleStartYear, cycleStartMonth, actualStartDay, 0, 0, 0, 0);

  // The cycle ends on the day before the startDay of the next month.
  // Thus, the start date of the NEXT cycle (exclusive end date) is the startDay of the next month.
  let cycleEndYear = cycleStartYear;
  let cycleEndMonth = cycleStartMonth + 1;
  if (cycleEndMonth > 11) {
    cycleEndMonth = 0;
    cycleEndYear = cycleStartYear + 1;
  }
  const daysInEndMonth = new Date(cycleEndYear, cycleEndMonth + 1, 0).getDate();
  const actualEndDay = Math.min(startDay, daysInEndMonth);
  const cycleEndDate = new Date(cycleEndYear, cycleEndMonth, actualEndDay, 0, 0, 0, 0);

  // Calculate inclusive display end date (1 day before the next cycle starts)
  const displayEndDate = new Date(cycleEndDate);
  displayEndDate.setDate(displayEndDate.getDate() - 1);

  const monthsID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const startLabel = `${cycleStartDate.getDate()} ${monthsID[cycleStartDate.getMonth()]}`;
  const endLabel = `${displayEndDate.getDate()} ${monthsID[displayEndDate.getMonth()]}`;

  return {
    startDate: cycleStartDate,
    endDate: cycleEndDate,
    label: `${startLabel} - ${endLabel}`
  };
}

/**
 * Filters a list of transactions to return only those falling within the current cycle.
 */
export function getTransactionsInCurrentCycle(
  transactions: Transaction[],
  startDay: number = 1,
  refDate: Date = new Date()
): Transaction[] {
  const { startDate, endDate } = getCycleRange(startDay, refDate);

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayStr}`;
  };

  const startStr = formatDateString(startDate);
  const endStr = formatDateString(endDate);

  return transactions.filter(t => t.date >= startStr && t.date < endStr);
}
