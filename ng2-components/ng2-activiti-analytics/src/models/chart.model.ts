/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as moment from 'moment';

enum ChartsType {
    PIE = 'pie',
    TABLE = 'table',
    LINE = 'line',
    BAR_CHART = 'barChart',
    MULTI_BAR_CHART = 'multiBarChart',
    PROCESS_DEFINITION_HEATMAP = 'processDefinitionHeatMap',
    MASTER_DETAIL_TABLE = 'masterDetailTable'
}

enum ChartsIcon {
    PIE_CHART = 'pie_chart',
    WEB = 'web',
    SHOW_CHART = 'show_chart',
    EQUALIZER = 'equalizer',
    POLL = 'poll',
    SHARE = 'share',
    SUBTITLES = 'subtitles'
}

export class Chart {
    public id: string;
    public type: string;
    public icon: string;

    constructor(obj?: any) {
        this.id = obj && obj.id || null;
        if (obj && obj.type) {
            this.type = this.convertType(obj.type);
            this.icon = this.getIconType(this.type);
        }
    }

    private convertType(type: string): ChartsType {
        let chartType = '';
        switch (type) {
            case 'pieChart':
                chartType = ChartsType.PIE;
                break;
            case 'table':
                chartType = ChartsType.TABLE;
                break;
            case 'line':
                chartType = ChartsType.LINE;
                break;
            case 'barChart':
                chartType = ChartsType.BAR_CHART;
                break;
            case 'multiBarChart':
                chartType = ChartsType.MULTI_BAR_CHART;
                break;
            case 'processDefinitionHeatMap':
                chartType = ChartsType.PROCESS_DEFINITION_HEATMAP;
                break;
            case 'masterDetailTable':
                chartType = ChartsType.MASTER_DETAIL_TABLE;
                break;
            default:
                chartType = Charts.TABLEW;
                break;
        }
        return chartType;
    }

    private getIconType(type: string): ChartsIcon {
        let typeIcon: string = '';
        switch (type) {
            case 'pie':
                typeIcon = ChartsIcon.PIE_CHART;
                break;
            case 'table':
                typeIcon = ChartsIcon.WEB;
                break;
            case 'line':
                typeIcon = ChartsIcon.SHOW_CHART;
                break;
            case 'bar':
                typeIcon = ChartsIcon.EQUALIZER;
                break;
            case 'multiBar':
                typeIcon = ChartsIcon.POLL;
                break;
            case 'HeatMap':
                typeIcon = ChartsIcon.SHARE;
                break;
            case 'masterDetailTable':
                typeIcon = ChartsIcon.SUBTITLES;
                break;
            default:
                typeIcon = ChartsIcon.WEB;
                break;
        }
        return typeIcon;
    }
}

export class LineChart extends Chart {
    public title: string;
    public titleKey: string;
    public labels: string[] = [];
    public datasets: any[] = [];

    constructor(obj?: any) {
        super(obj);
        this.title = obj && obj.title || null;
        this.titleKey = obj && obj.titleKey || null;
        this.labels = obj && obj.columnNames.slice(1, obj.columnNames.length);

        obj.rows.forEach((value: any) => {
            this.datasets.push({data: value.slice(1, value.length), label: value[0]});
        });
    }
}

