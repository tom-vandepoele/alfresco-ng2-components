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

import { Component, OnInit } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { FormService } from './../../../services/form.service';
import { WidgetComponent } from './../widget.component';
import { FormFieldOption } from './../core/form-field-option';
import { WidgetVisibilityService } from '../../../services/widget-visibility.service';

@Component({
    selector: 'typeahead-widget',
    templateUrl: './typeahead.widget.html',
    styleUrls: ['./typeahead.widget.css']
})
export class TypeaheadWidget extends WidgetComponent implements OnInit {

    public popupVisible: boolean = false;
    public minTermLength: number = 1;
    public value: string;
    public options: FormFieldOption[] = [];

    constructor(private formService: FormService,
                private visibilityService: WidgetVisibilityService,
                private logService: LogService) {
        super();
    }

    public ngOnInit(): void {
        if (this.field.form.taskId) {
            this.getValuesByTaskId();
        } else {
            this.getValuesByProcessDefinitionId();
        }
    }

    public getValuesByTaskId(): void {
        this.formService
            .getRestFieldValues(
                this.field.form.taskId,
                this.field.id
            )
            .subscribe(
                (result: FormFieldOption[]) => {
                    let options = result || [];
                    this.field.options = options;

                    let fieldValue = this.field.value;
                    if (fieldValue) {
                        let toSelect = options.find(item => item.id === fieldValue);
                        if (toSelect) {
                            this.value = toSelect.name;
                        }
                    }
                    this.field.updateForm();
                    this.visibilityService.refreshEntityVisibility(this.field);
                },
                err => this.handleError(err)
            );
    }

    public getValuesByProcessDefinitionId(): void {
        this.formService
            .getRestFieldValuesByProcessId(
                this.field.form.processDefinitionId,
                this.field.id
            )
            .subscribe(
                (result: FormFieldOption[]) => {
                    let options = result || [];
                    this.field.options = options;

                    let fieldValue = this.field.value;
                    if (fieldValue) {
                        let toSelect = options.find(item => item.id === fieldValue);
                        if (toSelect) {
                            this.value = toSelect.name;
                        }
                    }
                    this.field.updateForm();
                    this.visibilityService.refreshEntityVisibility(this.field);
                },
                err => this.handleError(err)
            );
    }

    public getOptions(): FormFieldOption[] {
        let val = this.value.toLocaleLowerCase();
        return this.field.options.filter(item => {
            let name = item.name.toLocaleLowerCase();
            return name.indexOf(val) > -1;
        });
    }

    onKeyUp() {
        if (this.value && this.value.length >= this.minTermLength) {
            this.options = this.getOptions();
            this.popupVisible = this.options.length > 0;
        } else {
            this.popupVisible = false;
        }
    }

    public onBlur(): void {
        setTimeout(() => {
            this.flushValue();
            this.checkVisibility();
        }, 200);
    }

    public flushValue(): void {
        this.popupVisible = false;

        let options = this.field.options || [];
        let lValue = this.value ? this.value.toLocaleLowerCase() : null;

        let field = options.find(item => item.name && item.name.toLocaleLowerCase() === lValue);
        if (field) {
            this.field.value = field.id;
            this.value = field.name;
        } else {
            this.field.value = null;
            this.value = null;
        }

        // TODO: seems to be not needed as field.value setter calls it
        this.field.updateForm();
    }

    // TODO: still causes onBlur execution
    public onItemClick(item: FormFieldOption, event: Event): void {
        if (item) {
            this.field.value = item.id;
            this.value = item.name;
            this.checkVisibility();
        }
        if (event) {
            event.preventDefault();
        }
    }

    private handleError(error: any): void {
        this.logService.error(error);
    }

    public checkVisibility(): void {
        this.visibilityService.refreshVisibility(this.field.form);
    }

}
