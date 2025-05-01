import {
	Constructable,
	Cookie,
	HeaderBuilderInterface,
	ResponseCookieManager,
} from '../..';
import { HTTP_HEADERS_METADATA_KEY } from '../Headers/Header';
import { CookieOptions } from './Cookie';

/**
 * This method is used to statically set a value of a cookie in the response
 * @param cookieName the cookie name
 * @param coookieValue the value associated with the cookie
 * @param cookieOpt the options for the cookie
 * @returns the decorator function for the class with the correct information
 */
export function SetCookie<T extends Constructable>(
	cookieName: string,
	coookieValue: string,
	cookieOpt: CookieOptions
) {
	return function (target: T): T {
		let headers =
			Reflect.getMetadata(HTTP_HEADERS_METADATA_KEY, target.prototype) ||
			new Map<string, HeaderBuilderInterface>();

		let newHeaderBuilder =
			(headers.get('Set-Cookie') as ResponseCookieManager) ||
			new ResponseCookieManager();

		newHeaderBuilder.push(
			Cookie.fromCookieOpts(cookieName, coookieValue, cookieOpt)
		);

		headers.set('Set-Cookie', newHeaderBuilder);
		Reflect.defineMetadata(
			HTTP_HEADERS_METADATA_KEY,
			headers,
			target.prototype
		);
		return target;
	};
}
