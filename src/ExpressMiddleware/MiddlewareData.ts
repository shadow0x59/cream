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

import { ParameterProp } from '../ExpressAdapter/ParameterProp';
import { MIDDLEWARE_METADATA_KEY } from '../ExpressAdapter/ExpressAdapters';

/**
 * @internal
 * This class is used to define parameter prop for middleware data
 * This is used to map parameters to the data in a middleware collection
 */
export class MiddlewareParameterProp extends ParameterProp {
	/**
	 * @param index the index of the parameter in the parameter call array
	 * @param name The name of the parameter in the data collection
	 * @param collection The collection that the data should be retrieved from
	 *
	 * @remarks The data is accessed like collection[name]
	 */
	constructor(
		index: number,
		name: string,
		public readonly collection: string
	) {
		super(index, name);
	}
}

/**
 * @internal
 * a type for easily defining arrays
 */
export type MiddlewareParameterProps = MiddlewareParameterProp[];

/**
 * This decorator factory is used to declare that a parameter of a method should be filled <br>
 * from the collection `collectionName`. The parameter will be filled either with the data or <br>
 * undefined if the data is not found in the collection or the collection is not found in the map
 * @param collectionName The collection the data should be retrieved from. The default collection name is 'default'
 * @param dataName the name of the field in the collection. To retrieve the entire collection the string "*" is used.
 * @returns the decorator that will effectively decorate the method
 */
export function MiddlewareData(
	collectionName: string = 'default',
	dataName: string = '*'
) {
	return function (
		target: Object,
		propertyKey: string | symbol,
		parameterIndex: number
	) {
		let existingRequiredParameters: MiddlewareParameterProps =
			Reflect.getOwnMetadata(
				MIDDLEWARE_METADATA_KEY,
				target,
				propertyKey
			) || [];
		existingRequiredParameters.push(
			new MiddlewareParameterProp(
				parameterIndex,
				dataName,
				collectionName
			)
		);
		Reflect.defineMetadata(
			MIDDLEWARE_METADATA_KEY,
			existingRequiredParameters,
			target,
			propertyKey
		);
	};
}
