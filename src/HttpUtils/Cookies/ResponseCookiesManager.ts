/*
 * Copyright 2025,2026 Raul Radu
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

import { HeaderBuilder } from '../Headers/HeaderBuilder';
import { Cookie } from './Cookie';

/**
 * This class is a header builder that handles Cookie instances instead of pure string
 */
export class ResponseCookieManager extends HeaderBuilder<Cookie> {
	/**
	 * This method overrides the base behavior of HeaderBuilder in order
	 * to return an array of strings for the Set-Cookie header
	 * @returns
	 */
	public override toConcreteHeader(): string | string[] {
		return this.map((cookie: Cookie) => cookie.bakeCookie());
	}
}
