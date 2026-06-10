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

import { Response } from 'express';
import {
	AutoMap,
	ContentType,
	CreamSerializers,
	ExpressMiddleware,
	ExpressModule,
	HttpMethod,
	HttpReturnCode,
	Serializable,
	UseMiddleware,
	ExpressController,
	Body,
	Delete,
	Get,
	Post,
	Put,
	UrlParameter,
	Header,
	MiddlewareReturnData,
	ExtendedRequest,
	MiddlewareData,
	RestError,
	UseMiddlewaresForController,
	RequestCookie,
} from '..';

import {
	BODY_METADATA_KEY,
	COOKIES_METADATA_KEY,
	HEADERS_METADATA_KEY,
	MIDDLEWARE_METADATA_KEY,
	PARAMS_METADATA_KEY,
} from '../ExpressAdapter/ExpressAdapters';

import { ROUTES_METADATA_KEY, Route } from '../HttpUtils/Route';
import { MiddlewareParameterProp } from '../ExpressMiddleware/MiddlewareData';
import { ParameterProp } from '../ExpressAdapter/ParameterProp';

class MockMiddleware extends ExpressMiddleware {
	public behaviour(
		_req: ExtendedRequest,
		_res: Response<any, Record<string, any>>
	): MiddlewareReturnData {
		return new MiddlewareReturnData('myMockedMiddleware', {
			myMiddlewareData: 'string',
			isAppUndefined: this.app == undefined,
		});
	}
}

@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class TestDataView {
	@AutoMap
	testData: string;

	constructor(testData: string) {
		this.testData = testData;
	}
}

@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class TestCall3View {
	@AutoMap
	body: string;

	@AutoMap
	field1: string;

	@AutoMap
	header1: string;

	@AutoMap
	cookie1: string;

	@AutoMap
	middlewareData?: string | undefined;

	constructor(
		body: string,
		field1: string,
		header1: string,
		cookie1: string,
		middlewareData?: string | undefined
	) {
		this.body = body;
		this.field1 = field1;
		this.header1 = header1;
		this.cookie1 = cookie1;
		this.middlewareData = middlewareData;
	}
}

@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class DeleteMethodView {
	@AutoMap
	contentType: string;

	constructor(contentType: string) {
		this.contentType = contentType;
	}
}

@ContentType('application/json')
@HttpReturnCode(200)
@Serializable(CreamSerializers.JSON)
class EmptyJson {}

@UseMiddlewaresForController([new MockMiddleware()])
@ExpressController('test')
class MockController extends ExpressModule {
	@Get('/async-call')
	public async asyncCall() {
		return new TestDataView('test');
	}

	@Get('/sync-call')
	public syncCall() {
		return new TestDataView('sync-test');
	}

	@Get('/test-call-2')
	public testCall2() {
		return 'string';
	}

	@UseMiddleware(new MockMiddleware())
	@Post('/test/:field1')
	public testCall3(
		@Body() data: string,
		@UrlParameter('field1') field1: string,
		@Header('header1') header1: string,
		@RequestCookie('cookie1') cookie1: string,
		@MiddlewareData('myMockedMiddleware', 'myMiddlewareData')
		middlewareData: string | undefined = undefined
	) {
		return new TestCall3View(
			data,
			field1,
			header1,
			cookie1,
			middlewareData
		);
	}

	@Get('/test-3')
	public throwsRestError() {
		throw new RestError('My Message', 404);
	}

	@Delete('delete-route')
	public deleteMethod(@Header('Content-Type') contentType: string) {
		return new DeleteMethodView(contentType);
	}

	@Put('put-route')
	public putMethod() {
		return new EmptyJson();
	}

	public normalMethod() {
		return 'normalData';
	}

	public normalMethodCallingPrepareTransaction() {
		this.prepareTransaction();
	}
}

let mockInstance: MockController;

let routes: Route[];

