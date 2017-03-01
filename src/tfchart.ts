import { TFChartSize, TFChartRangeMax, TFChartRange, TFChartRect, TFChartRectMake, TFChartPoint, TFChartPointMake } from './tfchart_utils'
import { TFChartRenderer } from './tfchart_renderer'
import { TFChartAnnotation } from './tfchart_annotation'
import { TFChartDataRequestType, TFChartDataController } from './tfchart_datacontroller'
import { TFChartContext } from './tfchart_context'

export class TFChart extends TFChartContext {
    private renderer: TFChartRenderer;
    private period: number;
    private dataController: TFChartDataController;

    private annotations: TFChartAnnotation[] = [];
    private bounds: TFChartRect = null;
    private visible_data_points: number = 0;
    private visible_offset: number = 0;

    private options = {
        theme: {
            backgroundColor: "#FFFFFF",
            axisColor: "#888888",
            gridColor: "#EEEEEE",
            crosshairTextColor: "#FFFFFF",
            crosshairBackground: '#555555',
            crosshairColor: "#999999"
        },
        min_data_points: 15,
        max_data_points: 1000,
        space_right: 0.0,
        initial_data_points: 100,
        view_range: null,
        controller: null
    };

    public constructor(chartContainer: any) {
        super(chartContainer);
    }

    public setPeriod(period: number) {
        this.period = period;
        this.dataController.setPeriod(this.period);
    }

    public setVisibleRange(range: TFChartRange) {
        let area = this.drawableArea();
        
        this.visible_data_points = range.span / this.period;

        // number of pixels per time unit (across the whole range)
        let ratio = area.size.width / this.visible_data_points;
        let availableRange = this.dataController.getCachedRange();

        if (range.position < availableRange.position && this.dataController.canSupplyData(TFChartDataRequestType.PREPEND)) {
            let start = Math.min(range.position, availableRange.position);
            let r = new TFChartRange(start, availableRange.position - start);
            this.dataController.requestData(r, TFChartDataRequestType.PREPEND);
        } else if (TFChartRangeMax(range) > TFChartRangeMax(availableRange) && this.dataController.canSupplyData(TFChartDataRequestType.APPEND)) {
            let start = Math.max(range.position, availableRange.position);
            let r = new TFChartRange(start, TFChartRangeMax(range) - start);
            this.dataController.requestData(r, TFChartDataRequestType.PREPEND);
        } else {
            this.visible_offset = ((availableRange.position - range.position) / this.period);

            this.checkViewableLimits();
            this.updateVisible();
            this.redraw();        
        }
    }

    public reset() {
        this.visible_offset = 0.0;
        this.visible_data_points = this.options.initial_data_points;
        if (this.dataController.hasData()) {
            this.updateVisible();
            this.redraw();
        }
    }

    public reflow() {
        // var width = this.container.width();
        // var height = this.container.height();
        // setCanvasSize(this.chart_canvas_name, width, height);
        // setCanvasSize(this.crosshair_canvas_name, width, height);
        // this.plot_area = null;
        // this.drawable_area = null;
        // this.bounds = null;
        // if (!isNullOrUndefined(this.data_controller.data) && this.data_controller.data.length != 0) {
        //     this.updateVisible();
        //     this.redraw();
        // }
    }

    public pixelValueAtXValue(x: number): number {
        let area = this.drawableArea();
        let ppdp = area.size.width / this.visible_data_points;
        return ((x - this.dataController.getCachedRange().position) / this.period) * ppdp + (this.visible_offset * ppdp);
    }

    public pixelValueAtYValue(y: number): number {
        let area = this.drawableArea();
        let y_ratio = this.y_axis.range.ratioForSize(area.size.height);
        return area.origin.y + area.size.height - ((y - this.y_axis.range.position) * y_ratio);
    }

    public valueAtPixelLocation(point: TFChartPoint): TFChartPoint {
        let area = this.drawableArea();
        let y_ratio = this.y_axis.range.ratioForSize(area.size.height);
        let ppdp = area.size.width / this.visible_data_points;
        let x_value = ((point.x / ppdp) - this.visible_offset) * this.period +  this.dataController.getCachedRange().position;
        return TFChartPointMake(x_value, (((area.size.height + area.origin.y) - point.y) / y_ratio) + this.y_axis.range.position);
    }

    public addAnnotation(annotation) {
        this.annotations.push(annotation);
        this.drawAnnotations();
    }

