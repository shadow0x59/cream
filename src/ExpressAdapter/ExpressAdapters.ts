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

import { RestError } from '../ExpressErrorHandler/ExpressErrorHandler';
import { ExtendedRequest } from '../ExpressMiddleware/ExpressMiddleware';
import { MiddlewareParameterProps } from '../ExpressMiddleware/MiddlewareData';
import { HttpMethod } from '../HttpUtils/HttpMethod';
import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';

import { ExpressModule } from './ExpressModule';
import { ParameterProp, ParameterProps } from './ParameterProp';
import { BootstrapSerializer } from '../Serializer/Serializer';
import { HTTP_CODE_METADATA_KEY } from '../HttpUtils/HttpReturnCode';
import { TransactionManager } from '../ExchangeUtils/TransactionManager';
import { ArgsBuilder } from './ArgsBuilder';
import { HTTP_HEADERS_METADATA_KEY } from '../HttpUtils/Headers/Header';
import { HeadersManager } from '../HttpUtils/Headers/HeadersManager';
import { Cookie } from '../HttpUtils/Cookies/Cookie';
import {
	DynamicCookieMapping,
	HTTP_DYNAMIC_COOKIES,
} from '../HttpUtils/Cookies/DynamicCookie';

export const BODY_METADATA_KEY = Symbol('cream:bodyAssoc');
export const PARAMS_METADATA_KEY = Symbol('cream:paramAssoc');
export const COOKIES_METADATA_KEY = Symbol('cream:cookieAssoc');
export const HEADERS_METADATA_KEY = Symbol('cream:headersAssoc');
export const MIDDLEWARE_METADATA_KEY = Symbol('cream:middlewareAssoc');
export const TRANSACTION_MANAGER_METADATA_KEY = Symbol(
	'cream:transactionManager'
);

/**
 * This method is used to declare a method of a class (that must extend {@link ExpressModule})
 * to be an API endpoint. This endpoint is bound to the router representing the class basepoint.
 * The basepoint (or zone) is defined by using {@link ExpressController} decorator.\
 * The decorated method is not altered and that means it can be used as a normal method.
 *
 * @remarks
 * It is suggested to use {@link Get}, {@link Post}, {@link Put} and {@link Delete}\
 * Methods are bound to the router in a topdown approach, this means that from Express's point of
 * view the top method is called first if two paths collide. Two paths collide when both the path and the http ù
 * method is the same so a path x bound to a Get request will not collide to the same path bound to a Post request.
 * @example
 * ```ts
 * import { ExpressController, ExpressModule, ExpressCall, HttpMethod } from "@creamapi/cream";
 *
 * \@ExpressController("/my-base-route")
 * export class MyController extends ExpressModule {
 *    \@ExpressCall("/hello-world", HttpMethod.GET)
 *    myMethod(): string{
 *       return "hello, world";
 *    }
 *
 * 	  // It also works with asynchronous methods
 *    \@ExpressCall("/hello-world-async", HttpMethod.GET)
 *    async myMethodAsync(): Promise<string> {
 *       return "hello, async world!";
 *    }
 * }
 * ```
 * @param relativePath Is the path relative to the basepoint. The path must follow the Express path definition
 * @param httpMethod The HTTP Method that must be used for the path. See {@link HttpMethod} for available methods
 * @returns returns the descriptor of the method.
 */
