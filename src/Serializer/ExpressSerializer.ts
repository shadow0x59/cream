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

type BaseSerializable = {} | string | number | boolean;

export type SerialBite = {
	data: BaseSerializable;
	dataLabel: string;
	metaInfo: SerializerMetaInfo | undefined;
};

export namespace SerializerCommon {
	export namespace Attributes {
		export const Array: string = 'common:array';
		export const AutoSerialize: string = 'common:autoserialize';
	}
}

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

		return this.serializeAnyObject(dataLabel, data);
	}

	private async serializeAnyObject(
		dataLabel: string,
		data: Object
	): Promise<String> {
		let serializer: Serializer =
			Reflect.getMetadata(SERIALIZER_METADATA_KEY, data) || this;

		let targetName: string = serializer.targetName;

		let metaInfo = this.fetchMetaInfoForObject(dataLabel);

		if (this.dataIsArray(data)) {
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

	private getContext(): Object {
		if (this.contextStack.length == 0) return {};
		return this.contextStack[this.contextStack.length - 1];
	}

	private popContext() {
		this.contextStack.pop();
	}

	private pushContext(context: Object) {
		this.contextStack.push(context);
	}

	public static makeSerializable(data: any) {
		for (let key in data) {
			AutoMap(data, key);
			Meta(SerializerCommon.Attributes.AutoSerialize)(data, key);
		}
		return data;
	}

	public async preObject(
		dataLabel: string,
		data: SerialBite[],
		metaInfo: SerializerMetaInfo | undefined
	): Promise<string> {
		return '';
	}

	public async postObject(
		dataLabel: string,
		data: SerialBite[],
		metaInfo: SerializerMetaInfo | undefined
	): Promise<string> {
		return '';
	}

	private dataIsArray(data: Object): boolean {
		return data.hasOwnProperty('length');
	}

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

			streamBuffer.push({
				data: datum,
				dataLabel: serialItem.outName,
				metaInfo: datumMetaInfo,
			});
		}

		return streamBuffer;
	}

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
 * This class is only used to bootstrap serialization
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
