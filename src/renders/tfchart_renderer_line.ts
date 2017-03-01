import { TFChartRenderer } from '../tfchart_renderer'
import { TFChart } from '../tfchart'

export class TFChartLineChartRenderer<T> extends TFChartRenderer {

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

    public render<T>(data: T[], chart: TFChart) {
        var ctx = chart.getDrawingContext();

        ctx.strokeStyle = this.theme.lineColor;
        ctx.beginPath();

        ctx.moveTo(chart.pixelValueAtXValue(data[0].timestamp), chart.pixelValueAtYValue(data[0].close));

        for (let point of data) {
            ctx.lineTo(chart.pixelValueAtXValue(point.timestamp), chart.pixelValueAtYValue(point.close));
        }

        ctx.stroke();
    }
}
