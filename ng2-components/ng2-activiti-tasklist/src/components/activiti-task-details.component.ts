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
    Component,
    DebugElement,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    TemplateRef,
    ViewChild
} from '@angular/core';
import { ContentLinkModel, FormModel, FormOutcomeEvent, FormService } from 'ng2-activiti-form';
import { AlfrescoTranslationService, LogService } from 'ng2-alfresco-core';
import { TaskQueryRequestRepresentationModel } from '../models/filter.model';
import { TaskDetailsModel } from '../models/task-details.model';
import { User } from '../models/user.model';
import { ActivitiTaskListService } from './../services/activiti-tasklist.service';

declare var require: any;

@Component({
    selector: 'activiti-task-details',
    templateUrl: './activiti-task-details.component.html',
    styleUrls: ['./activiti-task-details.component.css']
})
export class ActivitiTaskDetails implements OnInit, OnChanges {

    @ViewChild('activiticomments')
    public activiticomments: any;

    @ViewChild('activitichecklist')
    public activitichecklist: any;

    @ViewChild('errorDialog')
    public errorDialog: DebugElement;

    @Input()
    public debugMode: boolean = false;

    @Input()
    public taskId: string;

    @Input()
    public showNextTask: boolean = true;

    @Input()
    public showHeader: boolean = true;

    @Input()
    public showHeaderContent: boolean = true;

    @Input()
    public showInvolvePeople: boolean = true;

    @Input()
    public showComments: boolean = true;

    @Input()
    public showChecklist: boolean = true;

    @Input()
    public showFormTitle: boolean = true;

    @Input()
    public showFormCompleteButton: boolean = true;

    @Input()
    public showFormSaveButton: boolean = true;

    @Input()
    public readOnlyForm: boolean = false;

    @Input()
    public showFormRefreshButton: boolean = true;

    @Input()
    public peopleIconImageUrl: string = require('../assets/images/user.jpg');

    @Output()
    public formSaved: EventEmitter<FormModel> = new EventEmitter<FormModel>();

    @Output()
    public formCompleted: EventEmitter<FormModel> = new EventEmitter<FormModel>();

    @Output()
    public formContentClicked: EventEmitter<ContentLinkModel> = new EventEmitter<ContentLinkModel>();

    @Output()
    public formLoaded: EventEmitter<FormModel> = new EventEmitter<FormModel>();

    @Output()
    public taskCreated: EventEmitter<TaskDetailsModel> = new EventEmitter<TaskDetailsModel>();

    @Output()
    public taskDeleted: EventEmitter<string> = new EventEmitter<string>();

    @Output()
    public onError: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public executeOutcome: EventEmitter<FormOutcomeEvent> = new EventEmitter<FormOutcomeEvent>();

    public taskDetails: TaskDetailsModel;
    public taskFormName: string = null;

    public taskPeople: User[] = [];

    public noTaskDetailsTemplateComponent: TemplateRef<any>;

    /**
     * Constructor
     * @param auth Authentication service
     * @param translate Translation service
     * @param activitiForm Form service
     * @param activitiTaskList Task service
     */
    constructor(private translateService: AlfrescoTranslationService,
                private activitiForm: FormService,
                private activitiTaskList: ActivitiTaskListService,
                private logService: LogService) {

        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-tasklist', 'assets/ng2-activiti-tasklist');
        }
    }

    public ngOnInit(): void {
        if (this.taskId) {
            this.loadDetails(this.taskId);
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        let taskId = changes.taskId;
        if (taskId && !taskId.currentValue) {
            this.reset();
            return;
        }
        if (taskId && taskId.currentValue) {
            this.loadDetails(taskId.currentValue);
            return;
        }
    }

    /**
     * Reset the task details
     */
    private reset(): void {
        this.taskDetails = null;
    }

    /**
     * Check if the task has a form
     * @returns {boolean}
     */
    public hasFormKey(): boolean {
        return (this.taskDetails && this.taskDetails.formKey && this.taskDetails.formKey !== 'null');
    }

    public isTaskActive(): boolean {
        return this.taskDetails && this.taskDetails.duration === null;
    }

    /**
     * Load the activiti task details
     * @param taskId
     */
    private loadDetails(taskId: string): void {
        this.taskPeople = [];
        this.taskFormName = null;
        if (taskId) {
            this.activitiTaskList.getTaskDetails(taskId).subscribe(
                (res: TaskDetailsModel) => {
                    this.taskDetails = res;

                    if (this.taskDetails.name === 'null') {
                        this.taskDetails.name = 'No name';
                    }

                    let endDate: any = res.endDate;
                    this.readOnlyForm = this.readOnlyForm ? this.readOnlyForm : !!(endDate && !isNaN(endDate.getTime()));
                    if (this.taskDetails && this.taskDetails.involvedPeople) {
                        this.taskDetails.involvedPeople.forEach((user) => {
                            this.taskPeople.push(new User(user));
                        });
                    }
                });
        }
    }

    public isAssignedToMe(): boolean {
        return this.taskDetails.assignee ? true : false;
    }

    /**
     * Retrieve the next open task
     * @param processInstanceId
     * @param processDefinitionId
     */
    private loadNextTask(processInstanceId: string, processDefinitionId: string): void {
        let requestNode = new TaskQueryRequestRepresentationModel(
            {
                processInstanceId,
                processDefinitionId
            }
        );
        this.activitiTaskList.getTasks(requestNode).subscribe(
            (response) => {
                if (response && response.length > 0) {
                    this.taskDetails = response[0];
                } else {
                    this.reset();
                }
            }, (error) => {
                this.onError.emit(error);
            });
    }

    /**
     * Complete button clicked
     */
    public onComplete(): void {
        this.activitiTaskList.completeTask(this.taskId).subscribe(
            (res) => this.onFormCompleted(null)
        );
    }

    public onFormContentClick(content: ContentLinkModel): void {
        this.formContentClicked.emit(content);
    }

    public onFormSaved(form: FormModel): void {
        this.formSaved.emit(form);
    }

    public onFormCompleted(form: FormModel): void {
        this.formCompleted.emit(form);
        if (this.showNextTask) {
            this.loadNextTask(this.taskDetails.processInstanceId, this.taskDetails.processDefinitionId);
        }
    }

    public onFormLoaded(form: FormModel): void {
        this.taskFormName = null;
        if (form && form.name) {
            this.taskFormName = form.name;
        }
        this.formLoaded.emit(form);
    }

    public onChecklistTaskCreated(task: TaskDetailsModel): void {
        this.taskCreated.emit(task);
    }

    public onChecklistTaskDeleted(taskId: string): void {
        this.taskDeleted.emit(taskId);
    }

    public onFormError(error: any): void {
        this.errorDialog.nativeElement.showModal();
        this.onError.emit(error);
    }

    public onFormExecuteOutcome(event: FormOutcomeEvent): void {
        this.executeOutcome.emit(event);
    }

    public closeErrorDialog(): void {
        this.errorDialog.nativeElement.close();
    }

    public onClaimTask(taskId: string): void {
        this.loadDetails(taskId);
    }

    public toggleHeaderContent(): void {
        this.showHeaderContent = !this.showHeaderContent;
    }
}
