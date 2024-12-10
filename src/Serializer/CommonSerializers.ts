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

import { Serializer, SerialBite, SerializerCommon } from './Serializer';
import { SerializerMetaInfo } from './SerializerMetaInfo';

/**
 * In this namespace you can find common serializers defined by
 * Cream
 */
export namespace CreamSerializers {
	/**
	 * This serializer serialize objects to JSON notation
	 * It does not serialize methods, only attributes
	 * @remarks circular dependencies are not checked yet and this can
	 * cause a serious issue with your code.
	 */
	export class JSON extends Serializer {
		/**
		 * This method takes a number as input and returns a string corresponding to that number
		 * it just uses {@link Number.toString} under the hood
		 * @param _dataLabel **ignored**
		 * @param num The number to be serialized
		 * @returns a string representing the number num in json format
		 */
		async serializeNumber(
			_dataLabel: string,
			num: number
		): Promise<string> {
			return Number(num).toString();
		}

		/**
		 * This method just adds one quota at the beginning and one at the end of the string
		 * @param _dataLabel **ignored**
		 * @param data The string to be serialized
		 * @returns a string representing the string data in json format
		 */
		async serializeString(
			_dataLabel: string,
			data: string
		): Promise<string> {
			return '"' + data + '"';
		}

		/**
		 * This method returns the string equivalent of the boolean values true/false in the JSON format
		 * @param _dataLabel **ignored**
		 * @param data the boolean data to be serialized
		 * @returns the string equivalent in JSON format of data
		 */
		async serializeBoolean(
			_dataLabel: string,
			data: boolean
		): Promise<string> {
			return data ? 'true' : 'false';
		}

		/**
		 * This method is called when a null valued attribute is found.
		 * @remarks Beware that this doesn't mean that the value was undefined, but rather that
		 * the attribute exists but it is null, with not a value.\
		 * For further information about the difference between undefined and null
		 * you should look in the JavaScript documentation.
		 * @param _dataLabel **ignored**
		 * @returns 'null'
		 */
		async serializeNull(_dataLabel: string): Promise<string> {
			return 'null';
		}

		/**
		 * This method is used to serialize a Date into a string
		 * it works like Date.toJSON except it is calling directly
		 * Date.toISOString
		 * @param dataLabel unused. The label of the field containing the date
		 * @param data the actual date to be serialized
		 * @returns the serialized date as string, encapsulated by colons ("\<date\>").
		 */
		async serializeDate(dataLabel: string, data: Date): Promise<string> {
			return '"' + (await super.serializeDate(dataLabel, data)) + '"';
		}

		/**
		 * This method will do the job of serializing the input
		 * object that is automatically converted to a stream.\
		 * @remarks The stream order is top-down from class notation,
		 * so the first attribute found in the class will be the first
		 * to be inserted in the serialStream
		 * @param _serializedObjectName - **ignored**
		 * @param serialStream - the input stream the object to be serialized was sliced to by the {@link Serializer.serialize} method
		 * @param metaInfo - additional meta information about how to handle the object. These attributes were defined
		 * by {@link Meta} or by the {@link Serializer.serialize} method
		 * @returns a string representing the serialized version of the stream in JSON format
		 */
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

		/**
		 * This method serializes array-like objects previously identified by
		 * the {@link Serializer.serialize} method.
		 * @param serialStream - the serial stream of the array. each object is one object of the array
		 * SerialBite.dataLabel will be the index of the object
		 * @returns the string corresponding to the array. If the array is empty it will return a '[]'
		 * representing the empty array in JSON
		 */
		async serializeArray(serialStream: SerialBite[]): Promise<string> {
			if (serialStream.length == 0) return '[]';

			let outStream = '[';
			for (let elem of serialStream) {
				outStream +=
					(await this.serialize(elem.dataLabel, elem.data)) + ',';
			}

			return outStream.slice(0, outStream.length - 1) + ']';
		}

		/**
		 * This method is used to serialize a stream that contains object-like data
		 * {@link SerialBite.dataLabel} will contain either the attribute name or the alternative
		 * given by the {@link MapTo} decorator. This is not an issue because a reference to
		 * the actual field is held in {@link SerialBite.data}
		 * @param serialStream - the array of SerialBites representing the object
		 * @returns the string representing the serialStream in JSON format
		 */
		async serializeObject(serialStream: SerialBite[]): Promise<string> {
			if (serialStream.length == 0) return '{}';

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

			return outStream.slice(0, outStream.length - 1) + '}';
		}
	}

	/**
	 * @experimental
	 * This class will act as a serializer to XML format.
	 * This is still experimental and it is not yet suggested for
	 * extensive use. Any help on its enhancement is welcome!
	 */
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

		async serializeDate(dataLabel: string, data: Date): Promise<string> {
			if (dataLabel == '') return super.serializeDate(dataLabel, data);
			else
				return (
					'<' +
					dataLabel +
					'>' +
					(await super.serializeDate(dataLabel, data)) +
					'</' +
					dataLabel +
					'>'
				);
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
