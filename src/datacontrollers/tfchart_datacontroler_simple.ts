import { TFChartRange, TFChartRangeMake, TFChartIntersectionRange, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange, TFChartRangeInvalid } from '../tfchart_utils'
import { TFChartDataController, TFChartDataRequestType, TFChartDataAvailability, DataSubscription, TFChartDataOperationType, DataOperation } from '../tfchart_datacontroller'
import { TFChartDataSupplier, RequestResults } from '../tfchart_datasupplier'
import { TFChartDataBuffer } from './tfchart_databuffer'
import { Subject } from 'rxjs/Subject'

export class TFChartSimpleDataController<T> extends TFChartDataController {
    private period: number = -1;
    private data: TFChartDataBuffer<T> = new TFChartDataBuffer<T>();
    private pending_request_queue = [];
    private availableDataRange: TFChartRange = TFChartRangeInvalid();
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
        this.data.clear();

        this.dataSupplier.getAvailableRange(period)
                            .then((range: TFChartRange) => this.availableDataRange = range)
                            .then(() => console.log("Available range is: " + this.availableDataRange))
                            .then(() => this.dataSupplier.fetchInitialDataRange(TFChartRangeMake(this.availableDataRange.position, period * 40), period)
                                                            .then((initialRange: TFChartRange) => {
                                                                console.log("Requesting initial range of: " + initialRange);
                                                                return initialRange;
                                                            })
                                                            .then((initialRange: TFChartRange) => this.requestData(initialRange))
                            );

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

    public availableRange(): TFChartRange {
        return this.availableDataRange;
    }

    // public canSupplyData(range: TFChartRange): TFChartDataAvailability {
    //     if (TFChartEqualRanges(this.dataRange, TFChartRangeInvalid())) {
    //         TFChartDataAvailability.NOT_AVAILABLE;
    //     }

    //     let operation: TFChartDataRequestType;

    //     if (range.position < this.dataRange.position) {
    //         operation = TFChartDataRequestType.PREPEND;
    //     } else if (TFChartRangeMax(range) > TFChartRangeMax(this.dataRange)) {
    //         operation = TFChartDataRequestType.APPEND;
    //     } else {
    //         throw new Error("invalid data request " + range);
    //     }
        
    //     // console.log("Can supply for: " + operation + " ? " + this.dataExhausted + " " + ((this.dataExhausted & operation) != operation ? TFChartDataAvailability.AVAILABLE : TFChartDataAvailability.NOT_AVAILABLE));
    //     return (this.dataExhausted & operation) != operation ? TFChartDataAvailability.AVAILABLE : TFChartDataAvailability.NOT_AVAILABLE;
    // }
    // 
    // public checkDataExhausted(results: RequestResults<T>) {
    //     if (!results.moreDataPreceeds) {
    //         this.dataExhausted |= TFChartDataRequestType.PREPEND;   
    //     }
    //     if (!results.moreDataSucceeds) {
    //         this.dataExhausted |= TFChartDataRequestType.APPEND;   
    //     }
    //     console.log("Data exhaused: " + this.dataExhausted);
    //     console.log(results);
    // }

    // public requestInitialDataRange() {
    //     // console.log("Requesting initial");
    //     let suggestedRange = TFChartRangeInvalid(); //TFChartRangeMake(0, 100 * this.period);        
    //     this.dataSupplier.fetchInitialDataRange(suggestedRange, this.period)
    //         .then((range: TFChartRange) => {
    //                 console.log("Initial responded with range " + range);
    //                 this.requestData(range);
    //             })
    //             .catch((err) => {
    //                 this.dataExhausted |= TFChartDataRequestType.PREPEND | TFChartDataRequestType.APPEND;
    //                 console.error("Failed to get initial data range: " + err);
    //             });
    // }

    public requestData(range: TFChartRange) {
        if (this.requestInProgress) {
            // console.log("Request already in grogress - queuing");
            this.requestBacklog.push(range);
        } else {
            // console.log("think we want: " + range + " currently have " + this.dataRange + " for period: " + this.period);
            // we don't want any gaps in our cached data...
            range = TFChartIntersectionRange(range, this.availableDataRange);
            let operation: TFChartDataRequestType;
            if (!TFChartEqualRanges(this.data.getRange(), TFChartRangeInvalid())) {
                if (range.position < this.data.getRange().position) {
                    operation = TFChartDataRequestType.PREPEND;
                    range = TFChartUnionRange(range, this.data.getRange());
                    range.span -= this.data.getRange().span;
                } else if (TFChartRangeMax(range) > TFChartRangeMax(this.data.getRange())) {
                    operation = TFChartDataRequestType.APPEND;
                    let currentEnd = TFChartRangeMax(this.data.getRange()) + this.period;
                    range = TFChartRangeMake(currentEnd, TFChartRangeMax(range) - currentEnd);
                } else {
                    throw new Error("invalid data request " + range);
                }
            } else {
                operation = TFChartDataRequestType.APPEND;
            }

            if (range.span > 0) {
                this.requestInProgress = true;
                this.dataSupplier.fetchPaginationData(range, this.period)
                        .then((results: RequestResults<T>) => {
                            if (results.success == false) {
                                console.log("Failure returned from fetchPaginationData in dataSupplier");
                            } else {
                                switch (operation) {
                                    case TFChartDataRequestType.PREPEND:   
                                        this.prependData(results.data, results.range);
                                        break;
                                    case TFChartDataRequestType.APPEND:   
                                        this.appendData(results.data, results.range);
                                        break;
                                }
                            }
                        })
                        .catch((err) => {
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
        return this.data.getRange();
    }

    public getCachedData<T>(): any[] {
        return this.data.getData();
    }

    public getCachedDataSize(): number {
        if (this.data.getRange() == TFChartRangeInvalid()) {
            throw new Error("Arrrgh");
        }
        return this.data.getRange().span / this.period;
    }

    private prependData(data: T[], range: TFChartRange): void {

        this.data.appendData(data, range);

        this.observers.next({
            method: TFChartDataOperationType.ADD,
            count: data.length,
            type: TFChartDataRequestType.PREPEND
        });
    }

    private appendData(data: T[], range: TFChartRange): void {

        this.data.appendData(data, range);

        this.observers.next({
            method: TFChartDataOperationType.ADD,
            count: data.length,
            type: TFChartDataRequestType.APPEND
        });
    }

    // private removeCurrentDataFromRange(range: TFChartRange) {
    //     if (range !== null) {
    //         // we need to make sure we don't request the same data
    //         var intersection = TFChartIntersectionRange(this.dataRange, range);
    //         if (intersection.span > 0) { // something intersects
    //             if (TFChartEqualRanges(intersection, range)) {
    //                 // we already have this pending data
    //                 return null;
    //             } else {
    //                 // we need to update 'range'
    //                 if (range.position == intersection.position) {
    //                     // the beginning over laps
    //                     range.position += intersection.span + this.period;
    //                     range.span -= intersection.span;
    //                 } else if (TFChartRangeMax(range) == TFChartRangeMax(intersection)) {
    //                     // the end over laps
    //                     range.span = intersection.position - range.position - this.period;
    //                 }
    //             }
    //         }
    //     }
    //     return range;
    // }

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

            this.requestBacklog = [];
            // console.log("Processing backlog of " + this.requestBacklog.length + " requests: " + resultingRange);

            let results: TFChartRange[] = [];
            let overlap = TFChartIntersectionRange(resultingRange, this.data.getRange());
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
}