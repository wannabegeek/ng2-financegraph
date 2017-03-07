import { TFChartRange, TFChartRangeMake, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange } from '../tfchart_utils'
import { TFChartDataController, TFChartDataRequestType, DataSubscription, TFChartDataOperationType, DataOperation } from '../tfchart_datacontroller'
import { TFChartDataSupplier, RequestResults } from '../tfchart_datasupplier'
import { Subject } from 'rxjs/Subject'

export class TFChartSimpleDataController<T> extends TFChartDataController {
    private period: number = -1;
    private dataRange: TFChartRange = TFChartRangeMake(-1, 0);
    private data: T[] = [];
    private pending_request_queue = [];
    private dataExhausted: number = 0;
    private observers: Subject<DataOperation>;

    public constructor(private dataSupplier: TFChartDataSupplier<T>) {
        super();

        this.observers = new Subject();
    }

    public setPeriod(period: number) {
        this.period = period;
        // we need to clear our current cache and requre a re-request
        this.data = [];
        this.dataRange.span = 0;
    }

    public subscribe(subscriber: DataSubscription) {
        this.observers.subscribe(
            subscriber,
            function(err) {
                console.log("Error: " + err);
            },
            function() {
                console.log("Completed");
            }
        )
    }

    public canSupplyData(operation: TFChartDataRequestType): boolean {
        return (this.dataExhausted & operation) != operation;
    }

    public requestInitialRange(): Promise<TFChartRange> {
        return this.dataSupplier.initialRange(this.period);
    }

    public requestData(range: TFChartRange, operation: TFChartDataRequestType) {
        // console.log("think we want: " + range + " currently have " + this.dataRange);
        // we don't want any gaps in our cached data...
        if (this.dataRange.position == -1) {
            this.dataRange = TFChartRangeMake(range.position - this.period, 0);
        }

        if (operation === TFChartDataRequestType.PREPEND) {
            range = TFChartUnionRange(range, this.dataRange);
            range.span -= this.dataRange.span;
        } else {
            let currentEnd = TFChartRangeMax(this.dataRange) + this.period;
            range = TFChartRangeMake(currentEnd, TFChartRangeMax(range) - currentEnd);
        }

        if (range.span > 0) {
            this.dataSupplier.requestData(range, this.period)
                    .then((results) => {
                        switch (operation) {
                            case TFChartDataRequestType.PREPEND:   
                                if (range.position > results.range.position) {
                                    this.dataExhausted |= operation;   
                                }
                                this.prependData(results.data, results.range);
                                break;
                            case TFChartDataRequestType.APPEND:   
                                if (range.position < results.range.position) {
                                    this.dataExhausted |= operation;   
                                }
                                this.appendData(results.data, results.range);
                                break;
                        }
                    })
                    .catch((err) => {
                        switch (operation) {
                            case TFChartDataRequestType.PREPEND:   
                            case TFChartDataRequestType.APPEND:
                                this.dataExhausted |= operation
                                break;
                        }
                        console.log(err + " for " + operation);
                    });
        }
    }

    public getCachedRange(): TFChartRange {
        return this.dataRange;
    }

    public getCachedData(): T[] {
        return this.data;
    }

    public getCachedDataSize(): number {
        return this.dataRange.span / this.period;
    }

    private setData(data: T[], range: TFChartRange) {
        this.data = data;
        this.dataRange = range;
    }

    private prependData(data: T[], range: TFChartRange): void {
        // we don't want data that we already have...
        let intersectionSize = TFChartRangeMax(TFChartIntersectionRange(this.dataRange, range));
        range.span -= intersectionSize;

        let completeRange = this.dataRange.position == -1 ? range : TFChartUnionRange(this.dataRange, range);
        if (intersectionSize == 0) {
            data = this.normaliseData(data);
        } else {
            data = this.normaliseData(data.slice(0, intersectionSize));
        }
        this.setData(data.concat(this.data), completeRange);            

        this.observers.next({
            method: TFChartDataOperationType.ADD,
            count: data.length,
            type: TFChartDataRequestType.PREPEND
        });
    }

    private appendData(data: T[], range: TFChartRange): void {
        // we don't want data that we already have...
        let completeRange: TFChartRange = null;
        
        let intersectionSize: number = 0;
        if (this.dataRange.position == -1) {
            completeRange = range;
            intersectionSize = 0;
        } else {
            intersectionSize = TFChartRangeMax(TFChartIntersectionRange(this.dataRange, range));
            range.position += intersectionSize;
            range.span -= intersectionSize;
            completeRange = TFChartUnionRange(this.dataRange, range);
        }
        if (intersectionSize == 0) {
            data = this.normaliseData(data);
        } else {
            data = this.normaliseData(data.slice(intersectionSize, data.length - intersectionSize));
        }
        this.setData(this.data.concat(data), completeRange);

        this.observers.next({
            method: TFChartDataOperationType.ADD,
            count: data.length,
            type: TFChartDataRequestType.APPEND
        });
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
        return data;
        // if (this.period == null) {
        //     return data;
        // } else {
        //     let lastPoint: T = data[0];
        //     let result: T[] = [lastPoint];
        //     let first: boolean = true;

        //     for (let point of data) {
        //         if (first) {
        //             first = false;
        //             continue;
        //         }
        //         while (point.timestamp - lastPoint.timestamp > this.period) {
        //             lastPoint.timestamp += this.period;
        //             result.push(lastPoint);    
        //         }
        //         result.push(point);
        //         lastPoint = point;
        //     }
        //     return result;
        // }
    }
}