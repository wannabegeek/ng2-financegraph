import { TFChartSeries, TFChartDataType } from './tfchart_series'
import { TFChartRenderer } from '../renderers/tfchart_renderer'
import { TFChartBarChartRenderer } from '../renderers/tfchart_renderer_barchart'
import { TFChartDataSupplier } from '../tfchart_datasupplier'
import { TFChartSimpleDataController } from '../datacontrollers/tfchart_datacontroler_simple'
import { TFChartRange, TFChartRangeMax } from '../tfchart_utils'

export interface TFChartBarchartDataType extends TFChartDataType {
    value: number;
}

export class TFChartBarchartSeries extends TFChartSeries {

    constructor(dataSupplier: TFChartDataSupplier<TFChartBarchartDataType>) {
        super(new TFChartBarChartRenderer(), new TFChartSimpleDataController(dataSupplier));
    }

    public getVerticalRangeForHorizontal(horizontalRange: TFChartRange): TFChartRange {
        let max: number = 0;
        let data: TFChartBarchartDataType[] = <TFChartBarchartDataType []>this.dataController.getCachedData();
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