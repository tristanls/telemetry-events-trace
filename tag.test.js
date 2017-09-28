"use strict";

const crypto = require("crypto");
const events = require("events");
const pkg = require("./package.json");
const TelemetryEvents = require("telemetry-events");
const UrlSafeBase64 = require("urlsafe-base64");

const TraceTelemetryEvents = require("./index.js");

describe("tag", () =>
{
    let emitter, tracing;
    beforeEach(() =>
        {
            emitter = new events.EventEmitter();
            const telemetry = new TelemetryEvents(
                {
                    emitter,
                    package: pkg
                }
            );
            tracing = new TraceTelemetryEvents(
                {
                    telemetry
                }
            );
        }
    );
    it("does not alter parent span tags", done =>
        {
            emitter.on("telemetry", event =>
                {
                    if (event.traceId == event.spanId) // parent span
                    {
                        expect(event.tags).toEqual(
                            {
                                my: "tag"
                            }
                        );
                        done();
                    }
                }
            );
            const trace = tracing.trace("my trace", { my: "tag" });
            const childSpan = trace.span("my span", { more: "tag" });
            childSpan.finish();
            trace.finish();
        }
    );
});
