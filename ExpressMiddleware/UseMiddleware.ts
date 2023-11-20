import 'reflect-metadata';

import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';
import { BaseMiddleware, BaseMiddlewares } from './ExpressMiddleware';
import { ExpressModule } from '../ExpressAdapter/ExpressModule';

export function UseMiddlewaresForController<
	T extends { new (...args: any[]): ExpressModule }
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
