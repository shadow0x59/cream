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

import { Constructable } from '../Utils/Constructable';

export const HTTP_CODE_METADATA_KEY = Symbol('cream:http:return-code');

export function HttpReturnCode<T extends Constructable>(code: number) {
	return function (target: T): T {
		Reflect.defineMetadata(HTTP_CODE_METADATA_KEY, code, target.prototype);
		return target;
	};
}
