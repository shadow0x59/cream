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

import { Cookie, CookieTimeFrame, SameSite } from '..';

describe('CookieTimeFrame Test Suite', () => {
	it('Should create a time frame, correctly set start time and end time', () => {
		let tf = new CookieTimeFrame();
		tf.fromNow().willEndIn(1000);
		tf.getStartingPoint();

		expect(() => tf.getDeltaTime()).not.toThrow();
		expect(() => tf.getEndDate()).not.toThrow();
		expect(() => tf.getStartingPoint()).not.toThrow();

		expect(tf.getDeltaTime()).toBe(1000);
		expect(tf.getEndDate()).toStrictEqual<Date>(
			new Date(tf.getStartingPoint() + 1000)
		);
	});

	it('Should create a time frame and throw when trying to set the end time', () => {
		let tf = new CookieTimeFrame();
		expect(() => tf.willEndIn(1000)).toThrow();
	});

	it('Should create a time frame and throw when getting the starting point without being set', () => {
		let tf = new CookieTimeFrame();
		expect(() => tf.getStartingPoint()).toThrow();
	});

	it('Should create a time frame, set the starting point but fail to get the end date because no end point is set', () => {
		let tf = new CookieTimeFrame();
		tf.fromNow();
		expect(() => tf.getEndDate()).toThrow();
		expect(() => tf.getDeltaTime()).toThrow();
	});

	it('Should fail on a negative time displacement', () => {
		let tf = new CookieTimeFrame();
		expect(() => tf.fromNow().willEndIn(-1000)).toThrow();
	});

	it('Should fail to get end time since the time frame was never initialized', () => {
		let tf = new CookieTimeFrame();
		expect(() => tf.getEndDate()).toThrow();
		expect(() => tf.getDeltaTime()).toThrow();
	});

	it('Should not change the starting point after being already inizialized', () => {
		let tf = new CookieTimeFrame();
		tf.fromNow();
		let now = tf.getStartingPoint();
		expect(tf.fromNow().getStartingPoint()).toEqual(now);
	});
});

describe('Cookies Test Suite', () => {
	it('Should construct a cookie with no options', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('name=value');
		expect(bakedCookie).toContain('SameSite=Lax');
		expect(bakedCookie).toContain('HttpOnly');
		expect(bakedCookie).not.toContain('Path');
		expect(bakedCookie).not.toContain('Expires');
		expect(bakedCookie).not.toContain('Max-Age');
		expect(bakedCookie).not.toContain('Partitioned');
		expect(bakedCookie).not.toContain('Domain');
	});

	it('Should construct a cookie with HttpOnly to false', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			HttpOnly: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).not.toContain('HttpOnly');
	});

	it('Should construct a cookie with Partitioned to true', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			Partitioned: true,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('Partitioned');
	});

	it('Should construct a cookie with with Path', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			Path: '/path/like',
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('Path=/path/like');
	});

	it('Should create a cookie with Secure set to false', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			Secure: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).not.toContain('Secure');
	});

	it('Should create a cookie with SameSite to None', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			SameSite: SameSite.None,
			Secure: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('SameSite=None');
	});

	it('Should create a cookie with SameSite to Lax', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			SameSite: SameSite.Lax,
			Secure: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('SameSite=Lax');
	});

	it('Should create a cookie with SameSite to Strict', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			SameSite: SameSite.Strict,
			Secure: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('SameSite=Strict');
	});

	it('Should create a cookie with Partitioned set to true and override Secure false', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			Partitioned: true,
			Secure: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('Partitioned');
		expect(bakedCookie).toContain('Secure');
	});

	it('Should create a cookie with SameSite to None and override Secure false', () => {
		let cookie = Cookie.fromCookieOpts('name', 'value', {
			SameSite: SameSite.None,
			Secure: false,
		});
		let bakedCookie = cookie.bakeCookie();
		expect(bakedCookie).toContain('Secure');
	});
});