    public removeAnnotation(annotation) {
        let index = this.annotations.indexOf(annotation);
        if (index > -1) {
            this.annotations.splice(index, 1);
            this.drawAnnotations();
        }
    }

    public removeAnnotations() {
        this.annotations.splice(0, this.annotations.length)
    }

    public redraw() {
        this.clear();
        this.drawAxis();
        this.drawPlot();
        this.drawAnnotations();
    }

    public pan(delta: number, preventRedraw: boolean) {
        let area = this.drawableArea();

        this.visible_offset += (delta / area.size.width) * this.visible_data_points;
        this.checkViewableLimits();

        if (preventRedraw != true) {
            this.updateVisible();
            this.redraw();
        }
        this.checkDataAvailable();
    }

    public zoom(delta: number, preventRedraw: boolean) {
        let area = this.drawableArea();
        let move = (delta / area.size.width) * this.visible_data_points;
        this.visible_data_points += move;
        if (this.checkViewableRangeLimits()) {
            this.visible_offset += move;
            this.checkViewableOffsetLimits();
        }

        if (preventRedraw != true) {
            this.updateVisible();
            this.redraw();
        }
        this.checkDataAvailable();
    }

    public log() {
        let area = this.plotArea();
        console.log("Canvas Size" + this.getCanvasSize());
        console.log("Plot Area" + area.origin.x + " x " + area.origin.y + " --> " + area.size.width + ", " + area.size.height);
    }

    ////////////// END PUBLIC METHODS /////////////

    private checkDataAvailable() {
        let availableRange = this.dataController.getCachedRange();
        if (this.visible_offset > 0.0 && this.dataController.canSupplyData(TFChartDataRequestType.PREPEND)) {
            let start_x = this.x_axis.range.position - this.x_axis.range.span;
            let range =  new TFChartRange(start_x, availableRange.position - start_x - this.period);
            this.dataController.requestData(range, TFChartDataRequestType.PREPEND);
        }

        if (this.visible_data_points - this.visible_offset > this.dataController.getCachedDataSize() && this.dataController.canSupplyData(TFChartDataRequestType.APPEND)) {
            let range =  new TFChartRange(TFChartRangeMax(availableRange) + this.period, this.x_axis.range.span)
            this.dataController.requestData(range, TFChartDataRequestType.APPEND);
        }
    }

    public reevaluateVerticalRange(data) {
        let min = this.y_axis.range.position;
        let max = min + this.y_axis.range.span;
        let self = this;
        for (let point of data) {
            if (point.timestamp > TFChartRangeMax(self.x_axis.range)) {
                return;
            } else if (point.timestamp >= self.x_axis.range.position) {
                max = Math.max(max, point.high);
                min = Math.min(min, point.low);
            }
        }
        if (max !== min) {
            let y_range = new TFChartRange(min, max - min);
            if (!this.y_axis.range.equal(y_range)) {
                this.y_axis.range = y_range;
                if (this.options.view_range !== null) {
                    this.options.view_range(this, this.x_axis.range, this.y_axis.range);
                }
            }
        }
    };

    private checkViewableRangeLimits(): boolean {
        let result = Math.max(this.visible_data_points, this.options.min_data_points);
        result = Math.min(result, this.options.max_data_points);

        let restricted = (this.visible_data_points === result);
        this.visible_data_points = result;
        return restricted;
    }

    private checkViewableOffsetLimits(): boolean {
        let result: number;
        let area = this.drawableArea();
        let data_points = this.dataController.getCachedDataSize();
        if (this.visible_data_points >= data_points) {
            result = Math.max(this.visible_offset, 1.0);
            result = Math.min(result, (this.visible_data_points - data_points));
        } else {
            if (this.visible_offset > 0.0) {
                result = Math.min(this.visible_offset, this.visible_data_points / 2.0);
            } else {
                result = Math.max(this.visible_offset, -(data_points - (this.visible_data_points / 2.0)));
            }
        }
        let restricted = (this.visible_offset === result);
        this.visible_offset = result;
        return restricted;
    }

    private checkViewableLimits(): boolean {
        return this.checkViewableRangeLimits() && this.checkViewableOffsetLimits();
    }

    private periodFloor(value: number): number {
        return value - (value % this.period);
    }

    private periodCeil(value: number): number {
        return value - (value % this.period) + this.period;
    }

