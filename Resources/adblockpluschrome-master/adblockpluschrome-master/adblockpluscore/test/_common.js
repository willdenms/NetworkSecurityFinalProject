/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

let fs = require("fs");
let path = require("path");
let SandboxedModule = require("sandboxed-module");

const Cr = exports.Cr = {
  NS_OK: 0,
  NS_BINDING_ABORTED: 0x804B0002,
  NS_ERROR_FAILURE: 0x80004005
};

const MILLIS_IN_SECOND = exports.MILLIS_IN_SECOND = 1000;
const MILLIS_IN_MINUTE = exports.MILLIS_IN_MINUTE = 60 * MILLIS_IN_SECOND;
const MILLIS_IN_HOUR = exports.MILLIS_IN_HOUR = 60 * MILLIS_IN_MINUTE;
const MILLIS_IN_DAY = exports.MILLIS_IN_DAY = 24 * MILLIS_IN_HOUR;

let globals = {
  atob: data => new Buffer(data, "base64").toString("binary"),
  btoa: data => new Buffer(data, "binary").toString("base64"),
  Ci: {
  },
  Cu: {
    import: () => {},
    reportError: e => undefined
  },
  console: {
    log: () => undefined,
    error: () => undefined,
  },
  navigator: {
  },
  onShutdown: {
    add: () =>
    {
    }
  },
  Services: {
    obs: {
      addObserver: () =>
      {
      }
    },
    vc: {
      compare: (v1, v2) =>
      {
        function comparePart(p1, p2)
        {
          if (p1 != "*" && p2 == "*")
            return -1;
          else if (p1 == "*" && p2 != "*")
            return 1;
          else if (p1 == p2)
            return 0;
          else
            return parseInt(p1, 10) - parseInt(p2, 10);
        }

        let parts1 = v1.split(".");
        let parts2 = v2.split(".");
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++)
        {
          let result = comparePart(parts1[i] || "0", parts2[i] || "0");
          if (result != 0)
            return result;
        }
        return 0;
      }
    }
  },
  XPCOMUtils: {
    generateQI: () =>
    {
    }
  },
  URL: function(urlString)
  {
    return require("url").parse(urlString);
  }
};

let knownModules = new Map();
for (let dir of [path.join(__dirname, "stub-modules"),
                 path.join(__dirname, "..", "lib")])
  for (let file of fs.readdirSync(path.resolve(dir)))
    if (path.extname(file) == ".js")
      knownModules[path.basename(file, ".js")] = path.resolve(dir, file);

function addExports(exports)
{
  return function(source)
  {
    let extraExports = exports[path.basename(this.filename, ".js")];
    if (extraExports)
      for (let name of extraExports)
        source += `
          Object.defineProperty(exports, "${name}", {get: () => ${name}});`;
    return source;
  };
}

