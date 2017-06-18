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

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AlfrescoTranslationService, LogService } from 'ng2-alfresco-core';
import { ReportQuery } from '../models/report.model';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsGeneratorComponent } from './analytics-generator.component';

@Component({
    selector: 'activiti-analytics',
    templateUrl: './analytics.component.html',
    styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnChanges {

    @Input()
    public appId: number;

    @Input()
    public reportId: number;

    @Input()
    public hideParameters: boolean = false;

    @Input()
    public  debug: boolean = false;

    @Output()
    public editReport = new EventEmitter();

    @Output()
    public reportSaved = new EventEmitter();

    @Output()
    public reportDeleted = new EventEmitter();

    @ViewChild('analyticsgenerator')
    public analyticsgenerator: AnalyticsGeneratorComponent;

    public reportParamQuery: ReportQuery;

    constructor(private translateService: AlfrescoTranslationService,
                private analyticsService: AnalyticsService,
                private logService: LogService) {
        logService.info('AnalyticsComponent');
        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-analytics', 'assets/ng2-activiti-analytics');
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        this.analyticsgenerator.reset();
    }

    public showReport($event): void {
        this.analyticsgenerator.generateReport(this.reportId, $event);
    }

    public reset(): void {
        this.analyticsgenerator.reset();
    }

    public onEditReport(name: string): void {
        this.editReport.emit(name);
    }

    public onSaveReportSuccess(reportId): void {
        this.reportSaved.emit(reportId);
    }

    public onDeleteReportSuccess(): void {
        this.reportDeleted.emit();
    }

}
