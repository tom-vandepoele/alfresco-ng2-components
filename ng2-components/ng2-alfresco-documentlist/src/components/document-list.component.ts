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

import {
    AfterContentInit, Component, ContentChild, ElementRef, EventEmitter, HostListener, Input, NgZone,
    OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild
} from '@angular/core';
import { MinimalNodeEntity, MinimalNodeEntryEntity, NodePaging, Pagination } from 'alfresco-js-api';
import { AlfrescoTranslationService, DataColumnListComponent } from 'ng2-alfresco-core';
import {
    DataCellEvent,
    DataColumn,
    DataRowActionEvent,
    DataRowEvent,
    DataSorting,
    DataTableComponent,
    ObjectDataColumn
} from 'ng2-alfresco-datatable';
import { Subject } from 'rxjs/Rx';
import { ImageResolver, RowFilter, ShareDataRow, ShareDataTableAdapter } from './../data/share-datatable-adapter';
import { ContentActionModel } from './../models/content-action.model';
import { DocumentListService } from './../services/document-list.service';
import { NodeEntityEvent, NodeEntryEvent } from './node.event';

declare var require: any;

@Component({
    selector: 'alfresco-document-list',
    styleUrls: ['./document-list.component.css'],
    templateUrl: './document-list.component.html'
})
export class DocumentListComponent implements OnInit, OnChanges, AfterContentInit {

    private static SINGLE_CLICK_NAVIGATION: string = 'click';
    private static DOUBLE_CLICK_NAVIGATION: string = 'dblclick';
    private static DEFAULT_PAGE_SIZE: number = 20;

    @ContentChild(DataColumnListComponent)
    public columnList: DataColumnListComponent;

    @Input()
    public fallbackThumbnail: string = require('../assets/images/ft_ic_miscellaneous.svg');

    @Input()
    public navigate: boolean = true;

    @Input()
    public navigationMode: string = DocumentListComponent.DOUBLE_CLICK_NAVIGATION; // click|dblclick

    @Input()
    public thumbnails: boolean = false;

    @Input()
    public selectionMode: string = 'single'; // null|single|multiple

    @Input()
    public multiselect: boolean = false;

    @Input()
    public enablePagination: boolean = true;

    @Input()
    public contentActions: boolean = false;

    @Input()
    public contentActionsPosition: string = 'right'; // left|right

    @Input()
    public contextMenuActions: boolean = false;

    @Input()
    public creationMenuActions: boolean = true;

    @Input()
    public pageSize: number = DocumentListComponent.DEFAULT_PAGE_SIZE;

    @Input()
    public emptyFolderImageUrl: string = require('../assets/images/empty_doc_lib.svg');

    @Input()
    public allowDropFiles: boolean = false;

    @Input()
    public sorting: string[];

    @Input()
    public rowStyle: string;

    @Input()
    public rowStyleClass: string;

    public skipCount: number = 0;

    public pagination: Pagination;

    @Input()
    set rowFilter(value: RowFilter) {
        if (this.data && value && this.currentFolderId) {
            this.data.setFilter(value);
            this.loadFolderNodesByFolderNodeId(this.currentFolderId, this.pageSize, this.skipCount);
        }
    };

    @Input()
    set imageResolver(value: ImageResolver) {
        if (this.data) {
            this.data.setImageResolver(value);
        }
    }

    // The identifier of a node. You can also use one of these well-known aliases: -my- | -shared- | -root-
    @Input()
    public currentFolderId: string = null;

    @Input()
    public folderNode: MinimalNodeEntryEntity = null;

    @Input()
    public node: NodePaging = null;

    @Output()
    public nodeClick: EventEmitter<NodeEntityEvent> = new EventEmitter<NodeEntityEvent>();

    @Output()
    public nodeDblClick: EventEmitter<NodeEntityEvent> = new EventEmitter<NodeEntityEvent>();

    @Output()
    public folderChange: EventEmitter<NodeEntryEvent> = new EventEmitter<NodeEntryEvent>();

    @Output()
    public preview: EventEmitter<NodeEntityEvent> = new EventEmitter<NodeEntityEvent>();

    @Output()
    public success: EventEmitter<any> = new EventEmitter();

