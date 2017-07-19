import { TFChartRange, TFChartRangeInvalid } from './tfchart_utils'

export interface RequestResults<T> {
    success: boolean;
    range: TFChartRange;
    data: T[];
}

export abstract class TFChartDataSupplier<T> {
    // public fetchInitialDataRangeForPeriod(period: number): Promise<TFChartRange> {
    //     return this.fetchInitialDataRange(TFChartRangeInvalid(), period);
    // }

    public abstract getAvailableRange(period: number): Promise<TFChartRange>;

    public abstract fetchInitialDataRange(suggestedRange: TFChartRange, period: number): Promise<TFChartRange>;

    public abstract fetchPaginationData(range: TFChartRange, period: number): Promise<RequestResults<T>>;

    // public fetchUpdateData(timestamp: number, period: number): Promise<RequestResults<T>> {
    //     return new Promise((resolve, reject) => {
    //         reject("Not supported");
    //     });
    // };
}