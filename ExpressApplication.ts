import { ExpressModule, ExpressModules } from './ExpressAdapter/ExpressModule';
import { Express, NextFunction, Request, Response } from 'express';
import { ExpressMiddleware } from './ExpressMiddleware/ExpressMiddleware';
import { ExpressErrorHandler } from './ExpressErrorHandler/ExpressErrorHandler';
import {
	ExpressService,
	ExpressServices,
} from './ExpressService/ExpressService';

import { Server } from 'http';
import mongoose from 'mongoose';

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
		if (this.controllers.get(controller.className)) {
			throw Error(
				'Controller ' + controller.className + ' is already registered!'
			);
		}

		let currInstance = this.controllers
			.set(controller.className, controller)
			.get(controller.className)!;

		if (currInstance == undefined) {
			throw Error(
				'Something went wrong while registering ' + controller.className
			);
		}

		let middlewareList = currInstance.middlewareList.map(
			(instance: ExpressMiddleware) => {
				return instance.handle.bind(instance);
			}
		);

		if (middlewareList.length > 0) {
			this.app.use(currInstance.baseUrl, middlewareList);
		}
		this.app.use(currInstance.baseUrl, currInstance.router);

		controller.app = this;
	}

	public addControllers(controllers: ExpressModules) {
		for (let controller of controllers) {
			this.addController(controller);
		}
	}

	public addService(service: ExpressService) {
		if (this.services.get(service.id!)) {
			throw Error('Service ' + service.id! + ' is already registered!');
		}

		this.services.set(service.id!, service);

		service.app = this;
	}

	public addServices(services: ExpressServices) {
		for (let service of services) {
			this.addService(service);
		}
	}

	/**
	 * This method is an interface to express for handling errors
	 */
	public handleErrors(
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

	public async initServices() {
		for (let service of this.services) {
			console.log('Initializing service', service[0], '...');
			let res = false;
			try {
				res = await service[1].init();
			} catch (e) {
				console.log(e);
				res = false;
			}
			if (res) {
				console.log('Service', service[0], 'successfully initialized');
			} else {
				console.log('Could not initialize service', service[0]);
			}
		}
	}

	/**
	 * Starts the express application
	 */
	public async start() {
		let boundFn = this.handleErrors.bind(this);
		this.app.use(boundFn);
		await this.initServices();
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
				await mongoose.connection.close();
				resolve();
			});
		});
	}

	public getExpressApp(): Express {
		return this.app;
	}

	public getService<T>(serviceId: string) {
		return this.services.get(serviceId) as T;
	}
}
