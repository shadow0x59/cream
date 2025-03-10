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

import { MessageType } from './Message';
import { Response } from 'express';

/**
 * This class is used to prepare the transaction before sending the data to the user.\
 * It is accessible from any method that is decorated as {@link ExpressCall} or its derivatives
 * like {@link Get}, {@link Put}, {@link Post}, {@link Delete}.\
 * To access it in the method simply call ExpressModule.prepareTransaction().
 */
export class TransactionManager {
	/**
	 * The transaction content type
	 * @see {@link MessageType}
	 */
	private contentType!: MessageType;

	/**
	 * The transaction HTTP Return Code
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status | HTTP Status Codes}
	 */
	private retcode!: number;

	/**
	 * @param method The method that will handle the transaction
	 * @param thisArg The method owner (reserved for future usage)
	 */
	constructor(
		private method: any,
		private thisArg: any
	) {
		this.reset(thisArg);
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
		this.contentType = contentType;
		return this;
	}

	/**
	 * This method is used to set the return code of the transaction.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status | HTTP Status Codes}	 * @param contentType The content type of the data sent to the user
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
	public reset(thisArg: any): TransactionManager {
		this.contentType = 'text/plain';
		this.retcode = 200;
		this.thisArg = thisArg;
		return this;
	}

	/**
	 * @deprecated
	 * This method is used to get the status code. It will be replaced by finalizeTransaction
	 * @returns the status code of the transaction
	 */
	public getStatusCode(): number {
		return this.retcode;
	}

	/**
	 * @deprecated
	 * This method is used to get the content type. It will be replaced by finalizeTransaction
	 * @returns the content type of the transaction
	 */
	public getContentType(): MessageType {
		return this.contentType;
	}

	/**
	 * This method will apply all saved information to the transaction
	 * @param res the transaction that will be modified by the content of this transaction manager
	 * @returns the modified transaction
	 */
	public finalizeTransaction(res: Response): Response {
		return res.set('Content-Type', this.contentType).status(this.retcode);
	}
}
