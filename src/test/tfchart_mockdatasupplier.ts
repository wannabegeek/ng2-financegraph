import { TFChartDataBuffer } from '../datacontrollers/tfchart_databuffer'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartRangeMax, TFChartIntersectionRange } from '../tfchart_utils'
import { TFChartDataType } from '../series/tfchart_series'
import { TFChartDataSupplier, RequestResults } from '../tfchart_datasupplier'

export interface MockDataFactory<T> {
    (index: number): T;
}

export class MockDataSupplier<T> implements TFChartDataSupplier<T> {
    private storedData: T[] = [];

    constructor(private availabeRange: TFChartRange, private supplyCount: number, private initialOffset: number, dataFactory: MockDataFactory<T>) {
        
        for (let i = 0; i < TFChartRangeMax(availabeRange); i++) {
            this.storedData.push(dataFactory(i));
        }
    }

    public getAvailableRange(period: number): Promise<TFChartRange> {
        return new Promise((resolve, reject) => {
            resolve(this.availabeRange);
        });
    }

    public fetchInitialDataRange(suggestedRange: TFChartRange, period: number): Promise<TFChartRange> {
        return new Promise((resolve, reject) => {
            resolve(TFChartRangeMake(this.initialOffset, this.supplyCount));
        });
    }

    public fetchPaginationData(range: TFChartRange, period: number): Promise<RequestResults<T>> {
        return new Promise((resolve, reject) => {
            if (TFChartIntersectionRange(range, this.availabeRange).span == 0) {
                reject("Request out of range [we have " + this.availabeRange + " but received request for " + range);
            } else {
                console.log("Returning result for request: " + range);
                resolve({
                    success: true,
                    range: range,
                    data: this.storedData.slice(range.position, TFChartRangeMax(range))
                });
            }
        });
    }
}
