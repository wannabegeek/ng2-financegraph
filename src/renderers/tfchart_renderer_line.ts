import { TFChartRenderer } from './tfchart_renderer'
import { TFChart } from '../tfchart'
import { TFChartRange } from '../tfchart_utils'
import { TFChartLineDataType } from '../series/tfchart_series_line'

export class TFChartLineChartRenderer extends TFChartRenderer {

    private theme = {
        lineColor: "#FF0000"
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

    public render(data: TFChartLineDataType[], visibleRange: TFChartRange, chart: TFChart): void {
        var ctx = chart.getDrawingContext();

        if (data.length > 0) {
            ctx.strokeStyle = this.theme.lineColor;
            ctx.beginPath();

            ctx.moveTo(chart.pixelValueAtXValue(data[0].timestamp), chart.pixelValueAtYValue(data[0].value));

            for (let point of data) {
                ctx.lineTo(chart.pixelValueAtXValue(point.timestamp), chart.pixelValueAtYValue(point.value));
            }

            ctx.stroke();
        }
    }
}
