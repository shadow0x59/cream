/*
 * Copyright 2026 Raul Radu
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

export class ServerAlreadyRunningError extends Error {
	constructor() {
		super('Server is already running');
	}
}

export class StartingServerWhileStoppingError extends Error {
	constructor() {
		super(
			'Server is trying to start while stopping. Wait for the stopping procedure to complete to restart the server.'
		);
	}
}

export class FailedServiceInitializationError extends Error {
	constructor() {
		super('Failed to initialize all the services, see logs for more info.');
	}
}

export class ServerAlreadyStoppedError extends Error {
	constructor() {
		super('Trying to stop a server that is already stopped');
	}
}

export class ServerIsAlreadyStoppingError extends Error {
	constructor() {
		super('Stopping procedure already in progress');
	}
}

export class EmptyControllerError extends Error {
	constructor(controllerName: string) {
		super(
			`Controller ${controllerName} should have at least one rest method (Get, Put, Post, Delete) associated with it`
		);
	}
}

export class AlreadyRegisteredControllerError extends Error {
	constructor(controllerName: string) {
		super(`Controller ${controllerName} is already registered!`);
	}
}

export class AlreadyRegisteredServiceError extends Error {
	constructor(serviceId: string) {
		super(`Service ${serviceId} is already registered!`);
	}
}
