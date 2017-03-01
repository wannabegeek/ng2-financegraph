import { TFChartAnnotation } from '../tfchart_annotation'
import { TFChartRect, TFChartPoint, TFChartRectGetMaxY, TFChartRectGetMinY, TFChartRectGetMaxX } from '../tfchart_utils'
import { TFChart } from '../tfchart'

export class TFChartHorizontalRay extends TFChartAnnotation {

    constructor(private lineColor, private start: TFChartPoint) {
        super();
    }

    public render(bounds: TFChartRect, chart: TFChart) {
        if (this.start.x <= TFChartRectGetMaxX(bounds) && this.start.y <= TFChartRectGetMaxY(bounds) && this.start.y >= TFChartRectGetMinY(bounds)) {

            var ctx = chart.getDrawingContext();
            var plot = chart.plotArea();

            ctx.beginPath();
            var y = Math.round(chart.pixelValueAtYValue(this.start.y)) + 0.5;
            ctx.moveTo(chart.pixelValueAtXValue(this.start.x), y);
            ctx.lineTo(plot.origin.x + plot.size.width, y);
            ctx.strokeStyle = this.lineColor;
            ctx.stroke();
        }
    }
}
