import { TFChartDataBuffer } from './tfchart_databuffer'

describe("TFChartDataBuffer", () => {

    it("Create buffer", () => {

        let buffer = new TFChartDataBuffer();

        expect(buffer.clear()).toEqual("Hello world!");
    });
});