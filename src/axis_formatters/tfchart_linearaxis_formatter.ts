import { TFChartAxisFormatter, AxisValue, Axis } from './tfchart_axis_formatter'

export class LinearAxisFormatter extends TFChartAxisFormatter {
    constructor(private decimal_placess: number) {
        super();
    }

    public calculateAxisTicks(axis: Axis, count: number): number[] {
        var result: number[] = [];

        if (axis.range.span == 0.0) {
            // TODO: deal with it
            return result;
        }

        var step = axis.range.span / count;
        var mag = Math.floor(LinearAxisFormatter.log10(step));
        var magPow = Math.pow(10, mag);
        var magMsd = Math.round(step / magPow + 0.5);
        var stepSize = magMsd * magPow;

        var lower = stepSize * Math.floor(axis.range.position / stepSize);
        var upper = stepSize * Math.ceil((axis.range.position + axis.range.span) / stepSize);

        var val = lower;
        while(1) {
            result.push(val);
            val += stepSize;
            if (val > upper) {
                break;
            }
        }
        return result;
    }

    public format(value: number, range: number, is_crosshair: boolean): AxisValue {
        return {text: value.toFixed(this.decimal_placess), is_key: false};
    }

    private static roundToDP(val: number, dp: number): number {
        var p = Math.pow(10, dp);
        var t = val * p;
        t = Math.round(t);
        return t / p;
    }

    private static log10(val: number): number {
        return Math.log(val) / Math.LN10;
    }
}
