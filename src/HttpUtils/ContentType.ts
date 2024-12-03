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

import { MessageType } from '../ExchangeUtils/Message';
import { Constructable } from '../Utils/Constructable';

export const HTTP_CONTENT_TYPE_METADATA_KEY = Symbol('cream:http:content-type');

/**
 * This decorator is used to decorate a class to add information about
 * the content type that should be set in the Content-Type header
 * @param contentType  the content type that should be set in the header
 * @returns the decorator of the function
 */
export function ContentType<T extends Constructable>(contentType: MessageType) {
	return function (target: T): T {
		Reflect.defineMetadata(
			HTTP_CONTENT_TYPE_METADATA_KEY,
			contentType,
			target.prototype
		);
		return target;
	};
}
