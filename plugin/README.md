[![npm](https://img.shields.io/npm/v/nativescript-tasks.svg)](https://www.npmjs.com/package/nativescript-tasks)
[![npm](https://img.shields.io/npm/dt/nativescript-tasks.svg?label=npm%20downloads)](https://www.npmjs.com/package/nativescript-tasks)

# NativeScript Tasks

A [NativeScript](https://nativescript.org/) module for simply handling background tasks via web workers.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=DE5KRMBB3N2U8)

## License

[MIT license](https://raw.githubusercontent.com/mkloubert/nativescript-tasks/master/LICENSE)

## Platforms

* Android
* iOS

## Requirements

* NativeScript 2.4+ (s. [Multithreading Model](https://docs.nativescript.org/core-concepts/multithreading-model))

## Installation

Run

```bash
tns plugin add nativescript-tasks
```

inside your app project to install the module.

## Example

```typescript
import Tasks = require("nativescript-tasks");

Tasks.startNew((ctx) => {
                   return 23979 + ctx.state;
               },
               5979)  // 5979 will be stored in 'state'
                      // property of 'ctx' 
     .then((result) => {
               console.log('Result: ' + result.data);  // 29958
               // result.state = 5979
           })
     .catch((result) => {
               console.log('ERROR: ' + result.error);
               // result.state = 5979
            });
```

## Limitations

* You can only submit and return serializable objects and values!
* All task functions are 'closures', what means that you CANNOT access the variables from the current execution context. All functions are serialized as strings and submitted to the [worker script](https://github.com/mkloubert/nativescript-tasks/blob/master/plugin/worker.js) where "your" variables are NOT available there!

Read the [official documentation](https://docs.nativescript.org/core-concepts/multithreading-model#limitations) to get more information.
