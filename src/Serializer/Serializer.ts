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

import { RestError } from '../ExpressErrorHandler/ExpressErrorHandler';
import {
	AutoMap,
	SERIAL_MAP_METADATA_KEY,
	SERIALIZER_METADATA_KEY,
	SerialMap,
} from './Serializable';
import {
	Meta,
	SERIALIZER_META_INFO_METADATA_KEY,
	SerializerMetaInfo,
} from './SerializerMetaInfo';
import { SERIALIZER_TRANSFORM_METADATA_KEY } from './Transform';

/**
 * @internal
 * Defines the base types that should be serialized
 */
type BaseSerializable = {} | string | number | boolean;

/**
 * @internal
 * This type defines the unit of data that
 * should be serialized
 */
export type SerialBite = {
	/**
	 * the data that should be serialized
	 */
	data: BaseSerializable;

	/**
	 * The label that should be used when serializing
	 * aka the output name
	 */
	dataLabel: string;

	/**
	 * Additional meta information that can be
	 * used by serializers when serializing objects
	 */
	metaInfo: SerializerMetaInfo | undefined;
};

/**
 * This namespace defines Common information
 * for serializers
 */
export namespace SerializerCommon {
	/**
	 * This namespace defines the common attributes to all serializers
	 */
	export namespace Attributes {
		/**
		 * This attribute is used to declare an object as an array
		 */
		export const Array: string = 'common:array';

		/**
		 * This attribute is used to automatically serialize everything in the object
		 */
		export const AutoSerialize: string = 'common:autoserialize';
	}
}

/**
 * This base class that implements the complex logic for handling
 * serialization of objects. It gives a framework to easily implement
 * complex serializers.
 */
export abstract class Serializer {
	private targetName: string;
	private contextStack: object[] = [];

	constructor(targetName: string, baseContext: Object) {
		this.targetName = targetName;
		this.contextStack = [baseContext];
	}

	abstract handleSerializationStream(
		serializedObjectName: string,
		serialStream: SerialBite[],
		objectMetaInfo: SerializerMetaInfo
	): Promise<String>;

	abstract serializeNumber(dataLabel: string, num: number): Promise<string>;

	abstract serializeString(dataLabel: string, data: string): Promise<string>;

	abstract serializeBoolean(
		dataLabel: string,
		data: boolean
	): Promise<string>;

	abstract serializeNull(dataLabel: string): Promise<string>;

	/**
	 * This method is used to handle undefined data.
	 * By default undefined is returned as an empty string
	 * @param dataLabel (unused) the label of the data.
	 * @returns empty string
	 */
	async serializeUndefined(_dataLabel: string): Promise<string> {
		return '';
	}

	/**
	 * This method is used as the default behaviour for serializing Dates
	 * it uses the Date.toISOString method for serializing it.
	 * @param dataLabel (unused) the label of the data
	 * @param data the date to be serialized
	 * @returns the serialized string in ISO format
	 */
	async serializeDate(_dataLabel: string, data: Date): Promise<string> {
		return data.toISOString();
	}

	/**
	 * This method is used to serialize a piece of data
	 * @param dataLabel the label of the data
	 * @param data the actual data
	 * @returns a string representing the serialized object
	 */
	public async serialize(dataLabel: string, data: any): Promise<String> {
		if (typeof data === 'number') {
			return this.serializeNumber(dataLabel, data);
		}
		if (typeof data === 'string') {
			return this.serializeString(dataLabel, data);
		}
		if (typeof data === 'boolean') {
			return this.serializeBoolean(dataLabel, data);
		}

		if (data === null) {
			return this.serializeNull(dataLabel);
		}

		if (data === undefined) {
			return this.serializeUndefined(dataLabel);
		}

		if (data instanceof Date) {
			return this.serializeDate(dataLabel, data);
		}

		return this.serializeAnyObject(dataLabel, data);
	}

	/**
	 * This method is used to serialize anything that is not
	 * a base type
	 * @param dataLabel the data label that should be used when rendering
	 * @param data the data that should be serialized
	 * @returns the string representing the serialized object
	 */
	private async serializeAnyObject(
		dataLabel: string,
		data: Object
	): Promise<String> {
		let serializer: Serializer =
			Reflect.getMetadata(SERIALIZER_METADATA_KEY, data) || this;

		let targetName: string = serializer.targetName;

		let metaInfo = this.fetchMetaInfoForObject(dataLabel);

		if (Array.isArray(data)) {
			metaInfo.addAttribute(SerializerCommon.Attributes.Array);
			this.autoMapArray(data as any[]);
			targetName = dataLabel;
		}

		if (metaInfo.hasAttribute(SerializerCommon.Attributes.AutoSerialize)) {
			Serializer.makeSerializable(data);
		}

		let dataStream = this.streamify(data);

		serializer.pushContext(data);

		let preObjectStream = this.preObject(targetName, dataStream, metaInfo);

		let postObjectStream = this.postObject(
			targetName,
			dataStream,
			metaInfo
		);

		let outStream = (
			await Promise.all([
				preObjectStream,
				serializer.handleSerializationStream(
					targetName,
					dataStream,
					metaInfo
				),
				postObjectStream,
			])
		).join('');

		serializer.popContext();

		return outStream;
	}

