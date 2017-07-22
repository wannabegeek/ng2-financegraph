import { TFChartSize, TFChartSizeMake, TFChartRangeMax, TFChartRange, TFChartRect, TFChartRectMake, TFChartPoint, TFChartPointMake, TFChartRectInset } from './tfchart_utils';
import { Axis } from './axis_formatters/tfchart_axis_formatter';
import { DateTimeAxisFormatter } from './axis_formatters/tfchart_datetimeaxis_formatter';
import { LinearAxisFormatter } from './axis_formatters/tfchart_linearaxis_formatter';
// import * as ElementQueries from 'css-element-queries';
/// <reference path="../typings/modules/element-resize-event/index.d.ts" />
// import { elementResizeEvent } from 'element-resize-event';
let elementResizeEvent = require('element-resize-event');

export interface MouseHandler {
    (event: WheelEvent): boolean;
}

export abstract class TFChartContext {
    private chartCanvas: HTMLCanvasElement;
    private crosshairCanvas: HTMLCanvasElement;

    private context: CanvasRenderingContext2D;
    private axis_context: CanvasRenderingContext2D;

    private drawable_area: TFChartRect = null;
    private plot_area: TFChartRect = null;

    protected x_axis: Axis = new Axis(new DateTimeAxisFormatter(), 70.0, 0.0);
    protected y_axis: Axis = new Axis(new LinearAxisFormatter(4), 30.0, 20.0);

    public constructor(private chartContainer: HTMLDivElement) {
        this.chartCanvas = <HTMLCanvasElement>document.createElement('canvas');
        this.chartCanvas.id = 'chartCanvas';
        this.chartCanvas.style.position = 'absolute';
        this.chartCanvas.style.left = '0';
        this.chartCanvas.style.top = '0';
        this.chartCanvas.style.width = '100%';
        this.chartCanvas.style.height = '100%';
        chartContainer.appendChild(this.chartCanvas);

        this.crosshairCanvas = <HTMLCanvasElement>document.createElement('canvas');
        this.crosshairCanvas.id = 'crosshairCanvas';
        this.crosshairCanvas.style.position = 'absolute';
        this.crosshairCanvas.style.left = '0';
        this.crosshairCanvas.style.top = '0';
        this.crosshairCanvas.style.width = '100%';
        this.crosshairCanvas.style.height = '100%';
        this.crosshairCanvas.style.cursor = 'crosshair';
        chartContainer.appendChild(this.crosshairCanvas);

        this.context = this.chartCanvas.getContext('2d');
        this.axis_context = this.crosshairCanvas.getContext('2d');

        let self = this;
        elementResizeEvent(chartContainer, function() {
            self.setCanvasSizeAndReflow(TFChartSizeMake(chartContainer.offsetWidth, chartContainer.offsetHeight));
        });

        this.setCanvasSize(TFChartSizeMake(chartContainer.offsetWidth, chartContainer.offsetHeight));
    }

    protected setCanvasSizeAndReflow(size: TFChartSize) {
        this.setCanvasSize(size);
        this.reflow();
    }

    private setCanvasSize(size: TFChartSize) {
        this.chartCanvas.width = size.width;
        this.chartCanvas.height = size.height;
        this.crosshairCanvas.width = size.width;
        this.crosshairCanvas.height = size.height;
    }

    public addEventListener(eventType: string, handler: MouseHandler) {
        this.crosshairCanvas.addEventListener(eventType, handler, true);    
    }

    public translateMouseEvent(event: MouseEvent): TFChartPoint {
        let mouseX = event.offsetX - this.crosshairCanvas.offsetLeft;
        let mouseY = event.offsetY - this.crosshairCanvas.offsetTop;

        return TFChartPointMake(mouseX, mouseY);
    }

    public getCanvasSize(): TFChartSize {
        return new TFChartSize(this.chartCanvas.width, this.chartCanvas.height);
    }

    public clear() {
        this.clearChartContext();
        this.clearCrosshairContext();
    }

    public clearChartContext() {
        let width = this.chartCanvas.width;
        let height = this.chartCanvas.height;
        this.context.clearRect(0.0, 0.0, width, height);
    }

    public clearCrosshairContext() {
        let width = this.chartCanvas.width;
        let height = this.chartCanvas.height;
        this.axis_context.clearRect(0.0, 0.0, width, height);
    }

    public getDrawingContext(): CanvasRenderingContext2D {
        return this.context;
    }

    public getCrosshairContext(): CanvasRenderingContext2D {
        return this.axis_context;
    }

    public doesXValueIntersectVisible(x: number): boolean {
        return this.x_axis.range.intersects(x);
    }

    public drawableArea(): TFChartRect {
        if (this.drawable_area == null) {            
            this.drawable_area = TFChartRectInset(TFChartRectMake(
                                                    0, 
                                                    0, 
                                                    this.chartCanvas.width, 
                                                    this.chartCanvas.height), 
                                                this.x_axis.padding, 
                                                this.y_axis.padding);
        }

        return this.drawable_area;
    }

    public plotArea(): TFChartRect {
        if (this.plot_area == null) {
            // cache the value
            let width = Math.round(this.chartCanvas.width - this.x_axis.padding) + 0.5 ;
            let height = Math.round(this.chartCanvas.height - this.y_axis.padding) + 0.5;
            this.plot_area = new TFChartRect(new TFChartPoint(0.0, 0.0), new TFChartSize(width, height));
        }

        return this.plot_area;
    }

    protected reflow() {
        this.plot_area = null;
        this.drawable_area = null;
    }
}