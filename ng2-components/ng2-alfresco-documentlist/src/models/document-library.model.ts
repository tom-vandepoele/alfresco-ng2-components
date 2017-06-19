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

// note: contains only limited subset of available fields

import { MinimalNodeEntity, MinimalNodeEntryEntity } from 'alfresco-js-api';

export class NodePaging {
    public list: NodePagingList;
}

export class NodePagingList {
    public pagination: Pagination;
    public entries: NodeMinimalEntry[];
}

export class NodeMinimalEntry implements MinimalNodeEntity {
    public entry: NodeMinimal;
}

export class Pagination {
    public count: number;
    public hasMoreItems: boolean;
    public totalItems: number;
    public skipCount: number;
    public maxItems: number;
}

export class NodeMinimal implements MinimalNodeEntryEntity {
    public id: string;
    public parentId: string;
    public name: string;
    public nodeType: string;
    public isFolder: boolean;
    public isFile: boolean;
    public modifiedAt: Date;
    public modifiedByUser: UserInfo;
    public createdAt: Date;
    public createdByUser: UserInfo;
    public content: ContentInfo;
    public path: PathInfoEntity;
    public properties: NodeProperties = {};
}

export class UserInfo {
    public displayName: string;
    public id: string;
}

export class ContentInfo {
    public mimeType: string;
    public mimeTypeName: string;
    public sizeInBytes: number;
    public encoding: string;
}

export class PathInfoEntity {
    public elements: PathElementEntity[];
    public isComplete: boolean;
    public name: string;
}

export class PathElementEntity {
    public id: string;
    public name: string;
}

export interface NodeProperties {
    [key: string]: any;
}
