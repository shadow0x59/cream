import { NextFunction, Request, Response } from 'express';

export type MiddlewareDataCollection = {} | undefined;

export type MiddlewareDataCollections = Map<String, MiddlewareDataCollection>;

export interface ExtendedRequest extends Request {
	middlewareDataCollections?: MiddlewareDataCollections;
}

export abstract class ExpressMiddleware {
	public abstract behaviour(
		req: ExtendedRequest,
		res: Response
	): MiddlewareReturnData;

	handle(req: ExtendedRequest, res: Response, next: NextFunction) {
		try {
			let data: MiddlewareReturnData = this.behaviour(req, res);
			let collections: MiddlewareDataCollections =
				req.middlewareDataCollections || new Map();
			collections.set(data.collectionName, data.content);
			req.middlewareDataCollections = collections;

			next();
		} catch (e) {
			next(e);
		}
	}
}

export type ExpressMiddlewares = ExpressMiddleware[];

export class MiddlewareReturnData<T = {}> {
	constructor(
		public readonly content?: T,
		public readonly collectionName = 'default'
	) {}
}
