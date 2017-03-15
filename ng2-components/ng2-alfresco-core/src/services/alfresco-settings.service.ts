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
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AlfrescoSettingsService {

    static DEFAULT_ECM_ADDRESS: string = 'http://' + window.location.hostname + ':8080';
    static DEFAULT_BPM_ADDRESS: string = 'http://' + window.location.hostname + ':9999';
    static DEFAULT_OAUTH_ADDRESS: string = 'http://' + window.location.hostname + ':9191';
    static DEFAULT_CLIENT_ID: string = 'alfrescoexample';
    static DEFAULT_SECRET: string = 'secret';
    static DEFAULT_CSRF_CONFIG: boolean = false;

    static DEFAULT_BPM_CONTEXT_PATH: string = '/activiti-app';

    private _ecmHost: string = AlfrescoSettingsService.DEFAULT_ECM_ADDRESS;
    private _bpmHost: string = AlfrescoSettingsService.DEFAULT_BPM_ADDRESS;
    private _oauthHost: string = AlfrescoSettingsService.DEFAULT_OAUTH_ADDRESS;

    private _csrfDisabled: boolean = AlfrescoSettingsService.DEFAULT_CSRF_CONFIG;

    private _clientId: string = AlfrescoSettingsService.DEFAULT_CLIENT_ID;
    private _secret: string = AlfrescoSettingsService.DEFAULT_SECRET;

    private _bpmContextPath = AlfrescoSettingsService.DEFAULT_BPM_CONTEXT_PATH;

    private providers: string = 'ALL'; // ECM, BPM , ALL, OAUTH

    public bpmHostSubject: Subject<string> = new Subject<string>();
    public ecmHostSubject: Subject<string> = new Subject<string>();
    public oauthHostSubject: Subject<string> = new Subject<string>();
    public csrfSubject: Subject<boolean> = new Subject<boolean>();
    public clientIdSubject: Subject<string> = new Subject<string>();
    public secretSubject: Subject<string> = new Subject<string>();
    public providerSubject: Subject<string> = new Subject<string>();

    public get ecmHost(): string {
        return this._ecmHost;
    }

    public set csrfDisabled(csrfDisabled: boolean) {
        this.csrfSubject.next(csrfDisabled);
        this._csrfDisabled = csrfDisabled;
    }

    public set ecmHost(ecmHostUrl: string) {
        this.ecmHostSubject.next(ecmHostUrl);
        this._ecmHost = ecmHostUrl;
    }

    public get bpmHost(): string {
        return this._bpmHost;
    }

    public set bpmHost(bpmHostUrl: string) {
        this.bpmHostSubject.next(bpmHostUrl);
        this._bpmHost = bpmHostUrl;
    }

    public get oauthHost(): string {
        return this._oauthHost;
    }

    public set oauthHost(oauthHostUrl: string) {
        this.oauthHostSubject.next(oauthHostUrl);
        this._oauthHost = oauthHostUrl;
    }

    public get clientId(): string {
        return this._clientId;
    }

    public set clientId(clientId: string) {
        this.clientIdSubject.next(clientId);
        this._clientId = clientId;
    }

    public get secret(): string {
        return this._secret;
    }

    public set secret(secret: string) {
        this.secretSubject.next(secret);
        this._secret = secret;
    }

    public getBPMApiBaseUrl(): string {
        return this._bpmHost + this._bpmContextPath;
    }

    public getProviders(): string {
        return this.providers;
    }

    public setProviders(providers: string) {
        this.providerSubject.next(providers);
        this.providers = providers;
    }
}
