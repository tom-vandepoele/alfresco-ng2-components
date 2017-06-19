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

import { AfterContentInit, Component, ContentChild, ElementRef, EventEmitter, Input, OnChanges, Optional, Output, SimpleChange, SimpleChanges, TemplateRef } from '@angular/core';
import { MdCheckboxChange } from '@angular/material';
import { DataColumnListComponent } from 'ng2-alfresco-core';
import { DataColumn, DataRow, DataRowEvent, DataSorting, DataTableAdapter, ObjectDataRow, ObjectDataTableAdapter } from '../../data/index';
import { DataCellEvent } from './data-cell.event';
import { DataRowActionEvent } from './data-row-action.event';

declare var componentHandler;

@Component({
    selector: 'alfresco-datatable',
    styleUrls: ['./datatable.component.css'],
    templateUrl: './datatable.component.html'
})
export class DataTableComponent implements AfterContentInit, OnChanges {

    @ContentChild(DataColumnListComponent)
    public columnList: DataColumnListComponent;

    @Input()
    public data: DataTableAdapter;

    @Input()
    public rows: any[] = [];

    @Input()
    public selectionMode: string = 'single'; // none|single|multiple

    @Input()
    public multiselect: boolean = false;

    @Input()
    public actions: boolean = false;

    @Input()
    public actionsPosition: string = 'right'; // left|right

    @Input()
    public fallbackThumbnail: string;

    @Input()
    public contextMenu: boolean = false;

    @Input()
    public allowDropFiles: boolean = false;

    @Input()
    public rowStyle: string;

    @Input()
    public rowStyleClass: string;

    @Output()
    public rowClick: EventEmitter<DataRowEvent> = new EventEmitter<DataRowEvent>();

    @Output()
    public rowDblClick: EventEmitter<DataRowEvent> = new EventEmitter<DataRowEvent>();

    @Output()
    public showRowContextMenu: EventEmitter<DataCellEvent> = new EventEmitter<DataCellEvent>();

    @Output()
    public showRowActionsMenu: EventEmitter<DataCellEvent> = new EventEmitter<DataCellEvent>();

    @Output()
    public executeRowAction: EventEmitter<DataRowActionEvent> = new EventEmitter<DataRowActionEvent>();

    @Input()
    public loading: boolean = false;

    public noContentTemplate: TemplateRef<any>;
    public loadingTemplate: TemplateRef<any>;

    public isSelectAllChecked: boolean = false;

    constructor(@Optional() private el: ElementRef) {
    }

    public ngAfterContentInit(): void {
        this.setTableSchema();
        this.setupMaterialComponents();
    }

    public ngAfterViewInit(): void {
        this.setupMaterialComponents();
    }

    private setupMaterialComponents(): boolean {
        // workaround for MDL issues with dynamic components
        if (componentHandler) {
            componentHandler.upgradeAllRegistered();
            return true;
        }
        return false;
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (this.isPropertyChanged(changes.data)) {
            if (this.isTableEmpty()) {
                this.initTable();
            }
            return;
        }

        if (this.isPropertyChanged(changes.rows)) {
            if (this.isTableEmpty()) {
                this.initTable();
            } else {
                this.setTableRows(changes.rows.currentValue);
            }
            return;
        }

        if (changes.selectionMode && !changes.selectionMode.isFirstChange()) {
            this.resetSelection();
        }
    }

    public isPropertyChanged(property: SimpleChange): boolean {
        return property && property.currentValue ? true : false;
    }

    public  convertToRowsData(rows: any []): ObjectDataRow[] {
        return rows.map((row) => new ObjectDataRow(row));
    }

    private initTable(): void {
        this.data = new ObjectDataTableAdapter(this.rows, []);
    }

    public isTableEmpty(): boolean {
        return this.data === undefined || this.data === null;
    }

    private setTableRows(rows): void {
        if (this.data) {
            this.data.setRows(this.convertToRowsData(rows));
        }
    }

    private setTableSchema(): void {
        let schema: DataColumn[] = [];

        if (this.columnList && this.columnList.columns) {
            schema = this.columnList.columns.map((c) => <DataColumn> c);
        }

        if (this.data && schema && schema.length > 0) {
            this.data.setColumns(schema);
        }
    }

