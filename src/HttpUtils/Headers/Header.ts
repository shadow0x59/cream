/*
 * Copyright 2025 Raul Radu
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

import { Constructable } from '../../Utils/Constructable';
import { HeaderBuilder } from './HeaderBuilder';
import { NoCookiesHeaderNames } from './HeadersDef';

export const HTTP_HEADERS_METADATA_KEY = Symbol('cream:http:headers');

/**
 * This collection of methods allows to push a header to the response
 * This is structured this way to allow treating multiple values of the same header
 * at once.
 * Headers are mainly one value only, but an array of values can be passed to the client
 * in this case the array is serialized into a string by separating elements with a '<comma><space>', literally
 * ', '.
 * Multiple definition of the same header cannot exist in the same request, except for 'Set-Cookie'.
 * For cookies please use cookie specific functions.
 * @note THIS DOES NOT APPLY TO COOKIES, USE COOKIES SPECIFIC FUNCTIONS INSTEAD
 * @param headerName it is the header that is wanted to be set, except for Cookie-related stuff
 * @returns a collection of functions to act onto the header
 */
export function StaticResponseHeader(headerName: NoCookiesHeaderNames) {
	return {
		/**
		 * This function allows to set the value of a specific header.
		 * Use this function when the header can accept only a single value and
		 * not an array as this will overwrite any previous definitions of the header
		 * @param value the value of the header
		 * @returns the decorator function
		 */
		Set: <T extends Constructable>(value: string) => {
			return function (target: T): T {
				let headers =
					Reflect.getMetadata(
						HTTP_HEADERS_METADATA_KEY,
						target.prototype
					) || new Map<string, HeaderBuilder>();

				let newHeaderBuilder = new HeaderBuilder();

				newHeaderBuilder.push(value);

				headers.set(headerName, newHeaderBuilder);
				Reflect.defineMetadata(
					HTTP_HEADERS_METADATA_KEY,
					headers,
					target.prototype
				);
				return target;
			};
		},

		/**
		 * This function allows to append a value to a specific header.
		 * Use this function when an array of data needs to be sent to the user via array
		 * do not use it with Set-Cookie as it will not work properly.
		 * @param value the value to be pushed to the header
		 * @returns the decorator function
		 */
		Append: <T extends Constructable>(value: string) => {
			return function (target: T): T {
				let headers =
					Reflect.getMetadata(
						HTTP_HEADERS_METADATA_KEY,
						target.prototype
					) || new Map<string, HeaderBuilder>();
				let headerBuilder: HeaderBuilder | undefined =
					headers.get(headerName) || new HeaderBuilder();

				if (headerBuilder) {
					headerBuilder.push(value);
				}

				headers.set(headerName, headerBuilder);
				Reflect.defineMetadata(
					HTTP_HEADERS_METADATA_KEY,
					headers,
					target.prototype
				);
				return target;
			};
		},
	};
}
