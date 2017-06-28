# telemetry-events-trace

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/telemetry-events-trace.png)](http://npmjs.org/package/telemetry-events-trace)

Helper for creating and emitting [TelemetryEvents](https://github.com/tristanls/telemetry-events) for tracing.

## Contributors

[@tristanls](https://github.com/tristanls)

## Contents

  * [Installation](#installation)
  * [Usage](#usage)
  * [Tests](#tests)
  * [Documentation](#documentation)
    * [TraceTelemetryEvents](#tracetelemetryevents)
  * [Releases](#releases)

## Installation

    npm install telemetry-events-trace

## Usage

To run the below example run:

    npm run readme

```javascript
"use strict";

const events = require("events");
const pkg = require("../package.json");
const TelemetryEvents = require("telemetry-events");

const TraceTelemetryEvents = require("../index.js");

const emitter = new events.EventEmitter();

const telemetry = new TelemetryEvents(
    {
        emitter,
        package: pkg
    }
);
const tracing = new TraceTelemetryEvents(
    {
        telemetry
    }
);

emitter.on("telemetry", event => console.dir(event));

let rootSpan1 = tracing.trace("rootSpan1", undefined, {user: "tristan"});
setTimeout(() => rootSpan1.finish(), 5);

let rootSpan2 = tracing.trace("rootSpan2", {server: "001"}, {user: "tristan"});
let childSpan1 = rootSpan2.childSpan("childSpan1", {db: "020"});
let childSpan2 = rootSpan2.childSpan("childSpan2", {db: "021"});
let childSpan3 = childSpan1.childSpan("childSpan3");
let childSpan4 = childSpan2.followingSpan("childSpan4", {consumer: "me"});

let headers = childSpan3.inject("http_headers", {});
console.log(headers);
let extractedSpan = tracing.extract("http_headers", headers);

let childSpan5 = extractedSpan.childSpan("childSpan5");

setTimeout(() => childSpan3.finish(), 10);
setTimeout(() => childSpan2.finish(), 11);
setTimeout(() => childSpan1.finish(), 12);
setTimeout(() => rootSpan2.finish(), 13);
setTimeout(() => childSpan4.finish(), 22);

setTimeout(() => childSpan5.finish(), 20);

```

## Tests

No tests at this time.

## Documentation

  * [TraceTelemetryEvents](#tracetelemetryevents)

### TraceTelemetryEvents

**Public API**

  * [new TraceTelemetryEvents(config)](#new-tracetelemetryeventsconfig)
  * [tracing.extract(type, carrier)](#tracingextracttype-carrier)
  * [tracing.trace(name, \[tags\], \[baggage\], \[start\])](#tracingtracename-tags-baggage-start)
  * [span.childSpan(name, \[tags\], \[baggage\], \[start\])](#spanchildspanname-tags-baggage-start)
  * [span.finish(\[finish\])](#spanfinishfinish)
  * [span.followingSpan(name, \[tags\], \[baggage\], \[start\])](#spanfollowingspanname-tags-baggage-start)
  * [span.inject(type, carrier)](#spaninjecttype-carrier)

### new TraceTelemetryEvents(config)

  * `config`: _Object_
    * `telemetry`: _Object_ TelemetryEvents instance.
  * Return: _Object_ Instance of TraceTelemetryEvents.

Creates a new TraceTelemetryEvents instance.

### tracing.extract(type, carrier)

  * `type`: _String_ One of ["http_headers", "text_map"]
  * `carrier`: _Object_ JavaScript object to extract span from.
  * Return: _TraceTelemetryEvents.Span_ Span initialized from information in the carrier.

Creates a localy copy of the parent span extracted from the carrier. This local `Span` instance can then be used to generate child or following spans.

### tracing.trace(name, [tags], [baggage], [start])

  * `name`: _String_ Operation name to trace.
  * `tags`: _Object_ _(Default: {})_ Tags to attach to the span.
  * `baggage`: _Object_ _(Default: {})_ Baggage to attach to all the spans in the trace.
  * `start`: _Date_ _(Default: new Date())_ Start time.
  * Return: _TraceTelemetryEvents.Span_ Newly created root span for the trace.

Creates a root span.

### span.childSpan(name, [tags], [baggage], [start])

  * `name`: _String_ Operation name to trace.
  * `tags`: _Object_ _(Default: {})_ Tags to attach to the span.
  * `baggage`: _Object_ _(Default: {})_ Baggage to attach to this and all following spans in the trace.
  * `start`: _Date_ _(Default: new Date())_ Start time.
  * Return: _TraceTelemetryEvents.Span_ Newly created child span.

Creates a child span that has a `childOf` reference to the `span`.

### span.finish([finish])

  * `finish`: _Date_ _(Default: new Date())_ Finish time.
  * Return: _TraceTelemetryEvents.Span_ Finished span.

Finishes the `span` and emits a `trace` telemetry event.

### span.followingSpan(name, [tags], [baggage], [start])

  * `name`: _String_ Operation name to trace.
  * `tags`: _Object_ _(Default: {})_ Tags to attach to the span.
  * `baggage`: _Object_ _(Default: {})_ Baggage to attach to this and all following spans in the trace.
  * `start`: _Date_ _(Default: new Date())_ Start time.
  * Return: _TraceTelemetryEvents.Span_ Newly created "follows from" span.

Creates a child span that has a `followsFrom` reference to the `span`.

### span.inject(type, carrier)

  * `type`: _String_ One of ["http_headers", "text_map"]
  * `carrier`: _Object_ JavaScript object to inject span information into.
  * Return: `carrier` with injected span information.

Injects `span` information into the `carrier`.

## Releases

We follow semantic versioning policy (see: [semver.org](http://semver.org/)):

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
>MAJOR version when you make incompatible API changes,<br/>
>MINOR version when you add functionality in a backwards-compatible manner, and<br/>
>PATCH version when you make backwards-compatible bug fixes.

**caveat**: Major version zero is a special case indicating development version that may make incompatible API changes without incrementing MAJOR version.
