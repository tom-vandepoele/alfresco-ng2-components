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

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import { ContentActionHandler } from '../models/content-action.model';
import { PermissionModel } from '../models/permissions.model';
import { DocumentListService } from './document-list.service';

@Injectable()
export class FolderActionsService {

    public permissionEvent: Subject<PermissionModel> = new Subject<PermissionModel>();

    private handlers: { [id: string]: ContentActionHandler; } = {};

    constructor(private documentListService?: DocumentListService) {
        this.setupActionHandlers();
    }

    public getHandler(key: string): ContentActionHandler {
        if (key) {
            let lkey = key.toLowerCase();
            return this.handlers[lkey] || null;
        }
        return null;
    }

    public setHandler(key: string, handler: ContentActionHandler): boolean {
        if (key) {
            let lkey = key.toLowerCase();
            this.handlers[lkey] = handler;
            return true;
        }
        return false;
    }

    public canExecuteAction(obj: any): boolean {
        return this.documentListService && obj && obj.entry.isFolder === true;
    }

    private setupActionHandlers(): void {
        this.handlers.delete = this.deleteNode.bind(this);

        // TODO: for demo purposes only, will be removed during future revisions
        this.handlers.system1 = this.handleStandardAction1.bind(this);
        this.handlers.system2 = this.handleStandardAction2.bind(this);
    }

    // TODO: for demo purposes only, will be removed during future revisions
    private handleStandardAction1(document: any): void {
        window.alert('standard folder action 1');
    }

    // TODO: for demo purposes only, will be removed during future revisions
    private handleStandardAction2(document: any): void {
        window.alert('standard folder action 2');
    }

    private deleteNode(obj: any, target?: any, permission?: string): void {
        if (this.canExecuteAction(obj)) {
            if (this.hasPermission(obj.entry, permission)) {
                this.documentListService.deleteNode(obj.entry.id).subscribe(() => {
                    if (target && typeof target.reload === 'function') {
                        target.reload();
                    }
                });
            } else {
                this.permissionEvent.next(new PermissionModel({type: 'folder', action: 'delete', permission}));
            }
        }
    }

    private hasPermission(node: any, permissionToCheck: string): boolean {
        let hasPermission = false;

        if (this.hasPermissions(node)) {
            hasPermission = node.allowableOperations.find((permision) => permision === permissionToCheck) ? true : false;
        }

        return hasPermission;
    }

    private hasPermissions(node: any): boolean {
        return node && node.allowableOperations ? true : false;
    }
}
