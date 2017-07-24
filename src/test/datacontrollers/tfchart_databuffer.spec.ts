import { TFChartDataBuffer } from '../../datacontrollers/tfchart_databuffer'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartLocationInRange } from '../../tfchart_utils'
import { TFChartDataType } from '../../series/tfchart_series'

describe("TFChartDataBuffer", () => {

    class DataModel implements TFChartDataType {
        timestamp: number;

        constructor(private value: number) {
            this.timestamp = value;
        }

        public getValue(): number {
            return this.value;
        }
    }

    it("Create buffer and clean", () => {
        let buffer = new TFChartDataBuffer<DataModel>();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());

        let data : DataModel[] = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i * 10));
        }

        buffer.appendData(data, TFChartRangeMake(0, 990));
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(990);

        buffer.clear();
        expect(buffer.getData().length).toBe(0);
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and populate", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i * 10));
        }

        let range: TFChartRange = TFChartRangeMake(0, 990);

        buffer.appendData(data, range);
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(990);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(10 * count++);
            expect(TFChartLocationInRange(d.timestamp, buffer.getRange()));
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and append", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i * 10));
        }

        buffer.appendData(data, TFChartRangeMake(0, 990));
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(990);

        data = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i * 10));
        }
        buffer.appendData(data, TFChartRangeMake(1000, 990));
        expect(buffer.getData().length).toBe(200);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(1990);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(10 * count++);
            expect(TFChartLocationInRange(d.timestamp, buffer.getRange()));
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and prepend", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i * 10));
        }

        buffer.appendData(data, TFChartRangeMake(1000, 990));
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(1000);
        expect(buffer.getRange().span).toBe(990);

        data = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i * 10));
        }
        buffer.prependData(data, TFChartRangeMake(0, 990));
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getData().length).toBe(200);
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(1990);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(10 * count++);
            expect(TFChartLocationInRange(d.timestamp, buffer.getRange()));
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and prepend and append", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i * 10));
        }

        buffer.appendData(data, TFChartRangeMake(1000, 990));
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(1000);
        expect(buffer.getRange().span).toBe(990);

        data = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i * 10));
        }
        buffer.prependData(data, TFChartRangeMake(0, 990));
        expect(buffer.getData().length).toBe(200);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(1990);

        data = [];
        for (let i = 200; i < 300; i++) {
            data.push(new DataModel(i * 10));
        }
        buffer.appendData(data, TFChartRangeMake(2000, 990));
        expect(buffer.getData().length).toBe(300);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(2990);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(10 * count++);
            expect(TFChartLocationInRange(d.timestamp, buffer.getRange()));
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and append overlapping", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i * 10));
        }

        buffer.appendData(data, TFChartRangeMake(0, 990));
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(990);

        data = [];
        for (let i = 50; i < 200; i++) {
            data.push(new DataModel(i * 10));
        }
        buffer.appendData(data, TFChartRangeMake(500, 1490));
        expect(buffer.getData().length).toBe(200);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(1990);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(10 * count++);
            expect(TFChartLocationInRange(d.timestamp, buffer.getRange()));
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and prepend overlapping", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i * 10));
        }

        buffer.appendData(data, TFChartRangeMake(1000, 990));
        expect(buffer.getData().length).toBe(100);
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getRange().position).toBe(1000);
        expect(buffer.getRange().span).toBe(990);

        data = [];
        for (let i = 0; i < 150; i++) {
            data.push(new DataModel(i * 10));
        }
        buffer.prependData(data, TFChartRangeMake(0, 1490));
        expect(buffer.getRange()).not.toBeNull();
        expect(buffer.getData().length).toBe(200);
        expect(buffer.getRange().position).toBe(0);
        expect(buffer.getRange().span).toBe(1990);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(10 * count++);
            expect(TFChartLocationInRange(d.timestamp, buffer.getRange()));
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

});