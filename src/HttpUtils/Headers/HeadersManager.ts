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

import { HeaderBuilderInterface } from './HeaderBuilder';
import { HeaderNames } from './HeadersDef';

/**
 * This class is a helper class used to manage header builders
 * It is an extension of the standard Map<HeaderNames, HeaderBuilderInterface> class
 */
export class HeadersManager extends Map<HeaderNames, HeaderBuilderInterface> {
	/**
	 * Returns the header builder associated with the key and it autocasts it to
	 * whatever type T is as long as T implements HeaderBuilderInterface
	 * @param key The header we want to retrieve the header builder for
	 * @returns the header builder associated with the key or undefined if no header
	 * builder is associated with such key
	 */
	getAs<T extends HeaderBuilderInterface>(key: HeaderNames): T | undefined {
		return this.get(key) as T;
	}
}
