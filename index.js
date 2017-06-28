"use strict";

const crypto = require("crypto");
const UrlSafeBase64 = require("urlsafe-base64");

const TraceTelemetryEvents = module.exports = function(config)
{
    const self = this;

    config = config || {};

    if (!(self._telemetry = config.telemetry))
    {
        throw new Error("config is missing required property: telemetry");
    }
};

TraceTelemetryEvents.Span = function(config)
{
    const self = this;
    self._traceId = config.traceId;
    self._spanId = config.spanId || UrlSafeBase64.encode(crypto.randomBytes(64));
    self._name = config.name;
    self._start = config.start;
    self._baggage = config.baggage;
    self._tags = config.tags;
    self._telemetry = config.telemetry;
    self._references = config.references;
    return self;
};

TraceTelemetryEvents.Span.prototype.childSpan = function childSpan(name, tags = {}, baggage = {}, start = new Date())
{
    const self = this;
    return self.span(name, tags, baggage, start, [ { type: "childOf", spanId: self._spanId } ]);
};

TraceTelemetryEvents.Span.prototype.finish = function finish(finish = new Date())
{
    const self = this;
    self._finish = finish;
    self._telemetry.emit(
        {
            type: "trace",
            traceId: self._traceId,
            spanId: self._spanId,
            name: self._name,
            start: self._start.toISOString(),
            finish: self._finish.toISOString(),
            durationMs: self._finish.getTime() - self._start.getTime(),
            tags: self._tags,
            baggage: self._baggage,
            references: self._references
        }
    );
    self.finish = () => {}; // can't finish span more than once
    return self;
};

TraceTelemetryEvents.Span.prototype.followingSpan = function followingSpan(name, tags = {}, baggage = {}, start = new Date())
{
    const self = this;
    return self.span(name, tags, baggage, start, [ { type: "followsFrom", spanId: self._spanId } ]);
};

TraceTelemetryEvents.Span.prototype.inject = function inject(type, carrier)
{
    const self = this;
    switch (type)
    {
        case "http_headers":
            carrier['X-TRACE-ID'] = self._traceId;
            carrier['X-TRACE-SPAN-ID'] = self._spanId;
            carrier['X-TRACE-BAGGAGE'] = Buffer.from(JSON.stringify(self._baggage), "utf8").toString("base64");
            return carrier;
        case "text_map":
            carrier.traceId = self._traceId;
            carrier.spanId = self._spanId;
            carrier.baggage = JSON.stringify(self._baggage);
            return carrier;
        default:
            return null;
    }
};

TraceTelemetryEvents.Span.prototype.span = function span(name, tags = {}, baggage = {}, start = new Date(), references = [])
{
    const self = this;
    return new TraceTelemetryEvents.Span(
        {
            name,
            traceId: self._traceId,
            start,
            tags,
            baggage: Object.assign(self._baggage, baggage),
            references,
            telemetry: self._telemetry
        }
    );
};

TraceTelemetryEvents.prototype.extract = function extract(type, carrier)
{
    const self = this;
    let span;
    switch (type)
    {
        case "http_headers":
            span = new TraceTelemetryEvents.Span(
                {
                    traceId: carrier['X-TRACE-ID'],
                    spanId: carrier['X-TRACE-SPAN-ID'],
                    baggage: JSON.parse(Buffer.from(carrier['X-TRACE-BAGGAGE'], "base64")),
                    telemetry: self._telemetry
                }
            );
            span.finish = () => {}; // can't finish remote span
            return span;
        case "text_map":
            span = new TraceTelemetryEvents.Span(
                {
                    traceId: carrier.traceId,
                    spanId: carrier.spanId,
                    baggage: JSON.parse(carrier.baggage),
                    telemetry: self._telemetry
                }
            );
            span.finish = () => {}; // can't finish remote span
            return span;
        default:
            return null;
    }
}

TraceTelemetryEvents.prototype.trace = function trace(name, tags = {}, baggage = {}, start = new Date())
{
    const self = this;
    const traceId = UrlSafeBase64.encode(crypto.randomBytes(64));
    return new TraceTelemetryEvents.Span(
        {
            name,
            traceId,
            spanId: traceId,
            baggage,
            start,
            tags,
            telemetry: self._telemetry
        }
    );
};