    @Output()
    public ready: EventEmitter<any> = new EventEmitter();

    @Output()
    public error: EventEmitter<any> = new EventEmitter();

    @Output()
    public permissionError: EventEmitter<any> = new EventEmitter();

    @ViewChild(DataTableComponent)
    public dataTable: DataTableComponent;

    public actions: ContentActionModel[] = [];
    public emptyFolderTemplate: TemplateRef<any>;
    public contextActionHandler: Subject<any> = new Subject();
    public data: ShareDataTableAdapter;

    public loading: boolean = false;
    private currentNodeAllowableOperations: string[] = [];
    private CREATE_PERMISSION = 'create';

    constructor(private documentListService: DocumentListService,
                private ngZone: NgZone,
                private translateService: AlfrescoTranslationService,
                private el: ElementRef) {

        if (translateService) {
            translateService.addTranslationFolder('ng2-alfresco-documentlist', 'assets/ng2-alfresco-documentlist');
        }
    }

    public getContextActions(node: MinimalNodeEntity): any {
        if (node && node.entry) {
            let actions = this.getNodeActions(node);
            if (actions && actions.length > 0) {
                return actions.map((a) => {
                    return {
                        model: a,
                        node,
                        subject: this.contextActionHandler
                    };
                });
            }
        }
        return null;
    }

    public contextActionCallback(action): void {
        if (action) {
            this.executeContentAction(action.node, action.model);
        }
    }

    public ngOnInit(): any {
        this.data = new ShareDataTableAdapter(this.documentListService, null, this.getDefaultSorting());
        this.data.thumbnails = this.thumbnails;
        this.contextActionHandler.subscribe((val) => this.contextActionCallback(val));

        this.enforceSingleClickNavigationForMobile();
    }