	/**
	 * Gets the current context
	 * @returns the current context
	 */
	private getContext(): Object {
		let currentContext: object | undefined =
			this.contextStack[this.contextStack.length - 1];
		if (currentContext === undefined) {
			throw new RestError('Current context is undefined', 500);
		}
		return currentContext;
	}

	/**
	 * removes the current context from the stack
	 */
	private popContext() {
		this.contextStack.pop();
	}

	/**
	 * This is used to push a context to the stack.
	 * This context is used to infer data ownership
	 * @param context the context that should be pushed
	 */
	private pushContext(context: Object) {
		this.contextStack.push(context);
	}

	/**
	 * This static method makes any object serializable by iterating through the object
	 * this can break when recursive references are taken in place
	 * @param data the data to be serialized
	 * @returns the decorated data
	 */
	public static makeSerializable(data: any) {
		for (let key in data) {
			AutoMap(data, key);
			Meta(SerializerCommon.Attributes.AutoSerialize)(data, key);
		}
		return data;
	}

	/**
	 * This method is called before handling a custom object
	 * @param dataLabel the label of the object
	 * @param data the object
	 * @param metaInfo  any information useful for serialization
	 * @returns a string that should be appended before the serialization of the object
	 */
	public async preObject(
		_dataLabel: string,
		_data: SerialBite[],
		_metaInfo: SerializerMetaInfo | undefined
	): Promise<string> {
		return '';
	}

	/**
	 * This method is called after handling a custom object
	 * @param dataLabel the label of the object
	 * @param data the object
	 * @param metaInfo  any information useful for serialization
	 * @returns a string that should be appended after the serialization of the object
	 */
	public async postObject(
		_dataLabel: string,
		_data: SerialBite[],
		_metaInfo: SerializerMetaInfo | undefined
	): Promise<string> {
		return '';
	}

	/**
	 * This method is used to create a serialization of
	 * the array in data by putting the index as the
	 * field name
	 * @param data the array that should be mapped
	 */
	private autoMapArray(data: any[]): void {
		let serialMap: SerialMap[] = [];

		for (let index in data) {
			serialMap.push({
				fieldName: index,
				outName: index,
			});
		}

		Reflect.defineMetadata(SERIAL_MAP_METADATA_KEY, serialMap, data);
	}

	/**
	 * This method is used to streamify the data from the object given as input
	 * @param data the data that should be streamified
	 * @returns the stream of SerialBites that will be later handled by the serializer
	 */
	private streamify(data: Object): SerialBite[] {
		let streamBuffer: SerialBite[] = [];

		let serialMap: SerialMap[] =
			Reflect.getMetadata(SERIAL_MAP_METADATA_KEY, data) || [];

		let accessibleData = data as any;

		for (let serialItem of serialMap) {
			let datum = accessibleData[serialItem.fieldName];

			let datumMetaInfo: SerializerMetaInfo = Reflect.getMetadata(
				SERIALIZER_META_INFO_METADATA_KEY,
				data,
				serialItem.fieldName
			);

			let transformPipeline: Function[] =
				Reflect.getMetadata(
					SERIALIZER_TRANSFORM_METADATA_KEY,
					data,
					serialItem.fieldName
				) || [];

			let transformResult: any = datum;

			for (let transform of transformPipeline) {
				transformResult = transform(transformResult);
			}

			streamBuffer.push({
				data: transformResult,
				dataLabel: serialItem.outName,
				metaInfo: datumMetaInfo,
			});
		}

		return streamBuffer;
	}

	/**
	 * This method will return meta information for the current context based on the
	 * dataLabel
	 * @param dataLabel the name of the field that the metadata should be retrieved from
	 * @returns the metadata associated with the dataLabel
	 */
	private fetchMetaInfoForObject(dataLabel: string): SerializerMetaInfo {
		let serialMap: SerialMap[] | undefined = Reflect.getMetadata(
			SERIAL_MAP_METADATA_KEY,
			this.getContext()
		);

		let oldName = serialMap?.find((pair: SerialMap) => {
			return pair.outName == dataLabel;
		})?.fieldName;

		return (
			Reflect.getMetadata(
				SERIALIZER_META_INFO_METADATA_KEY,
				this.getContext(),
				oldName || dataLabel
			) || new SerializerMetaInfo()
		);
	}
}

/**
 * @internal
 * This class is only used to bootstrap serialization
 * It will also handle base types when no complex object is returned
 * The serialization of those types is language agnostic
 */
export class BootstrapSerializer extends Serializer {
	async serializeNull(_dataLabel: string): Promise<string> {
		return 'null';
	}
	constructor() {
		super('', {});
	}

	public async start(data: any): Promise<String> {
		return this.serialize('', data);
	}

	async serializeNumber(_: any, num: number): Promise<string> {
		return Number(num).toString();
	}

	async serializeString(_: any, data: string): Promise<string> {
		return data;
	}

	async serializeBoolean(_: any, bool: boolean): Promise<string> {
		return bool ? 'true' : 'false';
	}

	async handleSerializationStream(_: any): Promise<String> {
		throw Error('Trying to serialize an object that is not serializable');
	}
}
