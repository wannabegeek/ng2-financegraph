import { TFChartRenderer } from '../renderers/tfchart_renderer'
import { TFChartDataController } from '../tfchart_datacontroller'
import { TFChartRange, TFChartRangeMax } from '../tfchart_utils'
import { TFChart } from '../tfchart'

export abstract class TFChartSeries {
    
    constructor(protected renderer: TFChartRenderer, protected dataController: TFChartDataController) {
    }

    public getRenderer(): TFChartRenderer {
        return this.renderer;
    }

    public getDataController(): TFChartDataController {
        return this.dataController;
    }

    public setPeriod(period: number) {
        this.dataController.setPeriod(period);
    }

    public render(visibleRange: TFChartRange, chart: TFChart) {
        this.renderer.render(this.dataController.getCachedData(), visibleRange, chart);
    }

    public abstract getVerticalRangeForHorizontal(horizontalRange: TFChartRange): TFChartRange;
}