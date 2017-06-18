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

import { Component, Input, OnInit } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { FormService } from './../../../../../services/form.service';
import { DynamicTableColumn, DynamicTableColumnOption, DynamicTableModel, DynamicTableRow } from './../../dynamic-table.widget.model';

@Component({
    selector: 'alf-dropdown-editor',
    templateUrl: './dropdown.editor.html',
    styleUrls: ['./dropdown.editor.css']
})
export class DropdownEditorComponent implements OnInit {

    public value: any = null;
    public options: DynamicTableColumnOption[] = [];

    @Input()
    public table: DynamicTableModel;

    @Input()
    public row: DynamicTableRow;

    @Input()
    public column: DynamicTableColumn;

    constructor(private formService: FormService,
                private logService: LogService) {
    }

    public ngOnInit(): void {
        let field = this.table.field;
        if (field) {
            if (this.column.optionType === 'rest') {
                if (this.table.form && this.table.form.taskId) {
                    this.getValuesByTaskId(field);
                } else {
                    this.getValuesByProcessDefinitionId(field);
                }
            } else {
                this.options = this.column.options || [];
                this.value = this.table.getCellValue(this.row, this.column);
            }
        }
    }

    public getValuesByTaskId(field): void {
        this.formService
            .getRestFieldValuesColumn(
                field.form.taskId,
                field.id,
                this.column.id
            )
            .subscribe(
                (result: DynamicTableColumnOption[]) => {
                    this.column.options = result || [];
                    this.options = this.column.options;
                    this.value = this.table.getCellValue(this.row, this.column);
                },
                (err) => this.handleError(err)
            );
    }

    public getValuesByProcessDefinitionId(field): void {
        this.formService
            .getRestFieldValuesColumnByProcessId(
                field.form.processDefinitionId,
                field.id,
                this.column.id
            )
            .subscribe(
                (result: DynamicTableColumnOption[]) => {
                    this.column.options = result || [];
                    this.options = this.column.options;
                    this.value = this.table.getCellValue(this.row, this.column);
                },
                (err) => this.handleError(err)
            );
    }

    public onValueChanged(row: DynamicTableRow, column: DynamicTableColumn, event: any): void {
        let value: any = (<HTMLInputElement>event.target).value;
        value = column.options.find((opt) => opt.name === value);
        row.value[column.id] = value;
    }

    private handleError(error: any): void {
        this.logService.error(error);
    }
}
