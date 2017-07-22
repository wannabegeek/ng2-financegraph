import { TFChart } from '../tfchart'
import { TFChartLineSeries, TFChartLineDataType } from '../series/tfchart_series_line'
import { TFChartDataSupplier } from '../tfchart_datasupplier'
import { MockDataSupplier } from './tfchart_mockdatasupplier'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartRangeMax, TFChartIntersectionRange, TFChartSizeMake } from '../tfchart_utils'

describe("TFChart", () => {
    function createLineDataType(index: number): TFChartLineDataType {
        return {
            timestamp: index * 100,
            value: index
        };
    }

    it("Pan left", (done) => {
        let supplier: MockDataSupplier<TFChartLineDataType> = new MockDataSupplier<TFChartLineDataType>(TFChartRangeMake(0, 1000), 10, 0, createLineDataType);
        var chartContainer: HTMLDivElement = document.createElement('div');

        let counter: number = 0;
        let chart: TFChart = new TFChart(chartContainer, new TFChartLineSeries(supplier), 1, (range) => {
            console.log("[" + counter + "] VisibleRange ---> " + chart.getVisibleRange());
            console.log("[" + counter + "] VisibleDataPoints ---> " + chart.getVisibleDataPoints());

            expect(chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width)).toBeCloseTo(100);
                expect(chart.getVisibleRange().span).toBe(10);
                expect(chart.getVisibleDataPoints().span).toBe(10);

            if (counter == 0) {
                // chart.setVisibleRange(TFChartRangeMake(0, 100));
                expect(chart.getVisibleRange().position).toBe(0);
                expect(chart.getVisibleDataPoints().position).toBe(0);

                window.setTimeout(() => {
                    let pixelValue = -5 * chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width);
                    expect(pixelValue).toBe(-100);
                    console.log("Panning right 5 units (" + pixelValue + "px)");
                    chart.pan(pixelValue, true);
                }, 100);
            } else if (counter == 1) {
                // expect(chart.getVisibleDataPoints())
                expect(chart.getVisibleRange().position).toBe(5);
                expect(chart.getVisibleDataPoints().position).toBe(-5);

                window.setTimeout(() => {
                    let pixelValue = -15 * chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width);
                    expect(pixelValue).toBe(-300);
                    console.log("Panning right 15 units (" + pixelValue + "px)");
                    chart.pan(pixelValue, true);
                }, 100);
            } else if (counter == 2) {
                // expect(chart.getVisibleDataPoints())
                expect(chart.getVisibleRange().position).toBe(20);
                expect(chart.getVisibleDataPoints().position).toBe(-20);

                window.setTimeout(() => {
                    let pixelValue = -5 * chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width);
                    expect(pixelValue).toBe(-100);
                    console.log("Panning right 5 units (" + pixelValue + "px)");
                    chart.pan(pixelValue, true);
                }, 100);
            } else if (counter == 3) {
                expect(chart.getVisibleRange().position).toBe(25);
                expect(chart.getVisibleDataPoints().position).toBe(-25);
                done();
            }

            counter++;
            console.log("-------------");
        });
        chart["setCanvasSize"](TFChartSizeMake(200, 100));
        expect(chart.getPeriod()).toBe(1);
    });

    it("Pan right", (done) => {
        let supplier: MockDataSupplier<TFChartLineDataType> = new MockDataSupplier<TFChartLineDataType>(TFChartRangeMake(0, 1000), 10, 50, createLineDataType);
        var chartContainer: HTMLDivElement = document.createElement('div');

        let counter: number = 0;
        let chart: TFChart = new TFChart(chartContainer, new TFChartLineSeries(supplier), 1, (range) => {
            console.log("[" + counter + "] VisibleRange ---> " + chart.getVisibleRange());
            console.log("[" + counter + "] VisibleDataPoints ---> " + chart.getVisibleDataPoints());

            expect(chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width)).toBeCloseTo(100);
                expect(chart.getVisibleRange().span).toBe(10);
                expect(chart.getVisibleDataPoints().span).toBe(10);

            if (counter == 0) {
                // chart.setVisibleRange(TFChartRangeMake(0, 100));
                expect(chart.getVisibleRange().position).toBe(50);
                expect(chart.getVisibleDataPoints().position).toBe(0);

                window.setTimeout(() => {
                    let pixelValue = 5 * chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width);
                    expect(pixelValue).toBe(500);
                    console.log("Panning left 5 units (" + pixelValue + "px)");
                    chart.pan(pixelValue, true);
                }, 100);
            } else if (counter == 1) {
                // expect(chart.getVisibleDataPoints())
                expect(chart.getVisibleRange().position).toBe(40);
                expect(chart.getVisibleDataPoints().position).toBe(-5);

                window.setTimeout(() => {
                    let pixelValue = 15 * chart.getVisibleDataPoints().ratioForSize(chart.getCanvasSize().width);
                    expect(pixelValue).toBe(1500);
                    console.log("Panning right 15 units (" + pixelValue + "px)");
                    chart.pan(pixelValue, true);
                }, 100);
            } else if (counter == 2) {
                expect(chart.getVisibleRange().position).toBe(30);
                expect(chart.getVisibleDataPoints().position).toBe(0);
                done();
            }

            counter++;
        });
        chart["setCanvasSize"](TFChartSizeMake(1000, 100));
        expect(chart.getPeriod()).toBe(1);

        // chart.setVisibleRange(TFChartRangeMake(0, 100));
 
        // chart.redraw();

        // console.log(" ---> " + chart.getVisibleRange());
        // console.log(" ---> " + chart.getVisibleDataPoints());
        // chart.pan();
        // expect(TFChartEqualRanges(range1, range2)).toBe(true);
        // expect(TFChartEqualRanges(range1, range3)).toBe(false);
    });

});
