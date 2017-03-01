import { TFChartRange, TFChartRangeMake, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange } from '../tfchart_utils'
import { TFChartDataController, TFChartDataRequestType } from '../tfchart_datacontroller'
import { TFChartDataSupplier } from '../tfchart_datasupplier'

export class TFChartSimpleDataController<T> extends TFChartDataController {
    private period: number;
    private dataRange: TFChartRange;
    private data: T[] = [];
    private pending_request_queue = [];
    private dataExhausted: number = 0;

    public constructor(private dataSupplier: TFChartDataSupplier<T>) {
        super();
    }

    public setPeriod(period: number) {
        this.period = period;
        // we need to clear our current cache and requre a re-request
        this.data = [];
        this.dataRange = TFChartRangeMake(0, 0);
    }

    public canSupplyData(operation: TFChartDataRequestType): boolean {
        return (this.dataExhausted & operation) != operation;
    }

    public requestData(range: TFChartRange, operation: TFChartDataRequestType): Promise<number> {
        return new Promise((resolve, reject) => {
            // we don't want any gaps in our cached data...
            if (operation === TFChartDataRequestType.PREPEND) {
                range = TFChartUnionRange(range, this.dataRange);
                range.span -= this.dataRange.span;
            } else {
                range = TFChartRangeMake(TFChartRangeMax(this.dataRange), TFChartRangeMax(this.dataRange) + TFChartRangeMax(range));
            }

            this.dataSupplier.requestData(range, this.period)
                    .then((results) => {
                        let addCount: number = 0;
                        switch (operation) {
                            case TFChartDataRequestType.PREPEND:   
                                addCount = this.prependData(results.data, results.range);
                                break;
                            case TFChartDataRequestType.APPEND:   
                                addCount = this.appendData(results.data, results.range);
                                break;
                        }
                        resolve(addCount);
                    });
        });
    }

    public getCachedRange(): TFChartRange {
        return this.dataRange;
    }

    public getCachedData(): any[] {
        return this.data;
    }

    public getCachedDataSize(): number {
        return this.data.length;
    }

    private setData(data: T[]) {
        this.data = this.normaliseData(data);
        this.dataRange = TFChartRangeMake(this.data[0].timestamp, this.data[this.data.length - 1].timestamp - this.data[0].timestamp);
    }

    private prependData(data: T[], range: TFChartRange): number {
        if (range.position > range.position) {
            this.dataExhausted |= TFChartDataRequestType.PREPEND;   
        }
        // we don't want data that we already have...
        let intersectionSize = TFChartRangeMax(TFChartIntersectionRange(this.dataRange, range));
        if (intersectionSize == 0) {
            this.setData(data.concat(this.data));
        } else {
            this.setData(data.slice(0, intersectionSize).concat(this.data));            
        }

        return data.length - intersectionSize;
    }

    private appendData(data: T[], range: TFChartRange): number {
        if (range.position < range.position) {
            this.dataExhausted |= TFChartDataRequestType.APPEND;   
        }
        // we don't want data that we already have...
        let intersectionSize = TFChartRangeMax(TFChartIntersectionRange(this.dataRange, range));
        if (intersectionSize == 0) {
            this.setData(this.data.concat(data));
        } else {
            this.setData(this.data.concat(data.slice(intersectionSize, data.length - intersectionSize)));
        }

        return data.length - intersectionSize;
    }

    private removeCurrentDataFromRange(range: TFChartRange) {
        if (range !== null) {
            // we need to make sure we don't request the same data
            var intersection = TFChartIntersectionRange(this.dataRange, range);
            if (intersection.span > 0) { // something intersects
                if (TFChartEqualRanges(intersection, range)) {
                    // we already have this pending data
                    return null;
                } else {
                    // we need to update 'range'
                    if (range.position == intersection.position) {
                        // the beginning over laps
                        range.position += intersection.span + this.period;
                        range.span -= intersection.span;
                    } else if (TFChartRangeMax(range) == TFChartRangeMax(intersection)) {
                        // the end over laps
                        range.span = intersection.position - range.position - this.period;
                    }
                }
            }
        }
        return range;
    }

    private processPendingRequestQueue() {
        var prependRange = null;
        var appendRange = null;
        for (let request of this.pending_request_queue) {
            if (request[0] == TFChartDataRequestType.PREPEND) {
                if (prependRange == null) {
                    prependRange = request[1];
                } else {
                    prependRange = TFChartUnionRange(prependRange, request[1]);
                }
            } else {
                if (appendRange == null) {
                    appendRange = request[1];
                } else {
                    appendRange = TFChartUnionRange(appendRange, request[1]);
                }
            }
        }
        this.pending_request_queue = [];

        prependRange = this.removeCurrentDataFromRange(prependRange);
        appendRange = this.removeCurrentDataFromRange(appendRange);

        if (prependRange != null && this.canSupplyData(TFChartDataRequestType.PREPEND)) {
            this.requestData(prependRange, TFChartDataRequestType.PREPEND);
        }
        if (appendRange != null && this.canSupplyData(TFChartDataRequestType.APPEND)) {
            this.requestData(appendRange, TFChartDataRequestType.APPEND);
        }
    }

    private normaliseData(data: T[]): T[] {
        if (this.period == null) {
            return data;
        } else {
            let lastPoint: T = data[0];
            let result: T[] = [lastPoint];
            let first: boolean = true;

            for (let point of data) {
                if (first) {
                    first = false;
                    continue;
                }
                while (point.timestamp - lastPoint.timestamp > this.period) {
                    lastPoint.timestamp += this.period;
                    result.push(lastPoint);    
                }
                result.push(point);
                lastPoint = point;
            }
            return result;
        }
    }
}