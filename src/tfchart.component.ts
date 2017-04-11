import { Component, ViewChild, ElementRef, Input, Output, AfterViewInit, OnChanges, SimpleChange, EventEmitter } from '@angular/core';
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
export class TFChartComponent implements AfterViewInit, OnChanges {
    @Input('period') period: number;
    @Input('series') series: TFChartSeries;
    @Input('enableDebug') enableDebug: boolean;
    @Output('onRangeUpdate') onRangeUpdate: EventEmitter<TFChartRange> = new EventEmitter<TFChartRange>();

    @ViewChild("chartContainer") chartContainerRef: ElementRef;

    private chart: TFChart;

    ngAfterViewInit() {
        console.log("Initialising chart [period: " + this.period + "]");
        this.chart = new TFChart(this.chartContainerRef.nativeElement, this.series, this.period, (range) => {
            this.onRangeUpdate.emit(range);
        });
        this.chart.debug(this.enableDebug);
    }

    ngOnChanges(changes) {
        if (changes.period) {
            if (this.chart) {
                this.chart.setPeriod(this.period);
            }
        }
    }
}
