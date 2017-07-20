import { TFChartRange } from '../tfchart_utils'
import { TFChart } from '../tfchart'
import { TFChartDataType } from '../series/tfchart_series'

export abstract class TFChartRenderer {
    public abstract render(data:  TFChartDataType[], visibleRange: TFChartRange, chart: TFChart): void;
}
