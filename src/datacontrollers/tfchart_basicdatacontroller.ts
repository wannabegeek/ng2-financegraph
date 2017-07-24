import { TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartRangeMax, TFChartUnionRange, TFChartRangeInvalid, TFChartIntersectionRange } from '../tfchart_utils'
import { TFChartDataController, TFChartDataRequestType, TFChartDataAvailability, DataSubscription, TFChartDataOperationType, DataOperation, DataRequestResults } from '../tfchart_datacontroller'
import { TFChartDataSupplier, RequestResults } from '../tfchart_datasupplier'
import { TFChartDataBuffer } from './tfchart_databuffer'
import { TFChartDataType } from '../series/tfchart_series'
import { Subject } from 'rxjs/Subject'

export interface BacklogRequest<T extends TFChartDataType> {
    range: TFChartRange;
    resolve: (value?: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

export class TFChartBasicDataController<T extends TFChartDataType> extends TFChartDataController {

    private period: number = -1;

    // Total range avaialble from the supplier
    private availableDataRange: TFChartRange = TFChartRangeInvalid();
    private cachedData: TFChartDataBuffer<T> = new TFChartDataBuffer<T>();

    private requestInProgress: boolean = false;
    private requestBacklog: BacklogRequest<T>[] = [];


    public constructor(private dataSupplier: TFChartDataSupplier<T>) {
        super();
        // this.observers = new Subject();
    }

    public setPeriod(period: number) {
        if (period != this.period) {
            this.period = period;
            // we need to clear our current cache and requre a re-request
            this.cachedData.clear();
            this.availableDataRange = TFChartRangeInvalid();
        }
    }

    /**
     * Provides the total available range in timestamp space
     */
    public availableRange(): Promise<TFChartRange> {
        return new Promise((resolve, reject) => {
            if (this.availableDataRange == TFChartRangeInvalid()) {
                this.dataSupplier.getAvailableRange(this.period)
                        .then((range: TFChartRange) => this.availableDataRange = range)
                        .then(() => console.log("Available range is: " + this.availableDataRange))
                        .then(() => resolve(this.availableDataRange));
            } else {
                resolve(this.availableDataRange);
            }
        });
    }

    /**
     * range is in timestamp space i.e. startTimestamp -> endTimestamp.
     */
    public getDataInRange<T extends TFChartDataType>(range: TFChartRange): Promise<DataRequestResults<T>> {
        return new Promise((resolve, reject) => {
            this.availableRange().then((available) => {
                let intersectionWithAvailable: TFChartRange = TFChartIntersectionRange(range, available);
                if (intersectionWithAvailable.span == 0) {
                    reject("Requested range not within available range [requested: " + range + ", available: " + available + "]");
                } else {
                    // What is the intersection with the requested range and the cached range
                    let intersectionWithCache: TFChartRange = TFChartIntersectionRange(intersectionWithAvailable, this.cachedData.getRange());
                    if (intersectionWithCache.span == 0) {
                        // nothing in our cache, we need to request everything
                        console.log("Need to request our whole range");
                        this.requestData(intersectionWithAvailable)
                            .then((data) => {
                                resolve({
                                    data: this.cachedData.getDataInRange(intersectionWithAvailable),
                                    range: intersectionWithAvailable,
                                    moreToFollow: null                                    
                                });
                            })
                            .catch((reason) => {
                                reject(reason);
                            });
                    } else if (intersectionWithCache.span == intersectionWithAvailable.span) {
                        // we have all the data in our cache
                        console.log("Can fulfill request with cache data");
                        resolve({
                            data: this.cachedData.getDataInRange(intersectionWithAvailable),
                            range: intersectionWithAvailable,
                            moreToFollow: null
                        });
                    } else {
                        // we have some data in the cache, we will return that, and return the missing
                        // when we have it from the supplier.
                        let preceedingRange: TFChartRange = null;
                        let succeedingRange: TFChartRange = null;

                        console.log("Need to request partial data for range");
                        let maxCached: number = TFChartRangeMax(this.cachedData.getRange());

                        let completeionPromise: DataRequestResults<T> = null;

                        if (TFChartRangeMax(range) > maxCached) {
                            console.log("We need data beyond our cached range");
                            preceedingRange = TFChartRangeMake(maxCached, TFChartRangeMax(range) - maxCached);
                            
                        }
                        if (range.position < this.cachedData.getRange().position) {
                            console.log("We need data before our cached range");
                            succeedingRange = TFChartRangeMake(range.position, TFChartRangeMax(range) - this.cachedData.getRange().position);
                        }

                        let succeedingPromise: Promise<DataRequestResults<T>> = null;
                        let currentPromise: Promise<DataRequestResults<T>> = null;
                        if (succeedingRange != null) {
                            succeedingPromise = new Promise((resolve, reject) => {
                                                        this.requestData(succeedingRange)
                                                            .then((data) => {
                                                                let completeRange: TFChartRange = TFChartUnionRange(intersectionWithAvailable, data.range);
                                                                resolve({
                                                                    data: this.cachedData.getDataInRange(completeRange),
                                                                    range: completeRange,
                                                                    moreToFollow: null
                                                                });
                                                            })
                                                            .catch((reason) => {
                                                                reject(reason);
                                                            });
                                                    });
                        }
                        if (preceedingRange != null) {
                            currentPromise = new Promise((resolve, reject) => {
                                                        this.requestData(preceedingRange)
                                                            .then((data) => {
                                                                let completeRange: TFChartRange = TFChartUnionRange(intersectionWithAvailable, data.range);
                                                                resolve({
                                                                    data: this.cachedData.getDataInRange(completeRange),
                                                                    range: completeRange,
                                                                    moreToFollow: succeedingPromise
                                                                });
                                                            })
                                                            .catch((reason) => {
                                                                reject(reason);
                                                            });
                                                    });
                        } else {
                            currentPromise = succeedingPromise;
                        }
                            
                        resolve({
                            data: this.cachedData.getDataInRange(intersectionWithCache),
                            range: intersectionWithCache,
                            moreToFollow: currentPromise
                        });
                    }
                }
            });
        });
    }

    private requestData(range: TFChartRange): Promise<DataRequestResults<T>> {
        return new Promise((resolve, reject) => {
            // if (this.requestInProgress) {
            //     console.log("Request already in progress - queuing");
            //     this.requestBacklog.push({
            //         range: range,
            //         resolve: resolve,
            //         reject: reject
            //     });
            // } else {
                // console.log("think we want: " + range + " currently have " + this.data.getRange() + " for period: " + this.period);
                // we don't want any gaps in our cached data...
                range = TFChartIntersectionRange(range, this.availableDataRange);
                if (range.span == 0) {
                    reject("Request out of available range [we have " + this.availableDataRange + " but requested " + range + "]");
                } else {
                    console.log("Requesting range of: " + range);
                }
                let operation: TFChartDataRequestType;
                if (this.cachedData.getRange() !== TFChartRangeInvalid()) {
                    if (range.position < this.cachedData.getRange().position) {
                        operation = TFChartDataRequestType.PREPEND;
                        range = TFChartUnionRange(range, this.cachedData.getRange());
                        range.span -= this.cachedData.getRange().span;
                    } else if (TFChartRangeMax(range) > TFChartRangeMax(this.cachedData.getRange())) {
                        operation = TFChartDataRequestType.APPEND;
                        let currentEnd = TFChartRangeMax(this.cachedData.getRange());
                        range = TFChartRangeMake(currentEnd, TFChartRangeMax(range) - currentEnd);
                    } else {
                        console.log("We already have the requested data");
                        reject("invalid data request " + range);
                    }
                } else {
                    operation = TFChartDataRequestType.APPEND;
                }
                if (range.span > 0) {
                    this.requestInProgress = true;
                    this.dataSupplier.fetchPaginationData(range, this.period)
                            .then((results: RequestResults<T>) => {
                                if (results.success == false) {
                                    reject("Failure returned from fetchPaginationData in dataSupplier");
                                } else {
                                    switch (operation) {
                                        case TFChartDataRequestType.PREPEND: 
                                            this.cachedData.prependData(results.data, results.range);
                                            break;
                                        case TFChartDataRequestType.APPEND:   
                                            this.cachedData.appendData(results.data, results.range);
                                            break;
                                    }
                                    resolve({
                                        data: results.data,
                                        range: results.range,
                                        moreToFollow: false 
                                    });
                                }
                            })
                            .catch((err) => {
                                reject(err + " for " + operation);
                            })
                            .then(() => {
                                this.requestInProgress = false;
                                console.log("Processing pending queue");
                                this.processPendingRequestQueue();
                            });
                }
            // }
        });
    }

    private processPendingRequestQueue() {
        if (this.requestBacklog.length == 0) {
            return;
        } else {
            for (let request of this.requestBacklog) {
                this.requestData(request.range)
                        .then((data) => request.resolve(null))
                        // {
                        //     data: data.data,
                        //     range: data.range,
                        //     moreToFollow: data.moreToFollow
                        // }))
                        .catch((error) => request.reject(error));
            }
            // let resultingRange: TFChartRange;

            // // If we have a backlog of 2 or more requests then  we can combine them to a single request
            // if (this.requestBacklog.length >= 2) {
            //     resultingRange = this.requestBacklog[0];
            //     for (let r of this.requestBacklog) {
            //         resultingRange = TFChartUnionRange(resultingRange, r);
            //     }
            // } else {
            //     resultingRange = this.requestBacklog[0];                                    
            // }

            // // console.log("Processing backlog of " + this.requestBacklog.length + " requests: " + resultingRange);
            // this.requestBacklog = [];

            // let results: TFChartRange[] = [];
            // let overlap = TFChartIntersectionRange(resultingRange, this.cachedData.getRange());
            // if (overlap.span != 0) {
            //     if (resultingRange.position < overlap.position) {
            //         results.push(TFChartRangeMake(resultingRange.position, resultingRange.position - overlap.position));
            //     }

            //     if (TFChartRangeMax(resultingRange) > TFChartRangeMax(overlap)) {
            //         results.push(TFChartRangeMake(TFChartRangeMax(overlap), TFChartRangeMax(resultingRange) - TFChartRangeMax(overlap)));
            //     }
            // } else {
            //     results.push(resultingRange);
            // }
            // for (let r of results) {
            //     this.requestData(r);
            // }
        }
    }

}
