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

import { Component, Input, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { AccordionComponent } from './accordion.component';

@Component({
    selector: 'adf-accordion-group',
    templateUrl: 'accordion-group.component.html',
    styleUrls: ['./accordion-group.component.css']

})
export class AccordionGroupComponent implements OnDestroy {

    @ViewChild('contentWrapper')
    public contentWrapper: any;

    @Input()
    public heading: string;

    @Input()
    public headingIcon: string;

    @Input()
    public hasAccordionIcon: boolean = true;

    @Output()
    public headingClick: EventEmitter<any> = new EventEmitter<any>();

    public isOpen: boolean = false;
    public isSelected: boolean = false;

    @Input()
    set isOpen(value: boolean) {
        this.isOpen = value;
        if (value) {
            this.accordion.closeOthers(this);
        }
    }

    get isOpen() {
        return this.isOpen;
    }

    @Input()
    set isSelected(value: boolean) {
        this.isSelected = value;
    }

    get isSelected() {
        return this.isSelected;
    }

    constructor(private accordion: AccordionComponent) {
        this.accordion.addGroup(this);
    }

    public ngOnDestroy() {
        this.accordion.removeGroup(this);
    }

    public hasHeadingIcon() {
        return this.headingIcon ? true : false;
    }

    public toggleOpen(event: MouseEvent): void {
        event.preventDefault();
        this.isOpen = !this.isOpen;
        this.headingClick.emit(this.heading);
    }

    public getAccordionIcon(): string {
        return this.isOpen ? 'expand_less' : 'expand_more';
    }

}
