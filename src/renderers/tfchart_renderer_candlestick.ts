import { TFChartRenderer } from './tfchart_renderer'
import { TFChart } from '../tfchart'
import { TFChartRange } from '../tfchart_utils'
import { TFChartCandlestickDataType } from '../series/tfchart_series_candlestick'

export interface Theme {
    upFillColor: string;
    upStrokeColor: string;
    downFillColor: string;
    downStrokeColor: string;
    wickColor: string;
}

export class TFChartCandlestickRenderer extends TFChartRenderer {

    private theme = {
            upFillColor: "rgb(107, 165, 131)",
            upStrokeColor: "rgb(53, 82, 65)",
            downFillColor: "rgb(215, 84, 66)",
            downStrokeColor: "rgb(107, 42, 33)",
            wickColor: "rgb(180, 180, 180)"        
    };

    // TFChartCandlestickRenderer.prototype.setOptions = function(options) {
    //     var default_theme = {
    //             upFillColor: "rgb(107, 165, 131)",
    //             upStrokeColor: "rgb(53, 82, 65)",
    //             downFillColor: "rgb(215, 84, 66)",
    //             downStrokeColor: "rgb(107, 42, 33)",
    //             wickColor: "rgb(180, 180, 180)"        
    //     };

    //     this.theme = $.extend({}, default_theme, options.theme.candlestick || {});
    // }

    // constructor(timestampFn: Function, openFn, highFn, lowFn, closeFn) {
    //     super();
    // }

    public render(data: TFChartCandlestickDataType[], visibleRange: TFChartRange, chart: TFChart) {
        if (data.length > 0) {
            var ctx = chart.getDrawingContext();
            var x_start = chart.pixelValueAtXValue(data[0].timestamp);
            var x_end = chart.pixelValueAtXValue(data[data.length - 1].timestamp);
            var x_delta = chart.getCanvasSize().width;
            var candle_width = (x_delta / chart.getVisibleDataPoints().span) / 1.5;
            var half_candle_width = candle_width / 2.0;

            for (let point of data) {
                if (visibleRange.intersects(point.timestamp)) {
                    var body_top = Math.round(chart.pixelValueAtYValue(Math.max(point.open, point.close))) + 0.5;
                    var body_bottom = Math.round(chart.pixelValueAtYValue(Math.min(point.open, point.close))) + 0.5;

                    var offset = chart.pixelValueAtXValue(point.timestamp);
                    if (offset > -half_candle_width) {
                        ctx.beginPath();
                        ctx.rect(Math.round(offset - half_candle_width) + 0.5,
                                        body_top,
                                        candle_width,
                                        body_bottom - body_top);
                        this.fillCandle(ctx, point.close >= point.open);

                        ctx.strokeStyle = this.theme.wickColor;
                        ctx.beginPath();
                        var wick_location = Math.round(offset) + 0.5;
                        ctx.moveTo(wick_location, chart.pixelValueAtYValue(point.high));
                        ctx.lineTo(wick_location, body_top);
                        ctx.moveTo(wick_location, body_bottom);
                        ctx.lineTo(wick_location, chart.pixelValueAtYValue(point.low));
                        ctx.stroke();
                    }
                }
            }
        }
    }

    private fillCandle(ctx, isUp: boolean) {
        if (isUp) {
            ctx.fillStyle = this.theme.upFillColor;
            ctx.strokeStyle = this.theme.upStrokeColor;
        } else {
            ctx.fillStyle = this.theme.downFillColor;
            ctx.strokeStyle = this.theme.downStrokeColor;
        }
        ctx.fill();
        ctx.stroke();
    }
}