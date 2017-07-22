import { TFChartDataBuffer } from '../../datacontrollers/tfchart_databuffer'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges } from '../../tfchart_utils'

describe("TFChartDataBuffer", () => {

    class DataModel {
        constructor(private value: number) {
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
            data.push(new DataModel(i));
        }

        buffer.appendData(data, TFChartRangeMake(0, 100));
        expect(buffer.getData().length).toBe(100);
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 100))).toBe(true);

        buffer.clear();
        expect(buffer.getData().length).toBe(0);
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and populate", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i));
        }

        let range: TFChartRange = TFChartRangeMake(0, 100);

        buffer.appendData(data, range);
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 100))).toBe(true);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(count++);
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and append", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i));
        }

        buffer.appendData(data, TFChartRangeMake(0, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 100))).toBe(true);

        data = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i));
        }
        buffer.appendData(data, TFChartRangeMake(100, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 200))).toBe(true);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(count++);
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and prepend", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i));
        }

        buffer.appendData(data, TFChartRangeMake(100, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(100, 100))).toBe(true);

        data = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i));
        }
        buffer.prependData(data, TFChartRangeMake(0, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 200))).toBe(true);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(count++);
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });

    it("Create buffer and prepend and append", () => {
        let buffer = new TFChartDataBuffer<DataModel>();

        let data : DataModel[] = [];
        for (let i = 100; i < 200; i++) {
            data.push(new DataModel(i));
        }

        buffer.appendData(data, TFChartRangeMake(100, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(100, 100))).toBe(true);

        data = [];
        for (let i = 0; i < 100; i++) {
            data.push(new DataModel(i));
        }
        buffer.prependData(data, TFChartRangeMake(0, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 200))).toBe(true);

        data = [];
        for (let i = 200; i < 300; i++) {
            data.push(new DataModel(i));
        }
        buffer.appendData(data, TFChartRangeMake(200, 100));
        expect(buffer.getRange()).not.toBeNull();
        expect(TFChartEqualRanges(buffer.getRange(), TFChartRangeMake(0, 300))).toBe(true);

        let count: number = 0;
        for (let d of buffer.getData()) {
            expect(d.getValue()).toBe(count++);
        }

        buffer.clear();
        expect(buffer.getRange()).toEqual(TFChartRangeInvalid());
    });
});