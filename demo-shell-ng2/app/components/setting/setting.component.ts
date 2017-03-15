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

import { Component } from '@angular/core';
import { AlfrescoSettingsService, StorageService, LogService } from 'ng2-alfresco-core';

@Component({
    selector: 'alfresco-setting-demo',
    templateUrl: './setting.component.html',
    styleUrls: ['./setting.component.css']
})
export class SettingComponent {

    ecmHost: string;
    bpmHost: string;
    oauthHost: string;

    clientId: string;
    secret: string;

    constructor(private settingsService: AlfrescoSettingsService,
                private storage: StorageService,
                private logService: LogService) {
        this.ecmHost = this.settingsService.ecmHost;
        this.bpmHost = this.settingsService.bpmHost;
        this.oauthHost = this.settingsService.oauthHost;
        this.clientId = this.settingsService.clientId;
        this.secret = this.settingsService.secret;
    }

    public onChangeECMHost(event: KeyboardEvent): void {
        let value = (<HTMLInputElement>event.target).value.trim();
        if (value) {
            this.logService.info(`ECM host: ${value}`);
            this.ecmHost = value;
            this.settingsService.ecmHost = value;
            this.storage.setItem(`ecmHost`, value);
        }
    }

    public onChangeBPMHost(event: KeyboardEvent): void {
        let value = (<HTMLInputElement>event.target).value.trim();
        if (value) {
            this.logService.info(`BPM host: ${value}`);
            this.bpmHost = value;
            this.settingsService.bpmHost = value;
            this.storage.setItem(`bpmHost`, value);
        }
    }

    public onChangeOauthHost(event: KeyboardEvent): void {
        let value = (<HTMLInputElement>event.target).value.trim();
        if (value) {
            this.logService.info(`Oauth2 host: ${value}`);
            this.oauthHost = value;
            this.settingsService.oauthHost = value;
            this.storage.setItem(`oauthHost`, value);
        }
    }

    public onChangeClientId(event: KeyboardEvent): void {
        let value = (<HTMLInputElement>event.target).value.trim();
        if (value) {
            this.logService.info(`clientId: ${value}`);
            this.clientId = value;
            this.settingsService.clientId = value;
            this.storage.setItem(`clientId`, value);
        }
    }

    public onChangeSecret(event: KeyboardEvent): void {
        let value = (<HTMLInputElement>event.target).value.trim();
        if (value) {
            this.logService.info(`Secret: ${value}`);
            this.secret = value;
            this.settingsService.secret = value;
            this.storage.setItem(`secret`, value);
        }
    }

    public isOauthProviderEnabled(): boolean {
        return this.storage.getItem('providers') === "OAUTH";
    }

}
