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

import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { Observable, Subject } from 'rxjs/Rx';
import { SearchTermValidator } from './../forms/search-term-validator';
import { AlfrescoSearchAutocompleteComponent } from './alfresco-search-autocomplete.component';

@Component({
    selector: 'alfresco-search-control',
    templateUrl: './alfresco-search-control.component.html',
    styleUrls: ['./alfresco-search-control.component.css']
})
export class AlfrescoSearchControlComponent implements OnInit, OnDestroy {

    @Input()
    public searchTerm = '';

    @Input()
    public inputType = 'text';

    @Input()
    public autocomplete: boolean = false;

    @Input()
    public expandable: boolean = true;

    @Output()
    public searchChange = new EventEmitter();

    @Output()
    public searchSubmit = new EventEmitter();

    @Output()
    public fileSelect = new EventEmitter();

    @Output()
    public expand = new EventEmitter();

    public searchControl: FormControl;

    @ViewChild('searchInput', {})
    public searchInput: ElementRef;

    @ViewChild(AlfrescoSearchAutocompleteComponent)
    public liveSearchComponent: AlfrescoSearchAutocompleteComponent;

    @Input()
    public liveSearchEnabled: boolean = true;

    @Input()
    public liveSearchTerm: string = '';

    @Input()
    public liveSearchRoot: string = '-root-';

    @Input()
    public liveSearchResultType: string = null;

    @Input()
    public liveSearchResultSort: string = null;

    @Input()
    public liveSearchMaxResults: number = 5;

    public searchActive = false;

    public searchValid = false;

    public focusSubject = new Subject<FocusEvent>();

    constructor(private translateService: AlfrescoTranslationService) {

        this.searchControl = new FormControl(
            this.searchTerm,
            Validators.compose([Validators.required, SearchTermValidator.minAlphanumericChars(3)])
        );
    }

    public ngOnInit(): void {
        this.searchControl.valueChanges.debounceTime(400).distinctUntilChanged()
            .subscribe((value: string) => {
                    this.onSearchTermChange(value);
                }
            );

        this.setupFocusEventHandlers();

        this.translateService.addTranslationFolder('ng2-alfresco-search', 'assets/ng2-alfresco-search');
    }

    public ngOnDestroy(): void {
        this.focusSubject.unsubscribe();
    }

    private onSearchTermChange(value: string): void {
        this.searchValid = this.searchControl.valid;
        this.liveSearchTerm = this.searchValid ? value : '';
        this.searchControl.setValue(value, true);
        this.searchChange.emit({
            value,
            valid: this.searchValid
        });
    }

    private setupFocusEventHandlers(): void {
        let focusEvents: Observable<FocusEvent> = this.focusSubject.asObservable().debounceTime(50);
        focusEvents.filter(($event: FocusEvent) => {
            return $event.type === 'focusin' || $event.type === 'focus';
        }).subscribe(() => {
            this.onSearchFocus();
        });
        focusEvents.filter(($event: any) => {
            return $event.type === 'focusout' || $event.type === 'blur';
        }).subscribe(() => {
            this.onSearchBlur();
        });
    }

    public getTextFieldClassName(): string {
        return 'mdl-textfield mdl-js-textfield' + (this.expandable ? ' mdl-textfield--expandable' : '');
    }

    public getTextFieldHolderClassName(): string {
        return this.expandable ? 'search-field mdl-textfield__expandable-holder' : 'search-field';
    }

    public getAutoComplete(): string {
        return this.autocomplete ? 'on' : 'off';
    }

    /**
     * Method called on form submit, i.e. when the user has hit enter
     *
     * @param event Submit event that was fired
     */
    public onSearch(): void {
        this.searchControl.setValue(this.searchTerm, true);
        if (this.searchControl.valid) {
            this.searchSubmit.emit({
                value: this.searchTerm
            });
            this.searchInput.nativeElement.blur();
        }
    }

    public isAutoCompleteDisplayed(): boolean {
        return this.searchActive;
    }

    public setAutoCompleteDisplayed(display: boolean): void {
        this.searchActive = display;
    }

    public onFileClicked(event: any): void {
        this.setAutoCompleteDisplayed(false);
        this.fileSelect.emit(event);
    }

    public onSearchFocus(): void {
        this.setAutoCompleteDisplayed(true);
    }

    public onSearchBlur(): void {
        this.setAutoCompleteDisplayed(false);
    }

    public onFocus($event: FocusEvent): void {
        if (this.expandable) {
            this.expand.emit({
                expanded: true
            });
        }
        this.focusSubject.next($event);
    }

    public onBlur($event): void {
        if (this.expandable && (this.searchControl.value === '' || this.searchControl.value === undefined)) {
            this.expand.emit({
                expanded: false
            });
        }
        this.focusSubject.next($event);
    }

    public onEscape(): void {
        this.setAutoCompleteDisplayed(false);
    }

    public onArrowDown(): void {
        if (this.isAutoCompleteDisplayed()) {
            this.liveSearchComponent.focusResult();
        } else {
            this.setAutoCompleteDisplayed(true);
        }
    }

    public onAutoCompleteFocus($event): void {
        this.focusSubject.next($event);
    }

    public onAutoCompleteReturn($event): void {
        if (this.searchInput) {
            (<any> this.searchInput.nativeElement).focus();
        }
    }

    public onAutoCompleteCancel($event): void {
        if (this.searchInput) {
            (<any> this.searchInput.nativeElement).focus();
        }
        this.setAutoCompleteDisplayed(false);
    }

}
