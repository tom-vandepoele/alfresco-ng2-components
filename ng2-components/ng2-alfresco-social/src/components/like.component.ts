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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RatingService } from './../services/rating.service';

@Component({
    selector: 'adf-like',
    styleUrls: ['./like.component.css'],
    templateUrl: './like.component.html',
    providers: [RatingService]
})
export class LikeComponent {

    @Input()
    public nodeId: string;

    @Output()
    public changeVote = new EventEmitter();

    public likesCounter: number = 0;

    private ratingType: string = 'likes';

    private isLike: boolean = false;

    constructor(private ratingService: RatingService) {
    }

    public ngOnChanges(): Promise<PushSubscription> {
        this.clean();

        let ratingObserver = this.ratingService.getRating(this.nodeId, this.ratingType);

        ratingObserver.subscribe(
            (data) => {
                if (data.entry.aggregate) {
                    this.likesCounter = data.entry.aggregate.numberOfRatings;
                    if (data.entry.ratedAt) {
                        this.isLike = true;
                    }
                }
            }
        );

        return ratingObserver;
    }

    public likeClick(): void {
        if (this.isLike) {
            this.ratingService.deleteRating(this.nodeId, this.ratingType).subscribe(
                () => {
                    this.likesCounter -= 1;
                    this.isLike = false;
                }
            );
        } else {
            this.ratingService.postRating(this.nodeId, this.ratingType, true).subscribe(
                (data) => {
                    this.likesCounter = data.entry.aggregate.numberOfRatings;
                    this.isLike = true;
                }
            );
        }

        this.changeVote.emit(this.likesCounter);
    }

    private clean(): void {
        this.isLike = false;
        this.likesCounter = 0;
    }
}
