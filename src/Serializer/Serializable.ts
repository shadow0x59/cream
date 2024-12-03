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

/**
 * Declares a class to be serialized and also declares the serializer that
 * should be used to serialize the decorated class
 * @param serializer the Serializer that should be used
 * @returns the decorator that will decorate the class
 */
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

/**
 * This method is used to declare a field serializable
 * and it will also get the name of the field automatically
 * @param target the target class attribute
 * @param propertyName the name of the class attribute
 * @returns the decorator that will handle the mapping for serialization
 */
export function AutoMap(target: any, propertyName: string) {
	return MapTo(propertyName)(target, propertyName);
}

/**
 * This method is used to declare a field serializable
 * and it will also get the name of the field automatically but it will
 * map to a different name declared by the user
 * @param name the new name of the field in the serialized object
 * @returns the decorator that will handle the mapping for serialization
 */
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