    private chartBounds(): TFChartRect {
        let tl = this.valueAtPixelLocation(TFChartPointMake(this.x_axis.data_padding, this.y_axis.data_padding));
        let canvasSize = this.getCanvasSize()
        let br = this.valueAtPixelLocation(TFChartPointMake(
                                                Math.round(canvasSize.width - this.x_axis.padding) + 0.5 - (this.x_axis.data_padding * 2), 
                                                Math.round(canvasSize.height - this.y_axis.padding) + 0.5 - (this.y_axis.data_padding * 2))
                                            );

        this.bounds = TFChartRectMake(tl.x, br.y, br.x - tl.x, tl.y - br.y);

        return this.bounds;
    }

    private updateVisible() {
        let area = this.drawableArea();
        let availableRange = this.dataController.getCachedRange();

        let ppdp = area.size.width / this.visible_data_points;
        let offset = this.visible_offset * this.period;
        let start_x = this.periodFloor(availableRange.position - offset + (this.period / 2.0));
        let end_x = this.periodCeil(availableRange.position - offset - (this.period / 2.0) + ((area.size.width / ppdp) * this.period));

        let min = null;
        let max = null;
        let data = this.dataController.getCachedData();
        for (let point of data) {
            if (point.timestamp > end_x) {
                return;
            } else if (point.timestamp >= start_x) {
                max = (max == null) ? point.high : Math.max(max, point.high);
                min = (min == null) ? point.low : Math.min(min, point.low);
            }
        }

        this.x_axis.range = new TFChartRange(start_x, end_x - start_x);
        if (max !== min) {
            this.y_axis.range = new TFChartRange(min, max - min);
        }
        if (this.options.view_range !== null) {
            this.options.view_range(this, this.x_axis.range, this.y_axis.range);
        }
    }

    private drawPlot() {
        if (this.dataController.hasData()) {
            let area = this.plotArea();
            let ctx = this.getDrawingContext();
            ctx.save();
            ctx.rect(area.origin.x, area.origin.y, area.size.width, area.size.height);
            ctx.clip();
            // TODO: should we only give the renderer the visible data?
            this.renderer.render(this.dataController.getCachedData(), this);
            ctx.restore();
        }
    }

    private drawAnnotations() {
        if (this.annotations.length > 0) {
            let bounds = this.plotArea();
            let ctx = this.getDrawingContext();
            ctx.save();
            ctx.rect(bounds.origin.x, bounds.origin.y, bounds.size.width, bounds.size.height);
            ctx.clip();
            bounds = this.chartBounds();
            for (let annotation of this.annotations) {
                annotation.render(bounds, this);
            }
            ctx.restore();
        }
    }

    private drawAxis() {
        let ctx = this.getDrawingContext();

        let area = this.plotArea();

        ctx.strokeStyle = this.options.theme.axisColor;
        
        ctx.beginPath();    
        ctx.moveTo(area.origin.x, area.size.height);
        ctx.lineTo(area.origin.x + area.size.width, area.size.height);
        ctx.lineTo(area.origin.x + area.size.width, area.origin.y);
        ctx.stroke();

        let y_ticks = this.y_axis.formatter.calculateAxisTicks(this.y_axis, 10);
        ctx.font = "bold 10px Arial";

        for (let y_value of y_ticks) {
            let value = Math.round(this.pixelValueAtYValue(y_value)) + 0.5;
            if (value < area.size.height + area.origin.y) {
                ctx.strokeStyle = this.options.theme.axisColor;
                ctx.beginPath();
                ctx.moveTo(area.origin.x + area.size.width, value);
                ctx.lineTo(area.origin.x + area.size.width + 5, value);
                ctx.stroke();

                ctx.strokeStyle = this.options.theme.gridColor;
                ctx.beginPath();
                ctx.moveTo(area.origin.x, value);
                ctx.lineTo(area.origin.x + area.size.width, value);
                ctx.stroke();

                ctx.fillStyle = this.options.theme.axisColor;
                let y_text = this.y_axis.formatter.format(y_value, this.x_axis, false);
                if (y_text.is_key == true) {
                    ctx.font = "bold 10px Arial";
                }
                let text_size = ctx.measureText(y_text.text);
                ctx.fillText(y_text.text, area.origin.x + area.size.width + 5.0, value + 2.0 /* font size */);
                if (y_text.is_key == true) {
                    ctx.font = "10px Arial";
                }
            }
        }


        let x_ticks = this.x_axis.formatter.calculateAxisTicks(this.x_axis, 15);
        for (let x_value of x_ticks) {
            let value = Math.round(this.pixelValueAtXValue(x_value)) + 0.5;
            if (value < area.size.width + area.origin.x) {
                ctx.strokeStyle = this.options.theme.axisColor;
                ctx.beginPath();
                ctx.moveTo(value, area.origin.y + area.size.height);
                ctx.lineTo(value, area.origin.y + area.size.height + 5);
                ctx.stroke();

                ctx.strokeStyle = this.options.theme.gridColor;
                ctx.beginPath();
                ctx.moveTo(value, area.origin.y);
                ctx.lineTo(value, area.origin.y + area.size.height);
                ctx.stroke();

                ctx.fillStyle = this.options.theme.axisColor;
                let x_text = this.x_axis.formatter.format(x_value, this.x_axis, false);
                if (x_text.is_key == true) {
                    ctx.font = "bold 10px Arial";
                }
                let text_size = ctx.measureText(x_text.text);
                ctx.fillText(x_text.text, value - (text_size.width / 2.0), area.origin.y + area.size.height + 15.0);
                if (x_text.is_key == true) {
                    ctx.font = "10px Arial";
                }
            }
        }
    }

