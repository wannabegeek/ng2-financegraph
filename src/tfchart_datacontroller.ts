import { TFChartRange, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange } from './tfchart_utils'
import { TFChartDataType } from './series/tfchart_series'

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

export enum TFChartDataAvailability {
    AVAILABLE = 1,
    NOT_AVAILABLE = 2,
    PARTIALLY_AVAILABLE = 3
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
    
    public abstract availableRange(): TFChartRange;
    public abstract requestData(range: TFChartRange);
    
    public abstract getCachedRange(): TFChartRange;
    public abstract getCachedDataSize(): number;
    public abstract getCachedData<T extends TFChartDataType>(): T[];

    // public abstract canSupplyData(range: TFChartRange): TFChartDataAvailability;
    public hasData(): boolean {
        return this.getCachedDataSize() != 0;
    }
}