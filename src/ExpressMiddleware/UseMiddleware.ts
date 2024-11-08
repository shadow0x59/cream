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

import 'reflect-metadata';

import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';
import { BaseMiddleware, BaseMiddlewares } from './ExpressMiddleware';
import { ExpressModule } from '../ExpressAdapter/ExpressModule';

export function UseMiddlewaresForController<
	T extends { new (...args: any[]): ExpressModule },
>(middlewares: BaseMiddlewares) {
	return function (target: T): T {
		return class extends target {
			constructor(...args: any[]) {
				super(middlewares);
			}
		};
	};
}

export function UseMiddleware<T extends BaseMiddleware>(middleware: T) {
	return function (
		target: ExpressModule,
		propertyName: string,
		descriptor: PropertyDescriptor
	) {
		let methodRouters: Routes =
			Reflect.getOwnMetadata(ROUTES_METADATA_KEY, target) || [];

		let route: Route | undefined = methodRouters.find(
			(value: Route) => value.methodName == propertyName
		)!;

		if (route == undefined) {
			throw Error(
				'Method ' + propertyName + ' is not a valid ExpressCall'
			);
		}

		route.addMiddleware(middleware);

		Reflect.defineMetadata(ROUTES_METADATA_KEY, methodRouters, target);

		return descriptor;
	};
}