    public ngAfterContentInit(): void {
        let schema: DataColumn[] = [];

        if (this.columnList && this.columnList.columns && this.columnList.columns.length > 0) {
            schema = this.columnList.columns.map((c) => <DataColumn> c);
        }

        if (!this.data) {
            this.data = new ShareDataTableAdapter(this.documentListService, schema, this.getDefaultSorting());
        } else if (schema && schema.length > 0) {
            this.data.setColumns(schema);
        }

        let columns = this.data.getColumns();
        if (!columns || columns.length === 0) {
            this.setupDefaultColumns();
        }
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.folderNode && changes.folderNode.currentValue) {
            this.loadFolder();
        } else if (changes.currentFolderId && changes.currentFolderId.currentValue) {
            this.loadFolderByNodeId(changes.currentFolderId.currentValue);
        } else if (changes.node && changes.node.currentValue) {
            if (this.data) {
                this.data.loadPage(changes.node.currentValue);
            }
        }
    }

    public reload(): void {
        this.ngZone.run(() => {
            if (this.folderNode) {
                this.loadFolder();
            } else if (this.currentFolderId) {
                this.loadFolderByNodeId(this.currentFolderId);
            } else if (this.node) {
                this.data.loadPage(this.node);
                this.ready.emit();
            }
        });
    }

    public isEmptyTemplateDefined(): boolean {
        if (this.dataTable) {
            if (this.emptyFolderTemplate) {
                return true;
            }
        }
        return false;
    }

    public isMobile(): boolean {
        return !!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    public isEmpty(): boolean {
        return this.data.getRows().length === 0;
    }

    public isPaginationEnabled(): boolean {
        return this.enablePagination && !this.isEmpty();
    }

    public getNodeActions(node: MinimalNodeEntity | any): ContentActionModel[] {
        let target = null;

        if (node && node.entry) {
            if (node.entry.isFile) {
                target = 'document';
            }

            if (node.entry.isFolder) {
                target = 'folder';
            }

            if (target) {
                let ltarget = target.toLowerCase();
                let actionsByTarget = this.actions.filter((entry) => {
                    return entry.target.toLowerCase() === ltarget;
                }).map((action) => new ContentActionModel(action));

                actionsByTarget.forEach((action) => {
                    this.checkPermission(node, action);
                });

                return actionsByTarget;
            }
        }

        return [];
    }

    public checkPermission(node: any, action: ContentActionModel): ContentActionModel {
        if (action.permission) {
            if (this.hasPermissions(node)) {
                let permissions = node.entry.allowableOperations;
                let findPermission = permissions.find((permission) => permission === action.permission);
                if (!findPermission && action.disableWithNoPermission === true) {
                    action.disabled = true;
                }
            }
        }
        return action;
    }

    private hasPermissions(node: any): boolean {
        return node.entry.allowableOperations ? true : false;
    }

    @HostListener('contextmenu', ['$event'])
    public onShowContextMenu(event?: Event): void {
        if (event && this.contextMenuActions) {
            event.preventDefault();
        }
    }

    public performNavigation(node: MinimalNodeEntity): void {
        if (node && node.entry && node.entry.isFolder) {
            this.currentFolderId = node.entry.id;
            this.folderNode = node.entry;
            this.skipCount = 0;
            this.currentNodeAllowableOperations = node.entry.allowableOperations ? node.entry.allowableOperations : [];
            this.loadFolder();
            this.folderChange.emit(new NodeEntryEvent(node.entry));
        }
    }

    /**
     * Invoked when executing content action for a document or folder.
     * @param node Node to be the context of the execution.
     * @param action Action to be executed against the context.
     */
    public executeContentAction(node: MinimalNodeEntity, action: ContentActionModel): void {
        if (node && node.entry && action) {
            action.handler(node, this, action.permission);
        }
    }

    public loadFolder(): void {
        this.loading = true;
        let nodeId = this.folderNode ? this.folderNode.id : this.currentFolderId;
        if (nodeId) {
            this.loadFolderNodesByFolderNodeId(nodeId, this.pageSize, this.skipCount).catch((err) => this.error.emit(err));
        }
    }

    // gets folder node and its content
    public loadFolderByNodeId(nodeId: string): void {
        this.loading = true;
        this.documentListService.getFolderNode(nodeId).then((node) => {
                this.folderNode = node;
                this.currentFolderId = node.id;
                this.skipCount = 0;
                this.currentNodeAllowableOperations = node.allowableOperations ? node.allowableOperations : [];
                this.loadFolderNodesByFolderNodeId(node.id, this.pageSize, this.skipCount).catch((err) => this.error.emit(err));
            })
            .catch((err) => this.error.emit(err));
    }

    public loadFolderNodesByFolderNodeId(id: string, maxItems: number, skipCount: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.documentListService
                .getFolder(null, {
                    maxItems,
                    skipCount,
                    rootFolderId: id
                })
                .subscribe(
                    (val) => {
                        if (this.isCurrentPageEmpty(val, skipCount)) {
                            this.updateSkipCount(skipCount - maxItems);
                            this.loadFolderNodesByFolderNodeId(id, maxItems, skipCount - maxItems).then(() => {
                                resolve(true);
                            }, (error) => {
                                reject(error);
                            });
                        } else {
                            this.data.loadPage(<NodePaging>val);
                            this.pagination = val.list.pagination;
                            this.loading = false;
                            this.ready.emit();
                            resolve(true);
                        }
                    },
                    (error) => {
                        reject(error);
                    });
        });

    }

    private isCurrentPageEmpty(node, skipCount): boolean {
        return !this.hasNodeEntries(node) && this.hasPages(skipCount);
    }

    private hasPages(skipCount): boolean {
        return skipCount > 0 && this.isPaginationEnabled();
    }

    private hasNodeEntries(node): boolean {
        return node && node.list && node.list.entries && node.list.entries.length > 0;
    }

    /**
     * Creates a set of predefined columns.
     */
    public setupDefaultColumns(): void {
        let colThumbnail = new ObjectDataColumn({
            type: 'image',
            key: '$thumbnail',
            title: '',
            srTitle: 'Thumbnail'
        });

        let colName = new ObjectDataColumn({
            type: 'text',
            key: 'name',
            title: 'Name',
            cssClass: 'full-width',
            sortable: true
        });

        this.data.setColumns([colThumbnail, colName]);
    }

    public onPreviewFile(node: MinimalNodeEntity): void {
        if (node) {
            this.preview.emit(new NodeEntityEvent(node));
        }
    }

    public onNodeClick(node: MinimalNodeEntity): void {
        const domEvent = new CustomEvent('node-click', {
            detail: {
                sender: this,
                node
            },
            bubbles: true
        });
        this.el.nativeElement.dispatchEvent(domEvent);

        const event = new NodeEntityEvent(node);
        this.nodeClick.emit(event);

        if (!event.defaultPrevented) {
            if (this.navigate && this.navigationMode === DocumentListComponent.SINGLE_CLICK_NAVIGATION) {
                if (node && node.entry) {
                    if (node.entry.isFile) {
                        this.onPreviewFile(node);
                    }

                    if (node.entry.isFolder) {
                        this.performNavigation(node);
                    }
                }
            }
        }
    }

    public onRowClick(event: DataRowEvent): void {
        let item = (<ShareDataRow> event.value).node;
        this.onNodeClick(item);
    }

    public onNodeDblClick(node: MinimalNodeEntity): void {
        const domEvent = new CustomEvent('node-dblclick', {
            detail: {
                sender: this,
                node
            },
            bubbles: true
        });
        this.el.nativeElement.dispatchEvent(domEvent);

        const event = new NodeEntityEvent(node);
        this.nodeDblClick.emit(event);

        if (!event.defaultPrevented) {
            if (this.navigate && this.navigationMode === DocumentListComponent.DOUBLE_CLICK_NAVIGATION) {
                if (node && node.entry) {
                    if (node.entry.isFile) {
                        this.onPreviewFile(node);
                    }

                    if (node.entry.isFolder) {
                        this.performNavigation(node);
                    }
                }
            }
        }
    }

    public onRowDblClick(event?: DataRowEvent): void {
        let item = (<ShareDataRow> event.value).node;
        this.onNodeDblClick(item);
    }

    public onShowRowContextMenu(event: DataCellEvent): void {
        if (this.contextMenuActions) {
            let args = event.value;
            let node = (<ShareDataRow> args.row).node;
            if (node) {
                args.actions = this.getContextActions(node) || [];
            }
        }
    }

    public onShowRowActionsMenu(event: DataCellEvent): void {
        if (this.contentActions) {
            let args = event.value;
            let node = (<ShareDataRow> args.row).node;
            if (node) {
                args.actions = this.getNodeActions(node) || [];
            }
        }
    }

    public onExecuteRowAction(event: DataRowActionEvent): void {
        if (this.contentActions) {
            let args = event.value;
            let node = (<ShareDataRow> args.row).node;
            let action = (<ContentActionModel> args.action);
            this.executeContentAction(node, action);
        }
    }

    public onActionMenuError(event): void {
        this.error.emit(event);
    }

    public onActionMenuSuccess(event): void {
        this.reload();
        this.success.emit(event);
    }

    public onChangePageSize(event: Pagination): void {
        this.pageSize = event.maxItems;
        this.reload();
    }

    public onNextPage(event: Pagination): void {
        this.skipCount = event.skipCount;
        this.reload();
    }

    public onPrevPage(event: Pagination): void {
        this.skipCount = event.skipCount;
        this.reload();
    }

    public onPermissionError(event): void {
        this.permissionError.emit(event);
    }

    private enforceSingleClickNavigationForMobile(): void {
        if (this.isMobile()) {
            this.navigationMode = DocumentListComponent.SINGLE_CLICK_NAVIGATION;
        }
    }

    private getDefaultSorting(): DataSorting {
        let defaultSorting: DataSorting;
        if (this.sorting) {
            const [key, direction] = this.sorting;
            defaultSorting = new DataSorting(key, direction);
        }
        return defaultSorting;
    }

    public updateSkipCount(newSkipCount): void {
        this.skipCount = newSkipCount;
    }

    public hasCurrentNodePermission(permission: string): boolean {
        let hasPermission: boolean = false;
        if (this.currentNodeAllowableOperations.length > 0) {
            let permFound = this.currentNodeAllowableOperations.find((element) => element === permission);
            hasPermission = permFound ? true : false;
        }
        return hasPermission;
    }

    public hasCreatePermission(): boolean {
        return this.hasCurrentNodePermission(this.CREATE_PERMISSION);
    }

}