function rewriteRequires(source)
{
  function escapeString(str)
  {
    return str.replace(/(["'\\])/g, "\\$1");
  }

  return source.replace(/(\brequire\(["'])([^"']+)/g, (match, prefix, request) =>
  {
    if (request in knownModules)
      return prefix + escapeString(knownModules[request]);
    return match;
  });
}

exports.createSandbox = function(options)
{
  if (!options)
    options = {};

  let sourceTransformers = [rewriteRequires];
  if (options.extraExports)
    sourceTransformers.push(addExports(options.extraExports));

  // This module loads itself into a sandbox, keeping track of the require
  // function which can be used to load further modules into the sandbox.
  return SandboxedModule.require("./_common", {
    globals: Object.assign({}, globals, options.globals),
    sourceTransformers: sourceTransformers
  }).require;
};

exports.require = require;

exports.setupTimerAndXMLHttp = function()
{
  let currentTime = 100000 * MILLIS_IN_HOUR;
  let startTime = currentTime;

  let fakeTimer = {
    callback: null,
    delay: -1,
    nextExecution: 0,

    initWithCallback: function(callback, delay, type)
    {
      if (this.callback)
        throw new Error("Only one timer instance supported");
      if (type != 1)
        throw new Error("Only TYPE_REPEATING_SLACK timers supported");

      this.callback = callback;
      this.delay = delay;
      this.nextExecution = currentTime + delay;
    },

    trigger: function()
    {
      if (currentTime < this.nextExecution)
        currentTime = this.nextExecution;
      try
      {
        this.callback();
      }
      finally
      {
        this.nextExecution = currentTime + this.delay;
      }
    },

    cancel: function()
    {
      this.nextExecution = -1;
    }
  };

  let requests = [];
  function XMLHttpRequest()
  {
    this._host = "http://example.com";
    this._loadHandlers = [];
    this._errorHandlers = [];
  };
  XMLHttpRequest.prototype =
  {
    _path: null,
    _data: null,
    _queryString: null,
    _loadHandlers: null,
    _errorHandlers: null,
    status: 0,
    readyState: 0,
    responseText: null,

    addEventListener: function(eventName, handler, capture)
    {
      let list;
      if (eventName == "load")
        list = this._loadHandlers;
      else if (eventName == "error")
        list = this._errorHandlers;
      else
        throw new Error("Event type " + eventName + " not supported");

      if (list.indexOf(handler) < 0)
        list.push(handler);
    },

    removeEventListener: function(eventName, handler, capture)
    {
      let list;
      if (eventName == "load")
        list = this._loadHandlers;
      else if (eventName == "error")
        list = this._errorHandlers;
      else
        throw new Error("Event type " + eventName + " not supported");

      let index = list.indexOf(handler);
      if (index >= 0)
        list.splice(index, 1);
    },

    open: function(method, url, async, user, password)
    {
      if (method != "GET")
        throw new Error("Only GET requests are supported");
      if (typeof async != "undefined" && !async)
        throw new Error("Sync requests are not supported");
      if (typeof user != "undefined" || typeof password != "undefined")
        throw new Error("User authentification is not supported");

      let match = /^data:[^,]+,/.exec(url);
      if (match)
      {
        this._data = decodeURIComponent(url.substr(match[0].length));
        return;
      }

      if (url.substr(0, this._host.length + 1) != this._host + "/")
        throw new Error("Unexpected URL: " + url + " (URL starting with " + this._host + "expected)");

      this._path = url.substr(this._host.length);

      let queryIndex = this._path.indexOf("?");
      this._queryString = "";
      if (queryIndex >= 0)
      {
        this._queryString = this._path.substr(queryIndex + 1);
        this._path = this._path.substr(0, queryIndex);
      }
    },

    send: function(data)
    {
      if (!this._data && !this._path)
        throw new Error("No request path set");
      if (typeof data != "undefined" && data)
        throw new Error("Sending data to server is not supported");

      requests.push(Promise.resolve().then(() =>
      {
        let result = [Cr.NS_OK, 404, ""];
        if (this._data)
          result = [Cr.NS_OK, 0, this._data];
        else if (this._path in XMLHttpRequest.requestHandlers)
        {
          result = XMLHttpRequest.requestHandlers[this._path]({
            method: "GET",
            path: this._path,
            queryString: this._queryString
          });
        }

        [this.channel.status, this.channel.responseStatus, this.responseText] = result;
        this.status = this.channel.responseStatus;

        let eventName = (this.channel.status == Cr.NS_OK ? "load" : "error");
        let event = {type: eventName};
        for (let handler of this["_" + eventName + "Handlers"])
          handler.call(this, event);
      }));
    },

    overrideMimeType: function(mime)
    {
    },

    channel:
    {
      status: -1,
      responseStatus: 0,
      loadFlags: 0,
      INHIBIT_CACHING: 0,
      VALIDATE_ALWAYS: 0,
      QueryInterface: () => this
    }
  };

  XMLHttpRequest.requestHandlers = {};
  this.registerHandler = (path, handler) =>
  {
    XMLHttpRequest.requestHandlers[path] = handler;
  };

  function waitForRequests()
  {
    if (requests.length)
    {
      let result = Promise.all(requests);
      requests = [];
      return result.catch(e =>
      {
        console.error(e);
      }).then(() => waitForRequests());
    }
    else
      return Promise.resolve();
  }

  function runScheduledTasks(maxMillis)
  {
    let endTime = currentTime + maxMillis;
    if (fakeTimer.nextExecution < 0 || fakeTimer.nextExecution > endTime)
    {
      currentTime = endTime;
      return Promise.resolve();
    }
    else
    {
      fakeTimer.trigger();
      return waitForRequests().then(() => runScheduledTasks(endTime - currentTime));
    }

    currentTime = endTime;
  }

  this.runScheduledTasks = (maxHours, initial, skip) =>
  {
    if (typeof maxHours != "number")
      throw new Error("Numerical parameter expected");
    if (typeof initial != "number")
      initial = 0;
    if (typeof skip != "number")
      skip = 0;

    startTime = currentTime;
    return Promise.resolve().then(() =>
    {
      if (initial >= 0)
      {
        maxHours -= initial;
        return runScheduledTasks(initial * MILLIS_IN_HOUR);
      }
    }).then(() =>
    {
      if (skip >= 0)
      {
        maxHours -= skip;
        currentTime += skip * MILLIS_IN_HOUR;
      }
      return runScheduledTasks(maxHours * MILLIS_IN_HOUR);
    });
  };

  this.getTimeOffset = () => (currentTime - startTime) / MILLIS_IN_HOUR;
  Object.defineProperty(this, "currentTime", {
    get: () => currentTime
  });

  return {
    Cc: {
      "@mozilla.org/timer;1": {
        createInstance: () => fakeTimer
      }
    },
    Ci: {
      nsITimer:
      {
        TYPE_ONE_SHOT: 0,
        TYPE_REPEATING_SLACK: 1,
        TYPE_REPEATING_PRECISE: 2
      },
      nsIHttpChannel: () => null,
    },
    Cr,
    XMLHttpRequest,
    Date: {
      now: () => currentTime
    }
  };
};

exports.setupRandomResult = function()
{
  let randomResult = 0.5;
  Object.defineProperty(this, "randomResult", {
    get: () => randomResult,
    set: value => randomResult = value
  });

  return {
    Math: {
      random: () => randomResult,
      min: Math.min,
      max: Math.max,
      round: Math.round
    }
  };
};

exports.unexpectedError = function(error)
{
  console.error(error);
  this.ok(false, "Unexpected error: " + error);
};
