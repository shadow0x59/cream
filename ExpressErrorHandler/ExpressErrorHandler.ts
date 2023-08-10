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
