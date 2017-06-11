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

import { Component, EventEmitter, Input, OnChanges, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { NodePaging, Pagination } from 'alfresco-js-api';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { AlfrescoSearchService, SearchOptions } from './../services/alfresco-search.service';

@Component({
    selector: 'alfresco-search',
    styleUrls: ['./alfresco-search.component.css'],
    templateUrl: './alfresco-search.component.html'
})
export class AlfrescoSearchComponent implements OnChanges, OnInit {

    public static SINGLE_CLICK_NAVIGATION: string = 'click';
    public static DOUBLE_CLICK_NAVIGATION: string = 'dblclick';

    @Input()
    public searchTerm: string = '';

    @Input()
    public maxResults: number = 20;

    @Input()
    public resultSort: string = null;

    @Input()
    public rootNodeId: string = '-root-';

    @Input()
    public resultType: string = null;

    @Input()
    public navigationMode: string = AlfrescoSearchComponent.DOUBLE_CLICK_NAVIGATION; // click|dblclick

    @Input()
    public emptyFolderImageUrl: string = require('../assets/images/empty_doc_lib.svg');

    @Output()
    public resultsLoad = new EventEmitter();

    @Output()
    public preview: EventEmitter<any> = new EventEmitter<any>();

    private pagination: Pagination;
    private errorMessage;
    private queryParamName = 'q';
    private skipCount: number = 0;
    private nodeResults: NodePaging;

    constructor(private searchService: AlfrescoSearchService,
                private translateService: AlfrescoTranslationService,
                @Optional() private route: ActivatedRoute) {
    }

    public ngOnInit(): void {
        if (this.translateService !== null) {
            this.translateService.addTranslationFolder('ng2-alfresco-search', 'assets/ng2-alfresco-search');
        }

        if (this.route) {
            this.route.params.forEach((params: Params) => {
                this.searchTerm = params.hasOwnProperty(this.queryParamName) ? params[this.queryParamName] : null;
                this.displaySearchResults(this.searchTerm);
            });
        } else {
            this.displaySearchResults(this.searchTerm);
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.searchTerm) {
            this.searchTerm = changes.searchTerm.currentValue;
            this.skipCount = 0;
            this.displaySearchResults(this.searchTerm);
        }
    }

    public onPreviewFile(event: any): void {
        if (event.value) {
            this.preview.emit({
                value: event.value
            });
        }
    }

    /**
     * Loads and displays search results
     * @param searchTerm Search query entered by user
     */
    private displaySearchResults(searchTerm: string): void {
        if (searchTerm && this.searchService) {
            let searchOpts: SearchOptions = {
                include: ['path'],
                skipCount: this.skipCount,
                rootNodeId: this.rootNodeId,
                nodeType: this.resultType,
                maxItems: this.maxResults,
                orderBy: this.resultSort
            };
            this.searchService
                .getNodeQueryResults(searchTerm, searchOpts)
                .subscribe(
                    (results) => {
                        this.nodeResults = results;
                        this.pagination = results.list.pagination;
                        this.resultsLoad.emit(results.list.entries);
                        this.errorMessage = null;
                    },
                    (error) => {
                        if (error.status !== 400) {
                            this.errorMessage = <any>error;
                            this.resultsLoad.error(error);
                        }
                    }
                );
        }
    }

    public onChangePageSize(event: Pagination): void {
        this.maxResults = event.maxItems;
        this.displaySearchResults(this.searchTerm);
    }

    public onNextPage(event: Pagination): void {
        this.skipCount = event.skipCount;
        this.displaySearchResults(this.searchTerm);
    }

    public onPrevPage(event: Pagination): void {
        this.skipCount = event.skipCount;
        this.displaySearchResults(this.searchTerm);
    }
}
