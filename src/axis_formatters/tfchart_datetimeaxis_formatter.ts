import { TFChartAxisFormatter, AxisValue, Axis } from './tfchart_axis_formatter'
import { TFChartRange, TFChartRangeMax } from '../tfchart_utils'
import * as moment from 'moment';

interface Interval {
    count: number;
    unit: string;
}

export class DateTimeAxisFormatter extends TFChartAxisFormatter {
    private timeUnitSize: { [key:string]: number; } = {
                "second": 1000,
                "minute": 60 * 1000,
                "hour": 60 * 60 * 1000,
                "day": 24 * 60 * 60 * 1000,
                "month": 30 * 24 * 60 * 60 * 1000,
                "quarter": 3 * 30 * 24 * 60 * 60 * 1000,
                "year": 365.2425 * 24 * 60 * 60 * 1000
            };

// private intervals = [
//                 [1, "second"], [2, "second"], [5, "second"], [10, "second"], [30, "second"], 
//                 [1, "minute"], [2, "minute"], [5, "minute"], [10, "minute"], [30, "minute"], 
//                 [1, "hour"], [2, "hour"], [4, "hour"], [8, "hour"], [12, "hour"],
//                 [1, "day"], [2, "day"], [3, "day"],
//                 [0.25, "month"], [0.5, "month"], [1, "month"],
//                 [2, "month"]
//             ];

    private intervals: Interval[] = [
                {count: 1, unit: "second"},
                {count: 5, unit: "second"},
                {count: 10, unit: "second"},
                {count: 30, unit: "second"},
                {count: 1, unit: "minute"},
                {count: 2, unit: "minute"},
                {count: 5, unit: "minute"},
                {count: 10, unit: "minute"},
                {count: 30, unit: "minute"},
                {count: 1, unit: "hour"},
                {count: 2, unit: "hour"},
                {count: 4, unit: "hour"},
                {count: 8, unit: "hour"},
                {count: 12, unit: "hour"},
                {count: 1, unit: "day"},
                {count: 2, unit: "day"},
                {count: 3, unit: "day"},
                {count: 0.25, unit: "month"},
                {count: 0.5, unit: "month"},
                {count: 1, unit: "month"},
                {count: 2, unit: "month"}
            ];

    public calculateAxisTicks(axis: Axis, count: number): number[] {
        let result: number[] = [];

        if (axis.range.span == 0.0) {
            // TODO: deal with it
            return result;
        }

        let step = axis.range.span / count;
        let mag = Math.floor(DateTimeAxisFormatter.log10(step));
        let magPow = Math.pow(10, mag);
        let magMsd = Math.round(step / magPow + 0.5);
        let stepSize = magMsd * magPow;

        let i = 0;
        for (i = 0; i < this.intervals.length - 1; ++i) {
            if (stepSize < (this.intervals[i].count * this.timeUnitSize[this.intervals[i].unit])) {
                break;
            }
        }

        let size: number = this.intervals[i].count;
        let unit: string = this.intervals[i].unit;
        stepSize = size * this.timeUnitSize[unit];

        let lower = stepSize * Math.floor(axis.range.position / stepSize);
        let upper = stepSize * Math.ceil(TFChartRangeMax(axis.range) / stepSize);

        let val = lower;
        while(1) {
            result.push(val);
            val += stepSize;
            if (val > upper) {
                break;
            }
        }
        axis.tickSize = stepSize;
        return result;
    }

    public format(value: number, axis: Axis, is_crosshair: boolean): AxisValue {
        // var m = new Moment();
        if (is_crosshair == true) {
            return {text: moment(value).utc().format("YYYY-MM-DD HH:mm:ss"), is_key:false};
        } else {

            let t = axis.tickSize;
            let fmt: string;

            if (t < this.timeUnitSize['minute']) {
                fmt = "HH:mm:ss";
            } else if (t < this.timeUnitSize['day']) {
                fmt = "HH:mm";
            } else if (t < this.timeUnitSize['month']) {
                fmt = "D";
            } else if (t < this.timeUnitSize['year']) {
                fmt = "MMM YYYY";
            } else {
                fmt = "YYYY";
            }

            let is_key = false;
            if (value % this.timeUnitSize['day'] == 0) {
                fmt = "D";
                is_key = true;
            }
            if (value % this.timeUnitSize['month'] == 0) {
                fmt = "MMM";
                is_key = true;
            }
            if (value % this.timeUnitSize['year'] == 0) {
                fmt = "YYYY";
                is_key = true;
            }

            return {text: moment(value).utc().format(fmt), is_key: is_key};
        }
    }

    private static log10(val: number): number {
        return Math.log(val) / Math.LN10;
    }
}
