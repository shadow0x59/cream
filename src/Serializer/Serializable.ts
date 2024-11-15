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

import { Serializer } from './ExpressSerializer';
import { Constructable } from '../Utils/Constructable';

export const SERIALIZER_METADATA_KEY = Symbol('cream:data-serializer');
export const SERIAL_MAP_METADATA_KEY = Symbol('cream:data-serial-map');

export type SerialMap = {
	fieldName: string;
	outName: string;
};

export function Serializable<T extends Constructable>(
	serializer: Constructable<Serializer>
) {
	return function (target: T): T {
		Reflect.defineMetadata(
			SERIALIZER_METADATA_KEY,
			new serializer(target.name, target),
			target.prototype
		);
		return target;
	};
}

export function AutoMap(target: any, propertyName: string) {
	return MapTo(propertyName)(target, propertyName);
}

export function MapTo(name: string) {
	return function (target: any, propertyName: string) {
		let serialMap: SerialMap[] =
			Reflect.getOwnMetadata(SERIAL_MAP_METADATA_KEY, target) || [];

		serialMap.push({
			fieldName: propertyName,
			outName: name,
		});

		Reflect.defineMetadata(SERIAL_MAP_METADATA_KEY, serialMap, target);
	};
}
