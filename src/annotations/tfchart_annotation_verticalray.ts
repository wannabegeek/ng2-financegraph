import { TFChartAnnotation } from './tfchart_annotation'
import { TFChartRect, TFChartPoint, TFChartRectGetMaxY, TFChartRectGetMinY, TFChartRectGetMaxX } from '../tfchart_utils'
import { TFChart } from '../tfchart'

export class TFChartVerticalRay extends TFChartAnnotation {

    constructor(private lineColor: string, private start: TFChartPoint, private is_down: boolean) {
        super();
    }

    public render(bounds: TFChartRect, chart: TFChart) {
        if (this.start.x <= TFChartRectGetMaxX(bounds) && this.start.x >= bounds.origin.x 
                && ((!this.is_down && this.start.y >= bounds.origin.y - bounds.size.height) || (this.is_down && this.start.y >= bounds.origin.y))) {
            var ctx = chart.getDrawingContext();
            var plot = chart.plotArea();
            ctx.beginPath();
            var x = Math.round(chart.pixelValueAtXValue(this.start.x)) + 0.5;
            ctx.moveTo(x, chart.pixelValueAtYValue(this.start.y));
            if (this.is_down) {
                ctx.lineTo(x, plot.origin.y + plot.size.height);
            } else {
                ctx.lineTo(x, plot.origin.y);
            }
            ctx.strokeStyle = this.lineColor;
            ctx.stroke();
        }
    }
}
