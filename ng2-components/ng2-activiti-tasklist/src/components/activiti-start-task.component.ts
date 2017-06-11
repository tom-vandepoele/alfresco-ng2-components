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

import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AlfrescoTranslationService, LogService } from 'ng2-alfresco-core';
import { Form } from '../models/form.model';
import { TaskDetailsModel } from '../models/task-details.model';
import { ActivitiTaskListService } from './../services/activiti-tasklist.service';

declare let dialogPolyfill: any;

@Component({
    selector: 'activiti-start-task',
    templateUrl: './activiti-start-task.component.html',
    styleUrls: ['./activiti-start-task.component.css']
})
export class ActivitiStartTaskButton {

    @Input()
    public appId: string;

    @Output()
    public onSuccess: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public error: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('dialog')
    public dialog: any;

    public forms: Form [];

    public formId: string = null;

    public name: string;
    public description: string;

    /**
     * Constructor
     * @param auth
     * @param translate
     * @param taskService
     */
    constructor(private translateService: AlfrescoTranslationService,
                private taskService: ActivitiTaskListService,
                private logService: LogService) {

        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-tasklist', 'assets/ng2-activiti-tasklist');
        }
    }

    public start(): void {
        if (this.name) {
            this.taskService.createNewTask(new TaskDetailsModel({
                name: this.name,
                description: this.description,
                category: this.appId ? '' + this.appId : null
            })).subscribe(
                (res: any) => {
                    this.onSuccess.emit(res);
                    this.closeDialog();
                    this.resetForm();
                    this.attachForm(res.id);
                },
                () => {
                    this.logService.error('An error occurred while trying to add the task');
                }
            );
        }
    }

    private attachForm(taskId: string): void {
        if (this.formId && taskId) {
            this.taskService.attachFormToATask(taskId, Number(this.formId));
            this.formId = null;
        }
    }

    public cancel(): void {
        this.closeDialog();
    }

    public showDialog(): void {
        if (!this.dialog.nativeElement.showModal) {
            dialogPolyfill.registerDialog(this.dialog.nativeElement);
        }

        this.loadFormsTask();

        if (this.dialog) {
            this.dialog.nativeElement.showModal();
        }
    }

    private loadFormsTask(): void {
        this.taskService.getFormList().subscribe((res: Form[]) => {
                this.forms = res;
            },
            (err) => {
                this.error.emit(err);
                this.logService.error('An error occurred while trying to get the forms');
            });
    }

    private closeDialog(): void {
        if (this.dialog) {
            this.dialog.nativeElement.close();
        }
    }

    private resetForm(): void {
        this.name = '';
        this.description = '';
    }
}
