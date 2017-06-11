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

import { Component, HostListener, Input } from '@angular/core';
import { LogService } from 'ng2-alfresco-core';
import { RenderingQueueServices } from '../services/rendering-queue.services';

declare let PDFJS: any;

@Component({
    selector: 'pdf-viewer',
    templateUrl: './pdfViewer.component.html',
    styleUrls: ['./pdfViewer.component.css', './pdfViewerHost.component.css'],
    providers: [RenderingQueueServices]
})
export class PdfViewerComponent {

    @Input()
    public urlFile: string;

    @Input()
    public blobFile: Blob;

    @Input()
    public nameFile: string;

    @Input()
    public showToolbar: boolean = true;

    public currentPdfDocument: any;
    public page: number;
    public displayPage: number;
    public totalPages: number;
    public loadingPercent: number;
    private pdfViewer: any;
    private currentScaleMode: string = 'auto';
    private currentScale: number;

    private MAX_AUTO_SCALE: number = 1.25;
    private DEFAULT_SCALE_DELTA: number = 1.1;
    private MIN_SCALE: number = 0.25;
    private MAX_SCALE: number = 10.0;

    constructor(private renderingQueueServices: RenderingQueueServices,
                private logService: LogService) {
    }

    public ngOnChanges() {
        if (!this.urlFile && !this.blobFile) {
            throw new Error('Attribute urlFile or blobFile is required');
        }

        if (this.urlFile) {
            return new Promise((resolve, reject) => {
                this.executePdf(this.urlFile, resolve, reject);
            });
        } else {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = () => {
                    this.executePdf(reader.result, resolve, reject);
                };
                reader.readAsArrayBuffer(this.blobFile);
            });
        }
    }

    private executePdf(src, resolve, reject): void {
        let loadingTask = this.getPDFJS().getDocument(src);

        loadingTask.onProgress = (progressData) => {
            let level = progressData.loaded / progressData.total;
            this.loadingPercent = Math.round(level * 100);
        };

        loadingTask.then((pdfDocument) => {
            this.currentPdfDocument = pdfDocument;
            this.totalPages = pdfDocument.numPages;
            this.page = 1;
            this.displayPage = 1;
            this.initPDFViewer(this.currentPdfDocument);

            this.currentPdfDocument.getPage(1).then(() => {
                this.scalePage('auto');
                resolve();
            }, (error) => {
                reject(error);
            });

        }, (error) => {
            reject(error);
        });
    }

    /**
     * return the PDFJS global object (exist to facilitate the mock of PDFJS in the test)
     *
     * @returns {PDFJS}
     */
    private getPDFJS(): PDFJS {
        return PDFJS;
    }

    private initPDFViewer(pdfDocument: any): void {
        PDFJS.verbosity = 1;
        PDFJS.disableWorker = false;

        let documentContainer = document.getElementById('viewer-pdf-container');
        let viewer: any = document.getElementById('viewer-viewerPdf');

        window.document.addEventListener('scroll', (event: Event) => {
            this.watchScroll(event.target);
        }, true);

        this.pdfViewer = new PDFJS.PDFViewer({
            container: documentContainer,
            viewer,
            renderingQueue: this.renderingQueueServices
        });

        this.renderingQueueServices.setViewer(this.pdfViewer);

        this.pdfViewer.setDocument(pdfDocument);
    }

    /**
     * Method to scale the page current support implementation
     *
     * @param {string} scaleMode - new scale mode
     */
    private scalePage(scaleMode): void {
        this.currentScaleMode = scaleMode;

        if (this.pdfViewer) {

            let viewerContainer = document.getElementById('viewer-main-container');
            let documentContainer = document.getElementById('viewer-pdf-container');

            let widthContainer;
            let heigthContainer;

            if (viewerContainer && viewerContainer.clientWidth <= documentContainer.clientWidth) {
                widthContainer = viewerContainer.clientWidth;
                heigthContainer = viewerContainer.clientHeight;
            } else {
                widthContainer = documentContainer.clientWidth;
                heigthContainer = documentContainer.clientHeight;
            }

            let currentPage = this.pdfViewer._pages[this.pdfViewer._currentPageNumber - 1];

            let padding = 20;
            let pageWidthScale = (widthContainer - padding) / currentPage.width * currentPage.scale;
            let pageHeightScale = (heigthContainer - padding) / currentPage.width * currentPage.scale;

            let scale;

            switch (this.currentScaleMode) {
                case 'page-actual':
                    scale = 1;
                    break;
                case 'page-width':
                    scale = pageWidthScale;
                    break;
                case 'page-height':
                    scale = pageHeightScale;
                    break;
                case 'page-fit':
                    scale = Math.min(pageWidthScale, pageHeightScale);
                    break;
                case 'auto':
                    let horizontalScale;
                    if (this.isLandscape) {
                        horizontalScale = Math.min(pageHeightScale, pageWidthScale);
                    } else {
                        horizontalScale = pageWidthScale;
                    }
                    scale = Math.min(this.MAX_AUTO_SCALE, horizontalScale);

                    break;
                default:
                    this.logService.error('pdfViewSetScale: \'' + scaleMode + '\' is an unknown zoom value.');
                    return;
            }

            this.setScaleUpdatePages(scale);
        }
    }

    /**
     * Update all the pages with the newScale scale
     *
     * @param {number} newScale - new scale page
     */
    private setScaleUpdatePages(newScale: number): void {
        if (!this.isSameScale(this.currentScale, newScale)) {
            this.currentScale = newScale;

            this.pdfViewer._pages.forEach(function (currentPage) {
                currentPage.update(newScale);
            });

            this.pdfViewer.update();
        }
    }

    /**
     * method to check if the request scale of the page is the same for avoid unuseful re-rendering
     *
     * @param {number} oldScale - old scale page
     * @param {number} newScale - new scale page
     *
     * @returns {boolean}
     */
    private isSameScale(oldScale: number, newScale: number): boolean {
        return (newScale === oldScale);
    }

    /**
     * method to check if is a land scape view
     *
     * @param {number} width
     * @param {number} height
     *
     * @returns {boolean}
     */
    private  isLandscape(width: number, height: number): boolean {
        return (width > height);
    }

    /**
     * Method triggered when the page is resized
     */
    onResize(): void {
        this.scalePage(this.currentScaleMode);
    }

    /**
     * toggle the fit page pdf
     */
    private pageFit(): void {
        if (this.currentScaleMode !== 'page-fit') {
            this.scalePage('page-fit');
        } else {
            this.scalePage('auto');
        }
    }

    /**
     * zoom in page pdf
     *
     * @param {number} ticks
     */
    private zoomIn(ticks: number): void {
        let newScale: any = this.currentScale;
        do {
            newScale = (newScale * this.DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.ceil(newScale * 10) / 10;
            newScale = Math.min(this.MAX_SCALE, newScale);
        } while (--ticks > 0 && newScale < this.MAX_SCALE);
        this.currentScaleMode = 'auto';
        this.setScaleUpdatePages(newScale);
    }

    /**
     * zoom out page pdf
     *
     * @param {number} ticks
     */
    private zoomOut(ticks: number): void {
        let newScale: any = this.currentScale;
        do {
            newScale = (newScale / this.DEFAULT_SCALE_DELTA).toFixed(2);
            newScale = Math.floor(newScale * 10) / 10;
            newScale = Math.max(this.MIN_SCALE, newScale);
        } while (--ticks > 0 && newScale > this.MIN_SCALE);
        this.currentScaleMode = 'auto';
        this.setScaleUpdatePages(newScale);
    }

    /**
     * load the previous page
     */
    private previousPage(): void {
        if (this.pdfViewer && this.page > 1) {
            this.page--;
            this.displayPage = this.page;

            this.pdfViewer.currentPageNumber = this.page;
        }
    }

    /**
     * load the next page
     */
    private nextPage(): void {
        if (this.pdfViewer && this.page < this.totalPages) {
            this.page++;
            this.displayPage = this.page;

            this.pdfViewer.currentPageNumber = this.page;
        }
    }

    /**
     * load the page in input
     *
     * @param {string} page - page to load
     */
    private inputPage(page: string): void {
        let pageInput = parseInt(page, 10);

        if (!isNaN(pageInput) && pageInput > 0 && pageInput <= this.totalPages) {
            this.page = pageInput;
            this.displayPage = this.page;
            this.pdfViewer.currentPageNumber = this.page;
        } else {
            this.displayPage = this.page;
        }
    }

    /**
     * Litener Scroll Event
     *
     * @param {any} target
     */
    private watchScroll(target): void {
        let outputPage = this.getVisibleElement(target);

        if (outputPage) {
            this.page = outputPage.id;
            this.displayPage = this.page;
        }
    }

    /**
     * find out what elements are visible within a scroll pane
     *
     * @param {any} target
     *
     * @returns {Object} page
     */
    private getVisibleElement(target) {
        return this.pdfViewer._pages.find((page) => {
            return this.isOnScreen(page, target);
        });
    }

    /**
     * check if a page is visible
     *
     * @param {any} page
     * @param {any} target
     *
     * @returns {boolean}
     */
    isOnScreen(page: any, target: any): boolean {
        let viewport: any = {};
        viewport.top = target.scrollTop;
        viewport.bottom = viewport.top + target.scrollHeight;
        let bounds: any = {};
        bounds.top = page.div.offsetTop;
        bounds.bottom = bounds.top + page.viewport.height;
        return ((bounds.top <= viewport.bottom) && (bounds.bottom >= viewport.top));
    };

    /**
     * Litener Keyboard Event
     * @param {KeyboardEvent} event
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        let key = event.keyCode;
        if (key === 39) { // right arrow
            this.nextPage();
        } else if (key === 37) {// left arrow
            this.previousPage();
        }
    }

}
