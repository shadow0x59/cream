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

/**
 * This interface defines a hook that is run after the listening node server
 * stops listening for incoming requests. It is useful, for example, to
 * close database connections.
 */
export interface AfterStopHook {
	afterStop(): Promise<void>;
}

/**
 * This interface defines a hook that is run just before the listening node server
 * stops listening for incoming requests. It is useful to check for incoming requests
 * and start rejecting them.
 */
export interface BeforeStopHook {
	beforeStop(): Promise<void>;
}
