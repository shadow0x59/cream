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

import { NextFunction, Response } from 'express';

import { Message } from '../ExchangeUtils/Message';
import { RestError } from '../ExpressErrorHandler/ExpressErrorHandler';
import {
	ExtendedRequest,
	MiddlewareDataCollection,
	MiddlewareDataCollections,
} from '../ExpressMiddleware/ExpressMiddleware';
import { MiddlewareParameterProps } from '../ExpressMiddleware/MiddlewareData';
import { HttpMethod } from '../HttpUtils/HttpMethod';
import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';

import { ExpressModule } from './ExpressModule';
import { ParameterProp, ParameterProps } from './ParameterProp';

export const BODY_METADATA_KEY = Symbol('express:bodyAssoc');
export const PARAMS_METADATA_KEY = Symbol('express:paramAssoc');
export const HEADERS_METADATA_KEY = Symbol('express:headersAssoc');
export const MIDDLEWARE_METADATA_KEY = Symbol('express:middlewareAssoc');

export function ExpressCall<T extends ExpressModule>(
	relativePath: string,
	httpMethod: HttpMethod = HttpMethod.GET
) {
	return function (
		target: T,
		propertyName: string,
		descriptor: PropertyDescriptor
	) {
		let method = descriptor.value!;
		let newMethod = (thisArg: ExpressModule) =>
			async function (
				req: ExtendedRequest,
				res: Response,
				next: NextFunction
			) {
				let args = [];
				let bodyAssocs: ParameterProps = Reflect.getOwnMetadata(
					BODY_METADATA_KEY,
					target,
					propertyName
				);
				if (bodyAssocs) {
					for (let param of bodyAssocs) {
						if (param.name == ':body') {
							args[param.index] = req.body;
						} else {
							args[param.index] = (req.body || [])[param.name];
						}
					}
				}

				let paramAssoc: ParameterProps = Reflect.getOwnMetadata(
					PARAMS_METADATA_KEY,
					target,
					propertyName
				);
				if (paramAssoc) {
					for (let param of paramAssoc) {
						args[param.index] = req.params[param.name];
					}
				}

				let headerMappings: ParameterProps = Reflect.getOwnMetadata(
					HEADERS_METADATA_KEY,
					target,
					propertyName
				);

				if (headerMappings) {
					for (let mapping of headerMappings) {
						args[mapping.index] = req.header(mapping.name);
					}
				}

				let middlewareAssoc: MiddlewareParameterProps =
					Reflect.getOwnMetadata(
						MIDDLEWARE_METADATA_KEY,
						target,
						propertyName
					);
				if (middlewareAssoc) {
					for (let param of middlewareAssoc) {
						let collections: MiddlewareDataCollections =
							req.middlewareDataCollections || new Map();

						let collection: MiddlewareDataCollection =
							collections.get(param.collection);

						if (collection) {
							if (param.name == '$') {
								args[param.index] = collection;
							} else {
								args[param.index] = (collection as any)[
									param.name
								];
							}
						} else {
							args[param.index] = undefined;
						}
					}
				}

				try {
					let result = (await method.apply(thisArg, args)) as Message;
					res.status(result.status || 200);
					res.set(
						'Content-Type',
						result.contentType || 'application/json'
					);
					res.send(result.content);
				} catch (e) {
					if (e instanceof RestError) {
						res.status((e as RestError).statusCode);
					} else {
						res.status(500);
					}
					next(e);
				}
			};

		let methodRouters: Routes =
			Reflect.getOwnMetadata(ROUTES_METADATA_KEY, target) || [];
		methodRouters.push(
			new Route(relativePath, newMethod, propertyName, httpMethod)
		);
		Reflect.defineMetadata(ROUTES_METADATA_KEY, methodRouters, target);

		return descriptor;
	};
}

export function Get<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.GET);
}

export function Post<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.POST);
}

export function Put<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.PUT);
}

export function Delete<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.DELETE);
}

export function ExpressController<
	T extends { new (...args: any[]): ExpressModule }
>(baseRoute: string) {
	return function (target: T): T {
		let routes: Routes =
			Reflect.getOwnMetadata(ROUTES_METADATA_KEY, target.prototype) || [];

		return class extends target {
			constructor(...args: any[]) {
				super(...args);

				if (target.name != '') {
					this.className = target.name;
				}

				for (let route of routes) {
					this.initRoute(route);
				}
				this.baseUrl = baseRoute;
			}

			private initRoute(route: Route) {
				let expressRoute = this.router.route(route.route);
				let expressRouteParams: any[] = route.getMiddlewareMethods();
				expressRouteParams.push(route.method(this));
				switch (route.httpMethod) {
					case HttpMethod.GET:
						expressRoute.get.apply(
							expressRoute,
							expressRouteParams
						);
						return;
					case HttpMethod.POST:
						expressRoute.post.apply(
							expressRoute,
							expressRouteParams
						);
						return;
					case HttpMethod.DELETE:
						expressRoute.delete.apply(
							expressRoute,
							expressRouteParams
						);
						return;
					case HttpMethod.PUT:
						expressRoute.put.apply(
							expressRoute,
							expressRouteParams
						);
						return;
				}
			}
		};
	};
}

export function BodyField(fieldName: string) {
	return function (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		let existingRequiredParameters: ParameterProps =
			Reflect.getOwnMetadata(BODY_METADATA_KEY, target, propertyKey) ||
			[];
		existingRequiredParameters.push(
			new ParameterProp(parameterIndex, fieldName)
		);
		Reflect.defineMetadata(
			BODY_METADATA_KEY,
			existingRequiredParameters,
			target,
			propertyKey
		);
	};
}

export function Body() {
	return BodyField(':body');
}

export function UrlParameter(fieldName: string) {
	return function (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		let existingRequiredParameters: ParameterProps =
			Reflect.getOwnMetadata(PARAMS_METADATA_KEY, target, propertyKey) ||
			[];
		existingRequiredParameters.push(
			new ParameterProp(parameterIndex, fieldName)
		);
		Reflect.defineMetadata(
			PARAMS_METADATA_KEY,
			existingRequiredParameters,
			target,
			propertyKey
		);
	};
}

export function Header(headerName: string) {
	return function (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		let existingHeaderMappings: ParameterProps =
			Reflect.getOwnMetadata(HEADERS_METADATA_KEY, target, propertyKey) ||
			[];
		existingHeaderMappings.push(
			new ParameterProp(parameterIndex, headerName)
		);
		Reflect.defineMetadata(
			HEADERS_METADATA_KEY,
			existingHeaderMappings,
			target,
			propertyKey
		);
	};
}
