[![npm](https://img.shields.io/npm/v/nativescript-batch.svg)](https://www.npmjs.com/package/nativescript-batch)
[![npm](https://img.shields.io/npm/dt/nativescript-batch.svg?label=npm%20downloads)](https://www.npmjs.com/package/nativescript-batch)

# NativeScript Batch

A [NativeScript](https://nativescript.org/) module for implementing batch operations.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=7MSZHCXXBPQAC)

## NativeScript Toolbox

This module is part of [nativescript-toolbox](https://github.com/mkloubert/nativescript-toolbox).

## License

[MIT license](https://raw.githubusercontent.com/mkloubert/nativescript-batch/master/LICENSE)

## Platforms

* Android
* iOS

## Installation

Run

```bash
tns plugin add nativescript-batch
```

inside your app project to install the module.

## Example

```typescript
import Batch = require("nativescript-batch");

export function startBatch() {
    Batch.newBatch(function(ctx) {
                       ctx.log("Running 1st operation...");
                   }).complete(function(ctx) {
                                   ctx.log("1st operation completed.");
                               })
                     .success(function(ctx) {
                                  ctx.log("1st operation succeeded.");
                              })
                     .error(function(ctx) {
                                ctx.log("ERROR in operation " + (ctx.index + 1) + ": " + ctx.error);
                            })
         .then(function(ctx) {
                   ctx.log("Running second operation...");
               }).complete(function(ctx) {
                               ctx.log("Second operation completed.");
                           })
                 .success(function(ctx) {
                              ctx.log("Second operation succeeded.");
                          })
                 .error(function(ctx) {
                            ctx.log("ERROR in operation " + (ctx.index + 1) + ": " + ctx.error);
                        })
         .start();
}
```

## Documentation

The full documentation can be found on [readme.io](https://nativescript-batch.readme.io/).

### Data binding

Each batch starts with an empty `Observable` and an empty `ObservableArray` that are submitted to each execution context of a callback.

These objects can be used in any View like a [ListView](https://docs.nativescript.org/ui/ui-views#listview) or a [Label](https://docs.nativescript.org/ui/ui-views#label), e.g.

An example of a code-behind:

```typescript
import Frame = require("ui/frame");
import {Observable} from "data/observable";
import Batch = require("nativescript-batch");

export function startBatch(args) {
    var button = args.object;
    
    var label = Frame.topmost().getViewById('my-label');
    var listView = Frame.topmost().getViewById('my-listview');

    var batch = Batch.newBatch(function(ctx) {
                                   // set 'labelText' property of 'bindingContext'
                                   // of 'label'
                                   //
                                   // this is the same object as
                                   // in 'batch.object'
                                   ctx.object.set("labelText", "Operation #1");
                                   
                                   // add item for 'bindingContext'
                                   // object of 'listView'
                                   //
                                   // this is the same object as
                                   // in 'batch.items'
                                   ctx.items.push({
                                       text: "Operation #1 executed"
                                   });
                               })
                     .then(function(ctx) {
                               ctx.object.set("labelText", "Operation #2");
                                   
                               ctx.items.push({
                                   text: "Operation #2 executed"
                               });
                           });
    
    var listViewVM = new Observable();
    listViewVM.set("batchItems", batch.items);
                           
    label.bindingContext = batch.object;
    listView.bindingContext = listViewVM;
    
    batch.start();
}
```

The declaration of the underlying view:

```xml
<Page xmlns="http://schemas.nativescript.org/tns.xsd">
  <GridLayout rows="64,*">
    <Button row="0" text="Start"
            tap="{{ startBatch }}" />
    
    <StackPanel>
      <Label id="my-label"
             text="{{ labelText }}" />
    
      <ListView id="my-listview"
                items="{{ batchItems }}">
              
        <ListView.itemsTemplate>
          <Label text="{{ text }}" />
        </ListView.itemsTemplate>
      </ListView>
    </StackPanel>
  </GridLayout>
</Page>
```
