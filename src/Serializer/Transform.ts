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

export const SERIALIZER_TRANSFORM_METADATA_KEY = Symbol(
	'cream:data-transformers'
);

/**
 * This decorator is used to transform a piece of data to another piece of data
 * Transform can change the data type aswell and the serializer will be able to detect it
 *
 * @remarks Transform only works with static transformations. Transformation that depend
 * on the current object (`this`) cannot be created with this method. For those kind of
 * methods it is preferrable to use {@link AutoMap} or {@link MapTo} with getters.
 * Also note that Transform is applied on a bottom-up approach, so Transform closer to
 * the decorated attribute will be applied first
 *
 * @example
 * ```ts
 * \@Serializable(CreamSerializers.JSON)
 * class MyClass {
 *
 *    \@Transform((data: boolean) => data ? "data is enough" : "data is not enough")
 *    \@Transform((data: number) => data < 5)
 *    \@AutoMap
 *    myData: number
 * }
 * ```
 *
 * @param tranformFunction the lambda used for transforming the datum into a new piece
 * of information
 * @returns the decorator that will decorate the class field.
 */
export function Transform<T, R>(tranformFunction: (data: T) => R) {
	return function (target: any, propertyName: string) {
		let transformers: Function[] =
			Reflect.getMetadata(
				SERIALIZER_TRANSFORM_METADATA_KEY,
				target,
				propertyName
			) || new Array<Function>();

		transformers.push(tranformFunction);

		Reflect.defineMetadata(
			SERIALIZER_TRANSFORM_METADATA_KEY,
			transformers,
			target,
			propertyName
		);
	};
}
