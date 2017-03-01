import { TFChartAnnotation } from './tfchart_annotation'
import { TFChartRect, TFChartPoint, TFChartRectGetMaxY, TFChartRectGetMinY, TFChartRectGetMaxX, TFChartRectMake } from '../tfchart_utils'
import { TFChart } from '../tfchart'

export class TFChartPolygon extends TFChartAnnotation {

    private bounding_box: TFChartRect;
    private points: TFChartPoint[] = []

    constructor(private borderColor: string, private fillColor: string) {
        super();
    }

    add(point: TFChartPoint) {
        if (this.points.length == 0) {
            this.bounding_box = TFChartRectMake(point.x, point.y, 0.0, 0.0);
        } else {
            this.bounding_box.origin.x = Math.min(this.bounding_box.origin.x, point.x);
            this.bounding_box.origin.y = Math.min(this.bounding_box.origin.y, point.y);
            this.bounding_box.size.width = Math.max(this.bounding_box.size.width, point.x - this.bounding_box.origin.x);
            this.bounding_box.size.height = Math.max(this.bounding_box.size.height, point.y - this.bounding_box.origin.y);
        }
        this.points.push(point);
    }


    public render(bounds: TFChartRect, chart: TFChart) {
        if (this.points.length > 0 && this.bounding_box.intersectsRect(bounds)) {
            var ctx = chart.getDrawingContext();
            ctx.beginPath();
            ctx.moveTo(Math.round(chart.pixelValueAtXValue(this.points[0].x)) + 0.5, Math.round(chart.pixelValueAtYValue(this.points[0].y)) + 0.5);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(Math.round(chart.pixelValueAtXValue(this.points[i].x)) + 0.5, Math.round(chart.pixelValueAtYValue(this.points[i].y)) + 0.5);
            }
            ctx.closePath();
            if (typeof this.fillColor !== 'undefined') {
                ctx.fillStyle = this.fillColor;
                ctx.fill();
            }
            if (typeof this.borderColor !== 'undefined') {
                ctx.strokeStyle = this.borderColor;
                ctx.stroke();
            }
        }
    }
}