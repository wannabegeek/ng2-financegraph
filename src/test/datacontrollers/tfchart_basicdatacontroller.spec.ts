
import { TFChartDataBuffer } from '../../datacontrollers/tfchart_databuffer'
import { TFChartRangeInvalid, TFChartRange, TFChartRangeMake, TFChartEqualRanges, TFChartRangeMax, TFChartIntersectionRange } from '../../tfchart_utils'
import { TFChartDataType } from '../../series/tfchart_series'
import { TFChartDataSupplier, RequestResults } from '../../tfchart_datasupplier'
import { DataOperation, TFChartDataOperationType, TFChartDataRequestType } from '../../tfchart_datacontroller'
import { TFChartBasicDataController } from '../../datacontrollers/tfchart_basicdatacontroller'
import { MockDataSupplier } from '../tfchart_mockdatasupplier'

describe("TFChartDataController", () => {

    interface DataType extends TFChartDataType {
        value: number;
    }

    function createDataType(index: number): DataType {
        return {
            timestamp: index,
            value: index
        };
    }

    it("Get available range", (done) => {
        let dataController = new TFChartBasicDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));
        dataController.setPeriod(1);

        dataController.availableRange()
            .then((range) => {
                expect(range.position).toBe(0);
                expect(range.span).toBe(10);
            })
            .then(() => {
                done();
            })
            .catch((error) => {
                console.error("AvailableRange failed: " + error);
            });
    });

    it("Get full data from source", (done) => {
        let dataController = new TFChartBasicDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));
        dataController.setPeriod(1);

        dataController.availableRange()
            .then((range) => {
                expect(range.position).toBe(0);
                expect(range.span).toBe(10);
            })
            .then(() => {
                dataController.getDataInRange(TFChartRangeMake(0, 10))
                    .then((data) => {
                        // Oooooooh, got some data
                        let counter: number = 0;
                        for (let i of data.data) {
                            expect(i.timestamp).toBe(counter++);
                        }
                        expect(data.range.position).toBe(0);
                        expect(data.range.span).toBe(10);
                        expect(data.moreToFollow).toBeNull();
                        done();
                    })
                    .catch((error) => {
                        console.error("Failed with error: " + error);
                    });
            })
            .catch((error) => {
                console.error("AvailableRange failed: " + error);
            });
    });

    it("Get full data from cache", (done) => {
        let dataController = new TFChartBasicDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));
        dataController.setPeriod(1);

        dataController.availableRange()
            .then((range) => {
                expect(range.position).toBe(0);
                expect(range.span).toBe(10);
            })
            .then(() => {
                dataController.getDataInRange(TFChartRangeMake(0, 10))
                    .then((data) => {
                        // Oooooooh, got some data
                        let counter: number = 0;
                        for (let i of data.data) {
                            expect(i.timestamp).toBe(counter++);
                        }
                        expect(data.range.position).toBe(0);
                        expect(data.range.span).toBe(10);
                        expect(data.moreToFollow).toBeNull();

                        // We have to assume the previous request is successfull and populates the 
                        // cache correctly
                        window.setTimeout(() => {
                            dataController.getDataInRange(TFChartRangeMake(0, 10))
                                .then((data) => {
                                    // Oooooooh, got some data
                                    let counter: number = 0;
                                    for (let i of data.data) {
                                        expect(i.timestamp).toBe(counter++);
                                    }
                                    expect(data.range.position).toBe(0);
                                    expect(data.range.span).toBe(10);
                                    expect(data.moreToFollow).toBeNull();

                                    done();
                                })
                                .catch((error) => {
                                    console.error("Failed with error: " + error);
                                });
                        }, 100);

                    })
                    .catch((error) => {
                        console.error("Failed with error: " + error);
                    });
            })
            .catch((error) => {
                console.error("AvailableRange failed: " + error);
            });
    });

    it("Get partial data from cache appended by source", (done) => {
        let dataController = new TFChartBasicDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));
        dataController.setPeriod(1);

        dataController.availableRange()
            .then((range) => {
                expect(range.position).toBe(0);
                expect(range.span).toBe(10);
            })
            .then(() => {
                dataController.getDataInRange(TFChartRangeMake(0, 5))
                    .then((data) => {
                        // Oooooooh, got some data
                        let counter: number = 0;
                        for (let i of data.data) {
                            expect(i.timestamp).toBe(counter++);
                        }
                        expect(data.range.position).toBe(0);
                        expect(data.range.span).toBe(5);
                        expect(data.moreToFollow).toBeNull();

                        // We have to assume the previous request is successfull and populates the 
                        // cache correctly
                        window.setTimeout(() => {
                            dataController.getDataInRange(TFChartRangeMake(0, 10))
                                .then((data) => {
                                    // Oooooooh, got some data
                                    let counter: number = 0;
                                    for (let i of data.data) {
                                        expect(i.timestamp).toBe(counter++);
                                    }
                                    expect(data.range.position).toBe(0);
                                    expect(data.range.span).toBe(5);
                                    expect(data.moreToFollow).not.toBeNull();

                                    data.moreToFollow.then((data) => {
                                            let counter: number = 0;
                                            for (let i of data.data) {
                                                expect(i.timestamp).toBe(counter++);
                                            }
                                            expect(data.range.position).toBe(0);
                                            expect(data.range.span).toBe(10);
                                            expect(data.moreToFollow).toBeNull();
                                            done();
                                        })
                                        .catch((error) => {
                                            console.error("Retrieving cache-missed data failed with error: " + error);
                                        });
                                })
                                .catch((error) => {
                                    console.error("Failed with error: " + error);
                                });
                        }, 100);

                    })
                    .catch((error) => {
                        console.error("Failed with error: " + error);
                    });
            })
            .catch((error) => {
                console.error("AvailableRange failed: " + error);
            });
    });

    it("Get partial data from cache prepended by source", (done) => {
        let dataController = new TFChartBasicDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));
        dataController.setPeriod(1);

        dataController.availableRange()
            .then((range) => {
                expect(range.position).toBe(0);
                expect(range.span).toBe(10);
            })
            .then(() => {
                // Request our data to cache ready for the test
                dataController.getDataInRange(TFChartRangeMake(5, 5))
                    .then((data) => {
                        // Oooooooh, got some data
                        let counter: number = 5;
                        for (let i of data.data) {
                            expect(i.timestamp).toBe(counter++);
                        }
                        expect(data.data.length).toBe(5);
                        expect(data.range.position).toBe(5);
                        expect(data.range.span).toBe(5);
                        expect(data.moreToFollow).toBeNull();

                        // We have to assume the previous request is successfull and populates the 
                        // cache correctly
                        window.setTimeout(() => {
                            dataController.getDataInRange(TFChartRangeMake(0, 10))
                                .then((data) => {
                                    // Oooooooh, got some data
                                    let counter: number = 5;
                                    for (let i of data.data) {
                                        expect(i.timestamp).toBe(counter++);
                                    }

                                    expect(data.data.length).toBe(5);
                                    expect(data.range.position).toBe(5);
                                    expect(data.range.span).toBe(5);
                                    expect(data.moreToFollow).not.toBeNull();

                                    data.moreToFollow.then((data) => {
                                            let counter: number = 0;
                                            for (let i of data.data) {
                                                expect(i.timestamp).toBe(counter++);
                                            }
                                            expect(data.data.length).toBe(10);
                                            expect(data.range.position).toBe(0);
                                            expect(data.range.span).toBe(10);
                                            expect(data.moreToFollow).toBeNull();
                                            done();
                                        })
                                        .catch((error) => {
                                            console.error("Retrieving cache-missed data failed with error: " + error);
                                        });
                                })
                                .catch((error) => {
                                    console.error("Failed with error: " + error);
                                });
                        }, 100);

                    })
                    .catch((error) => {
                        console.error("Failed with error: " + error);
                    });
            })
            .catch((error) => {
                console.error("AvailableRange failed: " + error);
            });
    });

    it("Get partial data from cache straddled by data from source", (done) => {
        let dataController = new TFChartBasicDataController<DataType>(new MockDataSupplier<DataType>(TFChartRangeMake(0, 10), 10, 0, createDataType));
        dataController.setPeriod(1);

        dataController.availableRange()
            .then((range) => {
                expect(range.position).toBe(0);
                expect(range.span).toBe(10);
            })
            .then(() => {
                dataController.getDataInRange(TFChartRangeMake(5, 2))
                    .then((data) => {
                        // Oooooooh, got some data
                        let counter: number = 5;
                        for (let i of data.data) {
                            expect(i.timestamp).toBe(counter++);
                        }
                        expect(data.data.length).toBe(2);
                        expect(data.range.position).toBe(5);
                        expect(data.range.span).toBe(2);
                        expect(data.moreToFollow).toBeNull();

                        // We have to assume the previous request is successfull and populates the 
                        // cache correctly
                        window.setTimeout(() => {
                            dataController.getDataInRange(TFChartRangeMake(0, 10))
                                .then((data) => {
                                    // Oooooooh, got some data
                                    let counter: number = 5;
                                    for (let i of data.data) {
                                        expect(i.timestamp).toBe(counter++);
                                    }

                                    expect(data.data.length).toBe(2);
                                    expect(data.range.position).toBe(5);
                                    expect(data.range.span).toBe(2);
                                    expect(data.moreToFollow).not.toBeNull();

                                    data.moreToFollow.then((data) => {
                                            // expect(data.data.length).not.toBe(10);
                                            // expect(data.range.span).not.toBe(10);
                                            // expect(data.moreToFollow).not.toBeNull();
                                            data.moreToFollow.then((data) => {
                                                let counter: number = 0;
                                                for (let i of data.data) {
                                                    expect(i.timestamp).toBe(counter++);
                                                }
                                                expect(data.data.length).toBe(10);
                                                expect(data.range.position).toBe(0);
                                                expect(data.range.span).toBe(10);
                                                expect(data.moreToFollow).toBeNull();
                                                done();
                                            })
                                            .catch((error) => {
                                                console.error("Retrieving cache-missed data failed with error: " + error);
                                            });
                                        })
                                        .catch((error) => {
                                            console.error("Retrieving cache-missed data failed with error: " + error);
                                        });
                                })
                                .catch((error) => {
                                    console.error("Failed with error: " + error);
                                });
                        }, 100);

                    })
                    .catch((error) => {
                        console.error("Failed with error: " + error);
                    });
            })
            .catch((error) => {
                console.error("AvailableRange failed: " + error);
            });
    });

});
