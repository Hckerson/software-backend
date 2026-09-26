import { TimeFilter } from './filter';

export { TimeFilter as Period };

export const SERIES_LENGTH: Record<TimeFilter, number> = {
    [TimeFilter.DAY]: 7,
    [TimeFilter.MONTH]: 12,
    [TimeFilter.YEAR]: 5,
};
