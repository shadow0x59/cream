import {
	ExpressMiddlewares,
	ExpressMiddleware,
} from '../ExpressMiddleware/ExpressMiddleware';
import { HttpMethod } from './HttpMethod';

export class Route {
	constructor(
		public route: string,
		public method: any,
		public httpMethod: HttpMethod,
		public middlewares: ExpressMiddlewares = []
	) {}

	public addMiddleware(middleware: ExpressMiddleware) {
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
