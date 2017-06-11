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
import { MinimalNodeEntity } from 'alfresco-js-api';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable, Subject } from 'rxjs/Rx';
import { FolderCreatedEvent } from '../events/folder-created.event';
import { AlfrescoApiService } from './alfresco-api.service';
import { AlfrescoAuthenticationService } from './alfresco-authentication.service';
import { LogService } from './log.service';

@Injectable()
export class AlfrescoContentService {

    public folderCreated: Subject<FolderCreatedEvent> = new Subject<FolderCreatedEvent>();

    constructor(public authService: AlfrescoAuthenticationService,
                public apiService: AlfrescoApiService,
                private logService: LogService) {
    }

    /**
     * Get thumbnail URL for the given document node.
     * @param nodeId {string} Node to get URL for.
     * @returns {string} URL address.
     */
    public getDocumentThumbnailUrl(nodeId: any): string {

        if (nodeId && nodeId.entry) {
            nodeId = nodeId.entry.id;
        }

        return this.apiService.getInstance().content.getDocumentThumbnailUrl(nodeId);
    }

    /**
     * Get content URL for the given node.
     * @param nodeId {string} Node to get URL for.
     * @returns {string} URL address.
     */
    public getContentUrl(nodeId: any): string {

        if (nodeId && nodeId.entry) {
            nodeId = nodeId.entry.id;
        }

        return this.apiService.getInstance().content.getContentUrl(nodeId);
    }

    /**
     * Get content for the given node.
     * @param nodeId {string}.
     *
     * @returns {Observable<any>} URL address.
     */
    public getNodeContent(nodeId: string): Observable<any> {
        return Observable.fromPromise(this.apiService.getInstance().core.nodesApi.getFileContent(nodeId).then((dataContent) => {
            return dataContent;
        })).catch(this.handleError);
    }

    /**
     * Create a folder
     * @param name - the folder name
     */
    public createFolder(relativePath: string, name: string, parentId?: string): Observable<MinimalNodeEntity> {
        return Observable.fromPromise(this.apiService.getInstance().nodes.createFolder(name, relativePath, parentId))
            .do((data) => {
                this.folderCreated.next({
                    relativePath,
                    name,
                    parentId,
                    node: data
                });
            })
            .catch((err) => this.handleError(err));
    }

    /**
     * Throw the error
     * @param error
     * @returns {ErrorObservable}
     */
    private handleError(error: Response): ErrorObservable<string | Response> {
        this.logService.error(error);
        return Observable.throw(error || 'Server error');
    }
}
