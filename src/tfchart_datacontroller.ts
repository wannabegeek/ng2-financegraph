import { TFChartRange, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange, TFChartRangeInvalid } from './tfchart_utils'
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

export interface DataRequestResults<T extends TFChartDataType> {
    data: T[];
    range: TFChartRange;
    moreToFollow: Promise<DataRequestResults<T>>;
}

export abstract class TFChartDataController {

    public abstract setPeriod(period: number);
    /**
     * This could be for if the availableRange is updated???
     */
    // public abstract subscribe(subscriber: DataSubscription);

    /**
     * Provides the total available range in timestamp space
     */
    public abstract availableRange(): Promise<TFChartRange>;

    /**
     * range is in timestamp space i.e. startTimestamp -> endTimestamp.
     */
    public abstract getDataInRange<T extends TFChartDataType>(range: TFChartRange): Promise<DataRequestResults<T>>

    
    // public abstract requestData(range: TFChartRange);
    
    // public abstract getCachedRange(): TFChartRange;
    // public abstract getCachedData<T extends TFChartDataType>(): T[];

    // public hasData(): boolean {
    //     return this.getCachedRange() != TFChartRangeInvalid();
    // }
}