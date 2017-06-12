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

import { ChangeDetectorRef, Component, ElementRef, Input, OnInit } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { WidgetVisibilityService } from '../../../services/widget-visibility.service';
import { FormFieldModel } from '../core/form-field.model';
import { WidgetComponent } from './../widget.component';
import { DynamicTableColumn, DynamicTableModel, DynamicTableRow } from './dynamic-table.widget.model';

@Component({
    selector: 'dynamic-table-widget',
    templateUrl: './dynamic-table.widget.html',
    styleUrls: ['./dynamic-table.widget.css']
})
export class DynamicTableWidget extends WidgetComponent implements OnInit {

    public ERROR_MODEL_NOT_FOUND = 'Table model not found';

    @Input()
    public field: FormFieldModel;

    @Input()
    public readOnly: boolean = false;

    public content: DynamicTableModel;

    public editMode: boolean = false;
    public editRow: DynamicTableRow = null;

    private selectArrayCode = [32, 0, 13];

    constructor(private elementRef: ElementRef,
                private visibilityService: WidgetVisibilityService,
                private logService: LogService,
                private cd: ChangeDetectorRef) {
        super();
    }

    public ngOnInit(): void {
        if (this.field) {
            this.content = new DynamicTableModel(this.field);
            this.visibilityService.refreshVisibility(this.field.form);
        }
    }

    public forceFocusOnAddButton(): void {
        if (this.content) {
            this.cd.detectChanges();
            let buttonAddRow = <HTMLButtonElement>this.elementRef.nativeElement.querySelector('#' + this.content.id + '-add-row');
            if (this.isDynamicTableReady(buttonAddRow)) {
                buttonAddRow.focus();
            }
        }
    }

    private isDynamicTableReady(buttonAddRow): boolean {
        return this.field && !this.editMode && buttonAddRow;
    }

    public isValid(): boolean {
        let result = true;

        if (this.content && this.content.field) {
            result = this.content.field.isValid;
        }

        return result;
    }

    public onRowClicked(row: DynamicTableRow): void {
        if (this.content) {
            this.content.selectedRow = row;
        }
    }

    public onKeyPressed($event: KeyboardEvent, row: DynamicTableRow): void {
        if (this.content && this.isEnterOrSpacePressed($event.keyCode)) {
            this.content.selectedRow = row;
        }
    }

    private isEnterOrSpacePressed(keycode): boolean {
        return this.selectArrayCode.indexOf(keycode) !== -1;
    }

    public hasSelection(): boolean {
        return !!(this.content && this.content.selectedRow);
    }

    public moveSelectionUp(): boolean {
        if (this.content && !this.readOnly) {
            this.content.moveRow(this.content.selectedRow, -1);
            return true;
        }
        return false;
    }

    public moveSelectionDown(): boolean {
        if (this.content && !this.readOnly) {
            this.content.moveRow(this.content.selectedRow, 1);
            return true;
        }
        return false;
    }

    public deleteSelection(): boolean {
        if (this.content && !this.readOnly) {
            this.content.deleteRow(this.content.selectedRow);
            return true;
        }
        return false;
    }

    public addNewRow(): boolean {
        if (this.content && !this.readOnly) {
            this.editRow = <DynamicTableRow> {
                isNew: true,
                selected: false,
                value: {}
            };
            this.editMode = true;
            return true;
        }
        return false;
    }

    public editSelection(): boolean {
        if (this.content && !this.readOnly) {
            this.editRow = this.copyRow(this.content.selectedRow);
            this.editMode = true;
            return true;
        }
        return false;
    }

    public getCellValue(row: DynamicTableRow, column: DynamicTableColumn): any {
        if (this.content) {
            let result = this.content.getCellValue(row, column);
            if (column.type === 'Amount') {
                return (column.amountCurrency || '$') + ' ' + (result || 0);
            }
            return result;
        }
        return null;
    }

    public onSaveChanges(): void {
        if (this.content) {
            if (this.editRow.isNew) {
                let row = this.copyRow(this.editRow);
                this.content.selectedRow = null;
                this.content.addRow(row);
                this.editRow.isNew = false;
            } else {
                this.content.selectedRow.value = this.copyObject(this.editRow.value);
            }
            this.content.flushValue();
        } else {
            this.logService.error(this.ERROR_MODEL_NOT_FOUND);
        }
        this.editMode = false;
        this.forceFocusOnAddButton();
    }

    public  onCancelChanges(): void {
        this.editMode = false;
        this.editRow = null;
        this.forceFocusOnAddButton();
    }

    public opyRow(row: DynamicTableRow): DynamicTableRow {
        return <DynamicTableRow> {
            value: this.copyObject(row.value)
        };
    }

    private copyObject(obj: any): any {
        let result = obj;

        if (typeof obj === 'object' && obj !== null && obj !== undefined) {
            result = Object.assign({}, obj);
            Object.keys(obj).forEach((key) => {
                if (typeof obj[key] === 'object') {
                    result[key] = this.copyObject(obj[key]);
                }
            });
        }

        return result;
    }
}
