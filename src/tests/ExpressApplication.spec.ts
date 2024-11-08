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

import { ExpressApplication, ExpressMiddleware, ExpressModule } from '..';
import express, { Request, Response } from 'express';
import { ExpressController, Get } from '../ExpressAdapter/ExpressAdapters';
import { UseMiddlewaresForController } from '../ExpressMiddleware/UseMiddleware';
import {
	ExtendedRequest,
	MiddlewareReturnData,
} from '../ExpressMiddleware/ExpressMiddleware';
import { ExpressService } from '../ExpressService/ExpressService';
import { ExpressErrorHandler } from '../ExpressErrorHandler/ExpressErrorHandler';

class MyMockApplication extends ExpressApplication {}

@ExpressController('myRoute')
class FakeController extends ExpressModule {}

@ExpressController('mySecondRoute')
class FakeControllerWithMethods extends ExpressModule {
	@Get('route1')
	public myMethod() {}
}

class MockedMiddleware extends ExpressMiddleware {
	public behaviour(
		req: ExtendedRequest,
		res: Response
	): MiddlewareReturnData<{}> {
		return new MiddlewareReturnData('test-collection', { content: 'test' });
	}
}

@UseMiddlewaresForController([new MockedMiddleware()])
@ExpressController('thirdRoute')
class ControllerWithClassMiddleware extends ExpressModule {
	@Get('myRoute')
	public myMethod() {}
}

@ExpressService.IdentifiedBy('MyId')
class MyService extends ExpressService {
	async init(): Promise<boolean> {
		return true;
	}
}

@ExpressService.IdentifiedBy('MyId')
class WrongService extends ExpressService {
	async init(): Promise<boolean> {
		return false;
	}
}

@ExpressService.IdentifiedBy('failingService')
class FailedService extends ExpressService {
	async init(): Promise<boolean> {
		return false;
	}
}

@ExpressService.IdentifiedBy('throwingService')
class ThrowingService extends ExpressService {
	async init(): Promise<boolean> {
		throw Error('Failed to init');
	}
}

class MyErrorHandler implements ExpressErrorHandler {
	handle(err: Error, req: Request, res: Response): void {
		res.send({
			error: err.message,
		});
	}
}

let expressApp = express();
let mockInstance: MyMockApplication;

let controllerWithMethodsInstance = new FakeControllerWithMethods();

let myServiceInstance: MyService = new MyService();

describe('ExpressApplication Test Suite', () => {
	it('Should construct a new instance of a mocked application', () => {
		mockInstance = new MyMockApplication(expressApp, 5050);
		expect(mockInstance.getExpressApp()).toEqual(expressApp);
	});

	it('Should not add a controller instance with no express calls', () => {
		expect(() =>
			mockInstance.addController(new FakeController())
		).toThrow();
	});

	it('Should add a controller instance with express calls', () => {
		expect(() =>
			mockInstance.addController(controllerWithMethodsInstance)
		).not.toThrow();
		expect(controllerWithMethodsInstance.app).toEqual(mockInstance);
	});

	it('Should throw when trying to add the same controller', () => {
		try {
			mockInstance.addControllers([controllerWithMethodsInstance]);
			fail('Controller should not be added');
		} catch (e) {
			expect(e).toBeDefined();
		}
	});

	it('Should add a controller with class middlewares', () => {
		expect(() =>
			mockInstance.addController(new ControllerWithClassMiddleware())
		).not.toThrow();
	});

	it('Should add a service', () => {
		expect(() =>
			mockInstance.addServices([myServiceInstance])
		).not.toThrow();

		expect(myServiceInstance.app).toEqual(mockInstance);
	});

	it('Should return the service associated with myId', () => {
		let gotService = mockInstance.getService<MyService>('MyId');

		expect(gotService).toEqual(myServiceInstance);
	});

	it('Should not allow me to register a service with the same Id', () => {
		expect(() => mockInstance.addService(new WrongService())).toThrow();
		let gotService = mockInstance.getService<MyService>('MyId');

		expect(gotService).toEqual(myServiceInstance);
	});

	it('Should set the error handler', () => {
		expect(
			() => (mockInstance.errorHandler = new MyErrorHandler())
		).not.toThrow();
	});

	it('Should start', async () => {
		try {
			await mockInstance.start();
		} catch (e) {
			fail('Failed to start');
		}
	});

	it('Should stop', async () => {
		try {
			await mockInstance.stop();
		} catch (e) {
			fail('Failed to stop');
		}
	});

	it('Should add a new service that fails initialization', () => {
		expect(() =>
			mockInstance.addServices([
				new FailedService(),
				new ThrowingService(),
			])
		).not.toThrow();
	});

	it('Should fail to start', async () => {
		try {
			await mockInstance.start();
			fail('It should have not started');
		} catch (e) {}
	});
});
