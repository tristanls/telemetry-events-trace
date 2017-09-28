"use strict";

const crypto = require("crypto");
const events = require("events");
const pkg = require("./package.json");
const TelemetryEvents = require("telemetry-events");
const UrlSafeBase64 = require("urlsafe-base64");

const TraceTelemetryEvents = require("./index.js");

describe("extract", () =>
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
    describe("http_headers", () =>
    {
        it("creates valid span from headers", done =>
            {
                const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const spanId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const headers =
                {
                    "X-TRACE-ID": traceId,
                    "X-TRACE-SPAN-ID": spanId,
                    "X-TRACE-BAGGAGE": UrlSafeBase64.encode(
                        Buffer.from(
                            JSON.stringify(
                                {
                                    my: "baggage"
                                },
                                "utf8"
                            )
                        )
                    )
                };
                emitter.on("telemetry", event =>
                    {
                        expect(event).toEqual(expect.objectContaining(
                            {
                                baggage:
                                {
                                    my: "baggage"
                                },
                                references:
                                [
                                    {
                                        type: "childOf",
                                        spanId
                                    }
                                ],
                                type: "trace",
                                traceId,
                                spanId: expect.any(String),
                                name: "test"
                            }
                        ));
                        done();
                    }
                );
                const span = tracing.extract("http_headers", headers);
                span.childSpan("test").finish();
            }
        );
        it("creates valid span from headers without baggage", done =>
            {
                const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const spanId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const headers =
                {
                    "X-TRACE-ID": traceId,
                    "X-TRACE-SPAN-ID": spanId
                };
                emitter.on("telemetry", event =>
                    {
                        expect(event).toEqual(expect.objectContaining(
                            {
                                baggage: {},
                                references:
                                [
                                    {
                                        type: "childOf",
                                        spanId
                                    }
                                ],
                                type: "trace",
                                traceId,
                                spanId: expect.any(String),
                                name: "test"
                            }
                        ));
                        done();
                    }
                );
                const span = tracing.extract("http_headers", headers);
                span.childSpan("test").finish();
            }
        );
        [
            "X-TRACE-ID", "X-TRACE-SPAN-ID"
        ].map(header =>
            {
                it(`does not create span from headers if missing ${header}`, () =>
                    {
                        const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
                        const spanId = UrlSafeBase64.encode(crypto.randomBytes(64));
                        const headers =
                        {
                            "X-TRACE-ID": traceId,
                            "X-TRACE-SPAN-ID": spanId,
                            "X-TRACE-BAGGAGE": UrlSafeBase64.encode(
                                Buffer.from(
                                    JSON.stringify(
                                        {
                                            my: "baggage"
                                        },
                                        "utf8"
                                    )
                                )
                            )
                        };
                        delete headers[header];
                        expect(tracing.extract("http_headers", headers)).toBe(undefined);
                    }
                );
            }
        );
    });
    describe("text_map", () =>
    {
        it("creates valid span from text map", done =>
            {
                const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const spanId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const obj =
                {
                    traceId,
                    spanId,
                    baggage: JSON.stringify(
                        {
                            my: "baggage"
                        },
                        "utf8"
                    )
                };
                emitter.on("telemetry", event =>
                    {
                        expect(event).toEqual(expect.objectContaining(
                            {
                                baggage:
                                {
                                    my: "baggage"
                                },
                                references:
                                [
                                    {
                                        type: "childOf",
                                        spanId
                                    }
                                ],
                                type: "trace",
                                traceId,
                                spanId: expect.any(String),
                                name: "test"
                            }
                        ));
                        done();
                    }
                );
                const span = tracing.extract("text_map", obj);
                span.childSpan("test").finish();
            }
        );
        it("creates valid span from text map without baggage", done =>
            {
                const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const spanId = UrlSafeBase64.encode(crypto.randomBytes(64));
                const obj =
                {
                    traceId,
                    spanId
                };
                emitter.on("telemetry", event =>
                    {
                        expect(event).toEqual(expect.objectContaining(
                            {
                                baggage: {},
                                references:
                                [
                                    {
                                        type: "childOf",
                                        spanId
                                    }
                                ],
                                type: "trace",
                                traceId,
                                spanId: expect.any(String),
                                name: "test"
                            }
                        ));
                        done();
                    }
                );
                const span = tracing.extract("text_map", obj);
                span.childSpan("test").finish();
            }
        );
        [
            "traceId", "spanId"
        ].map(prop =>
            {
                it(`does not create span from text map if missing ${prop}`, () =>
                    {
                        const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
                        const spanId = UrlSafeBase64.encode(crypto.randomBytes(64));
                        const obj =
                        {
                            traceId,
                            spanId,
                            baggage: JSON.stringify(
                                {
                                    my: "baggage"
                                },
                                "utf8"
                            )
                        };
                        delete obj[prop];
                        expect(tracing.extract("text_map", obj)).toBe(undefined);
                    }
                );
            }
        );
    });
});
