# Cream - A Library For Semi-Declarative REST API Creation

Cream stands for Concise REST API Maker and it is a ExpressJS extension mainly targeting TypeScript builds.
It wasn't tested on plain JS.

# Installation

```npm
npm install @creamapi/cream
```

# Usage

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
	UrlParam,
	Get,
	Message,
} from '@creamapi/cream';

@ExpressController('/')
class MyController extends ExpressModule {
	@Get('/tokenize/:data')
	async stripString(@UrlParam('data') data: string): Promise<Message> {
		if (data.length == 0) {
			throw new RestError('Data is of length 0', 400);
		}

		// any other error will be treated as a 500 Internal Server Error
		return new Message(data.split(' '), 'application/json');
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

console.log(myController.splitString('Hello, World').content);

// the output will be
['Hello,', 'World'];
```

# Future Additions

List of open issues:

-   [Declarative Serialization-Deserialization of Input Views and Output Views](https://gitlab.com/worklog1/cream/-/issues/3)

# Contributors

## Owner

[shadow0x59 - Radu Raul](https://gravatar.com/shadow0x59)

## Maintainer

## Developer

## Bug Hunter

## Featurerist

# Donations

You want to keep this project up, but don't know how to collaborate?  
No worries! If you can and if you wish you can tip me a small amount :)  
Here on [Buy Me A Coffee](https://www.buymeacoffee.com/shadow0x59)
