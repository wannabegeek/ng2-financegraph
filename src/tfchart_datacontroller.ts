import { TFChartRange, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange } from './tfchart_utils'

export enum TFChartDataRequestType {
    PREPEND = 1,
    APPEND = 2
}

export interface NumberFunction<T> {
    (t: T): number;
}


export enum TFChartDataOperationType {
    ADD = 1,
    REMOVE = 2
}

export interface DataOperation {
    method: TFChartDataOperationType;
    count: number;
    type: TFChartDataRequestType;
}

export interface DataSubscription {
    (dataOperation: DataOperation): void;
}

export abstract class TFChartDataController {

    public abstract setPeriod(period: number);
    public abstract subscribe(subscriber: DataSubscription);
    
    public abstract requestData(range: TFChartRange, operation: TFChartDataRequestType);
    
    public abstract getCachedRange(): TFChartRange;
    public abstract getCachedDataSize(): number;
    public abstract getCachedData<T>(): T[];

    public abstract canSupplyData(operation: TFChartDataRequestType): boolean;
    public hasData(): boolean {
        return this.getCachedDataSize() != 0;
    }
}