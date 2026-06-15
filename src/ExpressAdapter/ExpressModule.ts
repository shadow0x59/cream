/*
 * Copyright 2024-2026 Raul Radu
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

import { Router } from 'express';
import { BaseMiddlewares } from '../ExpressMiddleware/ExpressMiddleware';
import { ExpressApplication } from '../ExpressApplication';
import { TRANSACTION_MANAGER_METADATA_KEY } from './ExpressAdapters';
import { TransactionManager } from '../ExchangeUtils/TransactionManager';

/**
 * This class is just a way to allow to explicitly declare
 * that the class inheriting ExpressModule is a controller.
 * This is because {@link ExpressController} decorates only
 * **ExpressModules** and defines some fields that are used by
 * the ExpressApplication to handle requests and define endpoints.
 * Also it gives an interface for accessing the express application
 * handling the class easily (by using ExpressModule.app)
 */
export class ExpressModule {
	/**
	 * This allows to access the express router that will handle
	 * the requests. This router will be registered to the
	 * {@link ExpressApplication} that will be defined in {@link ExpressModule.app}
	 */
	public accessor router: Router;

	/**
	 * This is the basepoint to which the controller is bound to
	 */
	public accessor baseUrl: string;

	/**
	 * This is used to keep the information about the class
	 * that will inherit the ExpressModule and that will be
	 * decorated by {@link ExpressController}
	 */
	public accessor className: string;

	/**
	 * The {@link ExpressApplication} the controller is registered to
	 */
	private _app!: ExpressApplication;

	/**
	 * The list of  controller-wise middlewares associated
	 * with the controller. The method-associated middlewares will not appear in this list
	 */
	public middlewareList: BaseMiddlewares;

	/**
	 * The list of  method-associated middlewares associated
	 * with the controller. The controller-wise middlewares will not appear in this list
	 */
	public methodsMiddlewareList: BaseMiddlewares;

	constructor() {
		this.middlewareList = [];
		this.methodsMiddlewareList = [];
		this.router = Router();
		this.baseUrl = '/';
		this.className = '';
	}

	private set app(v: ExpressApplication) {
		this._app = v;
		for (let middleware of this.middlewareList) {
			middleware.app = v;
		}
		for (let middleware of this.methodsMiddlewareList) {
			middleware.app = v;
		}
	}

	public get app(): ExpressApplication {
		return this._app;
	}

	public prepareTransaction(): TransactionManager {
		let error: Error = new Error();
		let oldLimit = Error.stackTraceLimit;
		Error.stackTraceLimit = 2;
		Error.captureStackTrace(error);
		Error.stackTraceLimit = oldLimit;
		let line = error.stack!.split('\n')[2];
		let callerName = line!.split('.')[1]!.split(' ')[0];

		let transactionManager = Reflect.getMetadata(
			TRANSACTION_MANAGER_METADATA_KEY,
			this,
			callerName!
		) as TransactionManager;

		if (transactionManager == undefined) {
			throw new Error(
				'Cannot prepare a transaction in a method that is not an ExpressMethod (or any of Get, Put, Post, Delete).'
			);
		}

		return transactionManager;
	}
}

export type ExpressModules = ExpressModule[];
