![GitLab License](https://img.shields.io/gitlab/license/worklog1%2Fcream)
![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/worklog1%2Fcream?branch=master)
![NPM Downloads](https://img.shields.io/npm/dy/%40creamapi%2Fcream)
![GitLab Issues](https://img.shields.io/gitlab/issues/open/worklog1%2Fcream)
![GitLab Contributors](https://img.shields.io/gitlab/contributors/worklog1%2Fcream)
![NPM Version](https://img.shields.io/npm/v/%40creamapi%2Fcream)

<a href="https://www.buymeacoffee.com/shadow0x59" target="_blank"><img heigth="60" src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 115px !important; height: 30px !important;" ></a>

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

If you've already installed expreess:

```bash
npm install @creamapi/cream
```

# Usage

> Note: These examples use TypeScript, in order to follow them please setup a TS project.

To create your own API with Cream it is easy! You just need to setup a few things then you can play with it with ease.

### Index

-   [API Documentation](#documentation)
-   [First Steps](#first-steps)
-   [Handling Complex Objects](#handling-complex-objects)
    -   [Handling data coming from the client](#handling-data-coming-from-the-client)
    -   [Returning complex objects](#returning-complex-objects)
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

## Continuing

To expand our REST API we also need to receive more complex data from the user, but this topic, how to handle different HTTP requests, is covered in the ~~[User Guide](public/index.html)~~ user guide that still has to be written, for now refer only to the [Documentation](#documentation).

# Comparing it with Express

Let's start from a easy task: return an array of tokens given a string separated by a empty space (only space, tabs and new lines not included)
An example: given the string `"Hello, World!  "` we have the following result

```json
["Hello,", "World", "", ""]
```

In ExpressJS it is easily done (for simplicity lets use a GET request) like this

```ts
import "express" from express;

let app = express();

app.use(express.json());

app.get("/tokenize/:data", (res, req)=>{
    req.send(res.params.data.split(" "));
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

		// any other error will be treated as a 500 Internal Server Error
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
