import { TFChartRect, TFChartRange } from '../tfchart_utils'

export class Axis {
    public range: TFChartRange = new TFChartRange(0.0, 0.0);
    public tickSize: number = 0;

    constructor(public formatter: TFChartAxisFormatter, public padding: number, public data_padding: number) {
    }
}

export interface AxisValue {
    text: string,
    is_key: boolean
}

export abstract class TFChartAxisFormatter {
    public abstract calculateAxisTicks(axis: Axis, count: number): number[];
    public abstract format(value: number, axis, is_crosshair: boolean): AxisValue;
}

    