# Cream - A Library For Semi-Declarative REST API Creation

Cream stands for Concise REST API Maker and it is a ExpressJS extension mainly targeting TypeScript builds.
It wasn't tested on plain JS.

# Installation

If express is not installed:

```npm
npm install express @types/express @creamapi/cream
```

If you've already installed expreess:

```npm
npm install @creamapi/cream
```

# Usage

> Note: These examples use TypeScript, in order to follow them please setup a TS project.

To create your own API with Cream it is easy! You just need to setup a few things then you can play with it with ease.

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
			here you can use any express middleware like cors, json, bodyParser
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

## Handling complex objects

Sending a string to the browser is cool, but REST APIs are more complex than this.  
They can receive data as a request and give a complex response, like a JSON text.

## Handling data coming from the client

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

## Returning complex objects

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
} from '@creamapi/cream';

@HttpReturnCode(200)
@ContentType('application/json')
@Serializable(CreamSerializers.JSON)
class HelloView {
	@AutoMap
	stringLength: number;

	@MapTo('userData')
	stringData: string;

	constructor(userString) {
		this.stringLength = stringData.length;
		this.stringData = stringData;
	}
}
```

Here we can see that we tell cream that HelloView is serializable by a JSON serializer, the return content type is application/json and that the http return code is 200.

We also see AutoMap and MapTo, these two decorators are used to declare which fields are serialized.

> The difference between MapTo and AutoMap is that MapTo allows us to specify the name of the field whilst AutoMap will take the name of the decorated attribute.

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
	"userData": "my hello",
	"stringLength": 8
}
```

## Continuing

To expand our REST API we also need to receive more complex data from the user, but this topic, how to handle different HTTP requests, is covered in the [User Guide]().

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
