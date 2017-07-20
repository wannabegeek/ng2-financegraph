import { TFChartRenderer } from './tfchart_renderer'
import { TFChart } from '../tfchart'
import { TFChartRange, TFChartRect } from '../tfchart_utils'
import { TFChartBarchartDataType } from '../series/tfchart_series_barchart'

export class TFChartBarChartRenderer extends TFChartRenderer {

    private theme = {
            barFillColor: "rgb(215, 84, 66)",
            barStrokeColor: "rgb(107, 42, 33)"
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

    public render(data: TFChartBarchartDataType[], visibleRange: TFChartRange, chart: TFChart): void {
        if (data.length > 0) {
            let ctx = chart.getDrawingContext();
            let x_start: number = chart.pixelValueAtXValue(data[0].timestamp);
            let x_end: number = chart.pixelValueAtXValue(data[data.length - 1].timestamp);
            let x_delta: number = x_end - x_start;
            let bar_width: number = (x_delta / data.length) / 1.5;
            let half_bar_width: number = bar_width / 2.0;

            ctx.fillStyle = this.theme.barFillColor;
            ctx.strokeStyle = this.theme.barStrokeColor;

            for (let point of data) {
                if (visibleRange.intersects(point.timestamp)) {
                    var plot: TFChartRect = chart.plotArea();
                    var body_top: number = Math.round(chart.pixelValueAtYValue(point.value)) + 0.5;
                    var offset: number = chart.pixelValueAtXValue(point.timestamp);

                    if (offset > -half_bar_width) {
                        ctx.beginPath();
                        ctx.rect(Math.round(offset - half_bar_width) + 0.5,
                                        body_top,
                                        bar_width,
                                        plot.origin.y + plot.size.height - body_top);

                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
        }
    }
}