describe('ExpressController & ExpressMiddleware Test Suite', () => {
	it('Should instanciate a new controller', () => {
		try {
			mockInstance = new MockController();
			expect(mockInstance).toBeDefined();
		} catch (e) {
			expect(e).not.toBeDefined();
		}
	});

	it('Should have the correct data set', () => {
		expect(mockInstance.className).toBe('MockController');
		expect(mockInstance.middlewareList).toHaveLength(1);
		expect(mockInstance.middlewareList[0]).toBeInstanceOf(MockMiddleware);
	});

	it('Should have 7 routes instanciated (7 out of 8 methods)', () => {
		routes = Reflect.getMetadata(
			ROUTES_METADATA_KEY,
			MockController.prototype
		);

		expect(mockInstance.router).toBeDefined();
		expect(routes).toBeDefined();
		expect(routes).toHaveLength(7);
	});

	it('Should call async methods normally', async () => {
		try {
			let res = await mockInstance.asyncCall();
			expect(res.testData).toBe('test');
		} catch (e) {
			expect(e).not.toBeDefined();
		}
	});

	it('Should call sync methods normally', () => {
		try {
			let res = mockInstance.syncCall();

			expect(res.testData).toBe('sync-test');
		} catch (e) {
			expect(e).not.toBeDefined();
		}
	});

	it('Should return a valid message', () => {
		let res = mockInstance.testCall2();

		expect(res).toBe('string');
	});

	it('Should get parameters by normal calling', () => {
		let res = mockInstance.testCall3(
			'passed-data',
			'fieldData',
			'headerData',
			'cookieData'
		);
		expect(res.body).toBe('passed-data');
		expect(res.field1).toBe('fieldData');
		expect(res.header1).toBe('headerData');
		expect(res.cookie1).toBe('cookieData');
	});

	it('Should fail calling prepareTransaction in a method that is not an endpoint', () => {
		expect(() =>
			mockInstance.normalMethodCallingPrepareTransaction()
		).toThrow();
	});

	it('Should have body, url param, header, cookie and middleware data parameters to be injected', async () => {
		let route = routes.find(
			(route: Route) => route.methodName == 'testCall3'
		);

		expect(route).toBeDefined();

		expect(route!.methodName).toBe('testCall3');
		expect(route!.httpMethod).toBe(HttpMethod.POST);

		let bodyFields: ParameterProp[] = Reflect.getMetadata(
			BODY_METADATA_KEY,
			MockController.prototype,
			route!.methodName
		);

		let urlParams: ParameterProp[] = Reflect.getMetadata(
			PARAMS_METADATA_KEY,
			MockController.prototype,
			route!.methodName
		);

		let headerParams: ParameterProp[] = Reflect.getMetadata(
			HEADERS_METADATA_KEY,
			MockController.prototype,
			route!.methodName
		);

		let cookieParams: ParameterProp[] = Reflect.getMetadata(
			COOKIES_METADATA_KEY,
			MockController.prototype,
			route!.methodName
		);

		let middlewareParams: MiddlewareParameterProp[] = Reflect.getMetadata(
			MIDDLEWARE_METADATA_KEY,
			MockController.prototype,
			route!.methodName
		);

		expect(bodyFields).toHaveLength(1);
		expect(urlParams).toHaveLength(1);
		expect(middlewareParams).toHaveLength(1);
		expect(bodyFields[0]!.name).toBe(':body');
		expect(urlParams[0]!.name).toBe('field1');
		expect(headerParams[0]!.name).toBe('header1');
		expect(cookieParams[0]!.name).toBe('cookie1');
		expect(middlewareParams[0]!.collection).toBe('myMockedMiddleware');
		expect(middlewareParams[0]!.name).toBe('myMiddlewareData');
	});

	it('Should throw RestError', () => {
		expect(mockInstance.throwsRestError).toThrow(RestError);
	});

	it('Should throw error while decorating a non ExpressCall method', () => {
		try {
			class FailingMock extends ExpressModule {
				@UseMiddleware(new MockMiddleware())
				throwsError() {}
			}
			new FailingMock();
		} catch (e) {
			expect(e).toBeDefined();
		}
	});

	it('Should create an ExpressModule with no middlewares', () => {
		class NoMiddlewares extends ExpressModule {}

		let noMiddlewareInstance = new NoMiddlewares();

		expect(noMiddlewareInstance.middlewareList).toHaveLength(0);
	});
});
