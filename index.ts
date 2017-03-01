import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TFChartComponent } from './src/tfchart.component';
export { TFChart } from './src/tfchart';

export { TFChartDataSupplier } from './src/tfchart_datasupplier';

export { TFChartAnnotation } from './src/annotations/tfchart_annotation';
export { TFChartLine } from './src/annotations/tfchart_annotation_line';
export { TFChartHorizontalRay } from './src/annotations/tfchart_annotation_horizontalray';
export { TFChartVerticalRay } from './src/annotations/tfchart_annotation_verticalray';
export { TFChartPolygon } from './src/annotations/tfchart_annotation_polygon';

export { TFChartDataController } from './src/tfchart_datacontroller';
export { TFChartSimpleDataController } from './src/datacontrollers/tfchart_datacontroler_simple';

export { TFChartAxisFormatter } from './src/axis_formatters/tfchart_axis_formatter';
export { LinearAxisFormatter } from './src/axis_formatters/tfchart_linearaxis_formatter';
export { DateTimeAxisFormatter } from './src/axis_formatters/tfchart_datetimeaxis_formatter';

export { TFChartRenderer } from './src/renderers/tfchart_renderer';
export { TFChartBarChartRenderer } from './src/renderers/tfchart_renderer_barchart';
export { TFChartCandlestickRenderer } from './src/renderers/tfchart_renderer_candlestick';
export { TFChartLineChartRenderer } from './src/renderers/tfchart_renderer_line';

export { TFChartSize, TFChartRangeMax, TFChartRangeMake, TFChartRange, TFChartRect, TFChartRectMake, TFChartRectGetMaxY, TFChartPoint, TFChartPointMake } from './src/tfchart_utils'

@NgModule({
  imports: [CommonModule],
  declarations: [
    TFChartComponent,
  ],
  exports: [
    TFChartComponent,
  ]
})
export class TFChartModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: TFChartModule,
      providers: []
    }
  }
}