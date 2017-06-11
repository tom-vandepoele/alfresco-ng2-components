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

import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { MinimalNodeEntity } from 'alfresco-js-api';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { AlfrescoSearchService, SearchOptions } from './../services/alfresco-search.service';
import { AlfrescoThumbnailService } from './../services/alfresco-thumbnail.service';

declare var require: any;

@Component({
    selector: 'alfresco-search-autocomplete',
    templateUrl: './alfresco-search-autocomplete.component.html',
    styleUrls: ['./alfresco-search-autocomplete.component.css']
})
export class AlfrescoSearchAutocompleteComponent implements OnInit, OnChanges {

    @Input()
    public  searchTerm: string = '';

    public results: any = null;

    public errorMessage;

    @Input()
    public  ngClass: any;

    @Input()
    public maxResults: number = 5;

    @Input()
    public resultSort: string = null;

    @Input()
    public rootNodeId: string = '-root';

    @Input()
    public resultType: string = null;

    @Output()
    public fileSelect: EventEmitter<any> = new EventEmitter();

    @Output()
    public searchFocus: EventEmitter<FocusEvent> = new EventEmitter<FocusEvent>();

    @Output()
    public cancel = new EventEmitter();

    @Output()
    public resultsLoad = new EventEmitter();

    @Output()
    public scrollBack = new EventEmitter();

    @ViewChild('resultsTableBody', {})
    public resultsTableBody: ElementRef;

    constructor(private searchService: AlfrescoSearchService,
                private translateService: AlfrescoTranslationService,
                private thumbnailService: AlfrescoThumbnailService) {
    }

    public ngOnInit(): void {
        if (this.translateService) {
            this.translateService.addTranslationFolder('ng2-alfresco-search', 'assets/ng2-alfresco-search');
        }
    }

    public  ngOnChanges(changes): void {
        if (changes.searchTerm) {
            this.results = null;
            this.errorMessage = null;
            this.displaySearchResults(changes.searchTerm.currentValue);
        }
    }

    /**
     * Loads and displays search results
     * @param searchTerm Search query entered by user
     */
    private displaySearchResults(searchTerm): void {
        let searchOpts: SearchOptions = {
            include: ['path'],
            rootNodeId: this.rootNodeId,
            nodeType: this.resultType,
            maxItems: this.maxResults,
            orderBy: this.resultSort
        };
        if (searchTerm !== null && searchTerm !== '') {
            this.searchService
                .getNodeQueryResults(searchTerm, searchOpts)
                .subscribe(
                    (results) => {
                        this.results = results.list.entries.slice(0, this.maxResults);
                        this.errorMessage = null;
                        this.resultsLoad.emit(this.results);
                    },
                    (error) => {
                        this.results = null;
                        this.errorMessage = <any>error;
                        this.resultsLoad.error(error);
                    }
                );
        }
    }

    /**
     * Gets thumbnail URL for the given document node.
     * @param node Node to get URL for.
     * @returns {string} URL address.
     */
    public getMimeTypeIcon(node: MinimalNodeEntity): string {
        if (node.entry.content && node.entry.content.mimeType) {
            let icon = this.thumbnailService.getMimeTypeIcon(node.entry.content.mimeType);
            return this.resolveIconPath(icon);
        }
        if (node.entry.isFolder) {
            return require('../assets/images/ft_ic_folder.svg');
        }
    }

    public  resolveIconPath(icon: string): string {
        return require('../assets/images/' + icon);
    }

    /**
     * Gets thumbnail message key for the given document node, which can be used to look up alt text
     * @param node Node to get URL for.
     * @returns {string} URL address.
     */
    public getMimeTypeKey(node: MinimalNodeEntity): string {
        if (node.entry.content && node.entry.content.mimeType) {
            return 'SEARCH.ICONS.' + this.thumbnailService.getMimeTypeKey(node.entry.content.mimeType);
        } else {
            return '';
        }
    }

    public focusResult(): void {
        let firstResult: any = this.resultsTableBody.nativeElement.querySelector('tr');
        firstResult.focus();
    }

    public  onItemClick(node: MinimalNodeEntity): void {
        if (node && node.entry) {
            this.fileSelect.emit(node);
        }
    }

    public onRowFocus($event: FocusEvent): void {
        this.searchFocus.emit($event);
    }

    public onRowBlur($event: FocusEvent): void {
        this.searchFocus.emit($event);
    }

    public  onRowEnter(node: MinimalNodeEntity): void {
        if (node && node.entry) {
            if (node.entry.isFile) {
                this.fileSelect.emit(node);
            }
        }
    }

    public onRowArrowDown($event: KeyboardEvent): void {
        let nextElement: any = this.getNextElementSibling(<Element> $event.target);
        if (nextElement) {
            nextElement.focus();
        }
    }

    public onRowArrowUp($event: KeyboardEvent): void {
        let previousElement: any = this.getPreviousElementSibling(<Element> $event.target);
        if (previousElement) {
            previousElement.focus();
        } else {
            this.scrollBack.emit($event);
        }
    }

    public onRowEscape($event: KeyboardEvent): void {
        this.cancel.emit($event);
    }

    private getNextElementSibling(node: Element): Element {
        return node.nextElementSibling;
    }

    private getPreviousElementSibling(node: Element): Element {
        return node.previousElementSibling;
    }

}
