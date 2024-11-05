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
import { ExpressMiddleware, ExpressModule, Message, UseMiddleware } from '..';
import {
	BODY_METADATA_KEY,
	Body,
	ExpressCall,
	ExpressController,
	Header,
	MIDDLEWARE_METADATA_KEY,
	PARAMS_METADATA_KEY,
	UrlParameter,
} from '../ExpressAdapter/ExpressAdapters';
import {
	ExtendedRequest,
	MiddlewareReturnData,
} from '../ExpressMiddleware/ExpressMiddleware';
import { ROUTES_METADATA_KEY, Route } from '../HttpUtils/Route';
import {
	MiddlewareData,
	MiddlewareParameterProp,
} from '../ExpressMiddleware/MiddlewareData';
import { ParameterProp } from '../ExpressAdapter/ParameterProp';
import { RestError } from '../ExpressErrorHandler/ExpressErrorHandler';
import { UseMiddlewaresForController } from '../ExpressMiddleware/UseMiddleware';
import { HttpMethod } from '../HttpUtils/HttpMethod';

class MockMiddleware extends ExpressMiddleware {
	public behaviour(
		req: ExtendedRequest,
		res: Response<any, Record<string, any>>
	): MiddlewareReturnData {
		return new MiddlewareReturnData('myMockedMiddleware', {
			myMiddlewareData: 'string',
		});
	}
}

@UseMiddlewaresForController([new MockMiddleware()])
@ExpressController('test')
class MockController extends ExpressModule {
	@ExpressCall('/async-call')
	public async asyncCall() {
		return new Message({ testData: 'test' });
	}

	@ExpressCall('/sync-call')
	public syncCall() {
		return new Message({ testData: 'sync-test' });
	}

	@ExpressCall('/test-call-2')
	public testCall2() {
		return new Message('string', 'text/plain', 400);
	}

	@UseMiddleware(new MockMiddleware())
	@ExpressCall('/test/:field1', HttpMethod.POST)
	public testCall3(
		@Body() data: string,
		@UrlParameter('field1') field1: string,
		@MiddlewareData('myMockedMiddleware', 'myMiddlewareData')
		middlewareData: string | undefined = undefined
	) {
		return new Message({
			body: data,
			field1: field1,
			middlewareData: middlewareData,
		});
	}

	@ExpressCall('/test-3')
	public throwsRestError() {
		throw new RestError('My Message', 404);
	}

	@ExpressCall('delete-route', HttpMethod.DELETE)
	public deleteMethod(@Header('Content-Type') contentType: string) {
		return new Message({ contentType: contentType });
	}

	@ExpressCall('put-route', HttpMethod.PUT)
	public putMethod() {
		return new Message({});
	}

	private normalMethod() {
		return 'normalData';
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

			expect(res.status).toBe(200);
			expect(res.content.testData).toBe('test');
		} catch (e) {
			expect(e).not.toBeDefined();
		}
	});

	it('Should call sync methods normally', () => {
		try {
			let res = mockInstance.syncCall();

			expect(res.status).toBe(200);
			expect(res.content.testData).toBe('sync-test');
		} catch (e) {
			expect(e).not.toBeDefined();
		}
	});

	it('Should return a valid message', () => {
		let res = mockInstance.testCall2();

		expect(res.content).toBe('string');
		expect(res.contentType).toBe('text/plain');
		expect(res.status).toBe(400);
	});

	it('Should get parameters by normal calling', () => {
		let res = mockInstance.testCall3('passed-data', 'fieldData');
		expect(res.content.body).toBe('passed-data');
		expect(res.content.field1).toBe('fieldData');
	});

	it('Should have 3 parameters to be injected', async () => {
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

		let middlewareParams: MiddlewareParameterProp[] = Reflect.getMetadata(
			MIDDLEWARE_METADATA_KEY,
			MockController.prototype,
			route!.methodName
		);

		expect(bodyFields).toHaveLength(1);
		expect(urlParams).toHaveLength(1);
		expect(middlewareParams).toHaveLength(1);
		expect(bodyFields[0].name).toBe(':body');
		expect(urlParams[0].name).toBe('field1');
		expect(middlewareParams[0].collection).toBe('myMockedMiddleware');
		expect(middlewareParams[0].name).toBe('myMiddlewareData');
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
