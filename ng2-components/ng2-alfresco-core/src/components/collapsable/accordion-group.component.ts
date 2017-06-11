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

import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
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

    public _isOpen: boolean = false;
    public _isSelected: boolean = false;

    @Input()
    set isOpen(value: boolean) {
        this._isOpen = value;
        if (value) {
            this.accordion.closeOthers(this);
        }
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    @Input()
    set isSelected(value: boolean) {
        this._isSelected = value;
    }

    get isSelected(): boolean {
        return this._isSelected;
    }

    constructor(private accordion: AccordionComponent) {
        this.accordion.addGroup(this);
    }

    public ngOnDestroy(): void {
        this.accordion.removeGroup(this);
    }

    public hasHeadingIcon(): boolean {
        return this.headingIcon ? true : false;
    }

    public toggleOpen(event: MouseEvent): void {
        event.preventDefault();
        this._isOpen = !this._isOpen;
        this.headingClick.emit(this.heading);
    }

    public getAccordionIcon(): string {
        return this._isOpen ? 'expand_less' : 'expand_more';
    }

}
