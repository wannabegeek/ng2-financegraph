import { TFChartRange, TFChartRangeMake, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange } from '../tfchart_utils'
import { TFChartDataController, TFChartDataRequestType, TFChartDataAvailability, DataSubscription, TFChartDataOperationType, DataOperation } from '../tfchart_datacontroller'
import { TFChartDataSupplier, RequestResults } from '../tfchart_datasupplier'
import { Subject } from 'rxjs/Subject'

export class TFChartSimpleDataController<T> extends TFChartDataController {
    private period: number = -1;
    private dataRange: TFChartRange = TFChartRangeMake(-1, 0);
    private data: T[] = [];
    private pending_request_queue = [];
    private dataExhausted: number = 0;
    private observers: Subject<DataOperation>;

    private requestInProgress: boolean = false;
    private requestBacklog: TFChartRange[] = [];

    public constructor(private dataSupplier: TFChartDataSupplier<T>) {
        super();

        this.observers = new Subject();
    }

    public setPeriod(period: number) {
        this.period = period;
        // we need to clear our current cache and requre a re-request
        this.data = [];
        this.dataRange.span = 0;
        this.dataExhausted = 0;
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

    public canSupplyData(range: TFChartRange): TFChartDataAvailability {
        if (this.dataRange.position == -1) {
            this.dataRange = TFChartRangeMake(range.position - this.period, 0);
        }

        let operation: TFChartDataRequestType;

        if (range.position < this.dataRange.position) {
            operation = TFChartDataRequestType.PREPEND;
        } else if (TFChartRangeMax(range) > TFChartRangeMax(this.dataRange)) {
            operation = TFChartDataRequestType.APPEND;
        } else {
            throw new Error("invalid data request " + range);
        }
        
        // console.log("Can supply for: " + operation + " ? " + this.dataExhausted + " " + ((this.dataExhausted & operation) != operation ? TFChartDataAvailability.AVAILABLE : TFChartDataAvailability.NOT_AVAILABLE));
        return (this.dataExhausted & operation) != operation ? TFChartDataAvailability.AVAILABLE : TFChartDataAvailability.NOT_AVAILABLE;
    }

    public checkDataExhausted(results: RequestResults<T>) {
        if (!results.moreDataPreceeds) {
            this.dataExhausted |= TFChartDataRequestType.PREPEND;   
        }
        if (!results.moreDataSucceeds) {
            this.dataExhausted |= TFChartDataRequestType.APPEND;   
        }
        console.log("Data exhaused: " + this.dataExhausted);
        console.log(results);
    }

    public requestInitialData() {
        // console.log("Requesting initial");
        let suggestedRange = TFChartRangeMake(0, 100 * this.period);        
        this.requestInProgress = true;
        this.dataSupplier.fetchInitialData(suggestedRange, this.period)
            .then((results: RequestResults<T>) => {
                    // console.log("Initial responded");
                    this.checkDataExhausted(results);
                    this.appendData(results.data, results.range);
                })
                .catch((err) => {
                    this.dataExhausted |= TFChartDataRequestType.PREPEND | TFChartDataRequestType.APPEND;
                })
                .then(() => {
                    this.requestInProgress = false;
                    this.processPendingRequestQueue();
                });
    }

    public requestData(range: TFChartRange) {
        if (this.requestInProgress) {
            // console.log("Request already in grogress - queuing");
            this.requestBacklog.push(range);
        } else {
            // console.log("think we want: " + range + " currently have " + this.dataRange + " for period: " + this.period);
            // we don't want any gaps in our cached data...
            if (this.dataRange.position == -1) {
                this.dataRange = TFChartRangeMake(range.position - this.period, 0);
            }

            let operation: TFChartDataRequestType;

            if (range.position < this.dataRange.position) {
                operation = TFChartDataRequestType.PREPEND;
            } else if (TFChartRangeMax(range) > TFChartRangeMax(this.dataRange)) {
                operation = TFChartDataRequestType.APPEND;
            } else {
                throw new Error("invalid data request " + range);
            }

            if (operation === TFChartDataRequestType.PREPEND) {
                range = TFChartUnionRange(range, this.dataRange);
                range.span -= this.dataRange.span;
            } else {
                let currentEnd = TFChartRangeMax(this.dataRange) + this.period;
                range = TFChartRangeMake(currentEnd, TFChartRangeMax(range) - currentEnd);
            }

            if (range.span > 0) {
                this.requestInProgress = true;
                this.dataSupplier.fetchPaginationData(range, this.period)
                        .then((results: RequestResults<T>) => {
                            this.checkDataExhausted(results);
                            switch (operation) {
                                case TFChartDataRequestType.PREPEND:   
                                    this.prependData(results.data, results.range);
                                    break;
                                case TFChartDataRequestType.APPEND:   
                                    this.appendData(results.data, results.range);
                                    break;
                            }
                        })
                        .catch((err) => {
                            this.dataExhausted |= TFChartDataRequestType.PREPEND | TFChartDataRequestType.APPEND;
                            console.log(err + " for " + operation);
                        })
                        .then(() => {
                            this.requestInProgress = false;
                            this.processPendingRequestQueue();
                        });
            }
        }
    }

    public getCachedRange(): TFChartRange {
        return this.dataRange;
    }

    public getCachedData(): T[] {
        return this.data;
    }

    public getCachedDataSize(): number {
        if (this.dataRange == null) {
            throw new Error("Arrrgh");
        }
        return this.dataRange.span / this.period;
    }

    private setData(data: T[], range: TFChartRange) {
        this.data = data;
        if (range == null) {
            throw new Error("Range returned from DataSupplier cannot be null");
        }
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
        if (this.requestBacklog.length == 0) {
            return;
        } else {
            let resultingRange: TFChartRange;
            if (this.requestBacklog.length >= 2) {
                resultingRange = this.requestBacklog[0];
                for (let r of this.requestBacklog) {
                    resultingRange = TFChartUnionRange(resultingRange, r);
                }
            } else {
                resultingRange = this.requestBacklog[0];                                    
            }

            // console.log("Processing backlog of " + this.requestBacklog.length + " requests: " + resultingRange);

            let results: TFChartRange[] = [];
            let overlap = TFChartIntersectionRange(resultingRange, this.dataRange);
            if (overlap.span != 0) {
                if (resultingRange.position < overlap.position) {
                    results.push(TFChartRangeMake(resultingRange.position, resultingRange.position - overlap.position));
                }

                if (TFChartRangeMax(resultingRange) > TFChartRangeMax(overlap)) {
                    results.push(TFChartRangeMake(TFChartRangeMax(overlap), TFChartRangeMax(resultingRange) - TFChartRangeMax(overlap)));
                }
            } else {
                results.push(resultingRange);
            }
            for (let r of results) {
                this.requestData(r);
            }
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