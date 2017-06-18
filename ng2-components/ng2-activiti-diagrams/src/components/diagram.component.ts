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

import { Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { AlfrescoTranslationService, LogService } from 'ng2-alfresco-core';
import { DiagramElementModel, DiagramModel } from '../models/diagram.model';
import { DiagramColorService } from '../services/diagram-color.service';
import { DiagramsService } from '../services/diagrams.service';
import { RaphaelService } from './raphael/raphael.service';

@Component({
    selector: 'activiti-diagram',
    styleUrls: ['./diagram.component.css'],
    templateUrl: './diagram.component.html'
})
export class DiagramComponent {
    @Input()
    public processDefinitionId: any;

    @Input()
    public processInstanceId: any;

    @Input()
    public metricPercentages: any;

    @Input()
    public metricColor: any;

    @Input()
    public metricType: string = '';

    @Input()
    public width: number = 1000;

    @Input()
    public height: number = 500;

    @Output()
    public onSuccess = new EventEmitter();

    @Output()
    public onError = new EventEmitter();

    public PADDING_WIDTH: number = 60;
    public PADDING_HEIGHT: number = 60;

    private diagram: DiagramModel;

    constructor(private elementRef: ElementRef,
                private translateService: AlfrescoTranslationService,
                private diagramColorService: DiagramColorService,
                private raphaelService: RaphaelService,
                private diagramsService: DiagramsService,
                private logService: LogService) {
        if (translateService) {
            translateService.addTranslationFolder('ng2-activiti-diagrams', 'assets/ng2-activiti-diagrams');
        }
    }

    public ngOnChanges(): void {
        this.reset();
        this.diagramColorService.setTotalColors(this.metricColor);
        if (this.processDefinitionId) {
            this.getProcessDefinitionModel(this.processDefinitionId);
        } else {
            this.getRunningProcessDefinitionModel(this.processInstanceId);
        }
    }

    public getRunningProcessDefinitionModel(processInstanceId: string): void {
        this.diagramsService.getRunningProcessDefinitionModel(processInstanceId).subscribe(
            (res: any) => {
                this.diagram = new DiagramModel(res);
                this.raphaelService.setting(this.diagram.diagramWidth + this.PADDING_WIDTH,
                    this.diagram.diagramHeight + this.PADDING_HEIGHT);
                this.setMetricValueToDiagramElement(this.diagram, this.metricPercentages, this.metricType);
                this.onSuccess.emit(res);
            },
            (err: any) => {
                this.onError.emit(err);
            }
        );
    }

    public getProcessDefinitionModel(processDefinitionId: string): void {
        this.diagramsService.getProcessDefinitionModel(processDefinitionId).subscribe(
            (res: any) => {
                this.diagram = new DiagramModel(res);
                this.raphaelService.setting(this.diagram.diagramWidth + this.PADDING_WIDTH,
                    this.diagram.diagramHeight + this.PADDING_HEIGHT);
                this.setMetricValueToDiagramElement(this.diagram, this.metricPercentages, this.metricType);
                this.onSuccess.emit(res);
            },
            (err: any) => {
                this.onError.emit(err);
            }
        );
    }

    public setMetricValueToDiagramElement(diagram: DiagramModel, metrics: any, metricType: string): void {
        for (let key in metrics) {
            if (metrics.hasOwnProperty(key)) {
                let foundElement: DiagramElementModel = diagram.elements.find(
                    (element: DiagramElementModel) => element.id === key);
                if (foundElement) {
                    foundElement.value = metrics[key];
                    foundElement.dataType = metricType;
                }
            }
        }
    }

    public reset(): void {
        this.raphaelService.reset();
    }
}
