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

import {DatePipe} from '@angular/common';
import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {TaskDetailsEvent} from 'ng2-activiti-tasklist';
import {AlfrescoTranslationService, LogService} from 'ng2-alfresco-core';

import {ProcessInstance} from '../models/process-instance.model';
import {ActivitiProcessService} from './../services/activiti-process.service';
import {ActivitiProcessInstanceHeader} from './activiti-process-instance-header.component';
import {ActivitiProcessInstanceTasks} from './activiti-process-instance-tasks.component';

@Component({
    selector: 'activiti-process-instance-details',
    templateUrl: './activiti-process-instance-details.component.html',
    styleUrls: ['./activiti-process-instance-details.component.css']
})
export class ActivitiProcessInstanceDetails implements OnChanges {

    @Input()
    public processInstanceId: string;

    @ViewChild(ActivitiProcessInstanceHeader)
    public processInstanceHeader: ActivitiProcessInstanceHeader;

    @ViewChild(ActivitiProcessInstanceTasks)
    public tasksList: ActivitiProcessInstanceTasks;

    @Input()
    public showTitle: boolean = true;

    @Input()
    public showRefreshButton: boolean = true;

    @Output()
    public processCancelled: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public error: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public taskClick: EventEmitter<TaskDetailsEvent> = new EventEmitter<TaskDetailsEvent>();

    public processInstanceDetails: ProcessInstance;

    @Output()
    public showProcessDiagram: EventEmitter<any> = new EventEmitter<any>();

    /**
     * Constructor
     * @param translate Translation service
     * @param activitiProcess   Process service
     */
    constructor(private translate: AlfrescoTranslationService,
                private activitiProcess: ActivitiProcessService,
                private logService: LogService) {

        if (translate) {
            translate.addTranslationFolder('ng2-activiti-processlist', 'assets/ng2-activiti-processlist');
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.processInstanceId && !changes.processInstanceId.currentValue) {
            this.reset();
            return;
        }
        if (changes.processInstanceId && changes.processInstanceId.currentValue) {
            this.load(changes.processInstanceId.currentValue);
            return;
        }
    }

    /**
     * Reset the task detail to undefined
     */
    public reset(): void {
        this.processInstanceDetails = null;
    }

    public load(processId: string): void {
        if (processId) {
            this.activitiProcess.getProcess(processId).subscribe(
                (res: ProcessInstance) => {
                    this.processInstanceDetails = res;
                }
            );
        }
    }

    public isRunning(): boolean {
        return this.processInstanceDetails && !this.processInstanceDetails.ended;
    }

    public cancelProcess(): void {
        this.activitiProcess.cancelProcess(this.processInstanceId).subscribe(
            (data) => {
                this.processCancelled.emit(data);
            }, (err) => {
                this.error.emit(err);
            });
    }

    // bubbles (taskClick) event
    public onTaskClicked(event: TaskDetailsEvent): void {
        this.taskClick.emit(event);
    }

    public getProcessNameOrDescription(dateFormat): string {
        let name = '';
        if (this.processInstanceDetails) {
            name = this.processInstanceDetails.name ||
                this.processInstanceDetails.processDefinitionName + ' - ' + this.getFormatDate(this.processInstanceDetails.started, dateFormat);
        }
        return name;
    }

    public getFormatDate(value, format: string): any {
        let datePipe = new DatePipe('en-US');
        try {
            return datePipe.transform(value, format);
        } catch (err) {
            this.logService.error(`ProcessListInstanceHeader: error parsing date ${value} to format ${format}`);
        }
    }

    public onShowProcessDiagram(event: any): void {
        this.showProcessDiagram.emit(event);
    }

}
