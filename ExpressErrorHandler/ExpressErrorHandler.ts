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

import { Response, Request } from 'express';

export class RestError extends Error {
	constructor(message: string, public readonly statusCode: number) {
		super(message);
	}
}

/**
 * This interface is populated with the thrown error and the correct http status code
 */
export interface ErrorInfo {
	/**
	 * The generated error
	 */
	err: Error;

	/**
	 * The http status code
	 */
	status: number;
}

/**
 * This interface is used to handle runtime exceptions
 */
export interface ExpressErrorHandler {
	/**
	 * @description This method is called whenever an exception is thrown
	 *
	 */
	handle(err: Error, req: Request, res: Response): void;
}
