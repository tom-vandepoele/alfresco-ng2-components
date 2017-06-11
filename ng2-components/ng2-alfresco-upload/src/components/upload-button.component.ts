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

import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MinimalNodeEntryEntity } from 'alfresco-js-api';
import { AlfrescoApiService, AlfrescoContentService, AlfrescoSettingsService, AlfrescoTranslationService, FileUtils, LogService, NotificationService } from 'ng2-alfresco-core';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable, Subject } from 'rxjs/Rx';
import { FileModel } from '../models/file.model';
import { PermissionModel } from '../models/permissions.model';
import { UploadService } from '../services/upload.service';

@Component({
    selector: 'alfresco-upload-button',
    templateUrl: './upload-button.component.html',
    styleUrls: ['./upload-button.component.css']
})
export class UploadButtonComponent implements OnInit, OnChanges {

    @Input()
    public disabled: boolean = false;

    /**
     * @deprecated Deprecated in 1.6.0, you can use UploadService events and NotificationService api instead.
     *
     * @type {boolean}
     * @memberof UploadButtonComponent
     */
    @Input()
    public showNotificationBar: boolean = true;

    @Input()
    public uploadFolders: boolean = false;

    @Input()
    public multipleFiles: boolean = false;

    @Input()
    public versioning: boolean = false;

    @Input()
    public acceptedFilesType: string = '*';

    @Input()
    public staticTitle: string;

    /**
     * @deprecated Deprecated in 1.6.0, this property is not used for couple of releases already.
     *
     * @type {string}
     * @memberof UploadDragAreaComponent
     */
    @Input()
    public currentFolderPath: string = '/';

    @Input()
    public rootFolderId: string = '-root-';

    @Input()
    public disableWithNoPermission: boolean = false;

    @Output()
    public onSuccess = new EventEmitter();

    @Output()
    public onError = new EventEmitter();

    @Output()
    public createFolder = new EventEmitter();

    @Output()
    public permissionEvent: EventEmitter<PermissionModel> = new EventEmitter<PermissionModel>();

    private hasPermission: boolean = false;

    private permissionValue: Subject<boolean> = new Subject<boolean>();

    constructor(private el: ElementRef,
                private uploadService: UploadService,
                private translateService: AlfrescoTranslationService,
                private logService: LogService,
                private notificationService: NotificationService,
                private settingsService: AlfrescoSettingsService,
                private apiService: AlfrescoApiService,
                private contentService: AlfrescoContentService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-alfresco-upload', 'assets/ng2-alfresco-upload');
        }
    }

    public ngOnInit(): void {
        this.settingsService.ecmHostSubject.subscribe((hostEcm: string) => {
            this.checkPermission();
        });

        this.permissionValue.subscribe((permission: boolean) => {
            this.hasPermission = permission;
        });
    }

    public ngOnChanges(changes: SimpleChanges): void {
        let rootFolderId = changes.rootFolderId;
        if (rootFolderId && rootFolderId.currentValue) {
            this.checkPermission();
        }
    }

    public isButtonDisabled(): boolean {
        return this.isForceDisable() || this.isDisableWithNoPermission();
    }

    public isForceDisable(): boolean {
        return this.disabled ? true : undefined;
    }

    public isDisableWithNoPermission(): boolean {
        return !this.hasPermission && this.disableWithNoPermission ? true : undefined;
    }

    public onFilesAdded($event: any): void {
        let files: File[] = FileUtils.toFileArray($event.currentTarget.files);

        if (this.hasPermission) {
            this.uploadFiles(files);
        } else {
            this.permissionEvent.emit(new PermissionModel({type: 'content', action: 'upload', permission: 'create'}));
        }
        // reset the value of the input file
        $event.target.value = '';
    }

    public onDirectoryAdded($event: any): void {
        if (this.hasPermission) {
            let files: File[] = FileUtils.toFileArray($event.currentTarget.files);
            this.uploadFiles(files);
        } else {
            this.permissionEvent.emit(new PermissionModel({type: 'content', action: 'upload', permission: 'create'}));
        }
        // reset the value of the input file
        $event.target.value = '';
    }

    /**
     * Upload a list of file in the specified path
     * @param files
     * @param path
     */
    public uploadFiles(files: File[]): void {
        if (files.length > 0) {
            const latestFilesAdded = files.map((file) => new FileModel(file, {
                newVersion: this.versioning,
                parentId: this.rootFolderId,
                path: (file.webkitRelativePath || '').replace(/\/[^\/]*$/, '')
            }));
            this.uploadService.addToQueue(...latestFilesAdded);
            this.uploadService.uploadFilesInTheQueue(this.onSuccess);
            if (this.showNotificationBar) {
                this.showUndoNotificationBar(latestFilesAdded);
            }
        }
    }

    // TODO: move to AlfrescoContentService
    public getFolderNode(nodeId: string): Observable<MinimalNodeEntryEntity> {
        let opts: any = {
            includeSource: true,
            include: ['allowableOperations']
        };

        return Observable.fromPromise(this.apiService.getInstance().nodes.getNodeInfo(nodeId, opts))
            .catch((err) => this.handleError(err));
    }

    /**
     * Show undo notification bar.
     *
     * @param {FileModel[]} latestFilesAdded - files in the upload queue enriched with status flag and xhr object.
     */
    private showUndoNotificationBar(latestFilesAdded: FileModel[]): void {
        let messageTranslate: any;
        let actionTranslate: any;

        messageTranslate = this.translateService.get('FILE_UPLOAD.MESSAGES.PROGRESS');
        actionTranslate = this.translateService.get('FILE_UPLOAD.ACTION.UNDO');

        this.notificationService.openSnackMessageAction(messageTranslate.value, actionTranslate.value, 3000).onAction().subscribe(() => {
            this.uploadService.cancelUpload(...latestFilesAdded);
        });
    }

    private checkPermission(): void {
        if (this.rootFolderId) {
            this.getFolderNode(this.rootFolderId).subscribe(
                (res) => this.permissionValue.next(this.hasCreatePermission(res)),
                (error) => this.onError.emit(error)
            );
        }
    }

    private handleError(error: Response): ErrorObservable<string | Response> {
        // in a real world app, we may send the error to some remote logging infrastructure
        // instead of just logging it to the console
        this.logService.error(error);
        return Observable.throw(error || 'Server error');
    }

    private hasCreatePermission(node: any): boolean {
        if (node && node.allowableOperations) {
            return node.allowableOperations.find((permision) => permision === 'create') ? true : false;
        }
        return false;
    }
}
