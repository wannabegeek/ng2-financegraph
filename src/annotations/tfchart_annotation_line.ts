import { TFChartAnnotation } from './tfchart_annotation'
import { TFChartRect, TFChartPoint, TFChartRectMake } from '../tfchart_utils'
import { TFChart } from '../tfchart'

export class TFChartLine extends TFChartAnnotation {

    private bounding_box: TFChartRect;
    
    constructor(private lineColor: string, private start: TFChartPoint, private end: TFChartPoint) {
        super();
        this.bounding_box = TFChartRectMake(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.max(start.x, end.x), Math.max(start.y, end.y));
    }

    public render(bounds: TFChartRect, chart: TFChart) {
        if (this.bounding_box.intersectsRect(bounds)) {
            var ctx = chart.getDrawingContext();
            ctx.beginPath();
            ctx.moveTo(chart.pixelValueAtXValue(this.start.x), chart.pixelValueAtYValue(this.start.y));
            ctx.lineTo(chart.pixelValueAtXValue(this.end.x), chart.pixelValueAtYValue(this.end.y));
            ctx.strokeStyle = this.lineColor;
            ctx.stroke();
        }
    }
}
