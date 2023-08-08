import { Constructable } from './Utils/Constructable';
import { ExpressModule, ExpressModules } from './ExpressAdapter/ExpressModule';
import { Express } from 'express';
import { ExpressMiddleware } from './ExpressMiddleware/ExpressMiddleware';

type ControllerMap<T> = Map<string, T>;

export class ExpressApplication {
	private controllers: ControllerMap<ExpressModule>;

	constructor(private app: Express) {
		this.controllers = new Map();
	}

	/**
	 * This method adds a controller  that handles a specific URL Zone declared by the ExpressController decorator
	 * This method automatically creates the instances and injects the necessary dependencies
	 *
	 * @param controller The controller that handles the specific route
	 */
	public addController<T extends ExpressModule>(
		controller: T
	) {

		if (this.controllers.get(controller.className)) {
			throw Error(
				'Controller ' +
					controller.className +
					' is already registered!'
			);
		}

		let currInstance = this.controllers
			.set(controller.className, controller)
			.get(controller.className)!;

		if (currInstance == undefined) {
			throw Error(
				'Something went wrong while registering ' +
					controller.className
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
	 * Starts the express application
	 */
	public start() {
		let port = process.env.PORT;

		if (port == undefined) {
			throw 'Undefined port number! Please define it in the environment';
		}

		this.app.listen(process.env.PORT, () => {
			console.log('Listening on', process.env.PORT);
		});
	}
}