export function ExpressCall<T extends ExpressModule>(
	relativePath: string,
	httpMethod: HttpMethod
) {
	return function (
		target: T,
		propertyName: string,
		descriptor: PropertyDescriptor
	) {
		let method = descriptor.value!;
		let methodTransactionManager = new TransactionManager();
		Reflect.defineMetadata(
			TRANSACTION_MANAGER_METADATA_KEY,
			methodTransactionManager,
			target,
			propertyName
		);

		let newMethod = (thisArg: ExpressModule) =>
			async function (
				req: ExtendedRequest,
				res: Response,
				next: NextFunction
			) {
				let argsBuilder = new ArgsBuilder(req);

				let bodyAssocs: ParameterProps = Reflect.getOwnMetadata(
					BODY_METADATA_KEY,
					target,
					propertyName
				);

				let paramAssoc: ParameterProps = Reflect.getOwnMetadata(
					PARAMS_METADATA_KEY,
					target,
					propertyName
				);

				let cookiesMappings: ParameterProps = Reflect.getOwnMetadata(
					COOKIES_METADATA_KEY,
					target,
					propertyName
				);

				let headerMappings: ParameterProps = Reflect.getOwnMetadata(
					HEADERS_METADATA_KEY,
					target,
					propertyName
				);

				let middlewareAssoc: MiddlewareParameterProps =
					Reflect.getOwnMetadata(
						MIDDLEWARE_METADATA_KEY,
						target,
						propertyName
					);

				argsBuilder
					.addBodyAssociations(bodyAssocs)
					.addParametersAssociations(paramAssoc)
					.addHeaderAssociations(headerMappings)
					.addCookiesAssociations(cookiesMappings)
					.addMiddlewareAssociations(middlewareAssoc);

				try {
					let bootstrapSerializer = new BootstrapSerializer();

					// I want to reset the transaction manager here to guarantee that
					// it is always in the standard state
					methodTransactionManager.reset();

					let result = await method.apply(
						thisArg,
						argsBuilder.finalize()
					);

					let data = await bootstrapSerializer.start(result);

					try {
						let cookiesManager =
							methodTransactionManager.getResponseCookiesManager();
						let dynamicCookies: DynamicCookieMapping[] =
							Reflect.getMetadata(HTTP_DYNAMIC_COOKIES, result) ||
							[];
						cookiesManager.concat(
							dynamicCookies.map(
								(cookieMap: DynamicCookieMapping) =>
									Cookie.fromCookieOpts(
										cookieMap.cookieName,
										result[cookieMap.propertyName],
										cookieMap.opts
									)
							)
						);
					} catch (e) {
						/* do nothing */
					}

					try {
						methodTransactionManager.ReturnCode(
							Reflect.getMetadata(HTTP_CODE_METADATA_KEY, result)
						);
					} catch (e) {
						/* do nothing */
					}

					try {
						methodTransactionManager.setHeaders(
							Reflect.getMetadata(
								HTTP_HEADERS_METADATA_KEY,
								result
							) as HeadersManager
						);
					} catch (e) {
						/* Do nothing */
					}

					methodTransactionManager
						.finalizeTransaction(res)
						.send(data);
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

/**
 * This method is used to declare a method of a class (that must extend {@link ExpressModule})
 * to be an API endpoint as a GET http method.
 *
 * This method just works by calling {@link ExpressCall} with {@link HttpMethod.GET} as the second parameter
 * To understand its behaviour please see {@link ExpressCall}.
 *
 * @remarks Methods are bound to the router in a topdown approach, this means that from Express's point of
 * view the top method is called first if two paths collide. Two paths collide when both the path and the http ù
 * method is the same so a path x bound to a Get request will not collide to the same path bound to a Post request.
 * @example
 * ```ts
 * import { ExpressController, ExpressModule, ExpressCall, HttpMethod } from "@creamapi/cream";
 *
 * \@ExpressController("/my-base-route")
 * export class MyController extends ExpressModule {
 *    \@Get("/hello-world")
 *    myMethod(): string{
 *       return "hello, world";
 *    }
 *
 * 	  // It also works with asynchronous methods
 *    \@Get("/hello-world-async")
 *    async myMethodAsync(): Promise<string> {
 *       return "hello, async world!";
 *    }
 * }
 * ```
 * @param relativePath Is the path relative to the basepoint. The path must follow the Express path definition
 * @returns returns the descriptor of the method.
 */
export function Get<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.GET);
}

/**
 * This method is used to declare a method of a class (that must extend {@link ExpressModule})
 * to be an API endpoint as a POST http method.
 *
 * To retrieve the body passed as an argument just use {@link Body} or {@link BodyField}.
 *
 * This method just works by calling {@link ExpressCall} with {@link HttpMethod.GET} as the second parameter
 * To understand its behaviour please see {@link ExpressCall}.
 *
 * @remarks
 * Methods are bound to the router in a topdown approach, this means that from Express's point of
 * view the top method is called first if two paths collide. Two paths collide when both the path and the http ù
 * method is the same so a path x bound to a Get request will not collide to the same path bound to a Post request.
 *
 * @example
 * ```ts
 * import { ExpressController, ExpressModule, ExpressCall, HttpMethod } from "@creamapi/cream";
 *
 * \@ExpressController("/my-base-route")
 * export class MyController extends ExpressModule {
 *    \@Post("/hello-world")
 *    myMethod(@Body body: any): string{
 *       return "hello, world";
 *    }
 *
 * 	  // It also works with asynchronous methods
 *    \@Post("/hello-world-async")
 *    async myMethodAsync(@BodyField("myField") myField: string): Promise<string> {
 *       return myField;
 *    }
 * }
 * ```
 * @param relativePath Is the path relative to the basepoint. The path must follow the Express path definition
 * @returns returns the descriptor of the method.
 */
export function Post<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.POST);
}

