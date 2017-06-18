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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WidgetComponent } from './../widget.component';

@Component({
    selector: 'dropdown-widget',
    templateUrl: './dropdown.widget.html',
    styleUrls: ['./dropdown.widget.css']
})
export class DropdownWidget extends WidgetComponent {

    @Input()
    public field: any;

    @Input('group')
    public formGroup: FormGroup;

    @Input('controllerName')
    public controllerName: string;

    @Output()
    public fieldChanged: EventEmitter<any> = new EventEmitter<any>();

    @Input()
    public showDefaultOption: boolean = true;

    @Input()
    public required: boolean = false;

    @Input()
    public defaultOptionText: string = 'Choose One';

    constructor() {
        super();
    }

    public ngOnInit(): void {
        if (this.required) {
            this.formGroup.get(this.controllerName).setValidators(Validators.compose(this.buildValidatorList()));
        }
    }

    public validateDropDown(controller: FormControl): any {
        return controller.value !== 'null' ? null : {controllerName: false};
    }

    public buildValidatorList(): any[] {
        let validatorList = [];
        validatorList.push(Validators.required);
        if (this.showDefaultOption) {
            validatorList.push(this.validateDropDown);
        }
        return validatorList;
    }
}
