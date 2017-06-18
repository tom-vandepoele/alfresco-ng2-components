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

import { AfterContentChecked, AfterViewInit, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormFieldModel, TabModel } from './../core/index';

declare var componentHandler: any;

@Component({
    selector: 'tabs-widget',
    templateUrl: './tabs.widget.html'
})
export class TabsWidget implements AfterContentChecked, AfterViewInit {

    @Input()
    public tabs: TabModel[] = [];

    @Output()
    public formTabChanged: EventEmitter<FormFieldModel> = new EventEmitter<FormFieldModel>();

    public visibleTabs: TabModel[] = [];

    public hasTabs(): boolean {
        return this.tabs && this.tabs.length > 0;
    }

    public ngAfterContentChecked(): void {
        this.filterVisibleTabs();
    }

    public ngAfterViewInit(): void {
        this.setupMaterialComponents();
    }

    public filterVisibleTabs(): void {
        this.visibleTabs = this.tabs.filter((tab) => {
            return tab.isVisible;
        });
    }

    public setupMaterialComponents(): boolean {
        // workaround for MDL issues with dynamic components
        if (componentHandler) {
            componentHandler.upgradeAllRegistered();
            return true;
        }
        return false;
    }

    public tabChanged(field: FormFieldModel): void {
        this.formTabChanged.emit(field);
    }

}
