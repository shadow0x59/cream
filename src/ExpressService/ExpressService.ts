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

import { ExpressApplication } from '../ExpressApplication';
import { Constructable } from '../Utils/Constructable';
export const SERVICE_ID_METADATA = Symbol('cream:service:id');

/**
 * This abstract class is used to declare a service for the app. <br>
 * This service is active all time during the lifetime of the owner app <br>
 * A service is mainly used for exchanging information between controllers <br>
 * for example daisy chaining updates within the controllers. <br>
 * Another useful example is just to initialize and share a database connection <br>
 * between multiple controllers or just to run some code at startup.
 */
export abstract class ExpressService {
	/**
	 * the application owning the service
	 */
	private _app!: ExpressApplication;

	/**
	 * This method must be implemented to bootstrap the service.
	 * If the service is successfully started then this method
	 * must return true. If there is an error with the initialization
	 * the method must return false
	 */
	abstract init(): Promise<boolean>;

	/**
	 * This is the setter to set the owning application
	 */
	public set app(v: ExpressApplication) {
		this._app = v;
	}

	/**
	 * This method is use to get the owning application
	 */
	public get app(): ExpressApplication {
		return this._app;
	}

	/**
	 * This method is used to get the current identifier of the service
	 */
	public get id() {
		return Reflect.getMetadata(SERVICE_ID_METADATA, this);
	}

	/**
	 * This decorator is used to declare the identifier of the service
	 * @remarks It is mandatory
	 * @param id The identifier that uniquely identifies the service. Having multiple services with the same ID will give conflicts
	 * @returns the decorator that will create a new class based from the service and will also set the identifier
	 */
	public static IdentifiedBy<T extends Constructable<ExpressService>>(
		id: string
	) {
		return function (target: T): T {
			Reflect.defineMetadata(SERVICE_ID_METADATA, id, target.prototype);
			return target;
		};
	}
}

export type ExpressServices = ExpressService[];
