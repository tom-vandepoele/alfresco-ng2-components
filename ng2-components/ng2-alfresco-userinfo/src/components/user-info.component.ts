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

import { Component, Input, OnInit } from '@angular/core';
import { AlfrescoAuthenticationService, AlfrescoTranslationService } from 'ng2-alfresco-core';
import { BpmUserModel } from './../models/bpm-user.model';
import { EcmUserModel } from './../models/ecm-user.model';
import { BpmUserService } from './../services/bpm-user.service';
import { EcmUserService } from './../services/ecm-user.service';

declare let componentHandler: any;
declare var require: any;

@Component({
    selector: 'ng2-alfresco-userinfo',
    styleUrls: ['./user-info.component.css'],
    templateUrl: './user-info.component.html'
})
export class UserInfoComponent implements OnInit {

    @Input()
    public ecmBackgroundImage: string = require('../assets/images/ecm-background.png');

    @Input()
    public bpmBackgroundImage: string = require('../assets/images/bpm-background.png');

    @Input()
    public menuOpenType: string = 'right';

    @Input()
    public fallBackThumbnailImage: string;

    public ecmUser: EcmUserModel;
    public bpmUser: BpmUserModel;
    public anonymousImageUrl: string = require('../assets/images/anonymous.gif');
    public bpmUserImage: string;
    public ecmUserImage: string;

    constructor(private ecmUserService: EcmUserService,
                private bpmUserService: BpmUserService,
                private authService: AlfrescoAuthenticationService,
                private translateService: AlfrescoTranslationService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-alfresco-userinfo', 'assets/ng2-alfresco-userinfo');
        }
        authService.onLogin.subscribe((response) => {
            this.getUserInfo();
        });
    }

    public isLoggedIn(): boolean {
        return this.authService.isLoggedIn();
    }

    public  ngOnInit(): void {
        this.getUserInfo();
    }

    public onImageLoadingError(event: Event): void {
        if (event) {
            let element = <any> event.target;
            element.src = this.fallBackThumbnailImage || this.anonymousImageUrl;
        }
    }

    public stopClosing(event: Event): void {
        event.stopPropagation();
    }

    public getUserAvatar(): string {
        return this.ecmUserImage || this.bpmUserImage;
    }

    public getBpmUserAvatar(): string {
        return this.bpmUserImage;
    }

    public getEcmUserAvatar(): string {
        return this.ecmUserImage;
    }

    private getUserInfo(): void {
        this.getEcmUserInfo();
        this.getBpmUserInfo();
    }

    private getEcmUserInfo(): void {
        if (this.authService.isEcmLoggedIn()) {
            this.ecmUserService.getCurrentUserInfo()
                .subscribe((res) => {
                        this.ecmUser = new EcmUserModel(res);
                        this.getEcmAvatar();
                    }
                );
        } else {
            this.ecmUser = null;
            this.ecmUserImage = null;
        }
    }

    private getBpmUserInfo(): void {
        if (this.authService.isBpmLoggedIn()) {
            this.bpmUserService.getCurrentUserInfo()
                .subscribe((res) => {
                    this.bpmUser = new BpmUserModel(res);
                });
            this.bpmUserImage = this.bpmUserService.getCurrentUserProfileImage();
        } else {
            this.bpmUser = null;
            this.bpmUserImage = null;
        }
    }

    private getEcmAvatar(): void {
        this.ecmUserImage = this.ecmUserService.getUserProfileImage(this.ecmUser.avatarId);
    }

}
