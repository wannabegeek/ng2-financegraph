import { Component, ViewChild, ElementRef, HostListener, EventEmitter, Input, Output, HostBinding } from '@angular/core';
import { TFChartSize, TFChartRangeMax, TFChartRange, TFChartRect, TFChartRectMake, TFChartPoint, TFChartPointMake } from './tfchart_utils'
import { TFChartRenderer } from './renderers/tfchart_renderer'
import { TFChartAnnotation } from './annotations/tfchart_annotation'
import { TFChartAxisFormatter } from './axis_formatters/tfchart_axis_formatter'
import { DateTimeAxisFormatter } from './axis_formatters/tfchart_datetimeaxis_formatter'
import { LinearAxisFormatter } from './axis_formatters/tfchart_linearaxis_formatter'
import { TFChartSeries } from './series/tfchart_series'
import { TFChart } from './tfchart'

export class Axis {
    public range: TFChartRange = new TFChartRange(0.0, 0.0);

    constructor(public formatter: TFChartAxisFormatter, public padding: number, public data_padding: number) {
    }
}

@Component({
    selector: 'tfchart',
    template: `
        <div #chartContainer style="height: 100%; width:100%; position: relative">
        </div>
      `,
    styles: [`
        crosshairCanvas {
            cursor: crosshair;
        }
    `],
    host: {'style': 'height: 100%'}
})
export class TFChartComponent {
    @Input('period') period: number;
    @Input('series') series: TFChartSeries;
    @Input('enableDebug') enableDebug: boolean;

    @ViewChild("chartContainer") chartContainerRef: ElementRef;

    private chart: TFChart;

    ngAfterViewInit() {
        console.log("Initialising chart [period: " + this.period + "]");
        this.chart = new TFChart(this.chartContainerRef.nativeElement, this.series, this.period);
        this.chart.debug(this.enableDebug);
    }


    // @HostListener('mousemove', ['$event'])
    // private onMouseMove(e: MouseEvent) {
    //     var ev = e ? e : window.event;
    //     let mouseX = ev.pageX - this.crosshairCanvas.offset().left;
    //     let mouseY = ev.pageY - this.crosshairCanvas.offset().top;

    //     if (this.isMouseDown) {
    //         let area = this.plotArea();
    //         let delta = -(this.drag_start - mouseX);
    //         this.pan(delta);
    //         this.drag_start = mouseX;
    //     }

    //     this.drawCrosshair(TFChartPointMake(mouseX, mouseY));

    //     return false;
    // }

    // @HostListener('mousedown', ['$event'])
    // private onMouseDown(e: MouseEvent) {
    //     let ev = e ? e : window.event;
    //     let mouseX = ev.pageX - this.crosshairCanvas.offset().left;
    //     let mouseY = ev.pageY - this.crosshairCanvas.offset().top;

    //     this.isMouseDown = true;
    //     this.drag_start = mouseX;
    //     this.crosshairCanvas.css('cursor', 'move');
    //     e.preventDefault();
    //     e.stopPropagation();
    //     return false;
    // }

    // @HostListener('mouseup', ['$event'])
    // private onMouseUp(e: MouseEvent) {
    //     this.isMouseDown = false;
    //     this.crosshairCanvas.css('cursor', 'crosshair');
    //     e.preventDefault();
    //     e.stopPropagation();
    //     return false;
    // }

    // @HostListener('mouseout', ['$event'])
    // private onMouseOut(e: MouseEvent) {
    //     this.removeCrosshair();
    //     this.isMouseDown = false;
    //     this.crosshairCanvas.css('cursor', 'crosshair');
    // }

    // @HostListener('mousewheel', ['$event'])
    // private onMouseWheelScroll(e) {
    //     var ev = e ? e : window.event;
    //     var deltaX = (e.wheelDeltaX || -e.detail);
    //     var deltaY = (e.wheelDeltaY || -e.detail);
    //     if (deltaX) {
    //         this.pan(deltaX, true);
    //     }
    //     if (deltaY) {
    //         var area = this.plotArea();
    //         this.zoom(deltaY, true);
    //     }
    //     this.updateVisible();
    //     this.redraw();

    //     let mouseX = ev.pageX - this.crosshairCanvas.offset().left;
    //     let mouseY = ev.pageY - this.crosshairCanvas.offset().top;
    //     this.drawCrosshair(TFChartPointMake(mouseX, mouseY));

    //     e.preventDefault();
    //     e.stopPropagation();
    //     return false;
    // }

    // @HostListener('touchup', ['$event'])
    // private onTouchMove(e) {
    //     var ev = e ? e : window.event;
    //     var touchX = e.targetTouches[0].pageX - this.crosshairCanvas.offset().left;
    //     if (e.targetTouches.length == 1) { // we are panning
    //         if (this.isTouchDown) { // however, the touch must be down to beable to move
    //             let area = this.plotArea();
    //             let delta = -(this.touch_start - touchX);
    //             this.pan(delta);
    //             this.touch_start = touchX;
    //         }
    //     } else if (e.targetTouches.length == 2) {
    //         let touchX_2 = e.targetTouches[1].pageX - this.crosshairCanvas.offset().left;
    //         let touch_delta = Math.abs(touchX_2 - touchX);
    //         // are we getting larger or smaller?
    //         this.zoom(2 * (touch_delta - this.touch_delta));
    //         this.touch_delta = touch_delta;
    //         this.updateVisible();
    //         this.redraw();
    //     }

    //     e.preventDefault();
    //     e.stopPropagation();
    //     return false;
    // }

    // @HostListener('touchup', ['$event'])
    // private onTouchDown(e) {
    //     var ev = e ? e : window.event;
    //     let len = e.targetTouches.length;
    //     let touchX = e.targetTouches[0].pageX - this.crosshairCanvas.offset().left;
    //     let touchY = e.targetTouches[0].pageY - this.crosshairCanvas.offset().top;

    //     this.touch_start = touchX;
    //     this.isTouchDown = true;

    //     if (len == 1) {
    //         this.drawCrosshair((touchX, touchY));
    //     } else {
    //         let touchX_2 = e.targetTouches[1].pageX - this.crosshairCanvas.offset().left;
    //         this.touch_delta = Math.abs(touchX_2 - touchX);
    //         this.removeCrosshair();
    //     }
    //     e.preventDefault();
    //     e.stopPropagation();
    //     return false;
    // }

    // @HostListener('touchup', ['$event'])
    // private onTouchUp(e) {
    //     this.isTouchDown = false;

    //     e.preventDefault();
    //     e.stopPropagation();
    //     return false;
    // }
}
