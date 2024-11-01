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

import { NextFunction, Response } from 'express';
import {
	BaseMiddleware,
	BaseMiddlewares,
	ExtendedRequest,
} from '../ExpressMiddleware/ExpressMiddleware';
import { HttpMethod } from './HttpMethod';
import { ExpressModule } from '../ExpressAdapter/ExpressModule';

export type ExpressFunction = (
	req: ExtendedRequest,
	res: Response,
	next: NextFunction
) => Promise<void>;

export type ExpressFunctionFactory = (
	thisArg: ExpressModule
) => ExpressFunction;

export class Route {
	constructor(
		public route: string,
		public method: ExpressFunctionFactory,
		public methodName: string,
		public httpMethod: HttpMethod,
		public middlewares: BaseMiddlewares = []
	) {}

	public addMiddleware(middleware: BaseMiddleware) {
		this.middlewares.push(middleware);
	}

	public getMiddlewareMethods() {
		let expressEndpoints = [];

		for (let middleware of this.middlewares) {
			expressEndpoints.push(middleware.handle.bind(middleware));
		}

		return expressEndpoints;
	}
}

export type Routes = Route[];

export const ROUTES_METADATA_KEY = Symbol('express:routes');
