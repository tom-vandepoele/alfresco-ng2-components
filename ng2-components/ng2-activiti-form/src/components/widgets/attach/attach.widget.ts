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

import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { ActivitiAlfrescoContentService } from '../../../services/activiti-alfresco.service';
import { ExternalContent } from '../core/external-content';
import { ExternalContentLink } from '../core/external-content-link';
import { FormFieldModel } from '../core/form-field.model';
import { WidgetComponent } from './../widget.component';

declare let dialogPolyfill: any;

@Component({
    selector: 'attach-widget',
    templateUrl: './attach.widget.html',
    styleUrls: ['./attach.widget.css']
})
export class AttachWidget extends WidgetComponent implements OnInit {

    public selectedFolderPathId: string;
    public selectedFolderSiteId: string;
    public selectedFolderSiteName: string;
    public selectedFolderAccountId: string;
    public fileName: string;
    public selectedFolderNodes: [ExternalContent];
    public selectedFile: ExternalContent;

    @Input()
    public field: FormFieldModel;

    @Output()
    public fieldChanged: EventEmitter<FormFieldModel> = new EventEmitter<FormFieldModel>();

    @Output()
    public error: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('dialog')
    public dialog: any;

    constructor(private contentService: ActivitiAlfrescoContentService,
                private logService: LogService) {
        super();
    }

    public ngOnInit(): void {
        if (this.field) {
            let params = this.field.params;

            if (params &&
                params.fileSource &&
                params.fileSource.selectedFolder) {
                this.selectedFolderSiteId = params.fileSource.selectedFolder.siteId;
                this.selectedFolderSiteName = params.fileSource.selectedFolder.site;
                this.setupFileBrowser();
                this.getExternalContentNodes();
            }
        }
    }

    public setupFileBrowser(): void {
        if (this.field) {
            let params = this.field.params;
            this.selectedFolderPathId = params.fileSource.selectedFolder.pathId;
            this.selectedFolderAccountId = params.fileSource.selectedFolder.accountId;
        }
    }

    public getLinkedFileName(): string {
        let result = this.fileName;

        if (this.selectedFile &&
            this.selectedFile.title) {
            result = this.selectedFile.title;
        }
        if (this.field &&
            this.field.value &&
            this.field.value.length > 0 &&
            this.field.value[0].name) {
            result = this.field.value[0].name;
        }

        return result;
    }

    public getExternalContentNodes(): void {
        this.contentService.getAlfrescoNodes(this.selectedFolderAccountId, this.selectedFolderPathId)
            .subscribe(
                (nodes) => this.selectedFolderNodes = nodes,
                (err) => {
                    this.error.emit(err);
                }
            );
    }

    public selectFile(node: ExternalContent): void {
        this.contentService.linkAlfrescoNode(this.selectedFolderAccountId, node, this.selectedFolderSiteId).subscribe(
            (link: ExternalContentLink) => {
                this.selectedFile = node;
                this.field.value = [link];
                this.field.json.value = [link];
                this.closeDialog();
                this.fieldChanged.emit(this.field);
            }
        );
    }

    public selectFolder(node: ExternalContent): void {
        this.selectedFolderPathId = node.id;
        this.getExternalContentNodes();
    }

    public showDialog(): boolean {
        this.setupFileBrowser();
        this.getExternalContentNodes();

        if (this.dialog) {
            if (!this.dialog.nativeElement.showModal) {
                dialogPolyfill.registerDialog(this.dialog.nativeElement);
            }

            this.dialog.nativeElement.showModal();
            return true;
        }
        return false;
    }

    private closeDialog(): void {
        if (this.dialog) {
            this.dialog.nativeElement.close();
        }
    }

    public cancel(): void {
        this.closeDialog();
    }

    public reset(): void {
        this.field.value = null;
        this.field.json.value = null;
    }

    public hasFile(): boolean {
        return this.field && this.field.value;
    }

}
