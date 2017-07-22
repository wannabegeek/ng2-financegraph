import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TFChartComponent } from './tfchart.component';
export { TFChart } from './tfchart';

export { TFChartDataSupplier, RequestResults } from './tfchart_datasupplier';

export { TFChartAnnotation } from './annotations/tfchart_annotation';
export { TFChartLine } from './annotations/tfchart_annotation_line';
export { TFChartHorizontalRay } from './annotations/tfchart_annotation_horizontalray';
export { TFChartVerticalRay } from './annotations/tfchart_annotation_verticalray';
export { TFChartPolygon } from './annotations/tfchart_annotation_polygon';

export { TFChartDataController } from './tfchart_datacontroller';
export { TFChartSimpleDataController } from './datacontrollers/tfchart_datacontroler_simple';

export { TFChartAxisFormatter } from './axis_formatters/tfchart_axis_formatter';
export { LinearAxisFormatter } from './axis_formatters/tfchart_linearaxis_formatter';
export { DateTimeAxisFormatter } from './axis_formatters/tfchart_datetimeaxis_formatter';

export { TFChartRenderer } from './renderers/tfchart_renderer';
export { TFChartBarChartRenderer } from './renderers/tfchart_renderer_barchart';
export { TFChartCandlestickRenderer } from './renderers/tfchart_renderer_candlestick';
export { TFChartLineChartRenderer } from './renderers/tfchart_renderer_line';

export { TFChartSeries } from './series/tfchart_series';
export { TFChartBarchartSeries, TFChartBarchartDataType } from './series/tfchart_series_barchart';
export { TFChartCandlestickSeries, TFChartCandlestickDataType } from './series/tfchart_series_candlestick';
export { TFChartLineSeries, TFChartLineDataType } from './series/tfchart_series_line';

export {
            TFChartRangeMax,
            TFChartRangeMake,
            TFChartRange,
            TFChartRangeInvalid,
            TFChartLocationInRange,
            TFChartEqualRanges,
            TFChartIntersectionRange,
            TFChartUnionRange,

            TFChartSize,
            TFChartSizeMake,

            TFChartRect,
            TFChartRectMake,
            TFChartRectGetMinX,
            TFChartRectGetMaxX,
            TFChartRectGetMinY,
            TFChartRectGetMaxY,

            TFChartPoint,
            TFChartPointMake
        } from './tfchart_utils'

export function delayedInit(): ModuleWithProviders {
  return {
    ngModule: TFChartModule,
    providers: []
  };
}

@NgModule({
  imports: [CommonModule],
  declarations: [
    TFChartComponent
  ],
  exports: [
    TFChartComponent
  ]
})
export class TFChartModule {
  static forRoot = delayedInit();
}
