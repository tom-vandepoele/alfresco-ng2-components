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

import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TaskDetailsEvent, TaskDetailsModel } from 'ng2-activiti-tasklist';
import { AlfrescoTranslationService, LogService } from 'ng2-alfresco-core';
import { Observable, Observer } from 'rxjs/Rx';
import { ProcessInstance } from '../models/process-instance.model';
import { ActivitiProcessService } from './../services/activiti-process.service';

declare let componentHandler: any;
declare let dialogPolyfill: any;

@Component({
    selector: 'activiti-process-instance-tasks',
    templateUrl: './activiti-process-instance-tasks.component.html',
    styleUrls: ['./activiti-process-instance-tasks.component.css']
})
export class ActivitiProcessInstanceTasks implements OnInit, OnChanges {

    @Input()
    public processInstanceDetails: ProcessInstance;

    @Input()
    public showRefreshButton: boolean = true;

    @Output()
    public error: EventEmitter<any> = new EventEmitter<any>();

    public activeTasks: TaskDetailsModel[] = [];
    public completedTasks: TaskDetailsModel[] = [];

    private taskObserver: Observer<TaskDetailsModel>;
    private completedTaskObserver: Observer<TaskDetailsModel>;

    public task$: Observable<TaskDetailsModel>;
    public completedTask$: Observable<TaskDetailsModel>;

    public message: string;
    public processId: string;

    @ViewChild('dialog')
    public dialog: any;

    @ViewChild('startDialog')
    public startDialog: any;

    @ViewChild('taskdetails')
    public taskdetails: any;

    @Output()
    public taskClick: EventEmitter<TaskDetailsEvent> = new EventEmitter<TaskDetailsEvent>();

    constructor(private translate: AlfrescoTranslationService,
                private activitiProcess: ActivitiProcessService,
                private logService: LogService) {
        if (translate) {
            translate.addTranslationFolder('ng2-activiti-processlist', 'assets/ng2-activiti-processlist');
        }

        this.task$ = new Observable<TaskDetailsModel>((observer) => this.taskObserver = observer).share();
        this.completedTask$ = new Observable<TaskDetailsModel>((observer) => this.completedTaskObserver = observer).share();
    }

    public  ngOnInit(): void {
        this.task$.subscribe((task: TaskDetailsModel) => {
            this.activeTasks.push(task);
        });
        this.completedTask$.subscribe((task: TaskDetailsModel) => {
            this.completedTasks.push(task);
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {
        let processInstanceDetails = changes.processInstanceDetails;
        if (processInstanceDetails && processInstanceDetails.currentValue) {
            this.load(processInstanceDetails.currentValue.id);
        }
    }

    public load(processId: string): void {
        this.loadActive(processId);
        this.loadCompleted(processId);
    }

    public loadActive(processId: string): void {
        this.activeTasks = [];
        if (processId) {
            this.activitiProcess.getProcessTasks(processId, null).subscribe(
                (res: TaskDetailsModel[]) => {
                    res.forEach((task) => {
                        this.taskObserver.next(task);
                    });
                },
                (err) => {
                    this.error.emit(err);
                }
            );
        } else {
            this.activeTasks = [];
        }
    }

    public loadCompleted(processId: string): void {
        this.completedTasks = [];
        if (processId) {
            this.activitiProcess.getProcessTasks(processId, 'completed').subscribe(
                (res: TaskDetailsModel[]) => {
                    res.forEach((task) => {
                        this.completedTaskObserver.next(task);
                    });
                },
                (err) => {
                    this.error.emit(err);
                }
            );
        } else {
            this.completedTasks = [];
        }
    }

    public hasStartFormDefined(): boolean {
        return this.processInstanceDetails && this.processInstanceDetails.startFormDefined === true;
    }

    public getUserFullName(user: any): string {
        if (user) {
            return (user.firstName && user.firstName !== 'null'
                    ? user.firstName + ' ' : '') +
                user.lastName;
        }
        return 'Nobody';
    }

    public getFormatDate(value, format: string): any {
        let datePipe = new DatePipe('en-US');
        try {
            return datePipe.transform(value, format);
        } catch (err) {
            this.logService.error(`ProcessListInstanceTask: error parsing date ${value} to format ${format}`);
        }
    }

    public clickTask($event: any, task: TaskDetailsModel): void {
        let args = new TaskDetailsEvent(task);
        this.taskClick.emit(args);
    }

    public clickStartTask(): void {
        this.processId = this.processInstanceDetails.id;
        this.showStartDialog();
    }

    public showStartDialog(): void {
        if (!this.startDialog.nativeElement.showModal) {
            dialogPolyfill.registerDialog(this.startDialog.nativeElement);
        }

        if (this.startDialog) {
            this.startDialog.nativeElement.showModal();
        }
    }

    public closeSartDialog(): void {
        if (this.startDialog) {
            this.startDialog.nativeElement.close();
        }
    }

    public onRefreshClicked(): void {
        this.load(this.processInstanceDetails.id);
    }

    public  onFormContentClick(): void {
        if (this.startDialog) {
            this.startDialog.nativeElement.close();
        }
    }
}
