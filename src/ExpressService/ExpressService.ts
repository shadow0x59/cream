/*
 * Copyright 2024 Raul Radu
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

import { ExpressApplication } from '../ExpressApplication';

export abstract class ExpressService {
	private _app!: ExpressApplication;
	private _id!: string;

	abstract init(): Promise<boolean>;

	public set app(v: ExpressApplication) {
		this._app = v;
	}

	public get app(): ExpressApplication {
		return this._app;
	}

	public get id() {
		return this._id;
	}

	public static IdentifiedBy<T extends { new (...args: any[]): any }>(
		id: string
	) {
		return function (target: T): T {
			return class extends target {
				constructor(...args: any[]) {
					super(...args);
					super._id = id;
				}
			};
		};
	}
}

export type ExpressServices = ExpressService[];
