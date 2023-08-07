import { Constructable } from './Utils/Constructable';
import { ExpressModule } from './ExpressAdapter/ExpressModule';
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
		controller: Constructable<T>
	) {
		let controllerInstance = new controller();

		if (this.controllers.get(controllerInstance.className)) {
			throw Error(
				'Controller ' +
					controllerInstance.className +
					' is already registered!'
			);
		}

		let currInstance = this.controllers
			.set(controllerInstance.className, controllerInstance)
			.get(controllerInstance.className)!;

		if (currInstance == undefined) {
			throw Error(
				'Something went wrong while registering ' +
					controllerInstance.className
			);
		}

		let middlewareList = currInstance.middlewareList.map(
			(x: Constructable<ExpressMiddleware>) => {
				let instance = new x();
				return instance.handle.bind(instance);
			}
		);

		if (middlewareList.length > 0) {
			this.app.use(currInstance.baseUrl, middlewareList);
		}
		this.app.use(currInstance.baseUrl, currInstance.router);
	}

	public addControllers(controllers: Constructable<ExpressModule>[]) {
		for (let controller of controllers) {
			this.addController(controller);
		}
	}

	public getController<T extends ExpressModule>(
		controller: Constructable<T>
	): T | undefined {
		return this.controllers.get(controller.name) as T;
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
