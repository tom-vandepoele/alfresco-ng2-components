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

import {
    AfterContentChecked,
    AfterViewChecked,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { AlfrescoTranslationService, ContentService, LogService } from 'ng2-alfresco-core';
import {
    ParameterValueModel,
    ReportParameterDetailsModel,
    ReportParametersModel,
    ReportQuery
} from '../models/report.model';
import { AnalyticsService } from '../services/analytics.service';

declare var componentHandler;
declare let dialogPolyfill: any;

@Component({
    selector: 'analytics-report-parameters',
    templateUrl: './analytics-report-parameters.component.html',
    styleUrls: ['./analytics-report-parameters.component.css']
})
export class AnalyticsReportParametersComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked, AfterContentChecked {

    public static FORMAT_DATE_ACTIVITI: string = 'YYYY-MM-DD';

    @Input()
    public appId: string;

    @Input()
    public reportId: string;

    @Input()
    public hideComponent: boolean = false;

    @Input()
    public debug: boolean = false;

    @Output()
    public onSuccess = new EventEmitter();

    @Output()
    public onError = new EventEmitter();

    @Output()
    public onEdit = new EventEmitter();

    @Output()
    public onFormValueChanged = new EventEmitter();

    @Output()
    public saveReportSuccess = new EventEmitter();

    @Output()
    public deleteReportSuccess = new EventEmitter();

    @ViewChild('reportNameDialog')
    public reportNameDialog: any;

    public onDropdownChanged = new EventEmitter();

    public onSuccessReportParams = new EventEmitter();

    public onSuccessParamOpt = new EventEmitter();

    public reportParameters: ReportParametersModel;

    public reportForm: FormGroup;

    private dropDownSub;
    private reportParamsSub;
    private paramOpts;
    private isEditable: boolean = false;
    private action: string;
    private reportParamQuery: ReportQuery;
    private reportName: string;
    private hideParameters: boolean = true;
    private formValidState: boolean = false;

    constructor(private translateService: AlfrescoTranslationService,
                private analyticsService: AnalyticsService,
                private formBuilder: FormBuilder,
                private logService: LogService,
                private contentService: ContentService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-analytics', 'assets/ng2-activiti-analytics');
        }
    }

    public ngOnInit(): void {
        this.dropDownSub = this.onDropdownChanged.subscribe((field) => {
            let paramDependOn: ReportParameterDetailsModel = this.reportParameters.definition.parameters.find((p) => p.dependsOn === field.id);
            if (paramDependOn) {
                this.retrieveParameterOptions(this.reportParameters.definition.parameters, this.appId, this.reportId, field.value);
            }
        });

        this.paramOpts = this.onSuccessReportParams.subscribe((report: ReportParametersModel) => {
            if (report.hasParameters()) {
                this.retrieveParameterOptions(report.definition.parameters, this.appId);
                this.generateFormGroupFromParameter(report.definition.parameters);
            }
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {
        this.isEditable = false;
        if (this.reportForm) {
            this.reportForm.reset();
        }
        let reportId = changes.reportId;
        if (reportId && reportId.currentValue) {
            this.getReportParams(reportId.currentValue);
        }

        let appId = changes.appId;
        if (appId && (appId.currentValue || appId.currentValue === null)) {
            this.getReportParams(this.reportId);
        }
    }

    private generateFormGroupFromParameter(parameters: ReportParameterDetailsModel[]): any {
        let formBuilderGroup: any = {};
        parameters.forEach((param: ReportParameterDetailsModel) => {
            switch (param.type) {
                case 'dateRange' :
                    formBuilderGroup.dateRange = new FormGroup({}, Validators.required);
                    break;
                case 'processDefinition':
                    formBuilderGroup.processDefGroup = new FormGroup({
                        processDefinitionId: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                case 'duration':
                    formBuilderGroup.durationGroup = new FormGroup({
                        duration: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                case 'dateInterval':
                    formBuilderGroup.dateIntervalGroup = new FormGroup({
                        dateRangeInterval: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                case 'boolean':
                    formBuilderGroup.typeFilteringGroup = new FormGroup({
                        typeFiltering: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                case 'task':
                    formBuilderGroup.taskGroup = new FormGroup({
                        taskName: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                case 'integer':
                    formBuilderGroup.processInstanceGroup = new FormGroup({
                        slowProcessInstanceInteger: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                case 'status':
                    formBuilderGroup.statusGroup = new FormGroup({
                        status: new FormControl(null, Validators.required, null)
                    }, Validators.required);
                    break;
                default:
                    return;
            }
        });
        this.reportForm = this.formBuilder.group(formBuilderGroup);
        this.reportForm.valueChanges.subscribe((data) => this.onValueChanged(data));
        this.reportForm.statusChanges.subscribe((data) => this.onStatusChanged(data));
    }

    public getReportParams(reportId: string): void {
        this.reportParamsSub = this.analyticsService.getReportParams(reportId).subscribe(
            (res: ReportParametersModel) => {
                this.reportParameters = res;
                if (this.reportParameters.hasParameters()) {
                    this.onSuccessReportParams.emit(res);
                } else {
                    this.reportForm = this.formBuilder.group({});
                    this.onSuccess.emit();
                }
            },
            (err: any) => {
                this.onError.emit(err);
            }
        );
    }

    private retrieveParameterOptions(parameters: ReportParameterDetailsModel[], appId: string, reportId?: string, processDefinitionId?: string): void {
        parameters.forEach((param) => {
            this.analyticsService.getParamValuesByType(param.type, appId, reportId, processDefinitionId).subscribe(
                (opts: ParameterValueModel[]) => {
                    param.options = opts;
                    this.onSuccessParamOpt.emit(opts);
                },
                (err: any) => {
                    this.onError.emit(err);
                }
            );
        });
    }

    public onProcessDefinitionChanges(field: any): void {
        if (field.value) {
            this.onDropdownChanged.emit(field);
        }
    }

    public submit(values: any): void {
        this.reportParamQuery = this.convertFormValuesToReportParamQuery(values);
        this.onSuccess.emit(this.reportParamQuery);
    }

    public  onValueChanged(values: any): void {
        this.onFormValueChanged.emit(values);
        if (this.reportForm && this.reportForm.valid) {
            this.submit(values);
        }
    }

    public onStatusChanged(status: any): void {
        if (this.reportForm && !this.reportForm.pending && this.reportForm.dirty) {
            this.formValidState = this.reportForm.valid;
        }
    }

    public convertMomentDate(date: string): any {
        return moment(date, AnalyticsReportParametersComponent.FORMAT_DATE_ACTIVITI, true)
                .format(AnalyticsReportParametersComponent.FORMAT_DATE_ACTIVITI) + 'T00:00:00.000Z';
    }

    public getTodayDate(): any {
        return moment().format(AnalyticsReportParametersComponent.FORMAT_DATE_ACTIVITI);
    }

    public convertNumber(value: string): number {
        return value != null ? parseInt(value, 10) : 0;
    }

    public convertFormValuesToReportParamQuery(values: any): ReportQuery {
        let reportParamQuery: ReportQuery = new ReportQuery();
        if (values.dateRange) {
            reportParamQuery.dateRange.startDate = this.convertMomentDate(values.dateRange.startDate);
            reportParamQuery.dateRange.endDate = this.convertMomentDate(values.dateRange.endDate);
        }
        if (values.statusGroup) {
            reportParamQuery.status = values.statusGroup.status;
        }
        if (values.processDefGroup) {
            reportParamQuery.processDefinitionId = values.processDefGroup.processDefinitionId;
        }
        if (values.taskGroup) {
            reportParamQuery.taskName = values.taskGroup.taskName;
        }
        if (values.durationGroup) {
            reportParamQuery.duration = values.durationGroup.duration;
        }
        if (values.dateIntervalGroup) {
            reportParamQuery.dateRangeInterval = values.dateIntervalGroup.dateRangeInterval;
        }
        if (values.processInstanceGroup) {
            reportParamQuery.slowProcessInstanceInteger = this.convertNumber(values.processInstanceGroup.slowProcessInstanceInteger);
        }
        if (values.typeFilteringGroup) {
            reportParamQuery.typeFiltering = values.typeFilteringGroup.typeFiltering;
        }
        return reportParamQuery;
    }

    public ngOnDestroy(): void {
        this.dropDownSub.unsubscribe();
        this.paramOpts.unsubscribe();
        if (this.reportParamsSub) {
            this.reportParamsSub.unsubscribe();
        }
    }

    public editEnable(): void {
        this.isEditable = true;
    }

    public editDisable(): void {
        this.isEditable = false;
    }

    public editTitle(): void {
        this.reportParamsSub = this.analyticsService.updateReport(this.reportParameters.id, this.reportParameters.name).subscribe(
            (res: ReportParametersModel) => {
                this.editDisable();
                this.onEdit.emit(this.reportParameters.name);
            },
            (err: any) => {
                this.onError.emit(err);
            }
        );
    }

    public showDialog(event: string): void {
        if (!this.reportNameDialog.nativeElement.showModal) {
            dialogPolyfill.registerDialog(this.reportNameDialog.nativeElement);
        }
        this.reportNameDialog.nativeElement.showModal();
        this.action = event;
        this.reportName = this.reportParameters.name + ' ( ' + this.getTodayDate() + ' )';
    }

    public closeDialog(): void {
        if (this.reportNameDialog) {
            this.reportNameDialog.nativeElement.close();
        }
    }

    public performAction(action: string, reportParamQuery: ReportQuery): void {
        reportParamQuery.reportName = this.reportName;
        this.closeDialog();
        if (action === 'Save') {
            this.doSave(reportParamQuery);
        } else if (action === 'Export') {
            this.doExport(reportParamQuery);
        }
        this.resetActions();
    }

    public resetActions(): void {
        this.action = '';
        this.reportName = '';
    }

    public isSaveAction(): boolean {
        return this.action === 'Save';
    }

    public isFormValid(): boolean {
        return this.reportForm && this.reportForm.dirty && this.reportForm.valid;
    }

    public doExport(paramQuery: ReportQuery): void {
        this.analyticsService.exportReportToCsv(this.reportId, paramQuery).subscribe(
            (data: any) => {
                let blob: Blob = new Blob([data], {type: 'text/csv'});
                this.contentService.downloadBlob(blob, paramQuery.reportName + '.csv');
            });
    }

    public doSave(paramQuery: ReportQuery): void {
        this.analyticsService.saveReport(this.reportId, paramQuery).subscribe(() => {
            this.saveReportSuccess.emit(this.reportId);
        });
    }

    public deleteReport(reportId: string): void {
        this.analyticsService.deleteReport(reportId).subscribe(() => {
            this.deleteReportSuccess.emit(reportId);
        }, (error) => this.logService.error(error));
    }

    public ngAfterViewChecked(): void {
        if (componentHandler) {
            componentHandler.upgradeAllRegistered();
        }
    }

    public ngAfterContentChecked(): void {
        if (this.reportForm && this.reportForm.valid) {
            this.reportForm.markAsDirty();
        }
    }

    public toggleParameters(): void {
        this.hideParameters = !this.hideParameters;
    }

    public isParametersHide(): boolean {
        return this.hideParameters;
    }
}
