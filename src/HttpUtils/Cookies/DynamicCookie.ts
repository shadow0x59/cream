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

import { CookieOptions } from './Cookie';

export const HTTP_DYNAMIC_COOKIES = Symbol('cream:http:cookies:dynamic');

/**
 * @internal
 * this type is used to map a property of a class to a cookie with its relative options
 */
export type DynamicCookieMapping = {
	propertyName: string;
	cookieName: string;
	opts: CookieOptions;
};

/**
 * This method is used to map an attribute of a class to a specific cookie
 * given the cookie options
 * @param cookieName the cookie name
 * @param opts the options associated with the cookie
 * @returns the decorator function that will decorate the class attribute
 */
export function DynamicCookie(cookieName: string, opts: CookieOptions = {}) {
	return function (target: any, propertyName: string) {
		let cookies: Array<DynamicCookieMapping> =
			Reflect.getMetadata(HTTP_DYNAMIC_COOKIES, target) ||
			new Array<DynamicCookieMapping>();

		let cookie: DynamicCookieMapping = {
			cookieName: cookieName,
			propertyName: propertyName,
			opts: opts,
		};

		cookies.push(cookie);

		Reflect.defineMetadata(HTTP_DYNAMIC_COOKIES, cookies, target);
	};
}
