import { TFChartRange, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange } from './tfchart_utils'

export enum TFChartDataRequestType {
    PREPEND = 1,
    APPEND = 2
}

export interface NumberFunction<T> {
    (t: T): number;
}

export abstract class TFChartDataController {
    public abstract setPeriod(period: number);
    // public abstract setData<T>(data: T[]);
    public abstract canSupplyData(operation: TFChartDataRequestType): boolean;
    
    public abstract requestData(range: TFChartRange, operation: TFChartDataRequestType): Promise<number>;

    public abstract getCachedRange(): TFChartRange;
    public abstract getCachedDataSize(): number;
    public abstract getCachedData<T>(): T[];

    public hasData(): boolean {
        return this.getCachedDataSize() != 0;
    }
}