export class BarChart extends Chart {
    public title: string;
    public titleKey: string;
    public labels: any = [];
    public datasets: any[] = [];
    public data: any[] = [];
    public xAxisType: string;
    public yAxisType: string;
    public options: any = {
        responsive: true,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }],
            xAxes: [{
                ticks: {},
                stacked: false
            }]
        }
    };

    constructor(obj?: any) {
        super(obj);
        this.title = obj && obj.title || null;
        this.titleKey = obj && obj.titleKey || null;
        this.xAxisType = obj && obj.xAxisType || null;
        this.yAxisType = obj && obj.yAxisType || null;
        this.options.scales.xAxes[0].ticks.callback = this.xAxisTickFormatFunction(this.xAxisType);
        this.options.scales.yAxes[0].ticks.callback = this.yAxisTickFormatFunction(this.yAxisType);
        if (obj.values) {
            obj.values.forEach((params: any) => {
                let dataValue = [];
                params.values.forEach((info: any) => {
                    info.forEach((value: any, index: any) => {
                        if (index % 2 === 0) {
                            if (!this.labels.includes(value)) {
                                this.labels.push(value);
                            }
                        } else {
                            dataValue.push(value);
                        }
                    });
                });
                if (dataValue && dataValue.length > 0) {
                    this.datasets.push({data: dataValue, label: params.key});
                }
            });
        }
    }

    public xAxisTickFormatFunction(xAxisType): Function {
        return (value) => {
            if (xAxisType !== null && xAxisType !== undefined) {
                if ('date_day' === xAxisType) {
                    return moment(new Date(value)).format('DD');
                } else if ('date_month' === xAxisType) {
                    return moment(new Date(value)).format('MMMM');
                } else if ('date_year' === xAxisType) {
                    return moment(new Date(value)).format('YYYY');
                }
            }
            return value;
        };
    };

    public yAxisTickFormatFunction(yAxisType): Function {
        return (value) => {
            if (yAxisType !== null && yAxisType !== undefined) {
                if ('count' === yAxisType) {
                    let label = '' + value;
                    if (label.indexOf('.') !== -1) {
                        return '';
                    }
                }
            }
            return value;
        };
    };

    public hasDatasets(): boolean {
        return this.datasets && this.datasets.length > 0 ? true : false;
    }
}

export class MultiBarChart extends BarChart {

    constructor(obj?: any) {
        super(obj);
    }
}

export class TableChart extends Chart {
    public title: string;
    public titleKey: string;
    public labels: string[] = [];
    public datasets: any[] = [];

    constructor(obj?: any) {
        super(obj);
        this.title = obj && obj.title || null;
        this.titleKey = obj && obj.titleKey || null;
        this.labels = obj && obj.columnNames;
        if (obj.rows) {
            this.datasets = obj && obj.rows;
        }
    }

    public hasDatasets(): boolean {
        return this.datasets && this.datasets.length > 0 ? true : false;
    }
}

export class DetailsTableChart extends TableChart {
    public detailsTable: any;
    public showDetails: boolean = false;

    constructor(obj?: any) {
        super(obj);
        if (obj.detailTables) {
            this.detailsTable = new TableChart(obj.detailTables[0]);
        }
    }

    public hasDetailsTable(): boolean {
        return this.detailsTable ? true : false;
    }
}

export class HeatMapChart extends Chart {
    public avgTimePercentages: string;
    public avgTimeValues: string;
    public processDefinitionId: string;
    public titleKey: string;
    public totalCountValues: string;
    public totalCountsPercentages: string;
    public totalTimePercentages: string;
    public totalTimeValues: string;

    constructor(obj?: any) {
        super(obj);
        this.avgTimePercentages = obj && obj.avgTimePercentages || null;
        this.avgTimeValues = obj && obj.avgTimeValues || null;
        this.processDefinitionId = obj && obj.processDefinitionId || null;
        this.totalCountValues = obj && obj.totalCountValues || null;
        this.titleKey = obj && obj.titleKey || null;
        this.totalCountsPercentages = obj && obj.totalCountsPercentages || null;
        this.totalTimePercentages = obj && obj.totalTimePercentages || null;
        this.totalTimeValues = obj && obj.totalTimeValues || null;
    }
}

export class PieChart extends Chart {
    public title: string;
    public titleKey: string;
    public labels: string[] = [];
    public data: string[] = [];

    constructor(obj?: any) {
        super(obj);
        this.title = obj && obj.title || null;
        this.titleKey = obj && obj.titleKey || null;
        if (obj.values) {
            obj.values.forEach((value: any) => {
                this.add(value.key, value.y);
            });
        }
    }

    public add(label: string, data: string): void {
        this.labels.push(label);
        this.data.push(data);
    }

    public hasData(): boolean {
        return this.data && this.data.length > 0 ? true : false;
    }

    public hasZeroValues(): boolean {
        let isZeroValues: boolean = false;
        if (this.hasData()) {
            isZeroValues = true;
            this.data.forEach((value) => {
                if (value.toString() !== '0') {
                    isZeroValues = false;
                }
            });
        }
        return isZeroValues;
    }
}
