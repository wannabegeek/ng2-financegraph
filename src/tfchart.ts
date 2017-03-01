import { TFChartDateTimeRange, TFChartSize, TFChartRangeMax, TFChartRangeMake, TFChartRange, TFChartRect, TFChartRectMake, TFChartRectGetMaxY, TFChartPoint, TFChartPointMake } from './tfchart_utils'
import { TFChartRenderer } from './renderers/tfchart_renderer'
import { TFChartAnnotation } from './annotations/tfchart_annotation'
import { TFChartSeries } from './series/tfchart_series'
import { TFChartDataRequestType, TFChartDataController, DataOperation } from './tfchart_datacontroller'
import { TFChartContext } from './tfchart_context'

export class TFChart extends TFChartContext {
    private annotations: TFChartAnnotation[] = [];
    private bounds: TFChartRect = null;
    private visibleDataPoints: number = 0;
    private visibleOffset: number = 0;

    private isMouseDown: boolean = false;
    private dragStart: number = 0;

    private enableDebug: boolean = false;

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
        max_data_points: 500,
        space_right: 0.0,
        initial_data_points: 100,
        view_range: null,
        controller: null
    };

    public constructor(chartContainer: any, private series: TFChartSeries, private period: number, initialRange: TFChartRange) {
        super(chartContainer);
        this.series.getDataController().subscribe((operation: DataOperation) => {
            if (this.visibleDataPoints == 0) {
                this.visibleDataPoints = this.series.getDataController().getCachedDataSize();
            };

            if (operation.type == TFChartDataRequestType.PREPEND) {
                this.visibleOffset -= operation.count;
            }
            this.updateAxisRanges();
            this.redraw();
        });

        this.setPeriod(period);
        this.series.setPeriod(this.period);
        this.series.getDataController().requestData(initialRange, TFChartDataRequestType.APPEND);

        let ctx = this.getCrosshairContext();
        this.addEventListener("mousemove", (event) => {
            let location = this.translateMouseEvent(event);

            if (this.isMouseDown) {
                let delta = -(this.dragStart - location.x);
                this.pan(delta, false);
                this.dragStart = location.x;
            }

            this.drawCrosshair(location);

            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        this.addEventListener("mouseout", (event) => {
            this.clearCrosshairContext();
            this.isMouseDown = false;
            // this.crosshair_canvas.css('cursor', 'crosshair');
            return false;
        });

        this.addEventListener("mousedown", (event) => {
            let location = this.translateMouseEvent(event);

            this.isMouseDown = true;
            this.dragStart = location.x;

            // this.crosshair_canvas.css('cursor', 'move');
            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        this.addEventListener("mouseup", (event) => {
            this.isMouseDown = false;
            // this.crosshair_canvas.css('cursor', 'crosshair');

            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        this.addEventListener("mousewheel", (event) => {

            let deltaX = event.wheelDeltaX;
            let deltaY = event.wheelDeltaY;
            // console.log("dx: " + deltaX + " dy: " + deltaY);
            if (deltaX) {
                this.pan(deltaX, false);
            }
            if (deltaY) {
                this.zoom(deltaY, false);
            }

            this.drawCrosshair(this.translateMouseEvent(event));

            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        // ctx.addEventListener("mouseup", this.mouseUp, false);
    }

    public setPeriod(period: number) {
        this.period = period;
        this.series.setPeriod(this.period);
        this.redraw();
    }

    public debug(value: boolean) {
        this.enableDebug = value;
    }

    public reset() {
        this.visibleOffset = 0.0;
        this.visibleDataPoints = this.options.initial_data_points;
        if (this.series.getDataController().hasData()) {
            this.updateAxisRanges();
            this.redraw();
        }
    }

    public pixelValueAtXValue(x: number): number {
        let area = this.drawableArea();
        let ppdp = area.size.width / this.visibleDataPoints;
        return ((x - this.series.getDataController().getCachedRange().position) / this.period) * ppdp + (this.visibleOffset * ppdp);
    }

    public pixelValueAtYValue(y: number): number {
        let area = this.drawableArea();
        let y_ratio = this.y_axis.range.ratioForSize(area.size.height);
        return area.origin.y + area.size.height - ((y - this.y_axis.range.position) * y_ratio);
    }

    public dataValueAtXLocation(x: number): number {
        let visibleRange = this.visibleDataRange(this.visibleOffset, this.visibleDataPoints);
        let area = this.drawableArea();
        let ppdp = area.size.width / this.visibleDataPoints;
        return visibleRange.position + ((x / ppdp) * this.period);
    }

    public dataValueAtYLocation(y: number): number {
        let area = this.drawableArea();
        let y_ratio = this.y_axis.range.ratioForSize(area.size.height);
        return ((TFChartRectGetMaxY(area) - y) / y_ratio) + this.y_axis.range.position;
    }

    public valueAtPixelLocation(point: TFChartPoint): TFChartPoint {
        return TFChartPointMake(
                    this.dataValueAtXLocation(point.x),
                    this.dataValueAtYLocation(point.y)
                );
    }

    public addAnnotation(annotation: TFChartAnnotation) {
        this.annotations.push(annotation);
        this.drawAnnotations();
    }

    public removeAnnotation(annotation: TFChartAnnotation) {
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
        if (this.enableDebug) {
            this.renderDebugInfo();
        }

                    // console.log("We have data for:\n\t" + TFChartDateTimeRange(this.series.getDataController().getCachedRange()) 
                    //         + "\n but showing:\n\t" + TFChartDateTimeRange(this.visibleDataRange(this.visibleOffset, this.visibleDataPoints))
                    //         + "\n axis:\n\t" + TFChartDateTimeRange(this.x_axis.range)
                    //         + "\n offset: " + this.visibleOffset + " count: " + this.visibleDataPoints
                    //     );

    }

    public pan(delta: number, preventRedraw: boolean) {
        let area = this.drawableArea();
        this.visibleOffset = this.checkViewableOffsetLimits(this.visibleDataPoints, this.visibleOffset + ((delta / area.size.width) * this.visibleDataPoints));

        if (preventRedraw != true) {
            this.updateAxisRanges();
            this.redraw();
        }
        this.checkDataAvailable();
    }

    public zoom(delta: number, preventRedraw: boolean) {
        let area = this.drawableArea();
        let move = (delta / area.size.width) * this.visibleDataPoints;
        this.visibleDataPoints = this.checkViewableRangeLimits(this.visibleDataPoints + move);
        this.visibleOffset = this.checkViewableOffsetLimits(this.visibleDataPoints, this.visibleOffset + move);

        if (preventRedraw != true) {
            this.updateAxisRanges();
            this.redraw();
        }
        this.checkDataAvailable();
    }

    public log() {
        let area = this.plotArea();
        console.log("Canvas Size" + this.getCanvasSize());
        console.log("Plot Area" + area.origin.x + " x " + area.origin.y + " --> " + area.size.width + ", " + area.size.height);
    }

    public setVisibleRange(range: TFChartRange) {
        let availableRange = this.series.getDataController().getCachedRange();

        this.visibleDataPoints = range.span / this.period;
        this.visibleOffset = (availableRange.position - range.position) / this.period;

        if (range.position < availableRange.position && this.series.getDataController().canSupplyData(TFChartDataRequestType.PREPEND)) {
            let start = Math.min(range.position, availableRange.position);
            let r = new TFChartRange(start, availableRange.position - start);
            this.series.getDataController().requestData(r, TFChartDataRequestType.PREPEND);
        } else if (TFChartRangeMax(range) > TFChartRangeMax(availableRange) && this.series.getDataController().canSupplyData(TFChartDataRequestType.APPEND)) {
            let start = Math.max(range.position, availableRange.position);
            let r = new TFChartRange(start, TFChartRangeMax(range) - start);
            this.series.getDataController().requestData(r, TFChartDataRequestType.APPEND);
        } else {
            this.visibleOffset = this.checkViewableOffsetLimits(this.visibleDataPoints, ((availableRange.position - range.position) / this.period));

            this.updateAxisRanges();
            this.redraw();        
        }
    }

    ////////////// END PUBLIC METHODS /////////////

    protected reflow() {
        super.reflow();
        this.bounds = null;
        if (this.series.getDataController().hasData()) {
            this.updateAxisRanges();
            this.redraw();
        }
    }

    private checkDataAvailable() {
        // let range: TFChartRange;
        let availableRange = this.series.getDataController().getCachedRange();
        let visibleRange = this.visibleDataRange(this.visibleOffset, this.visibleDataPoints);

        if (this.visibleOffset > 0.0 && this.series.getDataController().canSupplyData(TFChartDataRequestType.PREPEND)) {
            let startX = availableRange.position - this.x_axis.range.span;
            let range =  new TFChartRange(startX, availableRange.position - startX - this.period);
            this.series.getDataController().requestData(range, TFChartDataRequestType.PREPEND);
        } else if (this.visibleDataPoints - this.visibleOffset > this.series.getDataController().getCachedDataSize() && this.series.getDataController().canSupplyData(TFChartDataRequestType.APPEND)) {
            let range =  new TFChartRange(TFChartRangeMax(availableRange) + this.period, this.x_axis.range.span)
            this.series.getDataController().requestData(range, TFChartDataRequestType.APPEND);
        }
    }

    private checkViewableRangeLimits(visibleDataPoints: number): number {
        return Math.min(
                    Math.max(visibleDataPoints, this.options.min_data_points),
                    this.options.max_data_points
                );
    }

    private checkViewableOffsetLimits(visibleDataPoints: number, visibleOffset: number): number {
        let result: number;
        let area = this.drawableArea();
        let data_points = this.series.getDataController().getCachedDataSize();
        if (visibleOffset > 0.0) {
            result = Math.min(visibleOffset, visibleDataPoints / 2.0);
        } else {
            result = Math.max(visibleOffset, -(data_points - (visibleDataPoints / 2.0)));
        }
        return result;
    }

    private periodFloor(value: number): number {
        return value - (value % this.period);
    }

    private periodCeil(value: number): number {
        return value - (value % this.period) + this.period;
    }

    private chartBounds(): TFChartRect {
        let horizontalRange = this.visibleDataRange(this.visibleOffset, this.visibleDataPoints);
        let verticalRange = this.series.getVerticalRangeForHorizontal(horizontalRange);

        this.bounds = TFChartRectMake(
                                horizontalRange.position, 
                                verticalRange.position,
                                TFChartRangeMax(horizontalRange),
                                TFChartRangeMax(verticalRange)
                            );

        return this.bounds;
    }

    /**
     * Get the range in terms of data space for the viewport
     */
    private visibleDataRange(visibleOffset: number, visibleDataPoints: number): TFChartRange {
        let area = this.drawableArea();
        let dataController = this.series.getDataController();
        let availableRange = dataController.getCachedRange();

        let ppdp = area.size.width / this.visibleDataPoints;
        let offset = this.visibleOffset * this.period;
        let start_x = this.periodFloor(availableRange.position - offset + (this.period / 2.0));
        let end_x = this.periodCeil(availableRange.position - offset - (this.period / 2.0) + ((area.size.width / ppdp) * this.period));

        return TFChartRangeMake(start_x, end_x - start_x)
    }

    private updateAxisRanges() {
        this.x_axis.range = this.visibleDataRange(this.visibleOffset, this.visibleDataPoints);
        this.y_axis.range = this.series.getVerticalRangeForHorizontal(this.x_axis.range);
    }

    /**
     * Project the chart onto the viewport using the renderer supplied by the series
     */
    private drawPlot() {
        let area = this.plotArea();
        let ctx = this.getDrawingContext();
        ctx.save();
        ctx.rect(area.origin.x, area.origin.y, area.size.width, area.size.height);
        ctx.clip();
        this.series.render(this.visibleDataRange(this.visibleOffset, this.visibleDataPoints), this);
        ctx.restore();
    }

    /**
     * Project any annotations onto the viewport
     */
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

    /**
     * Draw the chart axis with tick marks
     */
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

    /**
     * Draw a crosshair at the current 'point' with values reflected on the axis
     */
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

    private renderDebugInfo() {
        let area = this.plotArea();
        let ctx = this.getDrawingContext();
        // ctx.save();
        ctx.font = "10px Arial";
        ctx.fillStyle = this.options.theme.axisColor;
        ctx.fillText("Offset: " + this.visibleOffset, 15, 15);
        ctx.fillText("Span: " + this.visibleDataPoints, 15, 28);
        ctx.fillText("Data Points: " + this.series.getDataController().getCachedDataSize(), 15, 41);
        // ctx.restore();

    }
    // private onResize() {
    //     this.reflow();
    // }
}