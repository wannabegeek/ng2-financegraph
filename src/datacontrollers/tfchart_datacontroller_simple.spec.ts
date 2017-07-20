import { TFChartDataBuffer } from './tfchart_databuffer'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartRangeMax, TFChartIntersectionRange } from '../tfchart_utils'
import { TFChartDataType } from '../series/tfchart_series'
import { TFChartDataSupplier, RequestResults } from '../tfchart_datasupplier'
import { DataOperation, TFChartDataOperationType, TFChartDataRequestType } from '../tfchart_datacontroller'
import { TFChartSimpleDataController } from './tfchart_datacontroler_simple'

describe("TFChartDataController", () => {

    interface DataType extends TFChartDataType {
        value: number;
    }
    //     constructor(private value: number) {
    //     }

    //     public getValue(): number {
    //         return this.value;
    //     }
    // }

    class MockDataSupplier implements TFChartDataSupplier<DataType> {
        private storedData: DataType[] = [];

        constructor(private availabeRange: TFChartRange, private supplyCount: number, private initialOffset: number) {
            
            for (let i = 0; i < TFChartRangeMax(availabeRange); i++) {
                this.storedData.push({
                    timestamp: i * 100,
                    value: i
                });
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

        public fetchPaginationData(range: TFChartRange, period: number): Promise<RequestResults<DataType>> {
            return new Promise((resolve, reject) => {
                if (TFChartIntersectionRange(range, this.availabeRange).span == 0) {
                    reject("Request out of range [we have " + this.availabeRange + " but received request for " + range);
                } else {
                    resolve({
                        success: true,
                        range: range,
                        data: this.storedData.slice(range.position, TFChartRangeMax(range))
                    });
                }
            });
        }
    }

    it("Initial subscription", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier(TFChartRangeMake(0, 10), 10, 0));

        dataController.subscribe((dataOperation: DataOperation) => {
            expect(dataOperation.count).toBe(10);
            expect(dataOperation.method).toBe(TFChartDataOperationType.ADD);
            expect(dataOperation.type).toBe(TFChartDataRequestType.APPEND);

            let data: DataType[] = dataController.getCachedData();
            expect(data.length).toBe(10);

            done();
        });

        dataController.setPeriod(1);
    });

    it("Request new forward contiguious block", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier(TFChartRangeMake(0, 100), 10, 0));

        let requestCount = 0;

        dataController.subscribe((dataOperation: DataOperation) => {
            expect(dataOperation.method).toBe(TFChartDataOperationType.ADD);
            expect(dataOperation.type).toBe(TFChartDataRequestType.APPEND);
            let data: DataType[] = dataController.getCachedData();

            expect(dataOperation.count).toBe(10);
            expect(data.length).toBe(10 * (requestCount + 1));

            if (requestCount < 9) {
                setTimeout(function() { 
                    dataController.requestData(TFChartRangeMake((10 * requestCount), 10));
                }, 100);
            } else {
                let counter = 0;
                for (let d of data) {
                    expect(d.value).toBe(counter++);
                }
                done();
            }

            requestCount++;
        });

        dataController.setPeriod(1);
    });

    it("Request new backwards contiguious block", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier(TFChartRangeMake(0, 100), 10, 90));

        let requestCount = 0;

        dataController.subscribe((dataOperation: DataOperation) => {
            expect(dataOperation.method).toBe(TFChartDataOperationType.ADD);
            expect(dataOperation.type).toBe(requestCount == 0 ? TFChartDataRequestType.APPEND : TFChartDataRequestType.PREPEND);
            let data: DataType[] = dataController.getCachedData();

            expect(dataOperation.count).toBe(10);
            expect(data.length).toBe(10 * (requestCount + 1));
            // expect(dataController.getCachedRange()).toBe(9 * (requestCount + 1));

            if (requestCount < 9) {
                setTimeout(function() { 
                    dataController.requestData(TFChartRangeMake(100 - (10 * (requestCount + 1)), 10));
                }, 100);
            } else {
                let counter = 0;
                for (let d of data) {
                    expect(d.value).toBe(counter++);
                }
                done();
            }

            requestCount++;
        });

        dataController.setPeriod(1);
    });

    it("Request new forward non-contiguious block", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier(TFChartRangeMake(0, 100), 10, 0));

        let requestCount = 0;

        dataController.subscribe((dataOperation: DataOperation) => {
            expect(dataOperation.method).toBe(TFChartDataOperationType.ADD);
            expect(dataOperation.type).toBe(TFChartDataRequestType.APPEND);
            let data: DataType[] = dataController.getCachedData();

            if (requestCount == 0) {
                expect(dataOperation.count).toBe(10);
                expect(data.length).toBe(10 * (requestCount + 1));
                setTimeout(function() { 
                    dataController.requestData(TFChartRangeMake(10, 90));
                }, 100);
            } else {
                expect(dataOperation.count).toBe(90);
                expect(data.length).toBe(100);
                let counter = 0;
                for (let d of data) {
                    expect(d.value).toBe(counter++);
                }
                done();
            }

            requestCount++;
        });

        dataController.setPeriod(1);
    });

    it("Request new backwards non-contiguious block", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier(TFChartRangeMake(0, 100), 10, 90));

        let requestCount = 0;

        dataController.subscribe((dataOperation: DataOperation) => {
            expect(dataOperation.method).toBe(TFChartDataOperationType.ADD);
            expect(dataOperation.type).toBe(requestCount == 0 ? TFChartDataRequestType.APPEND : TFChartDataRequestType.PREPEND);
            let data: DataType[] = dataController.getCachedData();

            if (requestCount == 0) {
                expect(dataOperation.count).toBe(10);
                expect(data.length).toBe(10 * (requestCount + 1));
                setTimeout(function() { 
                    dataController.requestData(TFChartRangeMake(0, 90));
                }, 100);
            } else {
                expect(dataOperation.count).toBe(90);
                expect(data.length).toBe(100);
                let counter = 0;
                for (let d of data) {
                    expect(d.value).toBe(counter++);
                }
                done();
            }

            requestCount++;
        });

        dataController.setPeriod(1);
    });

    it("Fill pending request queue", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier(TFChartRangeMake(0, 100), 10, 0));

        let requestCount = 0;

        dataController.subscribe((dataOperation: DataOperation) => {
            expect(dataOperation.method).toBe(TFChartDataOperationType.ADD);
            expect(dataOperation.type).toBe(TFChartDataRequestType.APPEND);
            let data: DataType[] = dataController.getCachedData();

            if (requestCount == 0) {
                expect(dataOperation.count).toBe(10);
                expect(data.length).toBe(10 * (requestCount + 1));
                dataController.requestData(TFChartRangeMake(10, 10));
                dataController.requestData(TFChartRangeMake(30, 10));
                dataController.requestData(TFChartRangeMake(50, 10));
                dataController.requestData(TFChartRangeMake(90, 10));
            } else if (requestCount == 1) {
                expect(dataOperation.count).toBe(90);
                expect(data.length).toBe(100);
                let counter = 0;
                for (let d of data) {
                    expect(d.value).toBe(counter++);
                }
                done();
            }

            requestCount++;
        });

        dataController.setPeriod(1);
    });

});