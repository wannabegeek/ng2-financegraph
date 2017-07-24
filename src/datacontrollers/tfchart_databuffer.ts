
import { TFChartRange, TFChartRangeMake, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange, TFChartRangeInvalid, TFChartLocationInRange } from '../tfchart_utils'
import { TFChartDataType } from '../series/tfchart_series'

export class TFChartDataBuffer<T extends TFChartDataType> {
    private data: T[] = [];
    private range: TFChartRange = TFChartRangeInvalid();

    constructor() {
    }

    public getData(): T[] {
        return this.data;
    }

    public getRange(): TFChartRange {
        return this.range;
    }

    public getDataInRange(range: TFChartRange): T[] {
        let result: T[] = [];
        for (let d of this.data) {
            if (TFChartLocationInRange(d.timestamp, range)) {
                result.push(d);
            }
        }
        return result;
    }

    public clear(): void {
        this.data = [];
        this.range = TFChartRangeInvalid();
    }

    public prependData(data: T[], range: TFChartRange) {
        if (this.range === TFChartRangeInvalid()) {
            this.data = data;
            this.range = range;            
        } else {
            // we don't want data that we already have...
            let intersectingRange: TFChartRange = TFChartIntersectionRange(this.range, range);
            let intersectionSize = TFChartRangeMax(intersectingRange);
            if (intersectingRange.span != range.span) {  // otherwise we have all the data already
                range.span -= intersectionSize;

                let result: T[] = [];
                if (intersectionSize != 0) {
                    for (let d of data) {
                        if (d.timestamp < this.range.position) {
                            result.push(d);
                        }
                    }
                } else {
                    result = data;
                }
                this.data = result.concat(this.data);
                this.range = TFChartUnionRange(this.range, range);
            }
        }
    }

    public appendData(data: T[], range: TFChartRange) {
        if (this.range === TFChartRangeInvalid()) {
            this.data = data;
            this.range = range;            
        } else {
            // we don't want data that we already have...
            let completeRange: TFChartRange = null;
            
            let intersectionSize: number = TFChartIntersectionRange(this.range, range).span;
            if (intersectionSize != range.span) {  // otherwise we have all the data already
                range.position += intersectionSize;
                range.span -= intersectionSize;
                completeRange = TFChartUnionRange(this.range, range);

                let result: T[] = [];
                if (intersectionSize != 0) {
                    let maxRange: number = TFChartRangeMax(this.range);
                    for (let d of data) {
                        if (d.timestamp > maxRange) {
                            result.push(d);
                        }
                    }
                } else {
                    result = data;
                }

                this.data = this.data.concat(result);
                this.range = completeRange; //TFChartUnionRange(this.range, range);
            }
        }
    }
}