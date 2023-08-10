import { ExpressModule, ExpressModules } from './ExpressAdapter/ExpressModule';
import { Express, NextFunction, Request, Response } from 'express';
import { ExpressMiddleware } from './ExpressMiddleware/ExpressMiddleware';
import { ExpressErrorHandler } from './ExpressErrorHandler/ExpressErrorHandler';

type ControllerMap<T> = Map<string, T>;

export class ExpressApplication {
	private controllers: ControllerMap<ExpressModule>;
	private port: number;

	constructor(
		private app: Express,
		port: number,
		private _errorHandler?: ExpressErrorHandler
	) {
		this.controllers = new Map();
		this.port = port;
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
	}

	public addControllers(controllers: ExpressModules) {
		for (let controller of controllers) {
			this.addController(controller);
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

	/**
	 * Starts the express application
	 */
	public start() {
		let boundFn = this.handleErrors.bind(this);
		this.app.use(boundFn);
		this.app.listen(this.port, () => {
			console.log('Listening on', this.port);
		});
	}
}
