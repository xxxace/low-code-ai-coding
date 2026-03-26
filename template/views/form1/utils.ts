import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

export function getISOYearWeek(date: string): string {
    const d = dayjs(date);
    const year = (d as any).weekYear();
    const week = d.week();
    return `${year}${week.toString().padStart(2, '0')}`;
}
