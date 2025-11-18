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

import { NextFunction, Request, Response } from 'express';
import { RestError } from '../ExpressErrorHandler/ExpressErrorHandler';
import { ExpressApplication } from '../ExpressApplication';

/**
 * @internal
 * this is just a placeholder type for {} | undefined
 */
export type MiddlewareDataCollection = {} | undefined;

/**
 * @internal
 * this type is for representing middelware data in requests
 */
export type MiddlewareDataCollections = Map<String, MiddlewareDataCollection>;

/**
 * This interface is used to extend express Request interface with
 * middleware data
 */
export interface ExtendedRequest extends Request {
	/**
	 * The collections that are used by middlewares to communicate data
	 * to the endpoint
	 */
	middlewareDataCollections?: MiddlewareDataCollections;
}

/**
 * @internal
 *
 * common interface for middlewares.
 * this common interface is used to define the duality of handle.
 * This duality is due to the fact that handle can be either async
 * or not sync.
 *
 * Having everything async will not give any performance boost,
 * it will only create more confusion than there already is
 */
export interface BaseMiddleware {
	app: ExpressApplication;
	/**
	 * @internal
	 * This method is for handling requests coming from the user.
	 * It is in the correct format for express calls.
	 * @param req the request coming from the user
	 * @param res the response to the user
	 * @param next the next function to be called when finished
	 * working on the request and no response should be given
	 */
	handle(
		req: Request,
		res: Response,
		next: NextFunction
	): void | Promise<void>;
}

/**
 * This abstract class implements the base middleware handle method for handling
 * ASYNChronous middlewares.
 * @remarks The API for middlewares is still in its early stage and will need some refactoring
 * to make it simpler for users.
 */
export abstract class AsyncExpressMiddleware<T> implements BaseMiddleware {
	app!: ExpressApplication;

	/**
	 * This is the method that your custom middleware should implement.
	 * This method will communicate to the user by returning the collection for
	 * this specific middleware.
	 * @remarks If the collection already exists then all its data will be
	 * overwritten by the return of this function. This sucks I know, any suggestion
	 * on how to change this is welcome.
	 *
	 * If an error should be thrown, like a 404 file not found error, {@link RestError}
	 * should be used to communicate with the user.
	 * Any error that does not extend RestError
	 * will return to the user with a 500 internal server error
	 *
	 * @param req the request coming from the client, with additional data included
	 * by previous middleware coming from the middleware stack
	 * @param res a response to the user, useful for example to send partial data.
	 *
	 * @returns the collection of this middleware, containing information useful for
	 * the following execution stack
	 */
	public abstract behaviour(
		req: ExtendedRequest,
		res: Response
	): Promise<MiddlewareReturnData<T>>;

	/**
	 * @internal
	 * this implementation of handle is going to set the collection in the
	 * collection map with the new content.
	 * If behavior throws it will check if the error extends RestError
	 * and then uses the rest error statusCode to send information to the user.
	 * @remarks This might not be necessary since the error handler already does this
	 */
	async handle(req: ExtendedRequest, res: Response, next: NextFunction) {
		try {
			let data: MiddlewareReturnData<T> = await this.behaviour(req, res);
			let collections: MiddlewareDataCollections =
				req.middlewareDataCollections || new Map();
			if (data.content) {
				collections.set(data.collectionName, data.content);
			}
			req.middlewareDataCollections = collections;

			next();
		} catch (e) {
			if (e instanceof RestError) {
				res.status((e as RestError).statusCode);
			} else {
				res.status(500);
			}
			next(e);
		}
	}
}

/**
 * This abstract class implements the base middleware handle method for handling
 * SYNChronous middlewares.
 * @remarks The API for middlewares is still in its early stage and will need some refactoring
 * to make it simpler for users.
 */
export abstract class ExpressMiddleware implements BaseMiddleware {
	app!: ExpressApplication;

	/**
	 * This is the method that your custom middleware should implement.
	 * This method will communicate to the user by returning the collection for
	 * this specific middleware.
	 * @remarks If the collection already exists then all its data will be
	 * overwritten by the return of this function. This sucks I know, any suggestion
	 * on how to change this is welcome.
	 *
	 * If an error should be thrown, like a 404 file not found error, {@link RestError}
	 * should be used to communicate with the user.
	 * Any error that does not extend RestError
	 * will return to the user with a 500 internal server error
	 *
	 * @param req the request coming from the client, with additional data included
	 * by previous middleware coming from the middleware stack
	 * @param res a response to the user, useful for example to send partial data.
	 *
	 * @returns the collection of this middleware, containing information useful for
	 * the following execution stack
	 */
	public abstract behaviour(
		req: ExtendedRequest,
		res: Response
	): MiddlewareReturnData;

	/**
	 * @internal
	 * this implementation of handle is going to set the collection in the
	 * collection map with the new content.
	 * If behavior throws it will check if the error extends RestError
	 * and then uses the rest error statusCode to send information to the user.
	 * @remarks This might not be necessary since the error handler already does this
	 */
	handle(req: ExtendedRequest, res: Response, next: NextFunction) {
		try {
			let data: MiddlewareReturnData = this.behaviour(req, res);
			let collections: MiddlewareDataCollections =
				req.middlewareDataCollections || new Map();
			collections.set(data.collectionName, data.content);
			req.middlewareDataCollections = collections;

			next();
		} catch (e) {
			if (e instanceof RestError) {
				res.status((e as RestError).statusCode);
			} else {
				res.status(500);
			}
			next(e);
		}
	}
}

/**
 * @internal
 * this type is just used to declare an array of BaseMiddlewares
 */
export type BaseMiddlewares = BaseMiddleware[];

/**
 * This method is used to define a collection in the collection mapping
 * To access this data in a method use {@link MiddlewareData}
 */
export class MiddlewareReturnData<T = {}> {
	/**
	 * @param collectionName the collection identifier that should be used when saving the data in the map
	 * @param content the content of the collection
	 */
	constructor(
		public readonly collectionName = 'default',
		public readonly content?: T
	) {}
}
