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

import { Component, HostListener } from '@angular/core';
import { ContextMenuService } from './context-menu.service';

@Component({
    selector: 'context-menu-holder',
    styles: [
        `
        .menu-container {
            background: #fff;
            display: block;
            margin: 0;
            padding: 0;
            border: none;
            overflow: visible;
            z-index: 9999;
        }

        .context-menu {
            list-style-type: none;
            position: static;
            height: auto;
            width: auto;
            min-width: 124px;
            padding: 8px 0;
            margin: 0;
            box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12);
            border-radius: 2px;
        }

        .context-menu .link {
            opacity: 1;
        }
        `
    ],
    template: `
        <div [ngStyle]="locationCss" class="menu-container">
            <ul class="context-menu">
                <li *ngFor="let link of links"
                    class="mdl-menu__item link"
                    (click)="onMenuItemClick($event, link)"
                    [attr.disabled]="link.model?.disabled || undefined">
                    {{link.title || link.model?.title}}
                </li>
            </ul>
        </div>
    `
})
export class ContextMenuHolderComponent {

    public links: string[] = [];
    public isShown: boolean = false;
    private mouseLocation: { left: number, top: number } = {left: 0, top: 0};

    constructor(private _contextMenuService: ContextMenuService) {
        _contextMenuService.show.subscribe(event => this.showMenu(event.event, event.obj));
    }

    get locationCss() {
        return {
            position: 'fixed',
            display: this.isShown ? 'block' : 'none',
            left: this.mouseLocation.left + 'px',
            top: this.mouseLocation.top + 'px'
        };
    }

    @HostListener('document:click')
    public clickedOutside(): void {
        this.isShown = false;
    }

    public onMenuItemClick(event: Event, menuItem: any): void {
        if (menuItem && menuItem.model && menuItem.model.disabled) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }
        menuItem.subject.next(menuItem);
    }

    public showMenu(event: MouseEvent, links: string[]): void {
        this.isShown = true;
        this.links = links;

        if (event) {
            this.mouseLocation = {
                left: event.clientX,
                top: event.clientY
            };
        }
    }

    @HostListener('contextmenu', ['$event'])
    public onShowContextMenu(event?: MouseEvent): void {
        if (event) {
            event.preventDefault();
        }
    }
}
