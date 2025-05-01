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
 * These headers are copied from
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers
 */

export type Authentication =
	| 'WWW-Authenticate'
	| 'Authorization'
	| 'Proxy-Authenticate'
	| 'Proxy-Authorization';

export type Caching =
	| 'Age'
	| 'Cache-Control'
	| 'Clear-Site-Data'
	| 'Expires'
	| 'No-Vary-Search';

export type Conditionals =
	| 'Last-Modified'
	| 'ETag'
	| 'If-Match'
	| 'If-None-Match'
	| 'If-Modified-Since'
	| 'If-Unmodified-Since'
	| 'Vary';

export type ConnectionManagement = 'Connection' | 'Keep-Alive';

export type ContentNegotiation =
	| 'Accept'
	| 'Accept-Encoding'
	| 'Accept-Language'
	| 'Accept-Patch'
	| 'Accept-Post';

export type Controls = 'Expect' | 'Max-Forwards';

export type Cookies = 'Cookie' | 'Set-Cookie';

export type CORS =
	| 'Access-Control-Allow-Credentials'
	| 'Access-Control-Allow-Headers'
	| 'Access-Control-Allow-Methods'
	| 'Access-Control-Allow-Origin'
	| 'Access-Control-Expose-Headers'
	| 'Access-Control-Max-Age'
	| 'Access-Control-Request-Headers'
	| 'Access-Control-Request-Method'
	| 'Origin'
	| 'Timing-Allow-Origin';

export type Downloads = 'Content-Disposition';

export type IntegrityDigests =
	| 'Content-Digest'
	| 'Repr-Diges'
	| 'Want-Content-Digest';

export type MessageBodyInformation =
	| 'Content-Length'
	| 'Content-Type'
	| 'Content-Encoding'
	| 'Content-Language'
	| 'Content-Location';

export type Preferences = 'Prefer' | 'Preference-Applied';

export type Proxies = 'Forwarder' | 'Via';

export type RangeRequests =
	| 'Accept-Ranges'
	| 'Range'
	| 'If-Range'
	| 'Content-Range';

export type Redirects = 'Location' | 'Refresh';

export type RequestContext =
	| 'From'
	| 'Host'
	| 'Refer'
	| 'Referrer-Policy'
	| 'User-Agent';

export type ResponseContext = 'Allow' | 'Server';

export type Security =
	| 'Cross-Origin-Embedder-Policy'
	| 'Cross-Origin-Opener-Policy'
	| 'Cross-Origin-Resource-Policy'
	| 'Content-Security-Policy'
	| 'Content-Security-Policy-Report-Only'
	| 'Expect-CT'
	| 'Permission-Policy'
	| 'Reporting-Endpoints'
	| 'Strict-Transport-Security'
	| 'Upgrade-Insecure-Requests'
	| 'X-Content-Type-Options'
	| 'X-Frame-Options'
	| 'X-Permitted-Cross-Domain-Policies'
	//	| 'X-Powered-By' // <-- This is removed due to security issues it can add.
	| 'X-XSS-Protection';

export type FetchMetadataRequest =
	| 'Sec-Fetch-Site'
	| 'Sec-Fetch-Mode'
	| 'Sec-Fetch-User'
	| 'Sec-Fetch-Dest'
	| 'Sec-Purpose'
	| 'Service-Worker-Navigation-Preload';

export type ServerSentEvents = 'Reporting-Endpoints';

export type TransferEncoding = 'Transfer-Encoding' | 'TE' | 'Trailer';

export type WebSockets =
	| 'Sec-WebSocket-Accept'
	| 'Sec-WebSocket-Extensions'
	| 'Sec-WebsSocket-Key'
	| 'Sec-WebSocket-Protocol'
	| 'Sec-WebSocket-Version';

export type Other =
	| 'Alt-Svc'
	| 'Alt-Used'
	| 'Date'
	| 'Link'
	| 'Retry-After'
	| 'Server-Timing'
	| 'Service-Worker'
	| 'Service-Worker-Allowed'
	| 'SourceMap'
	| 'Upgrade'
	| 'Priority';

export type AttributionReporting =
	| 'Attribution-Reporting-Eligible'
	| 'Attribution-Reporting-Register-Source'
	| 'Attribution-Reportin-Register-Trigger';

export type UserAgentClientHints =
	| 'Sec-CH-UA'
	| 'Sec-CH-UA-Arch'
	| 'Sec-CH-UA-Bitness'
	| 'Sec-CH-UA-Form-Factor'
	| 'Sec-CH-UA-Full-Version'
	| 'Sec-CH-UA-Full-Version-List'
	| 'Sec-CH-UA-Mobile'
	| 'Sec-CH-UA-Model'
	| 'Sec-CH-UA-Platform'
	| 'Sec-CH-UA-Platform-Version'
	| 'Sec-CH-UA-WoW64'
	| 'Sec-CH-Prefers-Color-Scheme'
	| 'Sec-CH-UA-Prefers-Reduced-Motion'
	| 'Sec-CH-Prefers-Reduced-Transparency';

export type DeviceClientHints = 'Device-Memory'; // <-- How is this one not a security threat?

export type NetworkClientHints = 'Downlink' | 'ECT' | 'RTT' | 'Save-Data';

export type ClientHints =
	| 'Accept-CH'
	| 'Critical-CH'
	| UserAgentClientHints
	| DeviceClientHints;

export type HeaderNames =
	| Authentication
	| Caching
	| Conditionals
	| ConnectionManagement
	| ContentNegotiation
	| Controls
	| Cookies
	| CORS
	| Downloads
	| IntegrityDigests
	| MessageBodyInformation
	| Preferences
	| Proxies
	| RangeRequests
	| Redirects
	| RequestContext
	| ResponseContext
	| Security
	| FetchMetadataRequest
	| ServerSentEvents
	| TransferEncoding
	| WebSockets
	| Other
	| AttributionReporting
	| ClientHints;

export type NoCookiesHeaderNames = Exclude<HeaderNames, Cookies>;
