// Copyright 2010-2012 Mikeal Rogers
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

var cookies = require('./lib/cookies')
  , copy = require('./lib/copy')
  , util = require('util')
  ;



// organize params for patch, post, put, head, del
function initParams(uri, options, callback) {
  var opts;
  if ((typeof options === 'function') && !callback) callback = options
  if (options && typeof options === 'object') {
    opts = util._extend({}, options);
    opts.uri = uri
  } else if (typeof uri === 'string') {
    opts = {uri:uri}
  } else {
    opts = util._extend({}, uri);
    uri = opts.uri
  }

  return { uri: uri, options: opts, callback: callback }
}

function request (uri, options, callback) {
  var opts;
  if (typeof uri === 'undefined') throw new Error('undefined is not a valid uri or options object.')
  if ((typeof options === 'function') && !callback) callback = options
  if (options && typeof options === 'object') {
    opts = util._extend({}, options);
    opts.uri = uri
  } else if (typeof uri === 'string') {
    opts = {uri:uri}
  } else {
    opts = util._extend({}, uri);
  }

  if (callback) opts.callback = callback
  var r = new request.Request(opts)
  return r
}

module.exports = request

request.debug = process.env.NODE_DEBUG && /\brequest\b/.test(process.env.NODE_DEBUG)

request.Request = require('./request')

request.initParams = initParams

request.defaults = function (options, requester) {
  var def = function (method) {
    var d = function (uri, opts, callback) {
      var params = initParams(uri, opts, callback)
      Object.keys(options).forEach(function (key) {
        if (key !== 'headers' && params.options[key] === undefined) {
          params.options[key] = options[key]
        }
      })
      if (options.headers) {
        var headers = {}
        util._extend(headers, options.headers)
        util._extend(headers, params.options.headers)
        params.options.headers = headers
      }
      if(typeof requester === 'function') {
        if(method === request) {
          method = requester
        } else {
          params.options._requester = requester
        }
      }
      return method(params.options, params.callback)
    }
    return d
  }
  
  var de = def(this)
  de.get = def(this.get)
  de.patch = def(this.patch)
  de.post = def(this.post)
  de.put = def(this.put)
  de.head = def(this.head)
  de.del = def(this.del)
  de.cookie = def(this.cookie)
  de.jar = this.jar
  de.defaults = this.defaults
  return de
}

function requester(params) {
  if(typeof params.options._requester === 'function') {
    return params.options._requester
  } else {
    return request
  }
}

request.forever = function (agentOptions, optionsArg) {
  var options = {}
  if (optionsArg) {
    for (var option in optionsArg) {
      options[option] = optionsArg[option]
    }
  }
  if (agentOptions) options.agentOptions = agentOptions
  options.forever = true
  return request.defaults(options)
}

request.get = function (uri, options, callback) {
  var params = initParams(uri, options, callback)
  params.options.method = 'GET'
  return requester(params)(params.uri || null, params.options, params.callback)
}
request.post = function (uri, options, callback) {
  var params = initParams(uri, options, callback)
  params.options.method = 'POST'
  return requester(params)(params.uri || null, params.options, params.callback)
}
request.put = function (uri, options, callback) {
  var params = initParams(uri, options, callback)
  params.options.method = 'PUT'
  return requester(params)(params.uri || null, params.options, params.callback)
}
request.patch = function (uri, options, callback) {
  var params = initParams(uri, options, callback)
  params.options.method = 'PATCH'
  return requester(params)(params.uri || null, params.options, params.callback)
}
request.head = function (uri, options, callback) {
  var params = initParams(uri, options, callback)
  params.options.method = 'HEAD'
  if (params.options.body ||
      params.options.requestBodyStream ||
      (params.options.json && typeof params.options.json !== 'boolean') ||
      params.options.multipart) {
    throw new Error("HTTP HEAD requests MUST NOT include a request body.")
  }

  return requester(params)(params.uri || null, params.options, params.callback)
}
request.del = function (uri, options, callback) {
  var params = initParams(uri, options, callback)
  params.options.method = 'DELETE'
  return requester(params)(params.uri || null, params.options, params.callback)
}
request.jar = function () {
  return cookies.jar();
}
request.cookie = function (str) {
  return cookies.parse(str);
}
