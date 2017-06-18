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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { Observable, Observer } from 'rxjs/Rx';
import { ReportParametersModel } from '../models/report.model';
import { AnalyticsService } from '../services/analytics.service';

@Component({
    selector: 'analytics-report-list',
    templateUrl: './analytics-report-list.component.html',
    styleUrls: ['./analytics-report-list.component.css']
})
export class AnalyticsReportListComponent implements OnInit {

    public static LAYOUT_LIST: string = 'LIST';
    public static LAYOUT_GRID: string = 'GRID';

    @Input()
    public layoutType: string = AnalyticsReportListComponent.LAYOUT_LIST;

    @Input()
    public appId: string;

    @Input()
    public selectFirst: boolean = false;

    @Output()
    public reportClick: EventEmitter<ReportParametersModel> = new EventEmitter<ReportParametersModel>();

    @Output()
    public onSuccess = new EventEmitter();

    @Output()
    public onError = new EventEmitter();

    private reportObserver: Observer<any>;
    private report$: Observable<any>;

    private currentReport: any;

    private reports: ReportParametersModel[] = [];

    constructor(private analyticsService: AnalyticsService,
                private logService: LogService) {
        this.report$ = new Observable<ReportParametersModel>((observer) => this.reportObserver = observer).share();
    }

    public ngOnInit(): void {
        this.initObserver();

        this.getReportList(this.appId);
    }

    private initObserver(): void {
        this.report$.subscribe((report: ReportParametersModel) => {
            this.reports.push(report);
        });
    }

    /**
     * Reload the component
     */
    public reload(reportId?): void {
        this.reset();
        this.getReportList(this.appId, reportId);
    }

    /**
     * Get the report list
     */
    private getReportList(appId: string, reportId?: string): void {
        this.analyticsService.getReportList(appId).subscribe(
            (res: ReportParametersModel[]) => {
                if (res && res.length === 0) {
                    this.createDefaultReports();
                } else {
                    res.forEach((report) => {
                        this.reportObserver.next(report);
                    });
                    if (reportId) {
                        console.log('SELEZIONO IL REPORT!');
                        this.selectReportByReportId(reportId);
                    }
                    if (this.selectFirst) {
                        this.selectFirstReport();
                    }
                    this.onSuccess.emit(res);
                }
            },
            (err: any) => {
                this.onError.emit(err);
            }
        );
    }

    /**
     * Create the default reports and return the report list
     */
    private createDefaultReports(): void {
        this.analyticsService.createDefaultReports().subscribe(
            () => {
                this.analyticsService.getReportList(this.appId).subscribe(
                    (response: ReportParametersModel[]) => {
                        response.forEach((report) => {
                            this.reportObserver.next(report);
                        });
                        this.onSuccess.emit(response);
                    }
                );
            }
        );
    }

    /**
     * Check if the report list is empty
     * @returns {boolean|ReportParametersModel[]}
     */
    public isReportsEmpty(): boolean {
        return this.reports === undefined || (this.reports && this.reports.length === 0);
    }

    /**
     * Reset the list
     */
    private reset(): void {
        if (!this.isReportsEmpty()) {
            this.reports = [];
        }
    }

    /**
     * Select the current report
     * @param report
     */
    public selectReport(report: any): void {
        this.currentReport = report;
        this.reportClick.emit(report);
    }

    public selectReportByReportId(reportId): void {
        let reportFound = this.reports.find((report) => report.id === reportId);
        if (reportFound) {
            this.currentReport = reportFound;
            this.reportClick.emit(reportFound);
        }
    }

    public selectFirstReport(): void {
        this.selectReport(this.reports[0]);
        this.selectFirst = false;
    }

    public isSelected(report: any): boolean {
        return this.currentReport === report ? true : false;
    }

    public isList(): boolean {
        return this.layoutType === AnalyticsReportListComponent.LAYOUT_LIST;
    }

    public isGrid(): boolean {
        return this.layoutType === AnalyticsReportListComponent.LAYOUT_GRID;
    }
}
