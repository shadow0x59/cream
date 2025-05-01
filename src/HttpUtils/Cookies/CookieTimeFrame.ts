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

/**
 * Represents a time frame for managing cookie expiration.
 * Provides methods to initialize, set expiration, and retrieve time details.
 */
export class CookieTimeFrame {
	/**
	 * Stores the initialization timestamp.
	 * `undefined` until initialized with `fromNow()`.
	 */
	private _now: number | undefined = undefined;

	/**
	 * Stores the initialization timestamp.
	 * `undefined` until initialized with `fromNow()`.
	 */
	private _final: number | undefined = undefined;

	/**
	 * Initializes the timeframe with the current timestamp.
	 *
	 * @returns The updated `CookieTimeFrame` instance.
	 */
	public fromNow(): CookieTimeFrame {
		if (this._now != undefined) return this;
		this._now = Date.now();
		return this;
	}

	/**
	 * Sets the expiration time in milliseconds, relative to initialization.
	 *
	 * @param milliseconds - The duration from the initialization point.
	 * @returns The updated `CookieTimeFrame` instance.
	 * @throws Error if the timeframe has not been initialized or if milliseconds are negative
	 */
	public willEndIn(milliseconds: number): CookieTimeFrame {
		if (this._now == undefined)
			throw Error(
				'Timeframe has never been initialized, use CookieTimeFrame.fromNow to initialize the timeframe.'
			);
		if (milliseconds < 0) {
			throw Error(
				'The method allows only for forwarding time frames, the end time cannot be in the past!'
			);
		}
		this._final = this._now! + milliseconds;
		return this;
	}

	/**
	 * Ensures that both initialization and expiration values are set.
	 *
	 * @throws Error if the timeframe has not been properly initialized or finalized.
	 */
	private checkIfParamsAreSet(): void {
		if (this._now == undefined)
			throw Error(
				'Timeframe has never been initialized, use CookieTimeFrame.fromNow to initialize the timeframe.'
			);
		if (this._final == undefined)
			throw Error(
				'Timeframe has no defined end, use CookieTimeFrame.willEndIn to finish the timeframe.'
			);
	}

	/**
	 * Retrieves the expiration date as a `Date` object.
	 *
	 * @returns A `Date` object representing the expiration time.
	 * @throws Error if the timeframe has not been properly initialized or finalized.
	 */
	public getEndDate(): Date {
		this.checkIfParamsAreSet();
		return new Date(this._final!);
	}

	/**
	 * Calculates the remaining time in milliseconds until expiration.
	 *
	 * @returns The number of milliseconds until expiration.
	 * @throws Error if the timeframe has not been properly initialized or finalized.
	 */
	public getDeltaTime(): number {
		this.checkIfParamsAreSet();
		return this._final! - this._now!;
	}

	/**
	 * This method is used to get the starting point of the time frame;
	 * @returns
	 */
	public getStartingPoint(): number {
		if (this._now == undefined)
			throw Error(
				'Timeframe has never been initialized, use CookieTimeFrame.fromNow to initialize the timeframe.'
			);
		return this._now;
	}
}
