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
export { ExpressModule, ExpressModules } from './ExpressAdapter/ExpressModule';
export {
	ExpressController,
	ExpressCall,
	Get,
	Post,
	Put,
	Delete,
	BodyField,
	Body,
	UrlParameter,
	Header,
	RequestCookie,
} from './ExpressAdapter/ExpressAdapters';
export {
	RestError,
	ErrorInfo,
	ExpressErrorHandler,
} from './ExpressErrorHandler/ExpressErrorHandler';
export { MessageType } from './ExchangeUtils/Message';
export { ExpressApplication } from './ExpressApplication';
export { AfterStopHook, BeforeStopHook } from './Hooks';
export {
	ExpressMiddleware,
	AsyncExpressMiddleware,
	MiddlewareDataCollection,
	MiddlewareDataCollections,
	MiddlewareReturnData,
	ExtendedRequest,
} from './ExpressMiddleware/ExpressMiddleware';
export { MiddlewareData } from './ExpressMiddleware/MiddlewareData';
export {
	UseMiddleware,
	UseMiddlewaresForController,
} from './ExpressMiddleware/UseMiddleware';
export { Constructable } from './Utils/Constructable';

export {
	ExpressService,
	ExpressServices,
} from './ExpressService/ExpressService';

export { HttpMethod } from './HttpUtils/HttpMethod';
export { HttpReturnCode } from './HttpUtils/HttpReturnCode';
export { ContentType } from './HttpUtils/ContentType';

export { Serializer, BootstrapSerializer } from './Serializer/Serializer';
export { CreamSerializers } from './Serializer/CommonSerializers';
export { Serializable, AutoMap, MapTo } from './Serializer/Serializable';
export { Meta, SerializerMetaInfo } from './Serializer/SerializerMetaInfo';
export { Transform } from './Serializer/Transform';
export { JSONSerializableArray } from './Serializer/SerializableDataStructures';
export { TransactionManager } from './ExchangeUtils/TransactionManager';

/**
 * Headers related content
 */

export { StaticResponseHeader } from './HttpUtils/Headers/Header';
export {
	HeaderNames,
	NoCookiesHeaderNames,
} from './HttpUtils/Headers/HeadersDef';
export {
	HeaderBuilder,
	HeaderBuilderInterface,
} from './HttpUtils/Headers/HeaderBuilder';

/** Cookies */
export {
	Cookie,
	SameSite,
	CookieOptions,
	RawCookieOptions,
} from './HttpUtils/Cookies/Cookie';
export { SetCookie } from './HttpUtils/Cookies/SetCookie';
export { DynamicCookie } from './HttpUtils/Cookies/DynamicCookie';
export { CookieTimeFrame } from './HttpUtils/Cookies/CookieTimeFrame';
export { ResponseCookieManager } from './HttpUtils/Cookies/ResponseCookiesManager';

/** Errors */
export * from './Errors';
