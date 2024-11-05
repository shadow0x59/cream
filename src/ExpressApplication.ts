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

import { ExpressModule, ExpressModules } from './ExpressAdapter/ExpressModule';
import { Express, NextFunction, Request, Response } from 'express';
import { BaseMiddleware } from './ExpressMiddleware/ExpressMiddleware';
import { ExpressErrorHandler } from './ExpressErrorHandler/ExpressErrorHandler';
import {
	ExpressService,
	ExpressServices,
} from './ExpressService/ExpressService';

import { Server } from 'http';

type ControllerMap<T> = Map<string, T>;
type ServiceMap<T> = ControllerMap<T>;

export class ExpressApplication {
	private controllers: ControllerMap<ExpressModule>;
	private services: ServiceMap<ExpressService>;
	private port: number;
	private server?: Server;

	constructor(
		private app: Express,
		port: number,
		private _errorHandler?: ExpressErrorHandler
	) {
		this.controllers = new Map();
		this.port = port;
		this.services = new Map();
	}

	set errorHandler(v: ExpressErrorHandler) {
		this._errorHandler = v;
	}

	/**
	 * This method adds a controller  that handles a specific URL Zone
	 * declared by the ExpressController decorator
	 * @param controller An instance of the controller that handles the
	 * specific route
	 */
	public addController<T extends ExpressModule>(controller: T) {
		if (controller.router.stack.length == 0) {
			throw Error(
				'Controller should have at least one express call asssociated with it'
			);
		}

		if (this.controllers.get(controller.className)) {
			throw Error(
				'Controller ' + controller.className + ' is already registered!'
			);
		}

		let currInstance = this.controllers
			.set(controller.className, controller)
			.get(controller.className)!;

		let middlewareList = currInstance.middlewareList.map(
			(instance: BaseMiddleware) => {
				return instance.handle.bind(instance);
			}
		);

		if (middlewareList.length > 0) {
			this.app.use(currInstance.baseUrl, middlewareList);
		}
		this.app.use(currInstance.baseUrl, currInstance.router);

		currInstance.app = this;
	}

	/**
	 * This method adds a list of controllers to the current application
	 * It will add them in the provided order
	 * @param controllers The list of controllers to be added to the current application
	 * @returns void
	 */
	public addControllers(controllers: ExpressModules): void {
		for (let controller of controllers) {
			this.addController(controller);
		}
	}

	/**
	 * This method adds a service to the current application
	 * The service must be uniquely identified by @ExpressSerivce.IdentifiedBy(id: string)
	 * decorator
	 *
	 * @param service the service to be added to the current application
	 * @returns void
	 */
	public addService(service: ExpressService): void {
		if (this.services.get(service.id!)) {
			throw Error('Service ' + service.id! + ' is already registered!');
		}

		this.services.set(service.id!, service);

		service.app = this;
	}

	/**
	 * Adds a list of services to the current application
	 * Remember that the services must be uniquely identified
	 * @param services The list of services to be added
	 */
	public addServices(services: ExpressServices) {
		for (let service of services) {
			this.addService(service);
		}
	}

	/**
	 * This method is an interface to express for providing a custom error
	 * handler
	 */
	private handleErrors(
		err: Error,
		req: Request,
		res: Response,
		next: NextFunction
	) {
		if (this._errorHandler) {
			this._errorHandler.handle(err, req, res);
		} else {
			next(err);
		}
	}

	/**
	 * This method initializes all the registered services.
	 * It tries to initialize all services before throwing an error
	 * In this way the developer can see all the issues at once and
	 * doesn't need to recompile for each error
	 * @returns true if all services are correctly intialized, false otherwise
	 */
	private async initServices(): Promise<boolean> {
		let initStatus: boolean = true;
		for (let service of this.services) {
			console.log('Initializing service', service[0], '...');
			let res = false;
			try {
				res = await service[1].init();
				initStatus = res ? initStatus : false;
			} catch (e) {
				console.log(e);
				res = false;
				initStatus = false;
			}
			if (res) {
				console.log('Service', service[0], 'successfully initialized');
			} else {
				console.log('Could not initialize service', service[0]);
			}
		}

		return initStatus;
	}

	/**
	 * Starts the express application
	 */
	public async start() {
		let boundFn = this.handleErrors.bind(this);
		this.app.use(boundFn);
		let res = await this.initServices();

		if (!res) {
			throw Error(
				'Failed to initialize all the services, see logs for more info.'
			);
		}
		this.server = this.app.listen(this.port, () => {
			console.log('Listening on', this.port);
		});
	}

	public stop(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.server!.close(async (err) => {
				if (err) {
					reject(err);
				}
				resolve();
			});
		});
	}

	public getExpressApp(): Express {
		return this.app;
	}

	public getService<T extends ExpressService>(serviceId: string) {
		return this.services.get(serviceId) as T;
	}
}
