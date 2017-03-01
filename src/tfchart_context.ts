import { TFChartSize, TFChartSizeMake, TFChartRangeMax, TFChartRange, TFChartRect, TFChartRectMake, TFChartPoint, TFChartPointMake } from './tfchart_utils';
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
    private chartCanvas: any;
    private crosshairCanvas: any;

    private context: any;
    private axis_context: any;

    private drawable_area: TFChartRect = null;
    private plot_area: TFChartRect = null;

    protected x_axis: Axis = new Axis(new DateTimeAxisFormatter(), 70.0, 0.0);
    protected y_axis: Axis = new Axis(new LinearAxisFormatter(4), 30.0, 20.0);

    public constructor(private chartContainer: any) {
        this.chartCanvas = document.createElement('canvas');
        this.chartCanvas.id = 'chartCanvas';
        this.chartCanvas.style.position = 'absolute';
        this.chartCanvas.style.left = '0';
        this.chartCanvas.style.top = '0';
        this.chartCanvas.style.width = '100%';
        this.chartCanvas.style.height = '100%';
        chartContainer.appendChild(this.chartCanvas);

        this.crosshairCanvas = document.createElement('canvas');
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
            self.setCanvasSize(TFChartSizeMake(chartContainer.offsetWidth, chartContainer.offsetHeight));
        });

        // this.setCanvasSize(TFChartSizeMake(chartContainer.offsetWidth, chartContainer.offsetHeight));
        this.chartCanvas.width = chartContainer.offsetWidth;
        this.chartCanvas.height = chartContainer.offsetHeight;
        this.crosshairCanvas.width = chartContainer.offsetWidth;
        this.crosshairCanvas.height = chartContainer.offsetHeight;
    }

    protected setCanvasSize(size: TFChartSize) {
        this.chartCanvas.width = size.width;
        this.chartCanvas.height = size.height;
        this.crosshairCanvas.width = size.width;
        this.crosshairCanvas.height = size.height;
        this.reflow();
    }

    public addEventListener(eventType: string, handler: MouseHandler) {
        this.crosshairCanvas.addEventListener(eventType, handler, this);    
    }

    public translateMouseEvent(event: MouseEvent): TFChartPoint {
        let mouseX = event.pageX - this.chartContainer.offsetLeft;
        let mouseY = event.pageY - this.chartContainer.offsetTop;

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

    public getDrawingContext(): any {
        return this.context;
    }

    public getCrosshairContext(): any {
        return this.axis_context;
    }

    public doesXValueIntersectVisible(x: number): boolean {
        return this.x_axis.range.intersects(x);
    }

    public drawableArea(): TFChartRect {
        if (this.drawable_area == null) {
            let width = Math.round(this.chartCanvas.width - this.x_axis.padding) + 0.5 - (this.x_axis.data_padding * 2);
            let height = Math.round(this.chartCanvas.height - this.y_axis.padding) + 0.5 - (this.y_axis.data_padding * 2);
            this.drawable_area = TFChartRectMake(this.x_axis.data_padding, this.y_axis.data_padding, width, height);
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