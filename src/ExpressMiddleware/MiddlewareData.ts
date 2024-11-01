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

export class MiddlewareParameterProp extends ParameterProp {
	constructor(
		index: number,
		name: string,
		public readonly collection: string
	) {
		super(index, name);
	}
}

export type MiddlewareParameterProps = MiddlewareParameterProp[];

export function MiddlewareData(
	collectionName: string = 'default',
	dataName: string = '$'
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
