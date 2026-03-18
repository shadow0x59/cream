![GitLab License](https://img.shields.io/gitlab/license/worklog1%2Fcream)
![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/worklog1%2Fcream?branch=master)
![NPM Downloads](https://img.shields.io/npm/dy/%40creamapi%2Fcream)
![GitLab Issues](https://img.shields.io/gitlab/issues/open/worklog1%2Fcream)
![GitLab Contributors](https://img.shields.io/gitlab/contributors/worklog1%2Fcream)
![NPM Version](https://img.shields.io/npm/v/%40creamapi%2Fcream)

<a href="https://www.buymeacoffee.com/shadow0x59" target="_blank"><img heigth="60" src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="width: 115px !important; height: 30px !important;" ></a>

# Cream - A Library For Semi-Declarative REST API Creation

Cream stands for Concise REST API Maker and it is a ExpressJS extension mainly targeting TypeScript builds.
It wasn't tested on plain JS.

### Contents

-   [Installation](#installation)
-   [Usage](#usage)
    -   [Index](#index)
    -   [API Documentation](#documentation)
    -   [First Steps](#first-steps)
    -   [Handling Complex Objects](#handling-complex-objects)
        -   [Handling data coming from the client](#handling-data-coming-from-the-client)
        -   [Returning complex objects](#returning-complex-objects)
    -   [Continuing](#continuing)
-   [Comparison with Express](#comparing-it-with-express)
-   [Contributors](#contributors)
-   [Donations](#donations)

# Installation

If express is not installed:

```bash
npm install express @types/express @creamapi/cream
```

If you've already installed exprees:

```bash
npm install @creamapi/cream
```

# Usage

> Note: These examples use TypeScript, in order to follow them please setup a TS project.
> Also you need to have experimental decorators on in your tsconfig.

To create your own API with Cream it is easy! You just need to setup a few things then you can play with it with ease.

## Index

-   [API Documentation](#documentation)
-   [First Steps](#first-steps)
-   [Handling Complex Objects](#handling-complex-objects)
    -   [Handling data coming from the client](#handling-data-coming-from-the-client)
    -   [Returning complex objects](#returning-complex-objects)
-   [Headers](#headers)
-   [Cookies](#cookies)
-   [Services](#services)
-   [Continuing](#continuing)

## Documentation

For full API documentation follow this link: [Cream API Documentation](https://worklog1.gitlab.io/cream/).

## First Steps

As a first step it is required to create an ExpressApplication like this:

File: _index.ts_

```ts
import "express" from express;
import { ExpressApplication } from "@creamapi/cream";

class MyCustomApplication extends ExpressApplication {
	public constructor() {
		let expressApp = express();
		/*
			here you can use any express middleware like cors, json, bodyParser
		*/
		expressApp.use(express.json());

		// We want our service to listen to port 4040
		super(expressApp, 4040);
	}
}

let myCustApp = new MyCustomApplication();
myCustApp.start();
```

If we try to run it we will see

```bash
Listening on 4040
```

But our API like this is useless, we need a controller to handle the requests!  
Let's create a controller that when visiting http://localhost:4040/hello-world returns `Hello, World!` on the screen.

File: _HelloController.ts_

```ts
import { ExpressController, Get } from '@creamapi/cream';

@ExpressController('/')
export class HelloController extends ExpressModule {
	@Get('/hello-world')
	public helloPrinter(): string {
		return 'Hello, World!';
	}
}
```

and back in _index.ts_

```ts
import "express" from express;
import { ExpressApplication } from "@creamapi/cream";
import { HelloController } from "./HelloController";

class MyCustomApplication extends ExpressApplication {
	public constructor() {
		let expressApp = express();
		/*
			here you can use any express middleware like cors, json,   bodyParser, morgan, etc.
		*/
		expressApp.use(express.json());

		// We want our service to listen to port 4040
		super(expressApp, 4040);

		// now we can add our controller here
		this.addController(new HelloController());
	}
}

let myCustApp = new MyCustomApplication();
myCustApp.start();
```

Now if we go to https://localhost:4040/hello-world we will see
`Hello, World!` written in our browser!

### One small step

Finally, for a very simpe REST API, the only thing missing is some way to tell the user the status of our transaction.  
Cream currently supports only setting the content type and the return code. Other information like cookies will be available soon.  
How to set this kind of information though? We don't have access to the transaction (or response), we can only accept requests and send
response data.

There is a perfect tool for this job: `ExpressModule.prepareTransaction()`. This method will return an object that allows us to set some information
about the transaction with ease! BEWARE: This method will throw an error when it is used outside a method that is not decorated as @Get @Put @Post or @Delete!  
Lets see how to use it by editing the previous _HelloController.ts_:

File: _HelloController.ts_

```ts
import { ExpressController, Get, TransactionManager } from '@creamapi/cream';

@ExpressController('/')
export class HelloController extends ExpressModule {
	@Get('/hello-world')
	public helloPrinter(): string {
		TransactionManager manager = this.prepareTransaction();
		manager.ContentType('application/json').StatusCode(200);
		return '{"hello": "world!"}';
	}
}
```

Now if we open again https://localhost:4040/hello-world we will see a JSON object.

## Handling complex objects

Sending a string to the browser is cool, but REST APIs are more complex than this.  
They can receive data as a request and give a complex response, like a JSON text.

### Handling data coming from the client

Let's reuse the last example, but this time we want to get a string from the client and write it on the screen. For this example, to keep it simple, we will use a Get request again, but this time we will use a UrlParameter to retrive the data.  
What does it mean? It means that when the user makes a request to http://localhost:4040/hello-world/\<data\> we want to get the value of \<data\> and write it back to the user.  
Since **Cream** uses _ExpressJS_ as the base library we have to stick to their language, this means that our endpoint will be defined like this: `https://localhost:4040/hello-world/:userString`. Now let's implement it in Cream:

File: _HelloController.ts_

```ts
import { ExpressController, Get } from '@creamapi/cream';

@ExpressController('/')
export class HelloController extends ExpressModule {
	@Get('/hello-world/:userData')
	public helloPrinter(@UrlParameter('userData') userData: string): string {
		return userData;
	}
}
```

Now if we try to go to http://localhost:4040/hello-world/my%20hello we will see
`my hello` written in our browser!

### Returning complex objects

Now we want to return a json object containing both our string and its length. To do so we must create a custom class that contains such data and tell cream that we want to serialize it to JSON. We can do it like this:

File: _HelloView.ts_

```ts
import {
	Serializable,
	CreamSerializers,
	AutoMap,
	MapTo,
	HttpReturnCode,
	ContentType,
	Transform,
} from '@creamapi/cream';

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class HelloView {
	@AutoMap
	get stringLength(): number {
		return this.stringData.length;
	}

	@MapTo('userData')
	public stringData: string;

	@Transform((data: number) => data.toString(2))
	@MapTo('binaryNum')
	dataNum: number = 2;

	otherData: number;

	constructor(userString) {
		this.stringData = stringData;
	}
}
```

Here we can see that we tell cream that HelloView is serializable by a JSON serializer, the return content type is application/json and that the http return code is 200.

We also see AutoMap and MapTo, these two decorators are used to declare which fields are serialized.

> Non-decorated fields, like otherData, are not serialized by default.  
> This behaviov is helpful to prevent unwanted dataleaks. With a serialize
> all by default behavior a secure field can be leaked, for example the user's password.

> The difference between MapTo and AutoMap is that MapTo allows us to specify the name of the field whilst AutoMap will take the name of the decorated attribute.

We can see that we can also serialize getters. This allows us to compute dynamically stuff when the object is serializable. Also, `this` correctly points to the correct object.

It is also possible for us to transform data before it being serialized!

> Transform will not affect the transformed data  
> Multiple transforms can be applied, just know that they are applied in a bottom-up approach

Now we want to use our custom data. As before let's reuse the last example as a base:

```ts
import { ExpressController, Get } from '@creamapi/cream';
import { HelloView } from './HelloView';

@ExpressController('/')
export class HelloController extends ExpressModule {
	@Get('/hello-world/:userData')
	public helloPrinter(@UrlParameter('userData') userData: string): HelloView {
		return new HelloView(userData);
	}
}
```

Now if we go again to http://localhost:4040/hello-world/my%20hello we will not see
`my hello` written in our browser, but we will see a JSON object like this:

```json
{
	"stringLength": 8,
	"userData": "my hello",
	"binaryNum": "10"
}
```

## Headers

HTTP Requests and Responses are characterized not only by a body and a URL but also by headers that are fundamental for the transmission. Such headers include Content-Length that is a must-have in order for the receiver to fully parse the data.

Some headers are automatically computed by Express (which Cream is based on) like Content-Length, but others can be set by the programmer, like Authorization or [Cookies](#Cookies).

The client sends headers, too, in fact Authorization is generally sent by the client and then consumed by the server.

### Reading request headers

The API to read headers sent by client is pretty much straigthforward. Since generally a functionality is dependant on the header value it can be seen as a input to such functionality. In programming passing inputs to a function is done with function parameters thus the header will be mapped to the desired parameter, like UrlParameter works.

For example now we will get the Authorization header that is set by the client:

```ts
import { ExpressController, Get } from '@creamapi/cream';

@ExpressController('/')
export class HelloController extends ExpressModule {
	@Get('/hello-header')
	public helloPrinter(
		@Header('Authorization') authorization: string
	): string {
		return 'Authorization:' + authorization;
	}
}
```

### Writing headers to the client

> This feature is available only for Cream 1.4.0+

Writing headers to the client is a bit more difficult than reading them. Headers are generally bound to data thus in Cream response headers are set in a view like `class HelloView`. In fact lets rewrite it to use headers:

File: _HelloView.ts_

```ts
import {
	Serializable,
	CreamSerializers,
	AutoMap,
	MapTo,
	HttpReturnCode,
	ContentType,
	Transform,
} from '@creamapi/cream';

@(StaticResponseHeader('Accept-Encoding').Set('gzip'))
@(StaticResponseHeader('Accept-Encoding').Append('deflate'))
@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class HelloView {
	@AutoMap
	get stringLength(): number {
		return this.stringData.length;
	}

	@MapTo('userData')
	public stringData: string;

	@Transform((data: number) => data.toString(2))
	@MapTo('binaryNum')
	dataNum: number = 2;

	otherData: number;

	constructor(userString) {
		this.stringData = stringData;
	}
}
```

Static headers can be set in two ways that can be both seen in the example above:

-   `StaticResponseHeader.Set`: sets a unique value to the header overwriting old data.
-   `StaticResponseHeader.Append`: appends a value to the header treating it as an array.

> Setting headers dynamically is not supported yet, but it is planned in the near future.

## Cookies

> This feature is available only for Cream 1.4.0+

Now we want to save some data onto the user machine for later use; in web there are a few tecniques to accomplish such task, beginning from the newest we have:

-   **IndexedDB**: which is used to store a lot of complex and structured data directly on the client (for example, to implement an offline application that stores all the requests that will be processed once the application goes online);
-   **Web Storage**: that is divided in localStorage (for persistent user data) and sessionStorage (for session data only, that will be deleted once the session has ended);
-   **_Cookies_**: the classic method to set data onto the user machine.

> The first two techniques while more modern require a complex frontend to be used and data cannot be directly controlled by the server. Cookies do not require any code on the frontend since they are automatically managed by the browser.
>
> This and the fact that cookies are widely used to manage user sessions and tracking information (and well, they are defined by the HTTP standard) made me implement a complete, secure and explicit by design Cookie API.

Now we will use the previous example and add cookies logic to set some data on the client's machine (browser to be correct) then retrieve such data and use it for processing.

File: _HelloView.ts_

```ts
import {
	Serializable,
	CreamSerializers,
	AutoMap,
	MapTo,
	HttpReturnCode,
	ContentType,
	Transform,
	SetCookie,
	DynamicCookie,
} from '@creamapi/cream';

@SetCookie('static-cookie', 'static-data', {
	MaxAge: (timeFrame: CookieTimeFrame) =>
		timeFrame.fromNow().willEndIn(3600 * 1000), // Will end in 1h
	Domain: 'localhost',
})
@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class HelloView {
	@AutoMap
	get stringLength(): number {
		return this.stringData.length;
	}

	@MapTo('userData')
	public stringData: string;

	@Transform((data: number) => data.toString(2))
	@MapTo('binaryNum')
	dataNum: number = 2;

	@DynamicCookie('testCookie', {
		MaxAge: (tf: CookieTimeFrame) => tf.fromNow().willEndIn(1200 * 1000),
	})
	cookie: string = 'changable-value';

	otherData: number;

	constructor(userString) {
		this.stringData = stringData;
		this.cookie = stringData + ' as cookie';
	}
}
```

We can see in this example that there are two types of cookies, `SetCookie` and `DynamicCookie`.

### SetCookie

`SetCookie` is used when we want to set a static cookie that is invariant from the data exchanged by the user, _for example a randomly generated session ID cookie_.

### DynamicCookie

`DynamicCookie` is used when the data stored changes with the user's request, _for example a shopping cart that can change when a user adds an item to it or removes an item from it_. In this case

Cookies (either static or dynamic) have many options to be set: `Path`, `MaxAge`, `Domain`, `Secure`, `HttpOnly`, `SameSite`, `Partitioned`. See the Cookie documentation for further detail, along with the [MDN documentation on Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies).

### A word on MaxAge and Expires

A experienced developer will notice that `Expires` is missing, this is due to the fact that it is not suggested to use it and modern browsers will prefer `MaxAge` over it even if both are set. `Expires` uses dates to tell the client when the cookie expires and such dates are generally relative to the server timezone thus the client receives a wrong expiry date.  
`MaxAge` instead uses milliseconds to tell the client in how much time the cookie will expire, ignoring timezones and providing more precise timings.

> Cream will set both to provide compatibility with older browsers whilst modern browsers will just ignore `Expires` and will use `MaxAge` by default.

To set `MaxAge` and to provide correct timings the user cannot set delta time immediately, like in the example the user must use a lambda function that takes a CookieTimeFrame as an argument, a helper class that is used to provide a starting time and an expiry in delta.

## Services

Services are a collection of, well, services that are globally available within the application. The concept of a `service` in Cream can be defined as:

-   **a component that is used to interconnect controllers**. For example lets think of a waiting queue, a matchmaking process;
-   **a component that provides functionality throughout the hole API**, like a user service that provides database access to user data for the whole API, a service to generate and verify JWT tokens or simply a logging service;
-   **a component that manages connections with external actors**, like a Rabbit MQ broker or a service that manages DB connections;
-   in general anything that needs to be globally accessible and shareable.

To understand better the usage of services and to see a clear example on how Cream works please refer to the next chapter.

## A simple use case of Cream

Now let's ditch over what we have built so far and let's implement an application that is a bit more complex, _just enough to make a clear example on how to use Cream_.

> Please note that this is not only the intended way to use Cream, your creativity is the only limit ... and Javascript 😃

We want to build a pull based chat system, this means that the user will receive the messages only when they explicitly request the API. The reason is that this is not a tutorial on how to use a WebSocket to build a chatting system so we have to stick with pull-based HTTP requests.

To create the system we need:

1. an authentication system to provide identity to users;
2. a chatting mechanism to allow users to chat;
3. ideally a way to make chats persistent.

We can skip point 3 since it is more of a storage issue rather than an API issue and there a new set of problems involving that part which are not covered by Cream (databases exist for a reason).

### User Management and Authentication

Point 1 can get complex so we simplify things a little bit, but before going on with the example please read carefully the following:

> DISCLAIMER: DO NOT TAKE THIS TUTORIAL AS GOOD PRACTICE FOR AUTHENTICATION AND AUTHORIZATION PROTOCOLS AND POLICIES, THIS IS JUST A OVERSEMPLIFICATION OF WHAT A REAL AUTHENTICATION SYSTEM SHOULD BE, BUILT ONLY FOR EDUCATIONAL PURPOSES. **_NONE OF THE AUTHORS NOR THE CONTRIBUTORS TAKE ANY RESPONSIBILITY IN HARMFUL RESULTS OF USING THE FOLLOWINIG CODE IN PRODUCTION ENVIRONMENTS_**

We can build a simple authentication system that just allows the users to register and store eveything in memory (username and password). For the login part we can just return the user id if the login is successful, otherwise we can return a 401 Unauthorized message.

File: _user.service.ts_

```ts
import {
	ExpressService,
	RestError,
	CreamSerializers,
	Serializable,
	HttpReturnCode,
	AutoMap,
} from '@creamapi/cream';

@Serializable(CreamSerializers.JSON)
@HttpReturnCode(200)
export class UserData {
	constructor(userId: number, username: string, password: string) {
		this.userId = userId;
		this.username = username;
		this.password = password;
		this.newMessages = 0;
	}

	@AutoMap
	public userId: number;

	@AutoMap
	public username: string;

	private password: string; // we don't want to be visible when we fetch the user information

	public bool matchesPassword(pwd: string): boolean {
		return this.password == password;
	}

	@AutoMap
	newMessages: number;
}

@ExpressService.IdentifiedBy('my-user-service')
export class UserService extends ExpressService {
	private usersMap: Map<string, UserData>;
	private userIdInc: number;

	constructor() {
		this.usersMap = new Map<string, UserData>();
		this.userIdInc = 0;
	}

	async init(): Promise<boolean> {
		return true;
	}

	public registerUser(username: string, password: string): UserData {
		if (this.usersMap.get(username)) {
			throw new RestError('Username already registered', 400);
		}

		this.usersMap.set(
			username,
			new UserData(this.userIdInc++, username, password)
		);

		return this.usersMap.get(username)!;
	}

	public loginUser(username: string, password: string): UserData {
		let userData: UserData | undefined = this.usersMap.get(username);
		if (userData == undefined) {
			throw new RestError('Unable to find user', 404);
		}

		if (!userData!.matchesPassword(password)) {
			throw new RestError('Invalid password', 401);
		}

		return userData!;
	}

	public getUserFromId(userId: string): UserData {
		for (let [username, user] of this.usersMap) {
			if (user.userId == userId) return user;
		}

		throw new RestError(
			'User with id ' + userId + ' could not be found',
			500
		);
	}
}
```

> A side note: in this example concurrency is not managed in any way. because this is a tutorial and has to be kept simple plus there are no synchronization primitives in TS/JS by default. I am tempted to implement them by myself, but there is already a library doing it, [async-ts](https://www.npmjs.com/package/async-ts), I haven't used it yet so I cannot give any reccomentadion for it, nor say anything bad about it.

This is a good example of how to create a service in Cream. In general we need two main things: our class has to extend `ExpressService` and then we have to identify this class by a unique identifier with `ExpressService.IdenfitiedBy` decorator.

The reason for having to manually put the identifier is for having a bit of control over the service system, for example when testing it is useful to have a mock instance of a service that replaces the original, without changing the application code.

`ExpressService` requires that the `class` extending it defines the method `init()` _which is by default asynchronous, even when no async is needed_. This method is used to setup the services and the advantage over using the `constructor` is that the point in time when this method is called is well known. It happens after calling `ExpressApplication.start()` and the underlying `expressjs.listen()` call. Also services are guaranteed to be initialized sequencially, following the insertion order.

> This behaviour is likely to change in the future with the introduction of service dependencies, that will introduce initalization parallelism when possible and guarantee initialization order when circularity is not a problem, but this topic is for future discussion, see issue for more information or to leave your opinions/ideas.

This service per se is pretty useless, let's now add a controller that interacts with the user via a REST API:

File: _user.controller.ts_

```ts
import { ExpressModule, ExpressController, Get, Post } from '@creamapi/cream';
import { UserData, UserService } from './user.service';

@ExpressController('/user')
export class UserController extends ExpressModule {
	@Post('/register')
	public register(
		@BodyParam('username') username: string,
		@BodyParam('password') password: string
	): UserData {
		return this.app
			.getService(UserService)
			.registerUser(username, password);
	}

	@Post('/login')
	public login(
		@BodyParam('username') username: string,
		@BodyParam('password') password: string
	): UserData {
		return this.app.getService(UserService).loginUser(username, password);
	}
}
```

The `app` class member is automatically injected to the controller and and refers to the `ExpressApplication` that this controller is registered to (we will see this part later).  
In general this is how `services` are used, they provide a service that other `controllers`, `services` and `middlewares` can use.

### Chatting system

File: _chat.service.ts_

```ts
import {
	ExpressService,
	RestError,
	CreamSerializers,
	Serializable,
	HttpReturnCode,
	AutoMap,
	ContentType,
} from '@creamapi/cream';
import { UserData, UserService } from './user.service';

@Serializable(CreamSerializers.JSON)
export class Message {
	constructor(sender: UserData, message: string) {
		this.sender = sender;
		this.message = message;
	}

	@AutoMap
	public sender: UserData;

	@AutoMap
	public message: string;
}

@Serializable(CreamSerializers.JSON)
@ContentType('application/json')
@HttpReturnCode(200)
export class ChatData {
	constructor(chatId: number, chatMembers: UserData[]) {
		this.chatId = chatId;
		for (let member of chatMembers) {
			this.chatMembers.set(member.userId, member);
		}
		this.messages = [];
	}

	public userJoin(user: UserData) {
		this.chatMembers.set(user.userId, user); // we assume that there are no duplicate IDs
	}

	public hasUser(userId: number): boolean {
		return this.chatMembers.get(userId) != undefined;
	}

	public postMessage(sender: UserData, message: string): void {
		if (this.chatMembers.get(sender.userId) == undefined) {
			throw new RestError('User is not in chat', 400);
		}

		this.messages.push(new Message(sender, message));
		for (let [userId, user] of this.chatMembers) {
			if (userId != sender.userId) {
				user.newMessages++;
			}
		}
	}

	@AutoMap
	public chatId: number;

	@AutoMap
	public chatMembers: Map<number, UserData>;

	@AutoMap
	public messages: Message[];
}

@ExpressService.IdentifiedBy('my-chat-service')
export class ChatService extends ExpressService {
	private chats: Map<number, ChatData>;
	private chatIdInc: number;
	private serverUserData: UserData;

	// we can use this construct to simplify accesing the user service
	private get userService(): UserService {
		return this.app.getService(UserService)!;
	}

	constructor() {
		this.chats = new Map<string, ChatData>();
		this.chatIdInc = 0;
		this.serverUserData = new UserData(-1, 'server', '');
	}

	async init(): Promise<boolean> {
		return true;
	}

	public createChat(creatorId: number) {
		let creator: UserData = this.userService.getUserFromId(creatorId);
		this.chatIdInc++;
		this.chats.set(
			this.chatIdInc,
			new ChatData(this.chatIdInc, [server, creator])
		);
		return this.getChat(this.chatIdInc);
	}

	public joinChat(chatId: number, userId: number): ChatData {
		let chat: ChatData = this.getChat(chatId);
		let user: UserData = this.userService.getUserFromId(userId);
		chat.userJoin(user);
		return chat;
	}

	public getAllChats(): ChatData[] {
		let chats: ChatData[] = [];
		for (let [_, chat] of this.chats) {
			chats.push(chat);
		}
		return chats;
	}

	public getChat(chatId: number): ChatData {
		let chat: ChatData | undefined = this.chats.get(chatId);
		if (chat == undefined) {
			throw new RestError('Could not find chat with provided id', 404);
		}

		return chat;
	}

	public getAllUserChats(userId: number): ChatData[] {
		let userChats: ChatData[] = [];
		for (let [chatId, chat] of this.chats) {
			if (chat.hasUser(userId)) {
				userChats.push(chat);
			}
		}
		return userChats;
	}

	public publishMessage(
		chatId: number,
		senderId: number,
		message: string
	): ChatData {
		let chat: ChatData = this.getChat(chatId);
		let user: UserData = this.userService.getUserFromId(senderId);
		chat.postMessage(user, message);
		return chat;
	}
}
```

Here we have a clear example on the fact that `services` can interact with other `services`. Now to almost finish the chat system we have to build the `controller` to allow the user to interact with the chats.

File: _chat.controller.ts_

```ts
import {
	ExpressModule,
	ExpressController,
	Get,
	Post,
	Put,
} from '@creamapi/cream';
import { ChatData, ChatService } from './chat.service';

@ExpressController('/chat')
export class ChatController extends ExpressModule {
	@Post('/create/:userId')
	public createChat(@UrlParam('userId') userId: number): ChatData {
		return this.app.getService(ChatService).createChat(userId);
	}

	@Put('/join/:chatId/:userId')
	public joinChat(
		@UrlParam('chatId') chatId: number,
		@UrlParam('userId') userId: number
	): ChatData {
		return this.app.getService(ChatService).joinChat(chatId, userId);
	}

	@Get('/all')
	public getAllChats(): JSONSerializableArray<ChatData> {
		return new JSONSerializableArray<ChatData>(
			this.app.getService(ChatService).getAllChats()
		);
	}

	@Get('/one/:chatId')
	public getOneChat(@UrlParameter('chatId') chatId: number): ChatData {
		return this.app.getService(ChatService).getChat(chatId);
	}

	@Get('/for-user/:userId')
	public getChatForUser(
		@UrlParameter('userId') userId: number
	): JSONSerializableArray<ChatData> {
		return new JSONSerializableArray<ChatData>(
			this.app.getService(ChatService).getAllUserChats(userId)
		);
	}
}
```

### The Express Application

Now we can finish our chat system by creating the main application and inserting the services and controllers.

File: _chat.app.ts_

```ts
import { ExpressApplication } from '@creamapi/cream';
import express from 'express';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UserService } from './user.service';
import { UserController } from './user.controller';

let expressBase = express();
let chatApp = new ExpressApplication(express, 4040);

chatApp.addControllers([
	new ChatController(),
	new UserController()
]);

chatApp.addServices([
	new UserService();
	new ChatService()
]);

chatApp.start();
```

This will open an API listening to port 4040 (http://localhost:4040).
Services are created in dependency order, since they are initialized in the insertion order. This means that since ChatService needs UserService it needs to be initalized before.

> A little note: the last statement is not precise. Dependencies matter only during initalization, since a service might require another service to correctly initalize. After a service is initalized it is available to be used whenever and by anyone.

## Gracefully Stopping The Server

It is really important to handle the last few instances of the lifetime of a server. Imagine that we want to upgrade our current
API with a new one, we first need to stop the old one, it requires a bit of effort: we need to reject incoming requests, we need
to wait for long processes to complete, we need to close the database connections or whatever critical needs to be done.

This procedure is generally called the _Graceful Shutdown Procedure_ because it allows the server to properly stop without causing any damage to the system.
In Cream this procedure is supported by default and gives the user a bit of customization tools to adapt to all situations. The only thing is that, whilst is supported by default, it is not enabled by default and has to be done manually with two simple calls.

Reusing the example from before we now have in our _chat.app.ts_:
File: _chat.app.ts_

```ts
import { ExpressApplication } from '@creamapi/cream';
import express from 'express';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { UserService } from './user.service';
import { UserController } from './user.controller';

let expressBase = express();
let chatApp = new ExpressApplication(express, 4040);

chatApp.addControllers([
	new ChatController(),
	new UserController()
]);

chatApp.addServices([
	new UserService();
	new ChatService()
]);

chatApp.registerStopOnSigInt();
chatApp.registerStopOnSigTerm();
chatApp.start();
```

Both `ExpressApplication.registerStopOnSigInt` and `ExpressApplication.registerStopOnSigTerm` will make the current process listen for `SIGINT` and `SIGTERM` and then call `ExpressApplication.stop`.

The `stop` method will then act in 3 steps:

-   it will run the before-stop hooks
-   it will stop the http server associated with express so it won't accept any new request
-   it will run the after-stop hooks

### Before and After Stop Hooks

The customization comes from the fact that the hooks are user defined (in fact Cream does not define any hook) and to register the hook it is as simple as calling `ExpressApplication.addAfterStopHook` and `ExpressApplication.addBeforeStopHook`.  
The hook to be added must implement respectively `AfterStopHook` and `BeforeStopHook` interfaces (so yes, it has to be a class).

> Note that Cream will not provide any reference to the ExpressApplication to the hooks, it has to be done manually by the user or the hook can be one of `ExpressService`, a _**registered**_ `ExpressController` or a `ExpressMiddleware`.

Again, let's edit the last example with this new functionality

_chat.service.ts_

```ts
// [...]
@ExpressService.IdentifiedBy('my-chat-service')
export class ChatService
	extends ExpressService
	implements BeforeStopHook, AfterStopHook
{
	private chats: Map<number, ChatData>;
	private chatIdInc: number;
	private serverUserData: UserData;

	constructor() {
		this.chats = new Map<string, ChatData>();
		this.chatIdInc = 0;
		this.serverUserData = new UserData(-1, 'server', '');
	}

	// we will see only the new features in the class and the most important methods, the others will not change

	async init(): Promise<boolean> {
		return true;
	}

	public publishMessage(
		chatId: number,
		senderId: number,
		message: string
	): ChatData {
		let chat: ChatData = this.getChat(chatId);
		let user: UserData = this.userService.getUserFromId(senderId);
		chat.postMessage(user, message);
		return chat;
	}

	private waitFor(millis: number): Promise<void> {
		return new Promise<void>((resolve) => setTimeout(resolve, millis));
	}

	private postToAll(message: string) {
		for (let chat of this.chats) {
			chat.postMessage(this.serverUserData, message);
		}
	}

	public async beforeStop() {
		this.postToAll('Server closing in 1 min...');
		await this.waitFor(30000); // wait for half the time
		this.postToAll('Server closing in 30 seconds...');
		await this.waitFor(25000);
		this.postToAll('Server closing in 5 seconds...');
		await this.waitFor(5000);
		this.postToAll('Server is closing now');
		this.rejectIncomingMessages(); // this method does not exist but imagine that it rejects all connections with a custom message until the server is stopped
	}

	public async afterStop() {
		// We can imagine that we have a way to persist, for example in a file, the user data and the chats data
		await this.persistUserData();
		await this.persistChatData();
	}
}
```

## Continuing

To expand our REST API we also need to receive more complex data from the user, but this topic, how to handle different HTTP requests, is covered in the ~~[User Guide](public/index.html)~~ user guide that still has to be written, for now refer only to the [Documentation](#documentation).

# Comparing it with Express

Let's start from a easy task: return an array of tokens given a string separated by a empty space (only space, tabs and new lines not included)
An example: given the string `"Hello, World!  "` we have the following result (we have two spaces at the end of our string)

```json
["Hello,", "World", "", ""]
```

In ExpressJS it is easily done (for simplicity lets use a GET request) like this

```ts
import express from 'express';

let app = express();

app.use(express.json());

app.get('/tokenize/:data', (res, req) => {
	req.send(res.params.data.split(' '));
});

app.listen(4040);
```

With Cream it would look more like this

```ts
import express from 'express';
import {
	ExpressApplication,
	ExpressController,
	ExpressModule,
	UrlParameter,
	Get,
	RestError,
	JSONSerializableArray,
} from '@creamapi/cream';

@ExpressController('/')
class MyController extends ExpressModule {
	@Get('/tokenize/:data')
	async splitString(
		@UrlParameter('data') data: string
	): Promise<JSONSerializableArray<string>> {
		if (data.length == 0) {
			throw new RestError('Data is of length 0', 400);
		}

		// any other error will be treated as a 500 Internal Server Error by default
		return new JSONSerializableArray(data.split(' '));
	}
}

class MyApp extends ExpressApplication {
	constructor() {
		let app = express();
		app.use(express.json());
		super(app, 4040);
	}
}

let myInstance = new MyApp();
myInstance.addController(new MyController());
myInstance.start();
```

Albeit looking complicated for this simple example, in case of larger projects the benefit is clearly visible. The classes define the
structure of the API! It is also made such that if the method stripString is called normally
like

```ts
let myController = new MyController();

console.log(myController.splitString('Hello, World'));

// the output will be
['Hello,', 'World'];
```

This allows for testing the controllers before plugging them in the REST API.

# Contributors

### Owner

@shadow0x59

### Maintainer

### Developer

### Bug Hunter

### Featurerist

### Special thanks

Special thanks to **Domenico Popolizio** for tolerating me with this project and for all the suggestions.

# Donations

You want to keep this project up, but don't know how to collaborate?  
No worries! If you can and if you wish you can tip me a small amount :)  
Here on ☕ [Buy Me A Coffee](https://www.buymeacoffee.com/shadow0x59) ☕
