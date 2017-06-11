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

import { Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { FileUtils } from 'ng2-alfresco-core';

@Directive({
    selector: '[file-draggable]'
})
export class FileDraggableDirective implements OnInit, OnDestroy {

    @Input('file-draggable')
    public enabled: boolean = true;

    @Output()
    public onFilesDropped: EventEmitter<File[]> = new EventEmitter<File[]>();

    @Output()
    public onFilesEntityDropped: EventEmitter<any> = new EventEmitter();

    @Output()
    public onFolderEntityDropped: EventEmitter<any> = new EventEmitter();

    public files: File [];

    private cssClassName: string = 'file-draggable__input-focus';
    private element: HTMLElement;

    constructor(private el: ElementRef, private ngZone: NgZone) {
        this.element = el.nativeElement;
    }

    public ngOnInit(): void {
        this.ngZone.runOutsideAngular(() => {
            this.element.addEventListener('dragenter', this.onDragEnter.bind(this));
            this.element.addEventListener('dragover', this.onDragOver.bind(this));
            this.element.addEventListener('dragleave', this.onDragLeave.bind(this));
            this.element.addEventListener('drop', this.onDropFiles.bind(this));
        });
    }

    public ngOnDestroy(): void {
        this.element.removeEventListener('dragenter', this.onDragEnter);
        this.element.removeEventListener('dragover', this.onDragOver);
        this.element.removeEventListener('dragleave', this.onDragLeave);
        this.element.removeEventListener('drop', this.onDropFiles);
    }

    /**
     * Method called when files is dropped in the drag and drop area.
     * @param event DOM event.
     */
    public onDropFiles(event: any): void {
        if (this.enabled && !event.defaultPrevented) {
            this.preventDefault(event);

            let items: DataTransferItem [] = event.dataTransfer.items;
            if (items) {
                items.forEach((currentItem) => {
                    if (currentItem.hasOwnProperty('webkitGetAsEntry')) {
                        let item: any = currentItem.webkitGetAsEntry();
                        if (item) {
                            if (item.isFile) {
                                this.onFilesEntityDropped.emit(item);
                            } else if (item.isDirectory) {
                                this.onFolderEntityDropped.emit(item);
                            }
                        }
                    } else {
                        let files = FileUtils.toFileArray(event.dataTransfer.files);
                        this.onFilesDropped.emit(files);
                    }
                });
            } else {
                // safari or FF
                let files = FileUtils.toFileArray(event.dataTransfer.files);
                this.onFilesDropped.emit(files);
            }

            this.element.classList.remove(this.cssClassName);
        }
    }

    /**
     * Change the style of the drag area when a file drag in.
     *
     * @param {event} event - DOM event.
     */
    public onDragEnter(event: Event): void {
        if (this.enabled && !event.defaultPrevented) {
            this.preventDefault(event);
            this.element.classList.add(this.cssClassName);
        }
    }

    /**
     * Change the style of the drag area when a file drag out.
     *
     * @param {event} event - DOM event.
     */
    public onDragLeave(event: Event): void {
        if (this.enabled && !event.defaultPrevented) {
            this.preventDefault(event);
            this.element.classList.remove(this.cssClassName);
        }
    }

    /**
     * Change the style of the drag area when a file is over the drag area.
     *
     * @param event
     */
    public onDragOver(event: Event): void {
        if (this.enabled && !event.defaultPrevented) {
            this.preventDefault(event);
            this.element.classList.add(this.cssClassName);
        }
    }

    /**
     * Prevent default and stop propagation of the DOM event.
     *
     * @param {event} $event - DOM event.
     */
    public preventDefault(event: Event): void {
        event.stopPropagation();
        event.preventDefault();
    }
}
