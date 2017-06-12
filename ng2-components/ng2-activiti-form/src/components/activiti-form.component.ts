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

import { AfterViewChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { FormErrorEvent, FormEvent } from './../events/index';
import { EcmModelService } from './../services/ecm-model.service';
import { FormService } from './../services/form.service';
import { NodeService } from './../services/node.service';
import { ContentLinkModel } from './widgets/core/content-link.model';
import { FormFieldModel, FormModel, FormOutcomeEvent, FormOutcomeModel, FormValues } from './widgets/core/index';

import { WidgetVisibilityService }  from './../services/widget-visibility.service';

declare var componentHandler: any;

@Component({
    selector: 'activiti-form',
    templateUrl: './activiti-form.component.html',
    styleUrls: ['./activiti-form.component.css']
})
export class ActivitiForm implements OnInit, AfterViewChecked, OnChanges {

    public static SAVE_OUTCOME_ID: string = '$save';
    public static COMPLETE_OUTCOME_ID: string = '$complete';
    public static START_PROCESS_OUTCOME_ID: string = '$startProcess';
    public static CUSTOM_OUTCOME_ID: string = '$custom';

    @Input()
    public taskId: string;

    @Input()
    public nodeId: string;

    @Input()
    public formId: string;

    @Input()
    public formName: string;

    @Input()
    public saveMetadata: boolean = false;

    @Input()
    public data: FormValues;

    @Input()
    public path: string;

    @Input()
    public nameNode: string;

    @Input()
    public showTitle: boolean = true;

    @Input()
    public showCompleteButton: boolean = true;

    @Input()
    public showSaveButton: boolean = true;

    @Input()
    public  showDebugButton: boolean = false;

    @Input()
    public readOnly: boolean = false;

    @Input()
    public showRefreshButton: boolean = true;

    @Input()
    public showValidationIcon: boolean = true;

    @Output()
    public formSaved: EventEmitter<FormModel> = new EventEmitter<FormModel>();

    @Output()
    public formCompleted: EventEmitter<FormModel> = new EventEmitter<FormModel>();

    @Output()
    public formContentClicked: EventEmitter<ContentLinkModel> = new EventEmitter<ContentLinkModel>();

    @Output()
    public formLoaded: EventEmitter<FormModel> = new EventEmitter<FormModel>();

    @Output()
    public executeOutcome: EventEmitter<FormOutcomeEvent> = new EventEmitter<FormOutcomeEvent>();

    @Output()
    public onError: EventEmitter<any> = new EventEmitter<any>();

    public form: FormModel;

    public debugMode: boolean = false;

    constructor(protected formService: FormService,
                protected visibilityService: WidgetVisibilityService,
                private ecmModelService: EcmModelService,
                private nodeService: NodeService,
                private logService: LogService) {
    }

    public hasForm(): boolean {
        return this.form ? true : false;
    }

    public isTitleEnabled(): boolean {
        if (this.showTitle) {
            if (this.form && this.form.taskName) {
                return true;
            }
        }
        return false;
    }

    public isOutcomeButtonEnabled(outcome: FormOutcomeModel): boolean {
        if (this.form.readOnly) {
            return false;
        }

        if (outcome) {
            // Make 'Save' button always available
            if (outcome.name === FormOutcomeModel.SAVE_ACTION) {
                return true;
            }
            return this.form.isValid;
        }
        return false;
    }

    public isOutcomeButtonVisible(outcome: FormOutcomeModel, isFormReadOnly: boolean): boolean {
        if (outcome && outcome.name) {
            if (outcome.name === FormOutcomeModel.COMPLETE_ACTION) {
                return this.showCompleteButton;
            }
            if (isFormReadOnly) {
                return outcome.isSelected;
            }
            if (outcome.name === FormOutcomeModel.SAVE_ACTION) {
                return this.showSaveButton;
            }
            if (outcome.name === FormOutcomeModel.START_PROCESS_ACTION) {
                return false;
            }
            return true;
        }
        return false;
    }

    public ngOnInit(): void {
        this.formService.formContentClicked.subscribe((content: ContentLinkModel) => {
            this.formContentClicked.emit(content);
        });

        if (this.nodeId) {
            this.loadFormForEcmNode();
        } else {
            this.loadForm();
        }
    }

    public ngAfterViewChecked(): void {
        this.setupMaterialComponents();
    }

    public  ngOnChanges(changes: SimpleChanges): any {
        let taskId = changes.taskId;
        if (taskId && taskId.currentValue) {
            this.getFormByTaskId(taskId.currentValue);
            return;
        }

        let formId = changes.formId;
        if (formId && formId.currentValue) {
            this.getFormDefinitionByFormId(formId.currentValue);
            return;
        }

        let formName = changes.formName;
        if (formName && formName.currentValue) {
            this.getFormDefinitionByFormName(formName.currentValue);
            return;
        }

        let nodeId = changes.nodeId;
        if (nodeId && nodeId.currentValue) {
            this.loadFormForEcmNode();
            return;
        }
    }

    /**
     * Invoked when user clicks outcome button.
     * @param outcome Form outcome model
     * @returns {boolean} True if outcome action was executed, otherwise false.
     */
    public onOutcomeClicked(outcome: FormOutcomeModel): boolean {
        if (!this.readOnly && outcome && this.form) {

            let args = new FormOutcomeEvent(outcome);
            this.executeOutcome.emit(args);
            if (args.defaultPrevented) {
                return false;
            }

            if (outcome.isSystem) {
                if (outcome.id === ActivitiForm.SAVE_OUTCOME_ID) {
                    this.saveTaskForm();
                    return true;
                }

                if (outcome.id === ActivitiForm.COMPLETE_OUTCOME_ID) {
                    this.completeTaskForm();
                    return true;
                }

                if (outcome.id === ActivitiForm.START_PROCESS_OUTCOME_ID) {
                    this.completeTaskForm();
                    return true;
                }

                if (outcome.id === ActivitiForm.CUSTOM_OUTCOME_ID) {
                    this.onTaskSaved(this.form);
                    this.storeFormAsMetadata();
                    return true;
                }
            } else {
                // Note: Activiti is using NAME field rather than ID for outcomes
                if (outcome.name) {
                    this.onTaskSaved(this.form);
                    this.completeTaskForm(outcome.name);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Invoked when user clicks form refresh button.
     */
    public onRefreshClicked(): void {
        this.loadForm();
    }

    public loadForm(): void {
        if (this.taskId) {
            this.getFormByTaskId(this.taskId);
            return;
        }

        if (this.formId) {
            this.getFormDefinitionByFormId(this.formId);
            return;
        }

        if (this.formName) {
            this.getFormDefinitionByFormName(this.formName);
            return;
        }
    }

    public loadFormProcessVariables(taskId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.formService.getTask(taskId).subscribe(
                (task) => {
                    if (this.isAProcessTask(task)) {
                        this.visibilityService.getTaskProcessVariable(taskId).subscribe((_) => {
                            resolve(true);
                        });
                    } else {
                        resolve(true);
                    }
                },
                (error) => {
                    this.handleError(error);
                    resolve(false);
                }
            );
        });
    }

    public isAProcessTask(taskRepresentation): boolean {
        return taskRepresentation.processDefinitionId && taskRepresentation.processDefinitionDeploymentId !== 'null';
    }

    public setupMaterialComponents(): boolean {
        // workaround for MDL issues with dynamic components
        if (componentHandler) {
            componentHandler.upgradeAllRegistered();
            return true;
        }
        return false;
    }

    public getFormByTaskId(taskId: string): Promise<FormModel> {
        return new Promise<FormModel>((resolve, reject) => {
            this.loadFormProcessVariables(this.taskId).then((_) => {
                this.formService
                    .getTaskForm(taskId)
                    .subscribe(
                        (form) => {
                            this.form = new FormModel(form, this.data, this.readOnly, this.formService);
                            this.onFormLoaded(this.form);
                            resolve(this.form);
                        },
                        (error) => {
                            this.handleError(error);
                            // reject(error);
                            resolve(null);
                        }
                    );
            });
        });
    }

    public getFormDefinitionByFormId(formId: string): void {
        this.formService
            .getFormDefinitionById(formId)
            .subscribe(
                (form) => {
                    this.formName = form.name;
                    this.form = this.parseForm(form);
                    this.onFormLoaded(this.form);
                },
                (error) => {
                    this.handleError(error);
                }
            );
    }

    public getFormDefinitionByFormName(formName: string): void {
        this.formService
            .getFormDefinitionByName(formName)
            .subscribe(
                (id) => {
                    this.formService.getFormDefinitionById(id).subscribe(
                        (form) => {
                            this.form = this.parseForm(form);
                            this.onFormLoaded(this.form);
                        },
                        (error) => {
                            this.handleError(error);
                        }
                    );
                },
                (error) => {
                    this.handleError(error);
                }
            );
    }

    public saveTaskForm(): void {
        if (this.form && this.form.taskId) {
            this.formService
                .saveTaskForm(this.form.taskId, this.form.values)
                .subscribe(
                    () => {
                        this.onTaskSaved(this.form);
                        this.storeFormAsMetadata();
                    },
                    (error) => this.onTaskSavedError(this.form, error)
                );
        }
    }

    public completeTaskForm(outcome?: string): void {
        if (this.form && this.form.taskId) {
            this.formService
                .completeTaskForm(this.form.taskId, this.form.values, outcome)
                .subscribe(
                    () => {
                        this.onTaskCompleted(this.form);
                        this.storeFormAsMetadata();
                    },
                    (error) => this.onTaskCompletedError(this.form, error)
                );
        }
    }

    public handleError(err: any): any {
        this.onError.emit(err);
    }

    public parseForm(json: any): FormModel {
        if (json) {
            let form = new FormModel(json, this.data, this.readOnly, this.formService);
            if (!json.fields) {
                form.outcomes = this.getFormDefinitionOutcomes(form);
            }
            return form;
        }
        return null;
    }

    /**
     * Get custom set of outcomes for a Form Definition.
     * @param form Form definition model.
     * @returns {FormOutcomeModel[]} Outcomes for a given form definition.
     */
    public getFormDefinitionOutcomes(form: FormModel): FormOutcomeModel[] {
        return [
            new FormOutcomeModel(form, {id: '$custom', name: FormOutcomeModel.SAVE_ACTION, isSystem: true})
        ];
    }

    public checkVisibility(field: FormFieldModel): void {
        if (field && field.form) {
            this.visibilityService.refreshVisibility(field.form);
        }
    }

    private loadFormForEcmNode(): void {
        this.nodeService.getNodeMetadata(this.nodeId).subscribe((data) => {
                this.data = data.metadata;
                this.loadFormFromActiviti(data.nodeType);
            },
            this.handleError);
    }

    public loadFormFromActiviti(nodeType: string): any {
        this.formService.searchFrom(nodeType).subscribe(
            (form) => {
                if (!form) {
                    this.formService.createFormFromANode(nodeType).subscribe((formMetadata) => {
                        this.loadFormFromFormId(formMetadata.id);
                    });
                } else {
                    this.loadFormFromFormId(form.id);
                }
            },
            (error) => {
                this.handleError(error);
            }
        );
    }

    private loadFormFromFormId(formId: string) {
        this.formId = formId;
        this.loadForm();
    }

    private storeFormAsMetadata() {
        if (this.saveMetadata) {
            this.ecmModelService.createEcmTypeForActivitiForm(this.formName, this.form).subscribe((type) => {
                    this.nodeService.createNodeMetadata(type.nodeType || type.entry.prefixedName, EcmModelService.MODEL_NAMESPACE, this.form.values, this.path, this.nameNode);
                },
                (error) => {
                    this.handleError(error);
                }
            );
        }
    }

    protected onFormLoaded(form: FormModel) {
        this.formLoaded.emit(form);
        this.formService.formLoaded.next(new FormEvent(form));
    }

    protected onTaskSaved(form: FormModel) {
        this.formSaved.emit(form);
        this.formService.taskSaved.next(new FormEvent(form));
    }

    protected onTaskSavedError(form: FormModel, error: any) {
        this.handleError(error);
        this.formService.taskSavedError.next(new FormErrorEvent(form, error));
    }

    protected onTaskCompleted(form: FormModel) {
        this.formCompleted.emit(form);
        this.formService.taskCompleted.next(new FormEvent(form));
    }

    protected onTaskCompletedError(form: FormModel, error: any) {
        this.handleError(error);
        this.formService.taskCompletedError.next(new FormErrorEvent(form, error));
    }
}
