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

import { Serializer, SerialBite, SerializerCommon } from './ExpressSerializer';
import { SerializerMetaInfo } from './SerializerMetaInfo';

export namespace CreamSerializers {
	export class JSON extends Serializer {
		async serializeNumber(
			_dataLabel: string,
			num: number
		): Promise<string> {
			return Number(num).toString();
		}

		async serializeString(
			_dataLabel: string,
			data: string
		): Promise<string> {
			return '"' + data + '"';
		}

		async serializeBoolean(
			_dataLabel: string,
			data: boolean
		): Promise<string> {
			return data ? 'true' : 'false';
		}

		async serializeNull(_dataLabel: string): Promise<string> {
			return 'null';
		}

		async handleSerializationStream(
			_serializedObjectName: string,
			serialStream: SerialBite[],
			metaInfo: SerializerMetaInfo
		): Promise<String> {
			if (metaInfo.hasAttribute(SerializerCommon.Attributes.Array)) {
				return this.serializeArray(serialStream);
			}

			return this.serializeObject(serialStream);
		}

		async serializeArray(serialStream: SerialBite[]): Promise<string> {
			let outStream = '[';
			for (let elem of serialStream) {
				outStream +=
					(await this.serialize(elem.dataLabel, elem.data)) + ',';
			}
			if (outStream.endsWith(',')) {
				return outStream.slice(0, outStream.length - 1) + ']';
			} else {
				return outStream + ']';
			}
		}

		async serializeObject(serialStream: SerialBite[]): Promise<string> {
			let outStream = '{';
			for (let elem of serialStream) {
				if (elem.data !== undefined) {
					outStream +=
						'"' +
						elem.dataLabel +
						'":' +
						(await this.serialize(elem.dataLabel, elem.data)) +
						',';
				}
			}

			if (outStream.endsWith(',')) {
				return outStream.slice(0, outStream.length - 1) + '}';
			}

			return outStream + '}';
		}
	}

	export class XML extends Serializer {
		public static Attribute: string = 'xml:attribute';
		public static Text: string = 'xml:text';
		public static AddIndex: string = 'xml:addIndex';

		async serializeNumber(dataLabel: string, num: number): Promise<string> {
			if (dataLabel == '') return Number(num).toString();

			return (
				'<' +
				dataLabel +
				'>' +
				Number(num).toString() +
				'</' +
				dataLabel +
				'>'
			);
		}

		async serializeString(
			dataLabel: string,
			data: string
		): Promise<string> {
			if (dataLabel == '') return data;
			return '<' + dataLabel + '>' + data + '</' + dataLabel + '>';
		}

		async serializeBoolean(
			dataLabel: string,
			data: boolean
		): Promise<string> {
			if (dataLabel == '') return data ? 'true' : 'false';

			return (
				'<' +
				dataLabel +
				'>' +
				(data ? 'true' : 'false') +
				'</' +
				dataLabel +
				'>'
			);
		}

		async serializeNull(dataLabel: string): Promise<string> {
			if (dataLabel == '') return 'null';
			return '<' + dataLabel + '/>';
		}

		async handleSerializationStream(
			serializedObjectName: string,
			serialStream: SerialBite[],
			objectMetaInfo: SerializerMetaInfo
		): Promise<String> {
			if (
				objectMetaInfo.hasAttribute(SerializerCommon.Attributes.Array)
			) {
				return this.serializeArray(
					serializedObjectName,
					serialStream,
					objectMetaInfo
				);
			}

			let objectLabel = '<' + serializedObjectName;
			let objectChildren = '';

			for (let elem of serialStream) {
				if (
					elem.metaInfo != undefined &&
					elem.metaInfo.hasAttribute(XML.Attribute)
				) {
					objectLabel +=
						' ' +
						elem.dataLabel +
						'="' +
						(await this.serialize('', elem.data)) +
						'"';
				} else if (
					elem.metaInfo != undefined &&
					elem.metaInfo.hasAttribute(XML.Text)
				) {
					objectChildren += await this.serialize('', elem.data);
				} else {
					objectChildren += await this.serialize(
						elem.dataLabel,
						elem.data
					);
				}
			}

			if (objectChildren == '') {
				return objectLabel + '/>';
			}

			return (
				objectLabel +
				'>' +
				objectChildren +
				'</' +
				serializedObjectName +
				'>'
			);
		}

		async serializeArray(
			arrayName: string,
			serialStream: SerialBite[],
			metaInfo: SerializerMetaInfo
		): Promise<string> {
			let outStream = '';
			let shouldAddIndex = metaInfo.hasAttribute(XML.AddIndex);

			for (let elem of serialStream) {
				outStream += '<' + arrayName;
				if (shouldAddIndex) {
					outStream += ' index="' + elem.dataLabel + '"';
				}
				outStream += '>';
				outStream += await this.serialize('', elem.data);
				outStream += '</' + arrayName + '>';
			}

			return outStream;
		}
	}
}