/**
 * This method is used to declare a method of a class (that must extend {@link ExpressModule})
 * to be an API endpoint as a PUT http method.
 *
 * To retrieve the body passed as an argument just use {@link Body} or {@link BodyField}.
 *
 * This method just works by calling {@link ExpressCall} with {@link HttpMethod.GET} as the second parameter
 * To understand its behaviour please see {@link ExpressCall}.
 *
 * @remarks Methods are bound to the router in a topdown approach, this means that from Express's point of
 * view the top method is called first if two paths collide. Two paths collide when both the path and the http ù
 * method is the same so a path x bound to a Get request will not collide to the same path bound to a Post request.
 * @example
 * ```ts
 * import { ExpressController, ExpressModule, ExpressCall, HttpMethod } from "@creamapi/cream";
 *
 * \@ExpressController("/my-base-route")
 * export class MyController extends ExpressModule {
 *    \@Put("/hello-world")
 *    myMethod(@Body body: any): string{
 *       return "hello, world";
 *    }
 *
 * 	  // It also works with asynchronous methods
 *    \@Put("/hello-world-async")
 *    async myMethodAsync(@BodyField("myField") myField: string): Promise<string> {
 *       return myField;
 *    }
 * }
 * ```
 * @param relativePath Is the path relative to the basepoint. The path must follow the Express path definition
 * @returns returns the descriptor of the method.
 */
export function Put<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.PUT);
}

/**
 * This method is used to declare a method of a class (that must extend {@link ExpressModule})
 * to be an API endpoint as a DELETE http method.
 *
 * To retrieve the body passed as an argument just use {@link Body} or {@link BodyField}.
 *
 * This method just works by calling {@link ExpressCall} with {@link HttpMethod.GET} as the second parameter
 * To understand its behaviour please see {@link ExpressCall}.
 *
 * @remarks
 * Methods are bound to the router in a topdown approach, this means that from Express's point of
 * view the top method is called first if two paths collide. Two paths collide when both the path and the http ù
 * method is the same so a path x bound to a Get request will not collide to the same path bound to a Post request.
 *
 * @example
 * ```ts
 * import { ExpressController, ExpressModule, ExpressCall, HttpMethod } from "@creamapi/cream";
 *
 * \@ExpressController("/my-base-route")
 * export class MyController extends ExpressModule {
 *    \@Delete("/hello-world")
 *    myMethod(@Body body: any): string{
 *       return "hello, world";
 *    }
 *
 * 	  // It also works with asynchronous methods
 *    \@Delete("/hello-world-async")
 *    async myMethodAsync(@BodyField("myField") myField: string): Promise<string> {
 *       return myField;
 *    }
 * }
 * ```
 * @param relativePath Is the path relative to the basepoint. The path must follow the Express path definition
 * @returns returns the descriptor of the method.
 */
export function Delete<T extends ExpressModule>(relativePath: string) {
	return ExpressCall<T>(relativePath, HttpMethod.DELETE);
}

