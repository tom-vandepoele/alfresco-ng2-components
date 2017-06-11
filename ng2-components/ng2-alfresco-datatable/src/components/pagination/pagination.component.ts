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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Pagination } from 'alfresco-js-api';
import { PaginationData } from '../../models/pagination.data';

@Component({
    selector: 'alfresco-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit, OnChanges {

    private static DEFAULT_PAGE_SIZE: number = 20;

    private summary: string = '';

    @Input()
    public supportedPageSizes: number[] = [5, 10, 20, 50, 100];

    @Input()
    public maxItems: number = PaginationComponent.DEFAULT_PAGE_SIZE;

    @Input()
    public pagination: Pagination;

    @Output()
    public changePageSize: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    @Output()
    public nextPage: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    @Output()
    public prevPage: EventEmitter<Pagination> = new EventEmitter<Pagination>();

    constructor() {
    }

    public ngOnInit(): void {
        if (!this.pagination) {
            this.pagination = new PaginationData(0, 0, 0, this.maxItems, true);
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.pagination) {
            if (changes.pagination.currentValue) {
                this.pagination = changes.pagination.currentValue;
                this.updateSummary();
            }
        }
    }

    public setPageSize(value: number): void {
        this.pagination.maxItems = value;
        this.updateSummary();
        this.changePageSize.emit(this.pagination);
    }

    public nextPageAvail(): boolean {
        return this.pagination.hasMoreItems;
    }

    public prevPageAvail(): boolean {
        return this.pagination.skipCount > 0;
    }

    public showNextPage(): void {
        this.pagination.skipCount += this.pagination.maxItems;
        this.updateSummary();
        this.nextPage.emit(this.pagination);
    }

    public showPrevPage(): void {
        this.pagination.skipCount -= this.pagination.maxItems;
        this.updateSummary();
        this.prevPage.emit(this.pagination);
    }

    public updateSummary(): void {
        let from = this.pagination.skipCount;
        if (from === 0) {
            from = 1;
        }
        let to = this.pagination.skipCount + this.pagination.count;
        let of = this.pagination.totalItems;
        this.summary = `${from}-${to} of ${of}`;
    }
}