    private drawCrosshair(point: TFChartPoint) {
        let area = this.plotArea();

        let ctx = this.getCrosshairContext();

        ctx.save();
        this.clearCrosshairContext();

        if (point.x >= 0.0 && point.x <= area.origin.x + area.size.width && point.y >= 0.0 && point.y <= area.origin.y + area.size.height) {
            point.x = Math.round(point.x) + 0.5;
            point.y = Math.round(point.y) + 0.5;

            ctx.setLineDash([4, 2]);
            ctx.strokeStyle = this.options.theme.crosshairColor;
            ctx.beginPath();  
            ctx.moveTo(point.x, area.origin.y);
            ctx.lineTo(point.x, area.size.height + area.origin.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(area.origin.x, point.y);
            ctx.lineTo(area.size.width + area.origin.x, point.y);
            ctx.stroke();

            ctx.restore();

            ctx.font = "10px Arial";

            // draw the value pills at the bottom and right showing the value
            let value = this.valueAtPixelLocation(point);
            ctx.fillStyle = this.options.theme.crosshairBackground;

            // right
            ctx.save();
            let y_text = this.y_axis.formatter.format(value.y, this.y_axis, true);
            let text_size = ctx.measureText(y_text.text);

            let verticalIndicatorSize = 8
            ctx.beginPath();
            ctx.moveTo(area.size.width + area.origin.x, point.y);
            ctx.lineTo(area.size.width + area.origin.x + 5, point.y - verticalIndicatorSize);
            ctx.lineTo(area.size.width + area.origin.x + text_size.width + 10, point.y - verticalIndicatorSize);
            ctx.lineTo(area.size.width + area.origin.x + text_size.width + 10, point.y + verticalIndicatorSize);
            ctx.lineTo(area.size.width + area.origin.x + 5, point.y + verticalIndicatorSize);
            ctx.fill();
            ctx.fillStyle = this.options.theme.crosshairTextColor;

            ctx.fillText(y_text.text, area.size.width + area.origin.x + 5, point.y + 3);
            ctx.restore();

            // bottom
            ctx.save();
            let x_text = this.x_axis.formatter.format(this.periodFloor(value.x + (this.period / 2.0)), this.x_axis, true);
            text_size = ctx.measureText(x_text.text);
            let horizontalIndicatorSize = text_size.width + 10;

            ctx.beginPath();
            ctx.moveTo(point.x - (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5);
            ctx.lineTo(point.x - 5, area.size.height + area.origin.y + 5);
            ctx.lineTo(point.x, area.size.height + area.origin.y);
            ctx.lineTo(point.x + 5, area.size.height + area.origin.y + 5);
            ctx.lineTo(point.x + (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5);
            ctx.lineTo(point.x + (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5 + verticalIndicatorSize * 2);
            ctx.lineTo(point.x - (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5 + verticalIndicatorSize * 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = this.options.theme.crosshairTextColor;
            ctx.fillText(x_text.text, point.x - (horizontalIndicatorSize / 2.0) + 5, area.size.height + area.origin.y + 3 + verticalIndicatorSize + 5.0 /* font size */);
            ctx.restore();
        }
    }

    private onResize() {
        this.reflow();
    }
}