import { TFChartRect } from '../tfchart_utils'
import { TFChart } from '../tfchart'

export abstract class TFChartAnnotation {
    public abstract render(bounds: TFChartRect, chart: TFChart);
}
