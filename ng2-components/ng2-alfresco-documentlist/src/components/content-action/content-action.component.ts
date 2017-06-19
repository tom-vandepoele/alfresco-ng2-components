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

import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

import { ContentActionHandler } from '../../models/content-action.model';
import { DocumentActionsService } from '../../services/document-actions.service';
import { FolderActionsService } from '../../services/folder-actions.service';
import { ContentActionModel } from './../../models/content-action.model';
import { ContentActionListComponent } from './content-action-list.component';

@Component({
    selector: 'content-action',
    template: ''
})
export class ContentActionComponent implements OnInit, OnChanges {

    @Input()
    public title: string = 'Action';

    @Input()
    public icon: string;

    @Input()
    public handler: string;

    @Input()
    public target: string;

    @Input()
    public permission: string;

    @Input()
    public disableWithNoPermission: boolean;

    @Input()
    public disabled: boolean = false;

    @Output()
    public execute = new EventEmitter();

    @Output()
    public permissionEvent = new EventEmitter();

    public model: ContentActionModel;

    constructor(private list: ContentActionListComponent,
                private documentActions: DocumentActionsService,
                private folderActions: FolderActionsService) {
        this.model = new ContentActionModel();
    }

    public ngOnInit(): void {
        this.model = new ContentActionModel({
            title: this.title,
            icon: this.icon,
            permission: this.permission,
            disableWithNoPermission: this.disableWithNoPermission,
            target: this.target,
            disabled: this.disabled
        });

        if (this.handler) {
            this.model.handler = this.getSystemHandler(this.target, this.handler);
        } else if (this.execute) {
            this.model.handler = (document: any): void => {
                this.execute.emit({
                    value: document
                });
            };
        }

        this.register();
    }

    public register(): boolean {
        if (this.list) {
            return this.list.registerAction(this.model);
        }
        return false;
    }

    public ngOnChanges(changes): void {
        // update localizable properties
        this.model.title = this.title;
    }

    public getSystemHandler(target: string, name: string): ContentActionHandler {
        if (target) {
            let ltarget = target.toLowerCase();

            if (ltarget === 'document') {
                if (this.documentActions) {
                    return this.documentActions.getHandler(name);
                }
            } else if (ltarget === 'folder') {
                if (this.folderActions) {
                    this.folderActions.permissionEvent.subscribe((permision) => {
                        this.permissionEvent.emit(permision);
                    });
                    return this.folderActions.getHandler(name);
                }
            }
        }
        return null;
    }
}
