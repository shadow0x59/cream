import 'reflect-metadata';

import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';
import { ExpressMiddleware, ExpressMiddlewares } from './ExpressMiddleware';
import { ExpressModule } from '../ExpressAdapter/ExpressModule';

export function UseMiddlewaresForController<
	T extends { new (...args: any[]): ExpressModule }
>(middlewares: ExpressMiddlewares) {
	return function (target: T): T {
		return class extends target {
			constructor(...args: any[]) {
				super(middlewares);

				if (target.name != '') {
					this.className = target.name;
				}
			}
		};
	};
}

export function UseMiddleware<T extends ExpressMiddleware>(
	middleware: T
) {
	return function (
		target: ExpressModule,
		propertyName: string,
		descriptor: PropertyDescriptor
	) {
		let methodRouters: Routes =
			Reflect.getOwnMetadata(ROUTES_METADATA_KEY, target) || [];

		let route: Route = methodRouters.find(
			(value: Route) => value.method == descriptor.value!
		)!;

		route.addMiddleware(middleware);

		Reflect.defineMetadata(ROUTES_METADATA_KEY, methodRouters, target);

		return descriptor;
	};
}
