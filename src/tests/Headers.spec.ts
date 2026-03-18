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

import {
	AutoMap,
	ContentType,
	CreamSerializers,
	ExpressApplication,
	ExpressController,
	ExpressErrorHandler,
	ExpressModule,
	Get,
	HeaderBuilder,
	HttpReturnCode,
	Serializable,
	Transform,
	StaticResponseHeader,
	SetCookie,
	DynamicCookie,
	CookieTimeFrame,
} from '..';

import express, { Response, Request, Express } from 'express';

import { HeadersManager } from '../HttpUtils/Headers/HeadersManager';
import supertest from 'supertest';

@(StaticResponseHeader('Accept-Language').Set('en-US'))
@(StaticResponseHeader('Accept-Encoding').Append('utf-8'))
@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class View {
	@Transform((data: string) => {
		data[0]!.toUpperCase();
		return data;
	})
	@AutoMap
	ciao: string = 'ciao';
}

@SetCookie('cookie1', 'value1', {
	MaxAge: (timeFrame: CookieTimeFrame) =>
		timeFrame.fromNow().willEndIn(3600 * 1000),
	Domain: 'localhost',
})
@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class StaticCookiesView {
	@AutoMap
	test1: string = 'test';
}

@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class DynamicCookiesView {
	@DynamicCookie('testCookie', {
		MaxAge: (tf: CookieTimeFrame) => tf.fromNow().willEndIn(1200 * 1000),
	})
	testCookie: string = 'value1';

	@AutoMap
	test1: string = 'test';
}

@ExpressController('/test')
class MockController extends ExpressModule {
	@Get('/predefined-static-header')
	public predefinedStaticHeader(): View {
		return new View();
	}

	@Get('/manual-static-header')
	public manualStaticHeader() {
		let headerBuilder: HeaderBuilder =
			this.prepareTransaction().getHeaderBuilder('Accept-Language');
		headerBuilder.push('en-US');

		return 'ciao2';
	}

	@Get('/get-static-cookies')
	public staticCookies(): StaticCookiesView {
		return new StaticCookiesView();
	}

	@Get('/get-dynamic-cookies')
	public dynamicCookies(): DynamicCookiesView {
		return new DynamicCookiesView();
	}
}

class CustomVerboseErrorHandler implements ExpressErrorHandler {
	handle(err: Error, _req: Request, res: Response): void {
		console.log(err);
		res.send({ message: err.message, error: err });
	}
}

class MyApp extends ExpressApplication {
	constructor(app: Express, port: number) {
		app.use(express.json());
		super(app, port);

		this.errorHandler = new CustomVerboseErrorHandler();
	}
}

let appInstance: MyApp = new MyApp(express(), 5052);

appInstance.addController(new MockController());

describe('Header Builder & Headers Manager Test Suite', () => {
	it('Should create an empty header builder', () => {
		let builder = new HeaderBuilder();
		expect(builder).toBeDefined();
		expect(builder.length).toBe(0);
	});

	it('Should use the correct separator', () => {
		let builder = new HeaderBuilder(';');
		builder.push('test1');
		builder.push('test2');
		expect(builder.toConcreteHeader()).toBe('test1;test2');
	});

	it('Should create a header manager', () => {
		let manager = new HeadersManager();
		expect(manager).toBeDefined();
	});

	it('Should map the header "Content-Type" to an empty header builder', () => {
		let manager = new HeadersManager();
		manager.set('Content-Type', new HeaderBuilder());
		expect(manager.getAs<HeaderBuilder>('Content-Type')).toBeDefined();
	});

	it('Should retrieve undefined from non defined headers in the headers manager', () => {
		let manager = new HeadersManager();
		expect(manager.getAs<HeaderBuilder>('Accept')).toBeUndefined();
	});
});

describe('Headers In Response Test Suite', () => {
	it('Should start the for the headers', async () => {
		try {
			await appInstance.start();
		} catch (e) {
			fail('Failed to start');
		}
	});

	it('Should return the correct view with the correct headers set', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/test/predefined-static-header'
		);
		expect(res.status).toBe(200);
		expect(res.body.ciao).toEqual('ciao');
		expect(res.get('Accept-Encoding')).toBe('utf-8');
		expect(res.get('Accept-Language')).toBe('en-US');
	});

	it('Should return the correct message with the correct manually set headers', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/test/manual-static-header'
		);
		expect(res.status).toBe(200);
		expect(res.text).toEqual('ciao2');
		expect(res.get('Accept-Language')).toBe('en-US');
	});

	it('Should return the correct message with the correct static cookies', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/test/get-static-cookies'
		);
		expect(res.status).toBe(200);
		expect(res.body.test1).toBe('test');
		expect(res.get('Set-Cookie')).toBeDefined();
		expect(res.get('Set-Cookie')).toHaveLength(1);
		expect(res.get('Set-Cookie')![0]).toContain('cookie1=value1');
		expect(res.get('Set-Cookie')![0]).toContain('HttpOnly');
		expect(res.get('Set-Cookie')![0]).toContain('SameSite');
		expect(res.get('Set-Cookie')![0]).toContain('HttpOnly');
		expect(res.get('Set-Cookie')![0]).toContain('Max-Age=3600000');
	});

	afterAll(async () => {
		await appInstance.stop();
	});
});
