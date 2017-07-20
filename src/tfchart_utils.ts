export function TFChartDateTimeRange(range: TFChartRange) {
    let start = new Date(range.position);
    let end = new Date(TFChartRangeMax(range));
    return start.toString() + " -> " + end.toString();
}

export class TFChartRange { 

    constructor(public position: number, public span: number) {
    }

    public equal(other: TFChartRange): boolean {
        return TFChartEqualRanges(this, other);
    }

    public intersects(location: number): boolean {
        return (location >= this.position && location <= TFChartRangeMax(this));
    }

    public ratioForSize(size: number): number {
        return size / this.span;
    }

    public toString(): string {
        return "{position: " + this.position + ", span: " + this.span + "}";
    }

}

let INVALID_RANGE: TFChartRange = TFChartRangeMake(Number.MAX_SAFE_INTEGER, 0);   
export function TFChartRangeInvalid(): TFChartRange {
    return INVALID_RANGE;
}

export function TFChartRangeMake(position: number, span: number): TFChartRange {
    return new TFChartRange(position, span);
}

export function TFChartLocationInRange(location: number, range: TFChartRange): boolean {
    return location >= range.position && location <= TFChartRangeMax(range);
}

export function TFChartRangeMax(range: TFChartRange): number {
    return range.position + range.span;
}

export function TFChartEqualRanges(range: TFChartRange, otherRange: TFChartRange): boolean {
    return (range.position == otherRange.position && range.span == otherRange.span);
}

export function TFChartIntersectionRange(range: TFChartRange, otherRange: TFChartRange): TFChartRange {
    var result = TFChartRangeMake(0, 0);

    if (TFChartRangeMax(range) < otherRange.position || TFChartRangeMax(otherRange) < range.position) {
        return TFChartRangeMake(0, 0);
    } else {
        result.position = Math.max(range.position, otherRange.position);
        result.span = Math.min(TFChartRangeMax(range), TFChartRangeMax(otherRange)) - result.position;
        return result;
    }
}

export function TFChartUnionRange(range: TFChartRange, otherRange: TFChartRange): TFChartRange {
    var start = Math.min(range.position, otherRange.position);
    return TFChartRangeMake(start, Math.max(TFChartRangeMax(range), TFChartRangeMax(otherRange)) - start);
}

//////////////////////////////////////////////////////////////////

export class TFChartPoint {
    constructor(public x: number, public y: number) {
    }

    public toString(): string {
        return "{x: " + this.x + ", y: " + this.y + "}";
    }
}

export function TFChartPointMake(x: number, y: number): TFChartPoint {
    return new TFChartPoint(x, y);
}

//////////////////////////////////////////////////////////////////

export class TFChartSize {
    constructor(public width: number, public height: number) {
    }

    public toString(): string {
        return "{width: " + this.width + ", height: " + this.height + "}";
    }
}

export function TFChartSizeMake(width: number, height: number): TFChartSize {
    return new TFChartSize(width, height);
}

//////////////////////////////////////////////////////////////////

export class TFChartRect {
    constructor(public origin: TFChartPoint, public size: TFChartSize) {
    }

    public toString(): string {
        return "origin: " + this.origin + ", size: " + this.size;
    }

    public containsPoint(point: TFChartPoint): boolean {
        return point.x >= this.origin.x && point.x <= (this.origin.x + this.size.width) &&
            point.y >= this.origin.y && point.y <= (this.origin.y + this.size.height);
    }

    public intersectsRect(rect: TFChartRect): boolean {
        return (this.origin.x + this.size.width >= rect.origin.x && this.origin.x <= rect.origin.x + rect.size.width 
                && this.origin.y + this.size.height >= rect.origin.y && this.origin.y <= rect.origin.y + rect.size.height);
    }
}

export function TFChartRectMake(x: number, y: number, w: number, h: number): TFChartRect {
    return new TFChartRect(new TFChartPoint(x, y), new TFChartSize(w, h));
}

export function TFChartRectGetMinX(rect: TFChartRect) {
    return rect.origin.x;
}

export function TFChartRectGetMaxX(rect: TFChartRect) {
    return rect.origin.x + rect.size.width;
}

export function TFChartRectGetMinY(rect: TFChartRect) {
    return rect.origin.y;
}

export function TFChartRectGetMaxY(rect: TFChartRect) {
    return rect.origin.y + rect.size.height;
}
