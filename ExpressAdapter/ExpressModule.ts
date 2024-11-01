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

import { Router } from 'express';
import { BaseMiddlewares } from '../ExpressMiddleware/ExpressMiddleware';
import { ExpressApplication } from '../ExpressApplication';

export class ExpressModule {
	public accessor router: Router;
	public accessor baseUrl: string;
	public accessor className: string;
	private _app!: ExpressApplication;

	constructor(public middlewareList: BaseMiddlewares = []) {
		this.router = Router();
		this.baseUrl = '/';
		this.className = '';
	}

	public set app(v: ExpressApplication) {
		this._app = v;
	}

	public get app(): ExpressApplication {
		return this._app;
	}
}

export type ExpressModules = ExpressModule[];