/**
 * This decorator is used to make a class to be a controller that handles HTTP requests.
 * The class decorated as a controller must inherit from {@link ExpressModule}.
 * In practice this will bound any {@link ExpressCall}-decorated method to an express router.
 * The router is also bound to the baseRoute parameter.\
 * The call tree will look something like this:
 * ```
 * /                          	<- this is the basepoint (parameter baseRoute) a controller is bound to
 * |- router1                 	<- This is one controller
 * |    |- GET
 * |    |   |- /path1
 * |    |   |    |- method1-1 	<- this is a endpoint
 * |    |   |    |- method1-2 	<- multiple methods can be bound to the same route (aka they collide)
 * |    |   |- /path2
 * |    |   |    |- method1-3
 * |    |   |- /              	<-  this will look like it is bound to the base path
 * |    |        |- method1-4
 * |    |- POST
 * |    |- PUT
 * |    |- DELETE
 * |- router2                 	<- multiple controller can be bound to the same basepoint
 * |    |- GET
 * |    |   |- /path1
 * |    |        |- method2-1 	<- this method is bound to the same path as method1-1
 * |    |- POST
 * |    |- PUT
 * |    |- DELETE
 * |- /new-endpoint				<- this is another basepoint. Any method bound to this method will be bound to the base path /new-endpoint
 * |       |- router1
 * |             |- GET
 * |             |- POST
 * |             |- PUT
 * |             |- DELETE
 * ```
 * @remarks
 * For whom want to work on low lever prototyping this decorator will alter the prototype of the
 * decorated class by adding functionalities without altering its behavior, including the constructor.
 * @param baseRoute the URL to which the controller is bound to
 * @returns a new class that extends the base decorated class that implements a few functions
 * that will bound routes to the router. Albeit it is a brand new class its usage is completely
 * transparent for the users.
 */
export function ExpressController<
	T extends { new (...args: any[]): ExpressModule },
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
				this.methodsMiddlewareList = this.methodsMiddlewareList.concat(
					route.middlewares
				);
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

/**
 * This parameter decorator will decorate a method parameter by associating it with a field in the body.
 * This permits the autofill of the parameter with the corresponding field (named fieldName) in the body.
 * @remarks
 *  If the field is undefined the field will be filled as undefined.\
 * If no body is provided to the request then all parameters decorated with BodyField will be undefined
 * @param fieldName the field name in the body
 * @returns the decorator function
 */
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

/**
 * This parameter decorator will decorate a method parameter by associating it with the whole body.
 * If no body is provided to the request then all attributes decorated with Body will be undefined
 * @returns the decorator function
 */
export function Body() {
	return BodyField(':body');
}

/**
 * This parameter decorator will decorate a method parameter by associating it with a field in the URL.
 * This field must be defined in the url like normally done in express.
 * @example
 * ```ts
 * // we are in a controller class
 *
 *    \@Get("/concat-space/:myParam1/:myParam2")
 *    concatWithSpace(
 *        \@UrlParameter("myParam1") param1: string,
 *        \@UrlParameter("myParam2") param2: string
 *    ): string {
 *        return param1 + " " + param2;
 *    }
 * //...
 * ```
 * @remarks If the field is undefined in the URL request the field will be filled as undefined.\
 * In general parameters are non-null because missing one parameter when making the request
 * will result to a different HTTP call and by extension a different controller method.
 * @param fieldName the field name in the body
 * @returns the decorator function
 */
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

/**
 * This parameter decorator will decorate a method parameter by associating it with a Request Header (eg. content-type).
 * @remarks If the header is undefined the field will be filled as undefined.
 * @param headerName the http header name
 * @returns the decorator function
 */
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

/**
 * This parameter decorator will decorate a method parameter by associating it with a Request Cookie found in the Cookie header.
 * @remarks
 *
 * - If there is no cookie header all parameters will be undefined
 * - If there is a malformed cookie the result is **undefined behavior**
 * - If there is a requested cookie that is not present in the response the parameter will be undefined
 *
 * @param cookieName the cookie name
 * @returns the decorator function
 */
export function ResponseCookie(cookieName: string) {
	return function (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		let existingCookieMappings: ParameterProps =
			Reflect.getOwnMetadata(COOKIES_METADATA_KEY, target, propertyKey) ||
			[];
		existingCookieMappings.push(
			new ParameterProp(parameterIndex, cookieName)
		);
		Reflect.defineMetadata(
			COOKIES_METADATA_KEY,
			existingCookieMappings,
			target,
			propertyKey
		);
	};
}
