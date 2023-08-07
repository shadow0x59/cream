import 'reflect-metadata';

import { Route, Routes, ROUTES_METADATA_KEY } from '../HttpUtils/Route';
import { Constructable, Constructables } from '../Utils/Constructable';
import { ExpressMiddleware } from './ExpressMiddleware';
import { ExpressModule } from '../ExpressAdapter/ExpressModule';

export function UseMiddlewaresForController<
	T extends { new (...args: any[]): ExpressModule }
>(middlewares: Constructables<ExpressMiddleware>) {
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
	middleware: Constructable<T>
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

		route.addMiddleware(new middleware());

		Reflect.defineMetadata(ROUTES_METADATA_KEY, methodRouters, target);

		return descriptor;
	};
}
