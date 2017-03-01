import { TFChartRect } from './tfchart_utils'
import { TFChart } from './tfchart'

export abstract class TFChartRenderer {
    public abstract render<T>(data: T[], chart: TFChart);
}
