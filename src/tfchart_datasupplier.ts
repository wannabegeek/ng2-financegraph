import { TFChartRange } from './tfchart_utils'

export interface RequestResults<T> {
    range: TFChartRange;
    data: T[];
}

export abstract class TFChartDataSupplier<T> {
    public abstract requestData(range: TFChartRange, period: number): Promise<RequestResults<T>>;
}