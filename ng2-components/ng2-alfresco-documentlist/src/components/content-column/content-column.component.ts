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

import { AfterContentInit, Component, ContentChild, Input, OnInit, TemplateRef } from '@angular/core';
import { DataColumn } from 'ng2-alfresco-datatable';

import { ContentColumnListComponent } from './content-column-list.component';

@Component({
    selector: 'content-column',
    template: ''
})
export class ContentColumnComponent implements OnInit, AfterContentInit, DataColumn {

    @Input()
    public key: string;

    @Input()
    public type: string = 'text';

    @Input()
    public format: string;

    @Input()
    public sortable: boolean = false;

    @Input()
    public title: string = '';

    @ContentChild(TemplateRef)
    public template: any;

    /**
     * Title to be used for screen readers.
     */
    @Input('sr-title')
    public srTitle: string;

    @Input('class')
    public cssClass: string;

    constructor(private list: ContentColumnListComponent) {
    }

    public ngOnInit(): void {
        if (!this.srTitle && this.key === '$thumbnail') {
            this.srTitle = 'Thumbnail';
        }
    }

    public ngAfterContentInit(): void {
        this.register();
    }

    public register(): boolean {
        if (this.list) {
            return this.list.registerColumn(this);
        }
        return false;
    }
}
