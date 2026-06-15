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

import { HeaderBuilder } from '../HttpUtils/Headers/HeaderBuilder';
import { HeadersManager } from '../HttpUtils/Headers/HeadersManager';
import { MessageType } from './Message';
import { Response } from 'express';
import { ResponseCookieManager } from '../HttpUtils/Cookies/ResponseCookiesManager';
import { NoCookiesHeaderNames } from '../HttpUtils/Headers/HeadersDef';

/**
 * This class is used to prepare the transaction before sending the data to the user.\
 * It is accessible from any method that is decorated as {@link ExpressCall} or its derivatives
 * like {@link Get}, {@link Put}, {@link Post}, {@link Delete}.\
 * To access it in the method simply call ExpressModule.prepareTransaction().
 */
export class TransactionManager {
	/**
	 * The transaction HTTP Return Code
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status | HTTP Status Codes}
	 */
	private retcode!: number;

	/**
	 * This object will handle headers
	 */
	private headers: HeadersManager;

	/**
	 * @param method The method that will handle the transaction
	 * @param thisArg The method owner (reserved for future usage)
	 */
	constructor() {
		this.headers = new HeadersManager();
		this.reset();
	}

	/**
	 * This method is used by the ExpressCall wrapper to set the cookies in the transaction
	 * manager.
	 * @note This will overwrite any previously set headers.
	 * @param headers the headers manager cotaining new headers
	 * @returns a self reference to the transaction manager for chaining more operations
	 */
	setHeaders(headers: HeadersManager | undefined) {
		if (headers == undefined) return this;
		for (let key of headers.keys()) {
			this.headers.set(key, headers.get(key)!);
		}

		return this;
	}

	/**
	 * This method allows to retrieve a header builder for the requested header
	 * @note this will create a new header builder if the one searched is undefined
	 * @param headerName the name of the header
	 * @returns the header builder associated with the headerName or undefined if none is found
	 */
	getHeaderBuilder(headerName: NoCookiesHeaderNames): HeaderBuilder {
		let builder: HeaderBuilder =
			this.headers.getAs<HeaderBuilder>(headerName) ||
			new HeaderBuilder();
		this.headers.set(headerName, builder);

		return builder;
	}

	/**
	 * This method is used to set the content type of the transaction.
	 * @see {@link MessageType}
	 * @param contentType The content type of the data sent to the user. If contentType is undefined then nothing is changed from the last value
	 * @returns a self reference to the transaction manager for chaining more operations
	 */
	public ContentType(
		contentType: MessageType | undefined
	): TransactionManager {
		if (contentType == undefined) return this;
		this.headers.getAs<HeaderBuilder>('Content-Type')![0] = contentType;
		return this;
	}

	/**
	 * Returns the cookies manager that will set or unset cookies for responses to users
	 */
	public getResponseCookiesManager(): ResponseCookieManager {
		return this.headers.getAs<ResponseCookieManager>('Set-Cookie')!;
	}

	/**
	 * This method is used to set the return code of the transaction.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status | HTTP Status Codes}
	 * @param retcode is the HTTP status code sent to the user. If retcode is undefined then nothing is changed from the last value
	 * @returns a self reference to the transaction manager for chaining more operations
	 */
	public ReturnCode(retcode: number | undefined): TransactionManager {
		if (retcode == undefined) return this;
		this.retcode = retcode;
		return this;
	}

	/**
	 * @internal
	 * This method is used to reset to a default state the transaction manager. This method is called
	 * everytime before calling the associated method.
	 * @param thisArg the owner of the method
	 * @returns a self reference to the transaction manager
	 */
	public reset(): TransactionManager {
		this.headers.clear();
		this.headers.set('Content-Type', new HeaderBuilder());
		this.headers.set('Set-Cookie', new ResponseCookieManager());
		this.ContentType('text/plain');
		this.retcode = 200;
		return this;
	}

	/**
	 * This method will apply all saved information to the transaction
	 * @param res the transaction that will be modified by the content of this transaction manager
	 * @returns the modified transaction
	 */
	public finalizeTransaction(res: Response): Response {
		for (let i of this.headers.keys()) {
			res.set(i, this.headers.get(i)!.toConcreteHeader());
		}
		return res.status(this.retcode);
	}
}
