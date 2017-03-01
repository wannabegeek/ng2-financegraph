import { TFChartSeries } from './tfchart_series'
import { TFChartRenderer } from '../renderers/tfchart_renderer'
import { TFChartLineChartRenderer } from '../renderers/tfchart_renderer_line'
import { TFChartDataSupplier } from '../tfchart_datasupplier'
import { TFChartSimpleDataController } from '../datacontrollers/tfchart_datacontroler_simple'
import { TFChartRange, TFChartRangeMax } from '../tfchart_utils'

export interface TFChartLineDataType {
    timestamp: number;
    value: number;
}

export class TFChartLineSeries extends TFChartSeries {

    constructor(dataSupplier: TFChartDataSupplier<TFChartLineDataType>) {
        super(new TFChartLineChartRenderer(), new TFChartSimpleDataController(dataSupplier));
    }

    public getVerticalRangeForHorizontal(horizontalRange: TFChartRange): TFChartRange {
        let max = 0;
        let data = this.dataController.getCachedData<TFChartLineDataType>();
        for (let point of data) {
            if (point.timestamp > TFChartRangeMax(horizontalRange)) {
                break;
            } else if (point.timestamp >= horizontalRange.position) {
                max = Math.max(max, point.value);
            }
        }

        return new TFChartRange(0, max);
    }
}