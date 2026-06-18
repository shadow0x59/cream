/*
 * Copyright 2024-2026 Raul Radu
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

import express, { Response, Request, Express } from 'express';
import {
	AutoMap,
	CreamSerializers,
	ExpressApplication,
	ExpressMiddleware,
	ExpressModule,
	Serializable,
	UseMiddleware,
	Body,
	BodyField,
	ExpressController,
	Header,
	UrlParameter,
	AsyncExpressMiddleware,
	ExtendedRequest,
	MiddlewareReturnData,
	ExpressErrorHandler,
	RestError,
	MiddlewareData,
	ContentType,
	Get,
	HttpReturnCode,
	Post,
	Meta,
	TransactionManager,
	Cookie,
	SameSite,
	RequestCookie,
	DynamicCookie,
} from '..';

import supertest from 'supertest';
import { SerializerCommon } from '../Serializer/Serializer';

interface AuthData {
	authHeader: string;
}

class MyApp extends ExpressApplication {
	constructor(app: Express, port: number) {
		app.use(express.json());
		super(app, port);
	}
}

class SyncMiddleware extends ExpressMiddleware {
	public behaviour(
		req: ExtendedRequest,
		_res: Response
	): MiddlewareReturnData<{}> {
		let header = req.header('Authorization');

		if (header == undefined) {
			throw new RestError('Missing auth token', 401);
		}

		if (header == 'fail') {
			throw Error('sync-random-error');
		}

		return new MiddlewareReturnData<AuthData>('auth', {
			authHeader: header,
		});
	}
}

class ASyncMiddleware extends AsyncExpressMiddleware<AuthData> {
	public async behaviour(
		req: ExtendedRequest,
		_res: Response
	): Promise<MiddlewareReturnData<AuthData>> {
		let header = req.header('Authorization');

		if (header == undefined) {
			throw new RestError('Missing auth token', 401);
		}

		if (header == 'fail') {
			throw Error('async-random-error');
		}

		return new MiddlewareReturnData<AuthData>('async-auth', {
			authHeader: header,
		});
	}
}

class GenericMiddleware extends ExpressMiddleware {
	public behaviour(
		_req: ExtendedRequest,
		_res: Response
	): MiddlewareReturnData<{}> {
		return new MiddlewareReturnData(undefined, { myContent: 'firstData' });
	}
}

class CascadedGenericMiddleware extends ExpressMiddleware {
	public behaviour(
		_req: ExtendedRequest,
		_res: Response
	): MiddlewareReturnData<{}> {
		return new MiddlewareReturnData(undefined, {
			mySecondContent: 'secondData,app=' + (this.app != undefined),
		});
	}
}

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class FastMessage {
	@AutoMap
	message: string;

	constructor(message: string) {
		this.message = message;
	}
}

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class ThrowinMethodMessage {
	@AutoMap
	auth: string = 'correct';

	@AutoMap
	middleware?: string | undefined;

	constructor(middleware: string | undefined) {
		this.middleware = middleware;
	}
}

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class CascadedMetadataView {
	@AutoMap
	myContent: string;

	@AutoMap
	mySecondContent: string;

	constructor(anyObj: CascadedMetadataView) {
		this.myContent = anyObj.myContent;
		this.mySecondContent = anyObj.mySecondContent;
	}
}

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class WithBodyTestView {
	@Meta(SerializerCommon.Attributes.AutoSerialize)
	@AutoMap
	gotBody: any;

	@AutoMap
	field1: string;

	@AutoMap
	field2?: string | undefined;

	@AutoMap
	param?: string | undefined;

	constructor(
		gotBody: any,
		field1: string,
		field2?: string | undefined,
		param?: string | undefined
	) {
		this.gotBody = gotBody;
		this.field1 = field1;
		this.field2 = field2;
		this.param = param;
	}
}

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class DynamicCookieTest {
	@DynamicCookie('cookie-test', { HttpOnly: true, SameSite: SameSite.Lax })
	public cookie: string = 'test';
}

@ExpressController('/my-route')
class MyController extends ExpressModule {
	@UseMiddleware(new SyncMiddleware())
	@Get('/do-stuff')
	public async doStuff(
		@MiddlewareData('auth', 'authHeader') authHeader: string,
		@MiddlewareData('auth') authData: AuthData
	): Promise<FastMessage> {
		if (authHeader != authData.authHeader) {
			throw new RestError('This should be impossible', 500);
		}

		return new FastMessage('ok');
	}

	@UseMiddleware(new ASyncMiddleware())
	@Get('/do-async')
	public async doAsyncStuff(
		@MiddlewareData('async-auth', 'authHeader') authHeader: string,
		@MiddlewareData('async-auth') authData: AuthData
	) {
		if (authHeader != authData.authHeader) {
			throw new RestError('This should be impossible', 500);
		}

		return new FastMessage('async-ok');
	}

	@Get('/throw/:errorType')
	public async throwingMethod(
		@UrlParameter('errorType') eType: string,
		@MiddlewareData('not-existing', 'dataField')
		middlewareData: string | undefined,
		@Header('Authorization') auth: string
	) {
		if (auth == 'correct') {
			return new ThrowinMethodMessage(middlewareData);
		}

		if (eType == 'rest-error') {
			throw new RestError('Failed on rest error', 405);
		}
		throw Error('random-error');
	}

	@UseMiddleware(new CascadedGenericMiddleware())
	@UseMiddleware(new GenericMiddleware())
	@Get('/generic-collection')
	public genericCall(@MiddlewareData() data: any) {
		return new CascadedMetadataView(data);
	}

	@Post('/with-body')
	public async postWithBodyAndNoParams(
		@UrlParameter('no-param') noParam: string | undefined,
		@Body() body: any,
		@BodyField('field1') field1: string,
		@BodyField('undefinedField') field2: string | undefined
	) {
		return new WithBodyTestView(body, field1, field2, noParam);
	}

	@Get('/plain-text')
	public async getPlainText(): Promise<string> {
		return 'plaintext string';
	}

	@Get('/with-transaction-manager/string')
	public async withTransactionManager(): Promise<string> {
		let transaction: TransactionManager = this.prepareTransaction();

		transaction.ContentType('text/plain').ReturnCode(301);

		return 'ciao';
	}

	@Get('/transaction-manager')
	public transactionManagerTest() {
		let tm = this.prepareTransaction();
		tm.ContentType(undefined);
		tm.ReturnCode(undefined);

		return 'test';
	}

	@Get('/dynamic-cookie')
	public setDynamicCookie(): DynamicCookieTest {
		return new DynamicCookieTest();
	}

	@Get('/set-cookie')
	public setCookie(): string {
		let tm = this.prepareTransaction();
		tm.getResponseCookiesManager().push(
			new Cookie('test-cookie', 'test-cookie-value', {
				HttpOnly: false,
				SameSite: SameSite.None,
				Secure: false,
				Partitioned: false,
			})
		);

		return 'Ok';
	}

	@Get('/get-cookie')
	public getCookie(
		@RequestCookie('test-cookie') testCookie: string
	): boolean {
		return testCookie === 'test-cookie-value';
	}
}

class CustomErrorHandler implements ExpressErrorHandler {
	handle(err: Error, _req: Request, res: Response): void {
		res.send({ message: err.message });
	}
}

class CustomVerboseErrorHandler implements ExpressErrorHandler {
	handle(err: Error, _req: Request, res: Response): void {
		console.log(err);
		res.send({ message: err.message, error: err });
	}
}

let appInstance: MyApp = new MyApp(express(), 5051);

appInstance.addController(new MyController());

describe('Testing parameter binding and middlewares running', () => {
	it('Should start the application', async () => {
		try {
			await appInstance.start();
		} catch (e) {
			fail('Failed to start');
		}
	});

	it('Should fail on sync middleware without custom error handler', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/do-stuff'
		);
		expect(res.status).toBe(401);
		expect(res.body).toBeDefined();
	});

	it('Should add custom error handler', () => {
		appInstance.errorHandler = new CustomErrorHandler();
	});

	it('Should fail on async middleware wuth custom error handler', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/do-async'
		);
		expect(res.status).toBe(401);
		expect(res.body.message).toEqual('Missing auth token');
	});

	it('Should forcefully fail on sync middleware', async () => {
		let res = await supertest(appInstance.getExpressApp())
			.get('/my-route/do-stuff')
			.set('Authorization', 'fail');
		expect(res.status).toBe(500);
		expect(res.body.message).toEqual('sync-random-error');
	});

	it('Should forcefully fail on async middleware', async () => {
		let res = await supertest(appInstance.getExpressApp())
			.get('/my-route/do-async')
			.set('Authorization', 'fail');
		expect(res.status).toBe(500);
		expect(res.body.message).toEqual('async-random-error');
	});

	it('Should fulfill request on sync middleware', async () => {
		let res = await supertest(appInstance.getExpressApp())
			.get('/my-route/do-stuff')
			.set('Authorization', 'not-fail');
		expect(res.status).toBe(200);
		expect(res.body.message).toEqual('ok');
	});

	it('Should fulfill request on async middleware', async () => {
		let res = await supertest(appInstance.getExpressApp())
			.get('/my-route/do-async')
			.set('Authorization', 'not-fail');
		expect(res.status).toBe(200);
		expect(res.body.message).toEqual('async-ok');
	});

	it('Should be forced to throw random error and return 500', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/throw/other'
		);
		expect(res.status).toBe(500);
		expect(res.body.message).toBeDefined();
	});

	it('Should be forced to throw rest error and return 405', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/throw/rest-error'
		);
		expect(res.status).toBe(405);
		expect(res.body.message).toBeDefined();
	});

	it('Should not throw on correct header and return 200', async () => {
		let res = await supertest(appInstance.getExpressApp())
			.get('/my-route/throw/any')
			.set('Authorization', 'correct');
		expect(res.status).toBe(200);
		expect(res.body.auth).toBe('correct');
		expect(res.body.middleware).toBeUndefined();
	});

	it('Should have data written from 2 middlewares in general colleciton', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/generic-collection'
		);
		expect(res.status).toBe(200);
		expect(res.body.myContent).toBeUndefined();
		expect(res.body.mySecondContent).toBe('secondData,app=true');
	});

	it('Should not throw on sent data and return body with the correct missing information', async () => {
		let dataToBeSent = {
			field1: 'myString',
		};

		let res = await supertest(appInstance.getExpressApp())
			.post('/my-route/with-body')
			.set('Content-Type', 'application/json')
			.send(dataToBeSent);
		expect(res.status).toBe(200);
		expect(res.body.gotBody).toEqual(dataToBeSent);
		expect(res.body.field1).toBe('myString');
		expect(res.body.field2).toBeUndefined();
		expect(res.body.param).toBeUndefined();
	});

	it('Should not throw on unsent data and should return undefined body properties', async () => {
		let res = await supertest(appInstance.getExpressApp())
			.post('/my-route/with-body')
			.set('Content-Type', 'application/json');

		expect(res.status).toBe(200);
		expect(res.body.field1).toBeUndefined();
		expect(res.body.field2).toBeUndefined();
		expect(res.body.param).toBeUndefined();
	});

	it('Should return a plain text with default content type as plain/text and status code 200', async () => {
		appInstance.errorHandler = new CustomVerboseErrorHandler();

		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/plain-text'
		);

		expect(res.status).toBe(200);
		expect(res.header['content-type']).toContain('text/plain');
		expect(res.text).toEqual('plaintext string');
	});

	it('Should return a plain text with 301 return code', async () => {
		appInstance.errorHandler = new CustomVerboseErrorHandler();

		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/with-transaction-manager/string'
		);

		expect(res.status).toBe(301);
		expect(res.header['content-type']).toContain('text/plain');
		expect(res.text).toEqual('ciao');
	});

	it('Should keep standard configuration when undefined is passed to transaction manager', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/transaction-manager'
		);
		expect(res.status).toBe(200);
		expect(res.header['content-type']).toContain('text/plain');
		expect(res.text).toEqual('test');
	});

	it('Should set a dynamic cookie', async () => {
		let superTestInstance = supertest.agent(appInstance.getExpressApp());
		let res = await superTestInstance.get('/my-route/dynamic-cookie');
		expect(res.status).toBe(200);
		expect(res.header['content-type']).toContain('application/json');
		expect(res.body).toStrictEqual({});
		expect(res.header['set-cookie']).toHaveLength(1);
		expect(res.header['set-cookie']![0]).toContain('cookie-test');
		expect(res.header['set-cookie']![0]).toContain('test');
	});

	it('Should set a cookie to the client and then retreive it later', async () => {
		let superTestInstance = supertest.agent(appInstance.getExpressApp());
		let res = await superTestInstance.get('/my-route/set-cookie');
		expect(res.status).toBe(200);
		expect(res.header['content-type']).toContain('text/plain');
		expect(res.text).toEqual('Ok');
		expect(res.header['set-cookie']).toHaveLength(1);
		expect(res.header['set-cookie']![0]).toContain('test-cookie');
		expect(res.header['set-cookie']![0]).toContain('test-cookie-value');

		let cookieString = res
			.get('Set-Cookie')!
			.reduce(
				(cookieString, item) =>
					(cookieString += item.split(';')[0] + ';'),
				''
			);
		cookieString = cookieString.slice(0, -1);

		res = await superTestInstance
			.get('/my-route/get-cookie')
			.set('Cookie', cookieString);
		expect(res.status).toBe(200);
		expect(res.header['content-type']).toContain('text/plain');
		expect(res.text).toEqual('true');
	});

	it('Should have undefined in cookie value since cookie header is not set', async () => {
		let res = await supertest(appInstance.getExpressApp()).get(
			'/my-route/get-cookie'
		);
		expect(res.status).toBe(200);
		expect(res.header['content-type']).toContain('text/plain');
		expect(res.text).toEqual('false');
	});

	it('Should stop', async () => {
		try {
			await appInstance.stop();
		} catch (e) {
			fail('Should have stopped!');
		}
	});
});
