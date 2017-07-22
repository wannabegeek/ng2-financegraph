import { TFChartDataBuffer } from '../../datacontrollers/tfchart_databuffer'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartRangeMax, TFChartIntersectionRange } from '../../tfchart_utils'
import { TFChartDataType } from '../../series/tfchart_series'
import { TFChartDataSupplier, RequestResults } from '../../tfchart_datasupplier'
import { DataOperation, TFChartDataOperationType, TFChartDataRequestType } from '../../tfchart_datacontroller'
import { TFChartSimpleDataController } from '../../datacontrollers/tfchart_datacontroler_simple'
import { MockDataSupplier } from '../tfchart_mockdatasupplier'

describe("TFChartDataController", () => {

    interface DataType extends TFChartDataType {
        value: number;
    }

    function createDataType(index: number): DataType {
        return {
            timestamp: index * 100,
            value: index
        };
    }

    it("Initial subscription", (done) => {
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));

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
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 100), 10, 0, createDataType));

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
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 100), 10, 90, createDataType));

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
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 100), 10, 0, createDataType));

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
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 100), 10, 90, createDataType));

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
        let dataController = new TFChartSimpleDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 100), 10, 0, createDataType));

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