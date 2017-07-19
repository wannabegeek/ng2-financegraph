import { TFChartSeries } from './tfchart_series'
import { TFChartRenderer } from '../renderers/tfchart_renderer'
import { TFChartCandlestickRenderer } from '../renderers/tfchart_renderer_candlestick'
import { TFChartDataSupplier } from '../tfchart_datasupplier'
import { TFChartSimpleDataController } from '../datacontrollers/tfchart_datacontroler_simple'
import { TFChartRange, TFChartRangeMax } from '../tfchart_utils'

export interface TFChartCandlestickDataType {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export class TFChartCandlestickSeries extends TFChartSeries {

    constructor(dataSupplier: TFChartDataSupplier<TFChartCandlestickDataType>) {
        super(new TFChartCandlestickRenderer(), new TFChartSimpleDataController(dataSupplier));
    }

    public getVerticalRangeForHorizontal(horizontalRange: TFChartRange): TFChartRange {
        let min: number = null;
        let max: number = null;
        let data: TFChartCandlestickDataType[] = this.dataController.getCachedData<TFChartCandlestickDataType>();
        for (let point of data) {
            if (point.timestamp > TFChartRangeMax(horizontalRange)) {
                break;
            } else if (point.timestamp >= horizontalRange.position) {
                max = (max == null) ? point.high : Math.max(max, point.high);
                min = (min == null) ? point.low : Math.min(min, point.low);
            }
        }

        return new TFChartRange(min, max - min);
    }
}