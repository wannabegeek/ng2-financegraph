import { TFChartRangeInvalid, 
    TFChartRange, 
    TFChartRangeMake, 
    TFChartEqualRanges, 
    TFChartLocationInRange, 
    TFChartUnionRange,
    TFChartIntersectionRange,
    TFChartRect,
    TFChartRectMake,
    TFChartPointMake,
    TFChartRectInset 
} from '../tfchart_utils'

describe("TFChartRange", () => {
    it("Equal ranges", () => {
        let range1: TFChartRange = TFChartRangeMake(0, 100);
        let range2: TFChartRange = TFChartRangeMake(0, 100);
        let range3: TFChartRange = TFChartRangeMake(0, 99);

        expect(TFChartEqualRanges(range1, range2)).toBe(true);
        expect(TFChartEqualRanges(range1, range3)).toBe(false);
    });

    it("Location in range", () => {
        let range: TFChartRange = TFChartRangeMake(0, 100);

        expect(TFChartLocationInRange(50, range)).toBe(true);
        expect(TFChartLocationInRange(0, range)).toBe(true);
        expect(TFChartLocationInRange(100, range)).toBe(true);
        expect(TFChartLocationInRange(101, range)).toBe(false);
    });

    it("Union of ranges", () => {
        let range1: TFChartRange = TFChartRangeMake(0, 100);
        let range2: TFChartRange = TFChartRangeMake(100, 100);
        let range3: TFChartRange = TFChartRangeMake(200, 100);

        let result: TFChartRange = TFChartUnionRange(range1, range2);
        expect(result.position).toBe(0);
        expect(result.span).toBe(200);

        result = TFChartUnionRange(range2, range3);
        expect(result.position).toBe(100);
        expect(result.span).toBe(200);

        result = TFChartUnionRange(range1, range3);
        expect(result.position).toBe(0);
        expect(result.span).toBe(300);
    });

    it("Intersection of ranges", () => {
        let range1: TFChartRange = TFChartRangeMake(0, 100);
        let range2: TFChartRange = TFChartRangeMake(50, 100);
        let range3: TFChartRange = TFChartRangeMake(200, 100);

        let result: TFChartRange = TFChartIntersectionRange(range1, range2);
        expect(result.position).toBe(50);
        expect(result.span).toBe(50);

        result = TFChartIntersectionRange(range1, range3);
        expect(result.position).toBe(0);
        expect(result.span).toBe(0);
    });
});

describe("TFChartRect", () => {
    it("Rect contains point", () => {
        let rect: TFChartRect = TFChartRectMake(0, 0, 100, 100);

        expect(rect.containsPoint(TFChartPointMake(50, 50))).toBe(true);
        expect(rect.containsPoint(TFChartPointMake(0, 0))).toBe(true);
        expect(rect.containsPoint(TFChartPointMake(0, 100))).toBe(true);
        expect(rect.containsPoint(TFChartPointMake(100, 0))).toBe(true);
        expect(rect.containsPoint(TFChartPointMake(100, 100))).toBe(true);

        expect(rect.containsPoint(TFChartPointMake(101, 100))).toBe(false);
        expect(rect.containsPoint(TFChartPointMake(100, 101))).toBe(false);
    });

    it("Rect_1 intersects Rect_2", () => {
        let rect1: TFChartRect = TFChartRectMake(0, 0, 100, 100);
        let rect2: TFChartRect = TFChartRectMake(50, 50, 100, 100);
        let rect3: TFChartRect = TFChartRectMake(200, 200, 100, 100);

        expect(rect1.intersectsRect(rect2)).toBe(true);
        expect(rect1.intersectsRect(rect3)).toBe(false);
    });

    it("Inset Rect", () => {
        let rect: TFChartRect = TFChartRectMake(0, 0, 100, 100);

        let result: TFChartRect = TFChartRectInset(rect, 2, 10);
        expect(result.origin.x).toBe(2);
        expect(result.origin.y).toBe(10);
        expect(result.size.width).toBe(96);
        expect(result.size.height).toBe(80);
    });
});