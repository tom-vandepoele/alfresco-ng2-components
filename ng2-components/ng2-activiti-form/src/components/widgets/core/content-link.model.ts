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

export class ContentLinkModel {

    public contentAvailable: boolean;
    public created: string;
    public createdBy: any;
    public id: number;
    public link: boolean;
    public  mimeType: string;
    public name: string;
    public previewStatus: string;
    public relatedContent: boolean;
    public  simpleType: string;
    public thumbnailUrl: string;
    public contentRawUrl: string;
    public contentBlob: Blob;
    public thumbnailStatus: string;

    constructor(obj?: any) {
        this.contentAvailable = obj && obj.contentAvailable;
        this.created = obj && obj.created;
        this.createdBy = obj && obj.createdBy || {};
        this.id = obj && obj.id;
        this.link = obj && obj.link;
        this.mimeType = obj && obj.mimeType;
        this.name = obj && obj.name;
        this.previewStatus = obj && obj.previewStatus;
        this.relatedContent = obj && obj.relatedContent;
        this.simpleType = obj && obj.simpleType;
        this.thumbnailStatus = obj && obj.thumbnailStatus;
    }

    public hasPreviewStatus(): boolean {
        return this.previewStatus === 'supported' ? true : false;
    }

    public isTypeImage(): boolean {
        return this.simpleType === 'image' ? true : false;
    }

    public isTypePdf(): boolean {
        return this.simpleType === 'pdf' ? true : false;
    }

    public isTypeDoc(): boolean {
        return this.simpleType === 'word' || this.simpleType === 'content' ? true : false;
    }

    public isThumbnailReady(): boolean {
        return this.thumbnailStatus === 'created';
    }

    public isThumbnailSupported(): boolean {
        return this.isTypeImage() || ((this.isTypePdf() || this.isTypeDoc()) && this.isThumbnailReady());
    }
}
