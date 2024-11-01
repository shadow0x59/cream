# Cream - A Library For Semi-Declarative REST API Creation

Cream stands for Concise REST API Maker and it is a ExpressJS extension mainly targeting TypeScript builds.
It wasn't tested on plain JS.

# Warnings

Note that this is still experimental so anything about this repository can change at any time.

# Installation

To use it, since it is not available publicly to npm, I suggest to install it as a git submodule.

# Usage

Let's start from a easy task: return an array of tokens given a string separated by a empty space (only space, tabs and new lines not included)
An example: given the string `"Hello, World!  "` we have the following result 
```json
[
    "Hello,", 
    "World", 
    "", 
    ""
]
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
import express from "express";
import { 
    ExpressApplication, 
    ExpressController, 
    ExpressModule, 
    UrlParam,
    Get,
    Message
} from "./libs/express-utils";

@ExpressController("/")
class MyController extends ExpressModule {
    @Get("/:data")
    async stripString(@UrlParam('data') data: string): Promise<Message> {
        if (data.length == 0) {
            throw new RestError("Data is of length 0", 400);
        }

        // any other error will be treated as a 500 Internal Server Error
        return new Message(data.split(" "), "application/json");
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

Albeit looking more complicated for larger projects the benefit is clearly visible. The classes define the 
structure of the API! It is also made such that if the method stripString is called normally
like 

```ts
let myController = new MyController();

console.log(myController.splitString("Hello, World").content);

// the output will be
[
    "Hello,",
    "World"
]
```

# Future Addons

As seen the extension library is not perfect.   
A change I want to implement is to allow serialization of the output in a declarative manner something like

```ts
@Serializers.JSON
class MyCustData {
    @AutoMap<String>()
    field1: string;
    
    @Map<Int>("myAwesomeField2")
    field2: int;
    
    constructor(field1: string, field2: int) {
        this.field1 = field1;
        this.field2 = field2;
    }
}


// Then it will be serialized to a JSON object like
{
    "field1": "<value>",
    "myAwesomeField2": 123
}
// but only when the method that returns a instance of 
// MyCustData is called from an API request, otherwise
// it will return the plain object.
```

