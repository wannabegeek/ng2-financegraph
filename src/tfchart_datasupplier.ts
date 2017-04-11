import { TFChartRange } from './tfchart_utils'

export interface RequestResults<T> {
    moreDataPreceeds: boolean;
    moreDataSucceeds: boolean;
    range: TFChartRange;
    data: T[];
}

export abstract class TFChartDataSupplier<T> {
    public abstract fetchInitialData(suggestedRange: TFChartRange, period: number): Promise<RequestResults<T>>;

    public fetchPaginationData(range: TFChartRange, period: number): Promise<RequestResults<T>> {
        return new Promise((resolve, reject) => {
            reject("Not supported");
        });
    };

    public fetchUpdateData(timestamp: number, period: number): Promise<RequestResults<T>> {
        return new Promise((resolve, reject) => {
            reject("Not supported");
        });
    };
}