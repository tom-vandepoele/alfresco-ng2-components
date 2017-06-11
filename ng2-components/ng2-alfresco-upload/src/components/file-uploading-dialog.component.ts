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

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { FileUploadCompleteEvent } from '../events/file.event';
import { FileModel } from '../models/file.model';
import { UploadService } from '../services/upload.service';

@Component({
    selector: 'file-uploading-dialog',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './file-uploading-dialog.component.html',
    styleUrls: ['./file-uploading-dialog.component.css']
})
export class FileUploadingDialogComponent implements OnInit, OnDestroy {

    @Input()
    public filesUploadingList: FileModel [];

    public  isDialogActive: boolean = false;
    public totalCompleted: number = 0;
    private totalCompletedMsg: string = 'FILE_UPLOAD.MESSAGES.SINGLE_COMPLETED';
    private isDialogMinimized: boolean = false;

    private listSubscription: any;
    private counterSubscription: any;

    constructor(private cd: ChangeDetectorRef,
                translateService: AlfrescoTranslationService,
                private uploadService: UploadService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-alfresco-upload', 'assets/ng2-alfresco-upload');
        }
        cd.detach();
    }

    public ngOnInit(): void {
        this.listSubscription = this.uploadService.queueChanged.subscribe((fileList: FileModel[]) => {
            this.filesUploadingList = fileList;
            if (this.filesUploadingList.length > 0) {
                this.isDialogActive = true;
                this.cd.detectChanges();
            }
        });

        this.counterSubscription = this.uploadService.fileUploadComplete.subscribe((e: FileUploadCompleteEvent) => {
            this.totalCompleted = e.totalComplete;
            if (this.totalCompleted > 1) {
                this.totalCompletedMsg = 'FILE_UPLOAD.MESSAGES.COMPLETED';
            }
            this.cd.detectChanges();
        });

        this.uploadService.fileUpload.subscribe((e) => {
            this.cd.detectChanges();
        });
    }

    /**
     * Toggle dialog visibility state.
     */
    public toggleVisible(): void {
        this.isDialogActive = !this.isDialogActive;
        this.cd.detectChanges();
    }

    /**
     * Toggle dialog minimized state.
     */
    public toggleMinimized(): void {
        this.isDialogMinimized = !this.isDialogMinimized;
        this.cd.detectChanges();
    }

    public ngOnDestroy(): void {
        this.listSubscription.unsubscribe();
        this.counterSubscription.unsubscribe();
    }
}
