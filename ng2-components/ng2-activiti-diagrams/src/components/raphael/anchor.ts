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

export class Anchor {

    public static ANCHOR_TYPE: any = {
        main: 'main',
        middle: 'middle',
        first: 'first',
        last: 'last'
    };

    public  uuid: any = null;
    public x: any = 0;
    public y: any = 0;
    public isFirst: any = false;
    public isLast: any = false;
    public typeIndex: any = 0;
    public type: any = Anchor.ANCHOR_TYPE.main;

    constructor(uuid: any, type: any, x: any, y: any) {
        this.uuid = uuid;
        this.x = x;
        this.y = y;
        this.type = (type === Anchor.ANCHOR_TYPE.middle) ? Anchor.ANCHOR_TYPE.middle : Anchor.ANCHOR_TYPE.main;
    }
}
