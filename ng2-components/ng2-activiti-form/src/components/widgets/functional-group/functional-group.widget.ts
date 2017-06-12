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

import { Component, ElementRef, OnInit } from '@angular/core';
import { FormService } from '../../../services/form.service';
import { GroupModel } from './../core/group.model';
import { WidgetComponent } from './../widget.component';

@Component({
    selector: 'functional-group-widget',
    templateUrl: './functional-group.widget.html',
    styleUrls: ['./functional-group.widget.css']
})
export class FunctionalGroupWidget extends WidgetComponent implements OnInit {

    public value: string;
    public popupVisible: boolean = false;
    public groups: GroupModel[] = [];
    public minTermLength: number = 1;
    public groupId: string;

    constructor(private formService: FormService,
                private elementRef: ElementRef) {
        super();
    }

    // TODO: investigate, called 2 times
    // https://github.com/angular/angular/issues/6782
    public ngOnInit(): void {
        if (this.field) {
            let group = this.field.value;
            if (group) {
                this.value = group.name;
            }

            let params = this.field.params;
            if (params && params['restrictWithGroup']) {
                let restrictWithGroup = <GroupModel> params['restrictWithGroup'];
                this.groupId = restrictWithGroup.id;
            }

            // Load auto-completion for previously saved value
            if (this.value) {
                this.formService
                    .getWorkflowGroups(this.value, this.groupId)
                    .subscribe((result: GroupModel[]) => this.groups = result || []);
            }
        }
    }

    public onKeyUp(event: KeyboardEvent): void {
        if (this.value && this.value.length >= this.minTermLength) {
            this.formService.getWorkflowGroups(this.value, this.groupId)
                .subscribe((result: GroupModel[]) => {
                    this.groups = result || [];
                    this.popupVisible = this.groups.length > 0;
                });
        } else {
            this.popupVisible = false;
        }
    }

    public onBlur(): void {
        setTimeout(() => {
            this.flushValue();
        }, 200);
    }

    public flushValue(): void {
        this.popupVisible = false;

        let option = this.groups.find((item) => item.name.toLocaleLowerCase() === this.value.toLocaleLowerCase());

        if (option) {
            this.field.value = option;
            this.value = option.name;
        } else {
            this.field.value = null;
            this.value = null;
        }

        this.field.updateForm();
    }

    // TODO: still causes onBlur execution
    public onItemClick(item: GroupModel, event: Event): void {
        if (item) {
            this.field.value = item;
            this.value = item.name;
        }
        if (event) {
            event.preventDefault();
        }
    }

    public setupMaterialComponents(handler: any): boolean {
        super.setupMaterialComponents(handler);
        if (handler) {
            if (this.elementRef && this.value) {
                this.setupMaterialTextField(this.elementRef, handler, this.value);
                return true;
            }
        }
        return false;
    }
}
