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
import { DynamicRowValidationSummary, DynamicTableColumn, DynamicTableModel, DynamicTableRow } from './../dynamic-table.widget.model';

@Component({
    selector: 'row-editor',
    templateUrl: './row.editor.html',
    styleUrls: ['./row.editor.css']
})
export class RowEditorComponent {

    @Input()
    public table: DynamicTableModel;

    @Input()
    public row: DynamicTableRow;

    @Input()
    public column: DynamicTableColumn;

    @Output()
    public save: EventEmitter<any> = new EventEmitter<any>();

    @Output()
    public cancel: EventEmitter<any> = new EventEmitter<any>();

    public validationSummary: DynamicRowValidationSummary = <DynamicRowValidationSummary> {isValid: true, text: null};

    public onCancelChanges(): void {
        this.cancel.emit({
            table: this.table,
            row: this.row,
            column: this.column
        });
    }

    public onSaveChanges(): void {
        this.validate();
        if (this.isValid()) {
            this.save.emit({
                table: this.table,
                row: this.row,
                column: this.column
            });
        }
    }

    private isValid(): boolean {
        return this.validationSummary && this.validationSummary.isValid;
    }

    private validate(): void {
        this.validationSummary = this.table.validateRow(this.row);
    }

}
