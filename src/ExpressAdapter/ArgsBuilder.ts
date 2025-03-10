/*
 * Copyright 2025 Raul Radu
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

import {
	ExtendedRequest,
	MiddlewareDataCollection,
	MiddlewareDataCollections,
} from '../ExpressMiddleware/ExpressMiddleware';
import { MiddlewareParameterProps } from '../ExpressMiddleware/MiddlewareData';
import { ParameterProps } from './ParameterProp';

/**
 * This class is used to prepare the arguments to use in a call for a express
 * method
 */
export class ArgsBuilder {
	private args: any[];

	/**
	 * @param req the request is used to prepare the arguments for the express call
	 */
	constructor(private req: ExtendedRequest) {
		this.args = [];
	}

	/**
	 * Maps the arguments that are body related to body data
	 * @param bodyAssociations The association information that relates the body and its data with the correct parameter index
	 * @returns a self reference to the ArgsBuilder
	 */
	public addBodyAssociations(bodyAssociations: ParameterProps): ArgsBuilder {
		if (bodyAssociations == undefined) return this;

		for (let param of bodyAssociations) {
			if (param.name == ':body') {
				this.args[param.index] = this.req.body;
			} else {
				this.args[param.index] = (this.req.body || [])[param.name];
			}
		}

		return this;
	}

	/**
	 * Maps the arguments that are URL parameter related to URL data
	 * @param paramsAssociations The association information that relates the URL parameters with the correct parameter index
	 * @returns a self reference to the ArgsBuilder
	 */
	public addParametersAssociations(
		paramsAssociations: ParameterProps
	): ArgsBuilder {
		if (paramsAssociations == undefined) return this;

		for (let param of paramsAssociations) {
			this.args[param.index] = this.req.params[param.name];
		}

		return this;
	}

	/**
	 * Maps the arguments that are headers related to header data
	 * @param headerAssociations The association information that relates the headers with the correct parameter index
	 * @returns a self reference to the ArgsBuilder
	 */
	public addHeaderAssociations(
		headerAssociations: ParameterProps
	): ArgsBuilder {
		if (headerAssociations == undefined) return this;

		for (let mapping of headerAssociations) {
			this.args[mapping.index] = this.req.header(mapping.name);
		}

		return this;
	}

	/**
	 * Maps the arguments that are middleware related to middleware data
	 * @param headerAssociations The association information that relates the middleware collections (and collection data) with the correct parameter index
	 * @returns a self reference to the ArgsBuilder
	 */
	public addMiddlewareAssociations(
		middlewareAssociations: MiddlewareParameterProps
	): ArgsBuilder {
		if (middlewareAssociations == undefined) return this;

		let collections: MiddlewareDataCollections =
			this.req.middlewareDataCollections || new Map();

		for (let param of middlewareAssociations) {
			let collection: MiddlewareDataCollection = collections.get(
				param.collection
			);

			if (collection) {
				if (param.name == '*') {
					this.args[param.index] = collection;
				} else {
					this.args[param.index] = (collection as any)[param.name];
				}
			} else {
				this.args[param.index] = undefined;
			}
		}

		return this;
	}

	/**
	 * This metod complese the building process of the args builder
	 * @returns the array of arguments that will be passed to the method
	 */
	public finalize(): any[] {
		return this.args;
	}
}
