import 'reflect-metadata';

import { Response, NextFunction } from 'express';
import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';
import { ExpressModule } from './ExpressModule';
import { HttpMethod } from '../HttpUtils/HttpMethod';
import { ParameterProp, ParameterProps } from './ParameterProp';
import { MiddlewareParameterProps } from '../ExpressMiddleware/MiddlewareData';
import { Message } from '../ExchangeUtils/Message';
import {
	ExtendedRequest,
	MiddlewareDataCollection,
	MiddlewareDataCollections,
} from '../ExpressMiddleware/ExpressMiddleware';

const BODY_METADATA_KEY = Symbol('express:bodyAssoc');
const PARAMS_METADATA_KEY = Symbol('express:paramAssoc');
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
		descriptor.value = async function (
			req: ExtendedRequest,
			res: Response,
			next: NextFunction
		) {
			let bodyAssocs: ParameterProps = Reflect.getOwnMetadata(
				BODY_METADATA_KEY,
				target,
				propertyName
			);
			if (bodyAssocs) {
				for (let param of bodyAssocs) {
					if (param.name == ':body') {
						arguments[param.index] = req.body;
					} else {
						arguments[param.index] = (req.body || [])[param.name];
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
					arguments[param.index] = (req.params || [])[param.name];
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

					let collection: MiddlewareDataCollection = collections.get(
						param.collection
					);

					if (collection) {
						arguments[param.index] = (collection as any)[
							param.name
						];
					} else {
						arguments[param.index] = undefined;
					}
				}
			}

			try {
				let result = (await method.apply(this, arguments)) as Message;
				res.status(result.status);
				res.set('Content-Type', result.contentType);
				res.send(result.content);
			} catch (e) {
				next(e);
			}
		};

		/*let paramAssoc: ParameterProps = Reflect.getOwnMetadata(
			PARAMS_METADATA_KEY,
			target,
			propertyName
			);
			if (paramAssoc) {
				for (let param of paramAssoc.sort(
					(a: ParameterProp, b: ParameterProp) => a.index - b.index
					)) {
						relativePath += '/:' + param.name;
					}
				}*/
		let methodRouters: Routes =
			Reflect.getOwnMetadata(ROUTES_METADATA_KEY, target) || [];
		methodRouters.push(
			new Route(relativePath, descriptor.value!, httpMethod)
		);
		Reflect.defineMetadata(ROUTES_METADATA_KEY, methodRouters, target);

		return descriptor;
	};
}

export function ExpressController<
	T extends { new (...args: any[]): ExpressModule }
>(baseRoute: string) {
	return function (target: T): T {
		let methodRouters: Routes = Reflect.getOwnMetadata(
			ROUTES_METADATA_KEY,
			target.prototype
		);

		return class extends target {
			constructor(...args: any[]) {
				super(...args);

				if (target.name != '') {
					this.className = target.name;
				}

				for (let route of methodRouters) {
					this.initRoute(route);
				}
				this.baseUrl = baseRoute;
			}

			private initRoute(route: Route) {
				let expressRoute = this.router.route(route.route);
				let expressRouteParams: any[] = route.getMiddlewareMethods();
				expressRouteParams.push(route.method.bind(this));
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
