import { TFChartSeries, TFChartDataType } from './tfchart_series'
import { TFChartRenderer } from '../renderers/tfchart_renderer'
import { TFChartLineChartRenderer } from '../renderers/tfchart_renderer_line'
import { TFChartDataSupplier } from '../tfchart_datasupplier'
import { TFChartSimpleDataController } from '../datacontrollers/tfchart_datacontroler_simple'
import { TFChartRange, TFChartRangeMax } from '../tfchart_utils'

export interface TFChartLineDataType extends TFChartDataType {
    value: number;
}

export class TFChartLineSeries extends TFChartSeries {

    constructor(dataSupplier: TFChartDataSupplier<TFChartLineDataType>) {
        super(new TFChartLineChartRenderer(), new TFChartSimpleDataController(dataSupplier));
    }

    public getVerticalRangeForHorizontal(horizontalRange: TFChartRange): TFChartRange {
        let min: number = null;
        let max: number = null;
        let data: TFChartLineDataType[] = <TFChartLineDataType []>this.dataController.getCachedData();
        for (let point of data) {
            if (point.timestamp > TFChartRangeMax(horizontalRange)) {
                break;
            } else if (point.timestamp >= horizontalRange.position) {
                max = (max == null) ? point.value : Math.max(max, point.value);
                min = (min == null) ? point.value : Math.min(min, point.value);
            }
        }

        return new TFChartRange(min, max - min);
    }
}