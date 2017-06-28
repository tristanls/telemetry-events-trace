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
childSpan4.tags(
    {
        "some": "tag",
        "some_other": "tag"
    }
);

let headers = childSpan3.inject("http_headers", {});
console.log(headers);
let extractedSpan = tracing.extract("http_headers", headers);

let childSpan5 = extractedSpan.childSpan("childSpan5");
childSpan5.tag("error", true);

setTimeout(() => childSpan3.finish(), 10);
setTimeout(() => childSpan2.finish(), 11);
setTimeout(() => childSpan1.finish(), 12);
setTimeout(() => rootSpan2.finish(), 13);
setTimeout(() => childSpan4.finish(), 22);

setTimeout(() => childSpan5.finish(), 20);
