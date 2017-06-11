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
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Rx';
import { AlfrescoApiService } from './alfresco-api.service';
import { LogService } from './log.service';

/**
 * RenditionsService
 *
 * @returns {RenditionsService} .
 */
@Injectable()
export class RenditionsService {

    constructor(private apiService: AlfrescoApiService,
                private logService: LogService) {

    }

    public isRenditionAvailable(nodeId: string, encoding: string): Observable<any> {
        return Observable.create((observer) => {
            this.getRendition(nodeId, encoding).subscribe((res) => {
                let isAvailable = true;
                if (res.entry.status === 'NOT_CREATED') {
                    isAvailable = false;
                }
                observer.next(isAvailable);
                observer.complete();
            }, () => {
                observer.next(false);
                observer.complete();
            });
        });
    }

    public isConversionPossible(nodeId: string, encoding: string): Observable<any> {
        return Observable.create((observer) => {
            this.getRendition(nodeId, encoding).subscribe(() => {
                observer.next(true);
                observer.complete();
            }, () => {
                observer.next(false);
                observer.complete();
            });
        });
    }

    public  getRendition(nodeId: string, encoding: string): Observable<any> {
        return Observable.fromPromise(this.apiService.getInstance().core.renditionsApi.getRendition(nodeId, encoding))
            .catch((err) => this.handleError(err));
    }

    public getRenditionsListByNodeId(nodeId: string): Observable<any> {
        return Observable.fromPromise(this.apiService.getInstance().core.renditionsApi.getRenditions(nodeId))
            .catch((err) => this.handleError(err));
    }

    public createRendition(nodeId: string, encoding: string): Observable<any> {
        return Observable.fromPromise(this.apiService.getInstance().core.renditionsApi.createRendition(nodeId, {id: encoding}))
            .catch((err) => this.handleError(err));
    }

    private handleError(error: Response): ErrorObservable<string | Response> {
        this.logService.error(error);
        return Observable.throw(error || 'Server error');
    }
}
