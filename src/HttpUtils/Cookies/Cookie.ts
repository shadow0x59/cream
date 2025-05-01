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

import { CookieTimeFrame } from './CookieTimeFrame';

export type ExpiryFunction = (timeFrame: CookieTimeFrame) => void;

export enum SameSite {
	Strict = 'Strict',
	Lax = 'Lax',
	None = 'None',
}

export type RawCookieOptions = {
	Expires?: Date;
	Path?: string;
	'Max-Age'?: number;
	Domain?: string;
	Secure: boolean;
	HttpOnly: boolean;
	SameSite: SameSite;
	Partitioned: boolean;
};

/**
 * The most important things to know are that
 * - if `Secure` is not set it will default to `true`
 * - If `SameSite` is `None` or if `Partitioned` is `true`, `Secure`
 * will default to `true`
 * - if `SameSite` is not set it will default to `SameSite.Lax`
 * - Expiration can be set only via `MaxAge` since is the
 * standard, `Expires` is deprecated (see MDN Docs).
 *
 * For a more detailed documentation please refer to MDN Docs:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
 *
 */
export type CookieOptions = {
	Path?: string;
	/**
	 * The expiration of a cookie can be set only by using an `ExpiryFunction`.\
	 * The reason behind this is that the expiry function will provide you, the user,
	 * with an already instanciated {@link CookieTimeFrame} and the user will only need to
	 * define the start of the timeframe and its end.
	 *
	 * Also some other stuff can be done in this function. The only thing is that
	 * `this` is probably undefined or has a undefined behaviour.
	 */
	MaxAge?: ExpiryFunction;
	Domain?: string;
	Secure?: boolean;
	HttpOnly?: boolean;
	SameSite?: SameSite;
	Partitioned?: boolean;
};

/**
 * This class is used to handle and create HTTP Cookies
 */
export class Cookie {
	/**
	 * Determines whether a given context should be considered secure
	 * based on provided options.
	 *
	 * @param secureOpt - Indicates if the context should be secure.
	 *                    Defaults to `true` if undefined.
	 * @param partitionedOpt - Specifies if the context is partitioned.
	 * @param sameSite - Defines the SameSite policy of the context.
	 *                   If `SameSite.None`, security is considered true.
	 * @returns `true` if:
	 *          - `secureOpt` is explicitly `true` or secureOpt is undefined
	 *          - `partitionedOpt` is explicitly `true`
	 *          - `sameSite` is set to `SameSite.None`
	 *          Otherwise, returns `false`.
	 */
	private static getIfSecure(
		secureOpt: boolean | undefined,
		partitionedOpt: boolean | undefined,
		sameSite: SameSite | undefined
	) {
		if (secureOpt == undefined) {
			return true;
		}

		return (
			secureOpt || partitionedOpt === true || sameSite === SameSite.None
		);
	}

	/**
	 * Creates a `Cookie` instance based on the provided name, value, and options.
	 * Ensures proper security, expiration settings, and partitioning considerations.
	 *
	 * @note if `cookieOptions.SameSite` is set to `None`, or if `cookieOptions.Partitioned`
	 * is `true` then `SameSite` will be automatically set to `true`.\
	 * If `SameSite` is not defined it will be set to `true` due to security reasons.\
	 * It can be set to `false` but it has to be done explicitly!
	 *
	 * @param cookieName - The name of the cookie.
	 * @param cookieValue - The value associated with the cookie.
	 * @param cookieOptions - Configuration options that define the cookie's behavior. see {@link CookieOptions}
	 * @returns A new instance of `Cookie` configured according to the provided options.
	 */
	public static fromCookieOpts(
		cookieName: string,
		cookieValue: string,
		cookieOptions: CookieOptions
	) {
		let rawOpts: RawCookieOptions = {
			Secure: Cookie.getIfSecure(
				cookieOptions.Secure,
				cookieOptions.Partitioned,
				cookieOptions.SameSite
			),
			HttpOnly: true,
			SameSite: cookieOptions.SameSite || SameSite.Lax,
			Domain: cookieOptions.Domain,
			Path: cookieOptions.Path,
			Partitioned: cookieOptions.Partitioned || false,
		};

		if (cookieOptions.HttpOnly != undefined) {
			rawOpts.HttpOnly = cookieOptions.HttpOnly;
		}

		if (cookieOptions.MaxAge) {
			let cookieTimeFrame = new CookieTimeFrame();
			cookieOptions.MaxAge(cookieTimeFrame);
			rawOpts['Max-Age'] = cookieTimeFrame.getDeltaTime();
			rawOpts['Expires'] = cookieTimeFrame.getEndDate();
		}
		return new Cookie(cookieName, cookieValue, rawOpts);
	}

	/**
	 * It is not recommended to use this constructor as all the default behaviour of
	 * Cream will be lost and all fields have to be set manually.
	 * Generally you want to use {@link Cookie.fromCookieOpts}.
	 * @param cookieName The name of the cookie
	 * @param cookieValue the value associated with the cookie
	 * @param cookieOptions the HTTP cookie options.
	 */
	constructor(
		private cookieName: string,
		private cookieValue: string,
		private cookieOptions: RawCookieOptions
	) {}

	/**
	 * This method is used to convert the `Cookie` instance to a HTTP Set-Cookie
	 * Header compliant string
	 * @returns The cookie in a HTTP-compliant string
	 */
	public bakeCookie(): string {
		let bakedCookie = this.cookieName + '=' + this.cookieValue;

		bakedCookie += this.cookieOptions.Domain
			? '; Domain=' + this.cookieOptions.Domain!
			: '';
		bakedCookie += this.cookieOptions.Expires
			? '; Expires=' + this.cookieOptions.Expires!.toUTCString()
			: '';
		bakedCookie += this.cookieOptions.HttpOnly ? '; HttpOnly' : '';
		bakedCookie += this.cookieOptions['Max-Age']
			? '; Max-Age=' + this.cookieOptions['Max-Age']
			: '';
		bakedCookie += this.cookieOptions.Partitioned ? '; Partitioned' : '';
		bakedCookie += this.cookieOptions.Path
			? '; Path=' + this.cookieOptions.Path
			: '';
		bakedCookie += this.cookieOptions.Secure ? '; Secure' : '';

		bakedCookie += '; SameSite=' + this.cookieOptions.SameSite;

		return bakedCookie;
	}
}
