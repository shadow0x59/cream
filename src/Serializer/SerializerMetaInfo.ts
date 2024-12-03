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

export const SERIALIZER_META_INFO_METADATA_KEY = Symbol(
	'cream:data-serializer'
);

/**
 * @internal
 * This class is used to store meta information for
 * the serializers that will be used to make decisions
 * when serializing objects
 */
export class SerializerMetaInfo {
	private attributes: string[] = [];

	public addAttribute(attribute: string): void {
		this.attributes.push(attribute);
	}

	public hasAttribute(attribute: string): boolean {
		return this.attributes.indexOf(attribute) != -1;
	}
}

/**
 * Defines a metadata for the attribute that can be used by
 * serializers to make decisions on serialization.
 * @example the XML serializer uses the attribute AutoIndex to automatically
 * add the index of the element as the attribute index in the xml tag
 * @param attribute the attribute that should be defined
 * @returns the decorator that will decorate the attribute
 */
export function Meta(attribute: string) {
	return function (target: any, propertyName: string) {
		let metaInfo: SerializerMetaInfo =
			Reflect.getMetadata(
				SERIALIZER_META_INFO_METADATA_KEY,
				target,
				propertyName
			) || new SerializerMetaInfo();

		metaInfo.addAttribute(attribute);

		Reflect.defineMetadata(
			SERIALIZER_META_INFO_METADATA_KEY,
			metaInfo,
			target,
			propertyName
		);
	};
}
