import { TFChartRange, TFChartRangeInvalid } from './tfchart_utils'

export interface RequestResults<T> {
    success: boolean;
    range: TFChartRange;
    data: T[];
}

export abstract class TFChartDataSupplier<T> {
    public abstract getAvailableRange(period: number): Promise<TFChartRange>;
    public abstract fetchInitialDataRange(suggestedRange: TFChartRange, period: number): Promise<TFChartRange>;
    public abstract fetchPaginationData(range: TFChartRange, period: number): Promise<RequestResults<T>>;
}