    public onRowClick(row: DataRow, mouseEvent: MouseEvent): void {
        if (mouseEvent) {
            mouseEvent.preventDefault();
        }

        if (row) {
            if (this.data) {
                const newValue = !row.isSelected;
                const rows = this.data.getRows();

                if (this.isSingleSelectionMode()) {
                    rows.forEach((r) => r.isSelected = false);
                    row.isSelected = newValue;
                }

                if (this.isMultiSelectionMode()) {
                    const modifier = mouseEvent.metaKey || mouseEvent.ctrlKey;
                    if (!modifier) {
                        rows.forEach((r) => r.isSelected = false);
                    }
                    row.isSelected = newValue;
                }
            }

            let dataRowEvent = new DataRowEvent(row, mouseEvent, this);
            this.rowClick.emit(dataRowEvent);

            if (!mouseEvent.defaultPrevented && this.el.nativeElement) {
                this.el.nativeElement.dispatchEvent(
                    new CustomEvent('row-click', {
                        detail: dataRowEvent,
                        bubbles: true
                    })
                );
            }
        }
    }

    public resetSelection(): void {
        if (this.data) {
            const rows = this.data.getRows();
            if (rows && rows.length > 0) {
                rows.forEach((r) => r.isSelected = false);
            }
        }
    }

    public onRowDblClick(row: DataRow, mouseEvent?: MouseEvent): void {
        if (mouseEvent) {
            mouseEvent.preventDefault();
        }

        let dataRowEvent = new DataRowEvent(row, mouseEvent, this);
        this.rowDblClick.emit(dataRowEvent);

        if (!mouseEvent.defaultPrevented && this.el.nativeElement) {
            this.el.nativeElement.dispatchEvent(
                new CustomEvent('row-dblclick', {
                    detail: dataRowEvent,
                    bubbles: true
                })
            );
        }
    }

    public onColumnHeaderClick(column: DataColumn): void {
        if (column && column.sortable) {
            let current = this.data.getSorting();
            let newDirection = 'asc';
            if (current && column.key === current.key) {
                newDirection = current.direction === 'asc' ? 'desc' : 'asc';
            }
            this.data.setSorting(new DataSorting(column.key, newDirection));
        }
    }

    public onSelectAllClick(mdCheckboxChangeEvent: MdCheckboxChange): void {
        this.isSelectAllChecked = mdCheckboxChangeEvent.checked;

        if (this.multiselect) {
            let rows = this.data.getRows();
            if (rows && rows.length > 0) {
                for (let currentRow of rows) {
                    if (currentRow) {
                        currentRow.isSelected = mdCheckboxChangeEvent.checked;
                    }
                }
            }
        }
    }

    public onImageLoadingError(event: Event): void {
        if (event && this.fallbackThumbnail) {
            let element = <any> event.target;
            element.src = this.fallbackThumbnail;
        }
    }

    public isIconValue(row: DataRow, col: DataColumn): boolean {
        if (row && col) {
            let value = row.getValue(col.key);
            return value && value.startsWith('material-icons://');
        }
        return false;
    }

    public asIconValue(row: DataRow, col: DataColumn): string {
        if (this.isIconValue(row, col)) {
            let value = row.getValue(col.key) || '';
            return value.replace('material-icons://', '');
        }
        return null;
    }

    public iconAltTextKey(value: string): string {
        return 'ICONS.' + value.substring(value.lastIndexOf('/') + 1).replace(/\.[a-z]+/, '');
    }

    public isColumnSorted(col: DataColumn, direction: string): boolean {
        if (col && direction) {
            let sorting = this.data.getSorting();
            return sorting && sorting.key === col.key && sorting.direction === direction;
        }
        return false;
    }

    public getContextMenuActions(row: DataRow, col: DataColumn): any[] {
        let event = new DataCellEvent(row, col, []);
        this.showRowContextMenu.emit(event);
        return event.value.actions;
    }

    public getRowActions(row: DataRow, col: DataColumn): any[] {
        let event = new DataCellEvent(row, col, []);
        this.showRowActionsMenu.emit(event);
        return event.value.actions;
    }

    public onExecuteRowAction(row: DataRow, action: any): void {
        if (action.disabled || action.disabled) {
            event.stopPropagation();
        } else {
            this.executeRowAction.emit(new DataRowActionEvent(row, action));
        }
    }

    public rowAllowsDrop(row: DataRow): boolean {
        return row.isDropTarget === true;
    }

    public hasSelectionMode(): boolean {
        return this.isSingleSelectionMode() || this.isMultiSelectionMode();
    }

    public isSingleSelectionMode(): boolean {
        return this.selectionMode && this.selectionMode.toLowerCase() === 'single';
    }

    public isMultiSelectionMode(): boolean {
        return this.selectionMode && this.selectionMode.toLowerCase() === 'multiple';
    }
}
