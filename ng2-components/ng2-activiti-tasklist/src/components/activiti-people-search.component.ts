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

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AlfrescoTranslationService } from 'ng2-alfresco-core';
import { Observable } from 'rxjs/Observable';
import { User } from '../models/user.model';

declare let componentHandler: any;
declare var require: any;

@Component({
    selector: 'activiti-people-search',
    templateUrl: './activiti-people-search.component.html',
    styleUrls: ['./activiti-people-search.component.css']
})

export class ActivitiPeopleSearch implements OnInit, AfterViewInit {

    @Input()
    public iconImageUrl: string = require('../assets/images/user.jpg');

    @Input()
    public results: Observable<User[]>;

    @Output()
    public onSearch: EventEmitter<any> = new EventEmitter();

    @Output()
    public onRowClicked: EventEmitter<any> = new EventEmitter();

    public searchUser: FormControl = new FormControl();

    public userList: User[] = [];

    constructor(private translateService: AlfrescoTranslationService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-tasklist', 'assets/ng2-activiti-tasklist');
        }

        this.searchUser
            .valueChanges
            .debounceTime(200)
            .subscribe((event: string) => {
                if (event && event.trim()) {
                    this.onSearch.emit(event);
                } else {
                    this.userList = [];
                }
            });
    }

    public ngOnInit(): void {
        this.results.subscribe((list) => {
            this.userList = list;
        });
    }

    public ngAfterViewInit(): void {
        this.setupMaterialComponents(componentHandler);
    }

    public setupMaterialComponents(handler?: any): boolean {
        // workaround for MDL issues with dynamic components
        let isUpgraded: boolean = false;
        if (handler) {
            handler.upgradeAllRegistered();
            isUpgraded = true;
        }
        return isUpgraded;
    }

    public onRowClick(userClicked: User): void {
        this.onRowClicked.emit(userClicked);
        this.userList = this.userList.filter((user) => {
            this.searchUser.reset();
            return user.id !== userClicked.id;
        });
    }

    public getDisplayUser(user: User): string {
        let firstName = user.firstName && user.firstName !== 'null' ? user.firstName : 'N/A';
        let lastName = user.lastName && user.lastName !== 'null' ? user.lastName : 'N/A';
        return firstName + ' - ' + lastName;
    }
}
