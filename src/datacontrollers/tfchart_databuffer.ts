
import { TFChartRange, TFChartRangeMake, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange, TFChartRangeInvalid } from '../tfchart_utils'

export class TFChartDataBuffer<T> {
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
        return this.data;
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
            let intersectionSize = TFChartRangeMax(TFChartIntersectionRange(this.range, range));
            range.span -= intersectionSize;

            if (intersectionSize != 0) {
                data = data.slice(0, intersectionSize);
            }
            this.data = data.concat(this.data);
            this.range = TFChartUnionRange(this.range, range);
        }
    }

    public appendData(data: T[], range: TFChartRange) {
        if (this.range === TFChartRangeInvalid()) {
            this.data = data;
            this.range = range;            
        } else {
            // we don't want data that we already have...
            let completeRange: TFChartRange = null;
            
            let intersectionSize: number = 0;
            intersectionSize = TFChartRangeMax(TFChartIntersectionRange(this.range, range));
            range.position += intersectionSize;
            range.span -= intersectionSize;
            completeRange = TFChartUnionRange(this.range, range);

            if (intersectionSize != 0) {
                data = data.slice(intersectionSize, data.length - intersectionSize);
            }

            this.data = data.concat(this.data);
            this.range = completeRange; //TFChartUnionRange(this.range, range);
        }
    }
}