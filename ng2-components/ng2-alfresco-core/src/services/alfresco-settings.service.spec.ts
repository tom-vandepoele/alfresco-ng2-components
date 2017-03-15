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

import { AlfrescoSettingsService } from './alfresco-settings.service';

describe('AlfrescoSettingsService', () => {

    let service: AlfrescoSettingsService;

    beforeEach(() => {
        service = new AlfrescoSettingsService();
    });

    describe('default values', () => {

        it('should have default ECM host', () => {
            expect(service.ecmHost).toBe(AlfrescoSettingsService.DEFAULT_ECM_ADDRESS);
        });

        it('should have default BPM host', () => {
            expect(service.bpmHost).toBe(AlfrescoSettingsService.DEFAULT_BPM_ADDRESS);
        });

        it('should have default OAUTH host', () => {
            expect(service.oauthHost).toBe(AlfrescoSettingsService.DEFAULT_OAUTH_ADDRESS);
        });

        it('should have default clientId', () => {
            expect(service.clientId).toBe(AlfrescoSettingsService.DEFAULT_CLIENT_ID);
        });

        it('should have default secret', () => {
            expect(service.secret).toBe(AlfrescoSettingsService.DEFAULT_SECRET);
        });
    });

    describe('set values', () => {

        it('should change host ECM', () => {
            let address = 'http://192.168.0.1';
            service.ecmHost = address;
            expect(service.ecmHost).toBe(address);
        });

        it('should change host BPM', () => {
            let address = 'http://192.168.0.1';
            service.bpmHost = address;
            expect(service.bpmHost).toBe(address);
        });

        it('should change host OAUTH', () => {
            let address = 'http://192.168.0.1';
            service.oauthHost = address;
            expect(service.oauthHost).toBe(address);
        });

        it('should change clientId OAUTH', () => {
            let clientId = 'testclient';
            service.clientId = clientId;
            expect(service.clientId).toBe(clientId);
        });

        it('should change secret OAUTH', () => {
            let secret = 'testSecret';
            service.secret = secret;
            expect(service.secret).toBe(secret);
        });
    });
});
