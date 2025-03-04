(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dexlibs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/* @preserve
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2018 Petka Antonov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
/**
 * bluebird build version 3.5.3
 * Features enabled: core, race, call_get, generators, map, nodeify, promisify, props, reduce, settle, some, using, timers, filter, any, each
 */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Promise=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _dereq_=="function"&&_dereq_;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _dereq_=="function"&&_dereq_;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise) {
    var SomePromiseArray = Promise._SomePromiseArray;
    function any(promises) {
      var ret = new SomePromiseArray(promises);
      var promise = ret.promise();
      ret.setHowMany(1);
      ret.setUnwrap();
      ret.init();
      return promise;
    }

    Promise.any = function (promises) {
      return any(promises);
    };

    Promise.prototype.any = function () {
      return any(this);
    };

  };

},{}],2:[function(_dereq_,module,exports){
  "use strict";
  var firstLineError;
  try {throw new Error(); } catch (e) {firstLineError = e;}
  var schedule = _dereq_("./schedule");
  var Queue = _dereq_("./queue");
  var util = _dereq_("./util");

  function Async() {
    this._customScheduler = false;
    this._isTickUsed = false;
    this._lateQueue = new Queue(16);
    this._normalQueue = new Queue(16);
    this._haveDrainedQueues = false;
    this._trampolineEnabled = true;
    var self = this;
    this.drainQueues = function () {
      self._drainQueues();
    };
    this._schedule = schedule;
  }

  Async.prototype.setScheduler = function(fn) {
    var prev = this._schedule;
    this._schedule = fn;
    this._customScheduler = true;
    return prev;
  };

  Async.prototype.hasCustomScheduler = function() {
    return this._customScheduler;
  };

  Async.prototype.enableTrampoline = function() {
    this._trampolineEnabled = true;
  };

  Async.prototype.disableTrampolineIfNecessary = function() {
    if (util.hasDevTools) {
      this._trampolineEnabled = false;
    }
  };

  Async.prototype.haveItemsQueued = function () {
    return this._isTickUsed || this._haveDrainedQueues;
  };


  Async.prototype.fatalError = function(e, isNode) {
    if (isNode) {
      process.stderr.write("Fatal " + (e instanceof Error ? e.stack : e) +
        "\n");
      process.exit(2);
    } else {
      this.throwLater(e);
    }
  };

  Async.prototype.throwLater = function(fn, arg) {
    if (arguments.length === 1) {
      arg = fn;
      fn = function () { throw arg; };
    }
    if (typeof setTimeout !== "undefined") {
      setTimeout(function() {
        fn(arg);
      }, 0);
    } else try {
      this._schedule(function() {
        fn(arg);
      });
    } catch (e) {
      throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    }
  };

  function AsyncInvokeLater(fn, receiver, arg) {
    this._lateQueue.push(fn, receiver, arg);
    this._queueTick();
  }

  function AsyncInvoke(fn, receiver, arg) {
    this._normalQueue.push(fn, receiver, arg);
    this._queueTick();
  }

  function AsyncSettlePromises(promise) {
    this._normalQueue._pushOne(promise);
    this._queueTick();
  }

  if (!util.hasDevTools) {
    Async.prototype.invokeLater = AsyncInvokeLater;
    Async.prototype.invoke = AsyncInvoke;
    Async.prototype.settlePromises = AsyncSettlePromises;
  } else {
    Async.prototype.invokeLater = function (fn, receiver, arg) {
      if (this._trampolineEnabled) {
        AsyncInvokeLater.call(this, fn, receiver, arg);
      } else {
        this._schedule(function() {
          setTimeout(function() {
            fn.call(receiver, arg);
          }, 100);
        });
      }
    };

    Async.prototype.invoke = function (fn, receiver, arg) {
      if (this._trampolineEnabled) {
        AsyncInvoke.call(this, fn, receiver, arg);
      } else {
        this._schedule(function() {
          fn.call(receiver, arg);
        });
      }
    };

    Async.prototype.settlePromises = function(promise) {
      if (this._trampolineEnabled) {
        AsyncSettlePromises.call(this, promise);
      } else {
        this._schedule(function() {
          promise._settlePromises();
        });
      }
    };
  }

  function _drainQueue(queue) {
    while (queue.length() > 0) {
      _drainQueueStep(queue);
    }
  }

  function _drainQueueStep(queue) {
    var fn = queue.shift();
    if (typeof fn !== "function") {
      fn._settlePromises();
    } else {
      var receiver = queue.shift();
      var arg = queue.shift();
      fn.call(receiver, arg);
    }
  }

  Async.prototype._drainQueues = function () {
    _drainQueue(this._normalQueue);
    this._reset();
    this._haveDrainedQueues = true;
    _drainQueue(this._lateQueue);
  };

  Async.prototype._queueTick = function () {
    if (!this._isTickUsed) {
      this._isTickUsed = true;
      this._schedule(this.drainQueues);
    }
  };

  Async.prototype._reset = function () {
    this._isTickUsed = false;
  };

  module.exports = Async;
  module.exports.firstLineError = firstLineError;

},{"./queue":26,"./schedule":29,"./util":36}],3:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL, tryConvertToPromise, debug) {
    var calledBind = false;
    var rejectThis = function(_, e) {
      this._reject(e);
    };

    var targetRejected = function(e, context) {
      context.promiseRejectionQueued = true;
      context.bindingPromise._then(rejectThis, rejectThis, null, this, e);
    };

    var bindingResolved = function(thisArg, context) {
      if (((this._bitField & 50397184) === 0)) {
        this._resolveCallback(context.target);
      }
    };

    var bindingRejected = function(e, context) {
      if (!context.promiseRejectionQueued) this._reject(e);
    };

    Promise.prototype.bind = function (thisArg) {
      if (!calledBind) {
        calledBind = true;
        Promise.prototype._propagateFrom = debug.propagateFromFunction();
        Promise.prototype._boundValue = debug.boundValueFunction();
      }
      var maybePromise = tryConvertToPromise(thisArg);
      var ret = new Promise(INTERNAL);
      ret._propagateFrom(this, 1);
      var target = this._target();
      ret._setBoundTo(maybePromise);
      if (maybePromise instanceof Promise) {
        var context = {
          promiseRejectionQueued: false,
          promise: ret,
          target: target,
          bindingPromise: maybePromise
        };
        target._then(INTERNAL, targetRejected, undefined, ret, context);
        maybePromise._then(
          bindingResolved, bindingRejected, undefined, ret, context);
        ret._setOnCancel(maybePromise);
      } else {
        ret._resolveCallback(target);
      }
      return ret;
    };

    Promise.prototype._setBoundTo = function (obj) {
      if (obj !== undefined) {
        this._bitField = this._bitField | 2097152;
        this._boundTo = obj;
      } else {
        this._bitField = this._bitField & (~2097152);
      }
    };

    Promise.prototype._isBound = function () {
      return (this._bitField & 2097152) === 2097152;
    };

    Promise.bind = function (thisArg, value) {
      return Promise.resolve(value).bind(thisArg);
    };
  };

},{}],4:[function(_dereq_,module,exports){
  "use strict";
  var old;
  if (typeof Promise !== "undefined") old = Promise;
  function noConflict() {
    try { if (Promise === bluebird) Promise = old; }
    catch (e) {}
    return bluebird;
  }
  var bluebird = _dereq_("./promise")();
  bluebird.noConflict = noConflict;
  module.exports = bluebird;

},{"./promise":22}],5:[function(_dereq_,module,exports){
  "use strict";
  var cr = Object.create;
  if (cr) {
    var callerCache = cr(null);
    var getterCache = cr(null);
    callerCache[" size"] = getterCache[" size"] = 0;
  }

  module.exports = function(Promise) {
    var util = _dereq_("./util");
    var canEvaluate = util.canEvaluate;
    var isIdentifier = util.isIdentifier;

    var getMethodCaller;
    var getGetter;
    if (!true) {
      var makeMethodCaller = function (methodName) {
        return new Function("ensureMethod", "                                    \n\
        return function(obj) {                                               \n\
            'use strict'                                                     \n\
            var len = this.length;                                           \n\
            ensureMethod(obj, 'methodName');                                 \n\
            switch(len) {                                                    \n\
                case 1: return obj.methodName(this[0]);                      \n\
                case 2: return obj.methodName(this[0], this[1]);             \n\
                case 3: return obj.methodName(this[0], this[1], this[2]);    \n\
                case 0: return obj.methodName();                             \n\
                default:                                                     \n\
                    return obj.methodName.apply(obj, this);                  \n\
            }                                                                \n\
        };                                                                   \n\
        ".replace(/methodName/g, methodName))(ensureMethod);
      };

      var makeGetter = function (propertyName) {
        return new Function("obj", "                                             \n\
        'use strict';                                                        \n\
        return obj.propertyName;                                             \n\
        ".replace("propertyName", propertyName));
      };

      var getCompiled = function(name, compiler, cache) {
        var ret = cache[name];
        if (typeof ret !== "function") {
          if (!isIdentifier(name)) {
            return null;
          }
          ret = compiler(name);
          cache[name] = ret;
          cache[" size"]++;
          if (cache[" size"] > 512) {
            var keys = Object.keys(cache);
            for (var i = 0; i < 256; ++i) delete cache[keys[i]];
            cache[" size"] = keys.length - 256;
          }
        }
        return ret;
      };

      getMethodCaller = function(name) {
        return getCompiled(name, makeMethodCaller, callerCache);
      };

      getGetter = function(name) {
        return getCompiled(name, makeGetter, getterCache);
      };
    }

    function ensureMethod(obj, methodName) {
      var fn;
      if (obj != null) fn = obj[methodName];
      if (typeof fn !== "function") {
        var message = "Object " + util.classString(obj) + " has no method '" +
          util.toString(methodName) + "'";
        throw new Promise.TypeError(message);
      }
      return fn;
    }

    function caller(obj) {
      var methodName = this.pop();
      var fn = ensureMethod(obj, methodName);
      return fn.apply(obj, this);
    }
    Promise.prototype.call = function (methodName) {
      var args = [].slice.call(arguments, 1);;
      if (!true) {
        if (canEvaluate) {
          var maybeCaller = getMethodCaller(methodName);
          if (maybeCaller !== null) {
            return this._then(
              maybeCaller, undefined, undefined, args, undefined);
          }
        }
      }
      args.push(methodName);
      return this._then(caller, undefined, undefined, args, undefined);
    };

    function namedGetter(obj) {
      return obj[this];
    }
    function indexedGetter(obj) {
      var index = +this;
      if (index < 0) index = Math.max(0, index + obj.length);
      return obj[index];
    }
    Promise.prototype.get = function (propertyName) {
      var isIndex = (typeof propertyName === "number");
      var getter;
      if (!isIndex) {
        if (canEvaluate) {
          var maybeGetter = getGetter(propertyName);
          getter = maybeGetter !== null ? maybeGetter : namedGetter;
        } else {
          getter = namedGetter;
        }
      } else {
        getter = indexedGetter;
      }
      return this._then(getter, undefined, undefined, propertyName, undefined);
    };
  };

},{"./util":36}],6:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, PromiseArray, apiRejection, debug) {
    var util = _dereq_("./util");
    var tryCatch = util.tryCatch;
    var errorObj = util.errorObj;
    var async = Promise._async;

    Promise.prototype["break"] = Promise.prototype.cancel = function() {
      if (!debug.cancellation()) return this._warn("cancellation is disabled");

      var promise = this;
      var child = promise;
      while (promise._isCancellable()) {
        if (!promise._cancelBy(child)) {
          if (child._isFollowing()) {
            child._followee().cancel();
          } else {
            child._cancelBranched();
          }
          break;
        }

        var parent = promise._cancellationParent;
        if (parent == null || !parent._isCancellable()) {
          if (promise._isFollowing()) {
            promise._followee().cancel();
          } else {
            promise._cancelBranched();
          }
          break;
        } else {
          if (promise._isFollowing()) promise._followee().cancel();
          promise._setWillBeCancelled();
          child = promise;
          promise = parent;
        }
      }
    };

    Promise.prototype._branchHasCancelled = function() {
      this._branchesRemainingToCancel--;
    };

    Promise.prototype._enoughBranchesHaveCancelled = function() {
      return this._branchesRemainingToCancel === undefined ||
        this._branchesRemainingToCancel <= 0;
    };

    Promise.prototype._cancelBy = function(canceller) {
      if (canceller === this) {
        this._branchesRemainingToCancel = 0;
        this._invokeOnCancel();
        return true;
      } else {
        this._branchHasCancelled();
        if (this._enoughBranchesHaveCancelled()) {
          this._invokeOnCancel();
          return true;
        }
      }
      return false;
    };

    Promise.prototype._cancelBranched = function() {
      if (this._enoughBranchesHaveCancelled()) {
        this._cancel();
      }
    };

    Promise.prototype._cancel = function() {
      if (!this._isCancellable()) return;
      this._setCancelled();
      async.invoke(this._cancelPromises, this, undefined);
    };

    Promise.prototype._cancelPromises = function() {
      if (this._length() > 0) this._settlePromises();
    };

    Promise.prototype._unsetOnCancel = function() {
      this._onCancelField = undefined;
    };

    Promise.prototype._isCancellable = function() {
      return this.isPending() && !this._isCancelled();
    };

    Promise.prototype.isCancellable = function() {
      return this.isPending() && !this.isCancelled();
    };

    Promise.prototype._doInvokeOnCancel = function(onCancelCallback, internalOnly) {
      if (util.isArray(onCancelCallback)) {
        for (var i = 0; i < onCancelCallback.length; ++i) {
          this._doInvokeOnCancel(onCancelCallback[i], internalOnly);
        }
      } else if (onCancelCallback !== undefined) {
        if (typeof onCancelCallback === "function") {
          if (!internalOnly) {
            var e = tryCatch(onCancelCallback).call(this._boundValue());
            if (e === errorObj) {
              this._attachExtraTrace(e.e);
              async.throwLater(e.e);
            }
          }
        } else {
          onCancelCallback._resultCancelled(this);
        }
      }
    };

    Promise.prototype._invokeOnCancel = function() {
      var onCancelCallback = this._onCancel();
      this._unsetOnCancel();
      async.invoke(this._doInvokeOnCancel, this, onCancelCallback);
    };

    Promise.prototype._invokeInternalOnCancel = function() {
      if (this._isCancellable()) {
        this._doInvokeOnCancel(this._onCancel(), true);
        this._unsetOnCancel();
      }
    };

    Promise.prototype._resultCancelled = function() {
      this.cancel();
    };

  };

},{"./util":36}],7:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(NEXT_FILTER) {
    var util = _dereq_("./util");
    var getKeys = _dereq_("./es5").keys;
    var tryCatch = util.tryCatch;
    var errorObj = util.errorObj;

    function catchFilter(instances, cb, promise) {
      return function(e) {
        var boundTo = promise._boundValue();
        predicateLoop: for (var i = 0; i < instances.length; ++i) {
          var item = instances[i];

          if (item === Error ||
            (item != null && item.prototype instanceof Error)) {
            if (e instanceof item) {
              return tryCatch(cb).call(boundTo, e);
            }
          } else if (typeof item === "function") {
            var matchesPredicate = tryCatch(item).call(boundTo, e);
            if (matchesPredicate === errorObj) {
              return matchesPredicate;
            } else if (matchesPredicate) {
              return tryCatch(cb).call(boundTo, e);
            }
          } else if (util.isObject(e)) {
            var keys = getKeys(item);
            for (var j = 0; j < keys.length; ++j) {
              var key = keys[j];
              if (item[key] != e[key]) {
                continue predicateLoop;
              }
            }
            return tryCatch(cb).call(boundTo, e);
          }
        }
        return NEXT_FILTER;
      };
    }

    return catchFilter;
  };

},{"./es5":13,"./util":36}],8:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise) {
    var longStackTraces = false;
    var contextStack = [];

    Promise.prototype._promiseCreated = function() {};
    Promise.prototype._pushContext = function() {};
    Promise.prototype._popContext = function() {return null;};
    Promise._peekContext = Promise.prototype._peekContext = function() {};

    function Context() {
      this._trace = new Context.CapturedTrace(peekContext());
    }
    Context.prototype._pushContext = function () {
      if (this._trace !== undefined) {
        this._trace._promiseCreated = null;
        contextStack.push(this._trace);
      }
    };

    Context.prototype._popContext = function () {
      if (this._trace !== undefined) {
        var trace = contextStack.pop();
        var ret = trace._promiseCreated;
        trace._promiseCreated = null;
        return ret;
      }
      return null;
    };

    function createContext() {
      if (longStackTraces) return new Context();
    }

    function peekContext() {
      var lastIndex = contextStack.length - 1;
      if (lastIndex >= 0) {
        return contextStack[lastIndex];
      }
      return undefined;
    }
    Context.CapturedTrace = null;
    Context.create = createContext;
    Context.deactivateLongStackTraces = function() {};
    Context.activateLongStackTraces = function() {
      var Promise_pushContext = Promise.prototype._pushContext;
      var Promise_popContext = Promise.prototype._popContext;
      var Promise_PeekContext = Promise._peekContext;
      var Promise_peekContext = Promise.prototype._peekContext;
      var Promise_promiseCreated = Promise.prototype._promiseCreated;
      Context.deactivateLongStackTraces = function() {
        Promise.prototype._pushContext = Promise_pushContext;
        Promise.prototype._popContext = Promise_popContext;
        Promise._peekContext = Promise_PeekContext;
        Promise.prototype._peekContext = Promise_peekContext;
        Promise.prototype._promiseCreated = Promise_promiseCreated;
        longStackTraces = false;
      };
      longStackTraces = true;
      Promise.prototype._pushContext = Context.prototype._pushContext;
      Promise.prototype._popContext = Context.prototype._popContext;
      Promise._peekContext = Promise.prototype._peekContext = peekContext;
      Promise.prototype._promiseCreated = function() {
        var ctx = this._peekContext();
        if (ctx && ctx._promiseCreated == null) ctx._promiseCreated = this;
      };
    };
    return Context;
  };

},{}],9:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, Context) {
    var getDomain = Promise._getDomain;
    var async = Promise._async;
    var Warning = _dereq_("./errors").Warning;
    var util = _dereq_("./util");
    var es5 = _dereq_("./es5");
    var canAttachTrace = util.canAttachTrace;
    var unhandledRejectionHandled;
    var possiblyUnhandledRejection;
    var bluebirdFramePattern =
      /[\\\/]bluebird[\\\/]js[\\\/](release|debug|instrumented)/;
    var nodeFramePattern = /\((?:timers\.js):\d+:\d+\)/;
    var parseLinePattern = /[\/<\(](.+?):(\d+):(\d+)\)?\s*$/;
    var stackFramePattern = null;
    var formatStack = null;
    var indentStackFrames = false;
    var printWarning;
    var debugging = !!(util.env("BLUEBIRD_DEBUG") != 0 &&
      (true ||
        util.env("BLUEBIRD_DEBUG") ||
        util.env("NODE_ENV") === "development"));

    var warnings = !!(util.env("BLUEBIRD_WARNINGS") != 0 &&
      (debugging || util.env("BLUEBIRD_WARNINGS")));

    var longStackTraces = !!(util.env("BLUEBIRD_LONG_STACK_TRACES") != 0 &&
      (debugging || util.env("BLUEBIRD_LONG_STACK_TRACES")));

    var wForgottenReturn = util.env("BLUEBIRD_W_FORGOTTEN_RETURN") != 0 &&
      (warnings || !!util.env("BLUEBIRD_W_FORGOTTEN_RETURN"));

    Promise.prototype.suppressUnhandledRejections = function() {
      var target = this._target();
      target._bitField = ((target._bitField & (~1048576)) |
        524288);
    };

    Promise.prototype._ensurePossibleRejectionHandled = function () {
      if ((this._bitField & 524288) !== 0) return;
      this._setRejectionIsUnhandled();
      var self = this;
      setTimeout(function() {
        self._notifyUnhandledRejection();
      }, 1);
    };

    Promise.prototype._notifyUnhandledRejectionIsHandled = function () {
      fireRejectionEvent("rejectionHandled",
        unhandledRejectionHandled, undefined, this);
    };

    Promise.prototype._setReturnedNonUndefined = function() {
      this._bitField = this._bitField | 268435456;
    };

    Promise.prototype._returnedNonUndefined = function() {
      return (this._bitField & 268435456) !== 0;
    };

    Promise.prototype._notifyUnhandledRejection = function () {
      if (this._isRejectionUnhandled()) {
        var reason = this._settledValue();
        this._setUnhandledRejectionIsNotified();
        fireRejectionEvent("unhandledRejection",
          possiblyUnhandledRejection, reason, this);
      }
    };

    Promise.prototype._setUnhandledRejectionIsNotified = function () {
      this._bitField = this._bitField | 262144;
    };

    Promise.prototype._unsetUnhandledRejectionIsNotified = function () {
      this._bitField = this._bitField & (~262144);
    };

    Promise.prototype._isUnhandledRejectionNotified = function () {
      return (this._bitField & 262144) > 0;
    };

    Promise.prototype._setRejectionIsUnhandled = function () {
      this._bitField = this._bitField | 1048576;
    };

    Promise.prototype._unsetRejectionIsUnhandled = function () {
      this._bitField = this._bitField & (~1048576);
      if (this._isUnhandledRejectionNotified()) {
        this._unsetUnhandledRejectionIsNotified();
        this._notifyUnhandledRejectionIsHandled();
      }
    };

    Promise.prototype._isRejectionUnhandled = function () {
      return (this._bitField & 1048576) > 0;
    };

    Promise.prototype._warn = function(message, shouldUseOwnTrace, promise) {
      return warn(message, shouldUseOwnTrace, promise || this);
    };

    Promise.onPossiblyUnhandledRejection = function (fn) {
      var domain = getDomain();
      possiblyUnhandledRejection =
        typeof fn === "function" ? (domain === null ?
          fn : util.domainBind(domain, fn))
          : undefined;
    };

    Promise.onUnhandledRejectionHandled = function (fn) {
      var domain = getDomain();
      unhandledRejectionHandled =
        typeof fn === "function" ? (domain === null ?
          fn : util.domainBind(domain, fn))
          : undefined;
    };

    var disableLongStackTraces = function() {};
    Promise.longStackTraces = function () {
      if (async.haveItemsQueued() && !config.longStackTraces) {
        throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }
      if (!config.longStackTraces && longStackTracesIsSupported()) {
        var Promise_captureStackTrace = Promise.prototype._captureStackTrace;
        var Promise_attachExtraTrace = Promise.prototype._attachExtraTrace;
        var Promise_dereferenceTrace = Promise.prototype._dereferenceTrace;
        config.longStackTraces = true;
        disableLongStackTraces = function() {
          if (async.haveItemsQueued() && !config.longStackTraces) {
            throw new Error("cannot enable long stack traces after promises have been created\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
          }
          Promise.prototype._captureStackTrace = Promise_captureStackTrace;
          Promise.prototype._attachExtraTrace = Promise_attachExtraTrace;
          Promise.prototype._dereferenceTrace = Promise_dereferenceTrace;
          Context.deactivateLongStackTraces();
          async.enableTrampoline();
          config.longStackTraces = false;
        };
        Promise.prototype._captureStackTrace = longStackTracesCaptureStackTrace;
        Promise.prototype._attachExtraTrace = longStackTracesAttachExtraTrace;
        Promise.prototype._dereferenceTrace = longStackTracesDereferenceTrace;
        Context.activateLongStackTraces();
        async.disableTrampolineIfNecessary();
      }
    };

    Promise.hasLongStackTraces = function () {
      return config.longStackTraces && longStackTracesIsSupported();
    };

    var fireDomEvent = (function() {
      try {
        if (typeof CustomEvent === "function") {
          var event = new CustomEvent("CustomEvent");
          util.global.dispatchEvent(event);
          return function(name, event) {
            var eventData = {
              detail: event,
              cancelable: true
            };
            es5.defineProperty(
              eventData, "promise", {value: event.promise});
            es5.defineProperty(eventData, "reason", {value: event.reason});
            var domEvent = new CustomEvent(name.toLowerCase(), eventData);
            return !util.global.dispatchEvent(domEvent);
          };
        } else if (typeof Event === "function") {
          var event = new Event("CustomEvent");
          util.global.dispatchEvent(event);
          return function(name, event) {
            var domEvent = new Event(name.toLowerCase(), {
              cancelable: true
            });
            domEvent.detail = event;
            es5.defineProperty(domEvent, "promise", {value: event.promise});
            es5.defineProperty(domEvent, "reason", {value: event.reason});
            return !util.global.dispatchEvent(domEvent);
          };
        } else {
          var event = document.createEvent("CustomEvent");
          event.initCustomEvent("testingtheevent", false, true, {});
          util.global.dispatchEvent(event);
          return function(name, event) {
            var domEvent = document.createEvent("CustomEvent");
            domEvent.initCustomEvent(name.toLowerCase(), false, true,
              event);
            return !util.global.dispatchEvent(domEvent);
          };
        }
      } catch (e) {}
      return function() {
        return false;
      };
    })();

    var fireGlobalEvent = (function() {
      if (util.isNode) {
        return function() {
          return process.emit.apply(process, arguments);
        };
      } else {
        if (!util.global) {
          return function() {
            return false;
          };
        }
        return function(name) {
          var methodName = "on" + name.toLowerCase();
          var method = util.global[methodName];
          if (!method) return false;
          method.apply(util.global, [].slice.call(arguments, 1));
          return true;
        };
      }
    })();

    function generatePromiseLifecycleEventObject(name, promise) {
      return {promise: promise};
    }

    var eventToObjectGenerator = {
      promiseCreated: generatePromiseLifecycleEventObject,
      promiseFulfilled: generatePromiseLifecycleEventObject,
      promiseRejected: generatePromiseLifecycleEventObject,
      promiseResolved: generatePromiseLifecycleEventObject,
      promiseCancelled: generatePromiseLifecycleEventObject,
      promiseChained: function(name, promise, child) {
        return {promise: promise, child: child};
      },
      warning: function(name, warning) {
        return {warning: warning};
      },
      unhandledRejection: function (name, reason, promise) {
        return {reason: reason, promise: promise};
      },
      rejectionHandled: generatePromiseLifecycleEventObject
    };

    var activeFireEvent = function (name) {
      var globalEventFired = false;
      try {
        globalEventFired = fireGlobalEvent.apply(null, arguments);
      } catch (e) {
        async.throwLater(e);
        globalEventFired = true;
      }

      var domEventFired = false;
      try {
        domEventFired = fireDomEvent(name,
          eventToObjectGenerator[name].apply(null, arguments));
      } catch (e) {
        async.throwLater(e);
        domEventFired = true;
      }

      return domEventFired || globalEventFired;
    };

    Promise.config = function(opts) {
      opts = Object(opts);
      if ("longStackTraces" in opts) {
        if (opts.longStackTraces) {
          Promise.longStackTraces();
        } else if (!opts.longStackTraces && Promise.hasLongStackTraces()) {
          disableLongStackTraces();
        }
      }
      if ("warnings" in opts) {
        var warningsOption = opts.warnings;
        config.warnings = !!warningsOption;
        wForgottenReturn = config.warnings;

        if (util.isObject(warningsOption)) {
          if ("wForgottenReturn" in warningsOption) {
            wForgottenReturn = !!warningsOption.wForgottenReturn;
          }
        }
      }
      if ("cancellation" in opts && opts.cancellation && !config.cancellation) {
        if (async.haveItemsQueued()) {
          throw new Error(
            "cannot enable cancellation after promises are in use");
        }
        Promise.prototype._clearCancellationData =
          cancellationClearCancellationData;
        Promise.prototype._propagateFrom = cancellationPropagateFrom;
        Promise.prototype._onCancel = cancellationOnCancel;
        Promise.prototype._setOnCancel = cancellationSetOnCancel;
        Promise.prototype._attachCancellationCallback =
          cancellationAttachCancellationCallback;
        Promise.prototype._execute = cancellationExecute;
        propagateFromFunction = cancellationPropagateFrom;
        config.cancellation = true;
      }
      if ("monitoring" in opts) {
        if (opts.monitoring && !config.monitoring) {
          config.monitoring = true;
          Promise.prototype._fireEvent = activeFireEvent;
        } else if (!opts.monitoring && config.monitoring) {
          config.monitoring = false;
          Promise.prototype._fireEvent = defaultFireEvent;
        }
      }
      return Promise;
    };

    function defaultFireEvent() { return false; }

    Promise.prototype._fireEvent = defaultFireEvent;
    Promise.prototype._execute = function(executor, resolve, reject) {
      try {
        executor(resolve, reject);
      } catch (e) {
        return e;
      }
    };
    Promise.prototype._onCancel = function () {};
    Promise.prototype._setOnCancel = function (handler) { ; };
    Promise.prototype._attachCancellationCallback = function(onCancel) {
      ;
    };
    Promise.prototype._captureStackTrace = function () {};
    Promise.prototype._attachExtraTrace = function () {};
    Promise.prototype._dereferenceTrace = function () {};
    Promise.prototype._clearCancellationData = function() {};
    Promise.prototype._propagateFrom = function (parent, flags) {
      ;
      ;
    };

    function cancellationExecute(executor, resolve, reject) {
      var promise = this;
      try {
        executor(resolve, reject, function(onCancel) {
          if (typeof onCancel !== "function") {
            throw new TypeError("onCancel must be a function, got: " +
              util.toString(onCancel));
          }
          promise._attachCancellationCallback(onCancel);
        });
      } catch (e) {
        return e;
      }
    }

    function cancellationAttachCancellationCallback(onCancel) {
      if (!this._isCancellable()) return this;

      var previousOnCancel = this._onCancel();
      if (previousOnCancel !== undefined) {
        if (util.isArray(previousOnCancel)) {
          previousOnCancel.push(onCancel);
        } else {
          this._setOnCancel([previousOnCancel, onCancel]);
        }
      } else {
        this._setOnCancel(onCancel);
      }
    }

    function cancellationOnCancel() {
      return this._onCancelField;
    }

    function cancellationSetOnCancel(onCancel) {
      this._onCancelField = onCancel;
    }

    function cancellationClearCancellationData() {
      this._cancellationParent = undefined;
      this._onCancelField = undefined;
    }

    function cancellationPropagateFrom(parent, flags) {
      if ((flags & 1) !== 0) {
        this._cancellationParent = parent;
        var branchesRemainingToCancel = parent._branchesRemainingToCancel;
        if (branchesRemainingToCancel === undefined) {
          branchesRemainingToCancel = 0;
        }
        parent._branchesRemainingToCancel = branchesRemainingToCancel + 1;
      }
      if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
      }
    }

    function bindingPropagateFrom(parent, flags) {
      if ((flags & 2) !== 0 && parent._isBound()) {
        this._setBoundTo(parent._boundTo);
      }
    }
    var propagateFromFunction = bindingPropagateFrom;

    function boundValueFunction() {
      var ret = this._boundTo;
      if (ret !== undefined) {
        if (ret instanceof Promise) {
          if (ret.isFulfilled()) {
            return ret.value();
          } else {
            return undefined;
          }
        }
      }
      return ret;
    }

    function longStackTracesCaptureStackTrace() {
      this._trace = new CapturedTrace(this._peekContext());
    }

    function longStackTracesAttachExtraTrace(error, ignoreSelf) {
      if (canAttachTrace(error)) {
        var trace = this._trace;
        if (trace !== undefined) {
          if (ignoreSelf) trace = trace._parent;
        }
        if (trace !== undefined) {
          trace.attachExtraTrace(error);
        } else if (!error.__stackCleaned__) {
          var parsed = parseStackAndMessage(error);
          util.notEnumerableProp(error, "stack",
            parsed.message + "\n" + parsed.stack.join("\n"));
          util.notEnumerableProp(error, "__stackCleaned__", true);
        }
      }
    }

    function longStackTracesDereferenceTrace() {
      this._trace = undefined;
    }

    function checkForgottenReturns(returnValue, promiseCreated, name, promise,
                                   parent) {
      if (returnValue === undefined && promiseCreated !== null &&
        wForgottenReturn) {
        if (parent !== undefined && parent._returnedNonUndefined()) return;
        if ((promise._bitField & 65535) === 0) return;

        if (name) name = name + " ";
        var handlerLine = "";
        var creatorLine = "";
        if (promiseCreated._trace) {
          var traceLines = promiseCreated._trace.stack.split("\n");
          var stack = cleanStack(traceLines);
          for (var i = stack.length - 1; i >= 0; --i) {
            var line = stack[i];
            if (!nodeFramePattern.test(line)) {
              var lineMatches = line.match(parseLinePattern);
              if (lineMatches) {
                handlerLine  = "at " + lineMatches[1] +
                  ":" + lineMatches[2] + ":" + lineMatches[3] + " ";
              }
              break;
            }
          }

          if (stack.length > 0) {
            var firstUserLine = stack[0];
            for (var i = 0; i < traceLines.length; ++i) {

              if (traceLines[i] === firstUserLine) {
                if (i > 0) {
                  creatorLine = "\n" + traceLines[i - 1];
                }
                break;
              }
            }

          }
        }
        var msg = "a promise was created in a " + name +
          "handler " + handlerLine + "but was not returned from it, " +
          "see http://goo.gl/rRqMUw" +
          creatorLine;
        promise._warn(msg, true, promiseCreated);
      }
    }

    function deprecated(name, replacement) {
      var message = name +
        " is deprecated and will be removed in a future version.";
      if (replacement) message += " Use " + replacement + " instead.";
      return warn(message);
    }

    function warn(message, shouldUseOwnTrace, promise) {
      if (!config.warnings) return;
      var warning = new Warning(message);
      var ctx;
      if (shouldUseOwnTrace) {
        promise._attachExtraTrace(warning);
      } else if (config.longStackTraces && (ctx = Promise._peekContext())) {
        ctx.attachExtraTrace(warning);
      } else {
        var parsed = parseStackAndMessage(warning);
        warning.stack = parsed.message + "\n" + parsed.stack.join("\n");
      }

      if (!activeFireEvent("warning", warning)) {
        formatAndLogError(warning, "", true);
      }
    }

    function reconstructStack(message, stacks) {
      for (var i = 0; i < stacks.length - 1; ++i) {
        stacks[i].push("From previous event:");
        stacks[i] = stacks[i].join("\n");
      }
      if (i < stacks.length) {
        stacks[i] = stacks[i].join("\n");
      }
      return message + "\n" + stacks.join("\n");
    }

    function removeDuplicateOrEmptyJumps(stacks) {
      for (var i = 0; i < stacks.length; ++i) {
        if (stacks[i].length === 0 ||
          ((i + 1 < stacks.length) && stacks[i][0] === stacks[i+1][0])) {
          stacks.splice(i, 1);
          i--;
        }
      }
    }

    function removeCommonRoots(stacks) {
      var current = stacks[0];
      for (var i = 1; i < stacks.length; ++i) {
        var prev = stacks[i];
        var currentLastIndex = current.length - 1;
        var currentLastLine = current[currentLastIndex];
        var commonRootMeetPoint = -1;

        for (var j = prev.length - 1; j >= 0; --j) {
          if (prev[j] === currentLastLine) {
            commonRootMeetPoint = j;
            break;
          }
        }

        for (var j = commonRootMeetPoint; j >= 0; --j) {
          var line = prev[j];
          if (current[currentLastIndex] === line) {
            current.pop();
            currentLastIndex--;
          } else {
            break;
          }
        }
        current = prev;
      }
    }

    function cleanStack(stack) {
      var ret = [];
      for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        var isTraceLine = "    (No stack trace)" === line ||
          stackFramePattern.test(line);
        var isInternalFrame = isTraceLine && shouldIgnore(line);
        if (isTraceLine && !isInternalFrame) {
          if (indentStackFrames && line.charAt(0) !== " ") {
            line = "    " + line;
          }
          ret.push(line);
        }
      }
      return ret;
    }

    function stackFramesAsArray(error) {
      var stack = error.stack.replace(/\s+$/g, "").split("\n");
      for (var i = 0; i < stack.length; ++i) {
        var line = stack[i];
        if ("    (No stack trace)" === line || stackFramePattern.test(line)) {
          break;
        }
      }
      if (i > 0 && error.name != "SyntaxError") {
        stack = stack.slice(i);
      }
      return stack;
    }

    function parseStackAndMessage(error) {
      var stack = error.stack;
      var message = error.toString();
      stack = typeof stack === "string" && stack.length > 0
        ? stackFramesAsArray(error) : ["    (No stack trace)"];
      return {
        message: message,
        stack: error.name == "SyntaxError" ? stack : cleanStack(stack)
      };
    }

    function formatAndLogError(error, title, isSoft) {
      if (typeof console !== "undefined") {
        var message;
        if (util.isObject(error)) {
          var stack = error.stack;
          message = title + formatStack(stack, error);
        } else {
          message = title + String(error);
        }
        if (typeof printWarning === "function") {
          printWarning(message, isSoft);
        } else if (typeof console.log === "function" ||
          typeof console.log === "object") {
          console.log(message);
        }
      }
    }

    function fireRejectionEvent(name, localHandler, reason, promise) {
      var localEventFired = false;
      try {
        if (typeof localHandler === "function") {
          localEventFired = true;
          if (name === "rejectionHandled") {
            localHandler(promise);
          } else {
            localHandler(reason, promise);
          }
        }
      } catch (e) {
        async.throwLater(e);
      }

      if (name === "unhandledRejection") {
        if (!activeFireEvent(name, reason, promise) && !localEventFired) {
          formatAndLogError(reason, "Unhandled rejection ");
        }
      } else {
        activeFireEvent(name, promise);
      }
    }

    function formatNonError(obj) {
      var str;
      if (typeof obj === "function") {
        str = "[function " +
          (obj.name || "anonymous") +
          "]";
      } else {
        str = obj && typeof obj.toString === "function"
          ? obj.toString() : util.toString(obj);
        var ruselessToString = /\[object [a-zA-Z0-9$_]+\]/;
        if (ruselessToString.test(str)) {
          try {
            var newStr = JSON.stringify(obj);
            str = newStr;
          }
          catch(e) {

          }
        }
        if (str.length === 0) {
          str = "(empty array)";
        }
      }
      return ("(<" + snip(str) + ">, no stack trace)");
    }

    function snip(str) {
      var maxChars = 41;
      if (str.length < maxChars) {
        return str;
      }
      return str.substr(0, maxChars - 3) + "...";
    }

    function longStackTracesIsSupported() {
      return typeof captureStackTrace === "function";
    }

    var shouldIgnore = function() { return false; };
    var parseLineInfoRegex = /[\/<\(]([^:\/]+):(\d+):(?:\d+)\)?\s*$/;
    function parseLineInfo(line) {
      var matches = line.match(parseLineInfoRegex);
      if (matches) {
        return {
          fileName: matches[1],
          line: parseInt(matches[2], 10)
        };
      }
    }

    function setBounds(firstLineError, lastLineError) {
      if (!longStackTracesIsSupported()) return;
      var firstStackLines = firstLineError.stack.split("\n");
      var lastStackLines = lastLineError.stack.split("\n");
      var firstIndex = -1;
      var lastIndex = -1;
      var firstFileName;
      var lastFileName;
      for (var i = 0; i < firstStackLines.length; ++i) {
        var result = parseLineInfo(firstStackLines[i]);
        if (result) {
          firstFileName = result.fileName;
          firstIndex = result.line;
          break;
        }
      }
      for (var i = 0; i < lastStackLines.length; ++i) {
        var result = parseLineInfo(lastStackLines[i]);
        if (result) {
          lastFileName = result.fileName;
          lastIndex = result.line;
          break;
        }
      }
      if (firstIndex < 0 || lastIndex < 0 || !firstFileName || !lastFileName ||
        firstFileName !== lastFileName || firstIndex >= lastIndex) {
        return;
      }

      shouldIgnore = function(line) {
        if (bluebirdFramePattern.test(line)) return true;
        var info = parseLineInfo(line);
        if (info) {
          if (info.fileName === firstFileName &&
            (firstIndex <= info.line && info.line <= lastIndex)) {
            return true;
          }
        }
        return false;
      };
    }

    function CapturedTrace(parent) {
      this._parent = parent;
      this._promisesCreated = 0;
      var length = this._length = 1 + (parent === undefined ? 0 : parent._length);
      captureStackTrace(this, CapturedTrace);
      if (length > 32) this.uncycle();
    }
    util.inherits(CapturedTrace, Error);
    Context.CapturedTrace = CapturedTrace;

    CapturedTrace.prototype.uncycle = function() {
      var length = this._length;
      if (length < 2) return;
      var nodes = [];
      var stackToIndex = {};

      for (var i = 0, node = this; node !== undefined; ++i) {
        nodes.push(node);
        node = node._parent;
      }
      length = this._length = i;
      for (var i = length - 1; i >= 0; --i) {
        var stack = nodes[i].stack;
        if (stackToIndex[stack] === undefined) {
          stackToIndex[stack] = i;
        }
      }
      for (var i = 0; i < length; ++i) {
        var currentStack = nodes[i].stack;
        var index = stackToIndex[currentStack];
        if (index !== undefined && index !== i) {
          if (index > 0) {
            nodes[index - 1]._parent = undefined;
            nodes[index - 1]._length = 1;
          }
          nodes[i]._parent = undefined;
          nodes[i]._length = 1;
          var cycleEdgeNode = i > 0 ? nodes[i - 1] : this;

          if (index < length - 1) {
            cycleEdgeNode._parent = nodes[index + 1];
            cycleEdgeNode._parent.uncycle();
            cycleEdgeNode._length =
              cycleEdgeNode._parent._length + 1;
          } else {
            cycleEdgeNode._parent = undefined;
            cycleEdgeNode._length = 1;
          }
          var currentChildLength = cycleEdgeNode._length + 1;
          for (var j = i - 2; j >= 0; --j) {
            nodes[j]._length = currentChildLength;
            currentChildLength++;
          }
          return;
        }
      }
    };

    CapturedTrace.prototype.attachExtraTrace = function(error) {
      if (error.__stackCleaned__) return;
      this.uncycle();
      var parsed = parseStackAndMessage(error);
      var message = parsed.message;
      var stacks = [parsed.stack];

      var trace = this;
      while (trace !== undefined) {
        stacks.push(cleanStack(trace.stack.split("\n")));
        trace = trace._parent;
      }
      removeCommonRoots(stacks);
      removeDuplicateOrEmptyJumps(stacks);
      util.notEnumerableProp(error, "stack", reconstructStack(message, stacks));
      util.notEnumerableProp(error, "__stackCleaned__", true);
    };

    var captureStackTrace = (function stackDetection() {
      var v8stackFramePattern = /^\s*at\s*/;
      var v8stackFormatter = function(stack, error) {
        if (typeof stack === "string") return stack;

        if (error.name !== undefined &&
          error.message !== undefined) {
          return error.toString();
        }
        return formatNonError(error);
      };

      if (typeof Error.stackTraceLimit === "number" &&
        typeof Error.captureStackTrace === "function") {
        Error.stackTraceLimit += 6;
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        var captureStackTrace = Error.captureStackTrace;

        shouldIgnore = function(line) {
          return bluebirdFramePattern.test(line);
        };
        return function(receiver, ignoreUntil) {
          Error.stackTraceLimit += 6;
          captureStackTrace(receiver, ignoreUntil);
          Error.stackTraceLimit -= 6;
        };
      }
      var err = new Error();

      if (typeof err.stack === "string" &&
        err.stack.split("\n")[0].indexOf("stackDetection@") >= 0) {
        stackFramePattern = /@/;
        formatStack = v8stackFormatter;
        indentStackFrames = true;
        return function captureStackTrace(o) {
          o.stack = new Error().stack;
        };
      }

      var hasStackAfterThrow;
      try { throw new Error(); }
      catch(e) {
        hasStackAfterThrow = ("stack" in e);
      }
      if (!("stack" in err) && hasStackAfterThrow &&
        typeof Error.stackTraceLimit === "number") {
        stackFramePattern = v8stackFramePattern;
        formatStack = v8stackFormatter;
        return function captureStackTrace(o) {
          Error.stackTraceLimit += 6;
          try { throw new Error(); }
          catch(e) { o.stack = e.stack; }
          Error.stackTraceLimit -= 6;
        };
      }

      formatStack = function(stack, error) {
        if (typeof stack === "string") return stack;

        if ((typeof error === "object" ||
            typeof error === "function") &&
          error.name !== undefined &&
          error.message !== undefined) {
          return error.toString();
        }
        return formatNonError(error);
      };

      return null;

    })([]);

    if (typeof console !== "undefined" && typeof console.warn !== "undefined") {
      printWarning = function (message) {
        console.warn(message);
      };
      if (util.isNode && process.stderr.isTTY) {
        printWarning = function(message, isSoft) {
          var color = isSoft ? "\u001b[33m" : "\u001b[31m";
          console.warn(color + message + "\u001b[0m\n");
        };
      } else if (!util.isNode && typeof (new Error().stack) === "string") {
        printWarning = function(message, isSoft) {
          console.warn("%c" + message,
            isSoft ? "color: darkorange" : "color: red");
        };
      }
    }

    var config = {
      warnings: warnings,
      longStackTraces: false,
      cancellation: false,
      monitoring: false
    };

    if (longStackTraces) Promise.longStackTraces();

    return {
      longStackTraces: function() {
        return config.longStackTraces;
      },
      warnings: function() {
        return config.warnings;
      },
      cancellation: function() {
        return config.cancellation;
      },
      monitoring: function() {
        return config.monitoring;
      },
      propagateFromFunction: function() {
        return propagateFromFunction;
      },
      boundValueFunction: function() {
        return boundValueFunction;
      },
      checkForgottenReturns: checkForgottenReturns,
      setBounds: setBounds,
      warn: warn,
      deprecated: deprecated,
      CapturedTrace: CapturedTrace,
      fireDomEvent: fireDomEvent,
      fireGlobalEvent: fireGlobalEvent
    };
  };

},{"./errors":12,"./es5":13,"./util":36}],10:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise) {
    function returner() {
      return this.value;
    }
    function thrower() {
      throw this.reason;
    }

    Promise.prototype["return"] =
      Promise.prototype.thenReturn = function (value) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
          returner, undefined, undefined, {value: value}, undefined);
      };

    Promise.prototype["throw"] =
      Promise.prototype.thenThrow = function (reason) {
        return this._then(
          thrower, undefined, undefined, {reason: reason}, undefined);
      };

    Promise.prototype.catchThrow = function (reason) {
      if (arguments.length <= 1) {
        return this._then(
          undefined, thrower, undefined, {reason: reason}, undefined);
      } else {
        var _reason = arguments[1];
        var handler = function() {throw _reason;};
        return this.caught(reason, handler);
      }
    };

    Promise.prototype.catchReturn = function (value) {
      if (arguments.length <= 1) {
        if (value instanceof Promise) value.suppressUnhandledRejections();
        return this._then(
          undefined, returner, undefined, {value: value}, undefined);
      } else {
        var _value = arguments[1];
        if (_value instanceof Promise) _value.suppressUnhandledRejections();
        var handler = function() {return _value;};
        return this.caught(value, handler);
      }
    };
  };

},{}],11:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL) {
    var PromiseReduce = Promise.reduce;
    var PromiseAll = Promise.all;

    function promiseAllThis() {
      return PromiseAll(this);
    }

    function PromiseMapSeries(promises, fn) {
      return PromiseReduce(promises, fn, INTERNAL, INTERNAL);
    }

    Promise.prototype.each = function (fn) {
      return PromiseReduce(this, fn, INTERNAL, 0)
        ._then(promiseAllThis, undefined, undefined, this, undefined);
    };

    Promise.prototype.mapSeries = function (fn) {
      return PromiseReduce(this, fn, INTERNAL, INTERNAL);
    };

    Promise.each = function (promises, fn) {
      return PromiseReduce(promises, fn, INTERNAL, 0)
        ._then(promiseAllThis, undefined, undefined, promises, undefined);
    };

    Promise.mapSeries = PromiseMapSeries;
  };


},{}],12:[function(_dereq_,module,exports){
  "use strict";
  var es5 = _dereq_("./es5");
  var Objectfreeze = es5.freeze;
  var util = _dereq_("./util");
  var inherits = util.inherits;
  var notEnumerableProp = util.notEnumerableProp;

  function subError(nameProperty, defaultMessage) {
    function SubError(message) {
      if (!(this instanceof SubError)) return new SubError(message);
      notEnumerableProp(this, "message",
        typeof message === "string" ? message : defaultMessage);
      notEnumerableProp(this, "name", nameProperty);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        Error.call(this);
      }
    }
    inherits(SubError, Error);
    return SubError;
  }

  var _TypeError, _RangeError;
  var Warning = subError("Warning", "warning");
  var CancellationError = subError("CancellationError", "cancellation error");
  var TimeoutError = subError("TimeoutError", "timeout error");
  var AggregateError = subError("AggregateError", "aggregate error");
  try {
    _TypeError = TypeError;
    _RangeError = RangeError;
  } catch(e) {
    _TypeError = subError("TypeError", "type error");
    _RangeError = subError("RangeError", "range error");
  }

  var methods = ("join pop push shift unshift slice filter forEach some " +
    "every map indexOf lastIndexOf reduce reduceRight sort reverse").split(" ");

  for (var i = 0; i < methods.length; ++i) {
    if (typeof Array.prototype[methods[i]] === "function") {
      AggregateError.prototype[methods[i]] = Array.prototype[methods[i]];
    }
  }

  es5.defineProperty(AggregateError.prototype, "length", {
    value: 0,
    configurable: false,
    writable: true,
    enumerable: true
  });
  AggregateError.prototype["isOperational"] = true;
  var level = 0;
  AggregateError.prototype.toString = function() {
    var indent = Array(level * 4 + 1).join(" ");
    var ret = "\n" + indent + "AggregateError of:" + "\n";
    level++;
    indent = Array(level * 4 + 1).join(" ");
    for (var i = 0; i < this.length; ++i) {
      var str = this[i] === this ? "[Circular AggregateError]" : this[i] + "";
      var lines = str.split("\n");
      for (var j = 0; j < lines.length; ++j) {
        lines[j] = indent + lines[j];
      }
      str = lines.join("\n");
      ret += str + "\n";
    }
    level--;
    return ret;
  };

  function OperationalError(message) {
    if (!(this instanceof OperationalError))
      return new OperationalError(message);
    notEnumerableProp(this, "name", "OperationalError");
    notEnumerableProp(this, "message", message);
    this.cause = message;
    this["isOperational"] = true;

    if (message instanceof Error) {
      notEnumerableProp(this, "message", message.message);
      notEnumerableProp(this, "stack", message.stack);
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

  }
  inherits(OperationalError, Error);

  var errorTypes = Error["__BluebirdErrorTypes__"];
  if (!errorTypes) {
    errorTypes = Objectfreeze({
      CancellationError: CancellationError,
      TimeoutError: TimeoutError,
      OperationalError: OperationalError,
      RejectionError: OperationalError,
      AggregateError: AggregateError
    });
    es5.defineProperty(Error, "__BluebirdErrorTypes__", {
      value: errorTypes,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }

  module.exports = {
    Error: Error,
    TypeError: _TypeError,
    RangeError: _RangeError,
    CancellationError: errorTypes.CancellationError,
    OperationalError: errorTypes.OperationalError,
    TimeoutError: errorTypes.TimeoutError,
    AggregateError: errorTypes.AggregateError,
    Warning: Warning
  };

},{"./es5":13,"./util":36}],13:[function(_dereq_,module,exports){
  var isES5 = (function(){
    "use strict";
    return this === undefined;
  })();

  if (isES5) {
    module.exports = {
      freeze: Object.freeze,
      defineProperty: Object.defineProperty,
      getDescriptor: Object.getOwnPropertyDescriptor,
      keys: Object.keys,
      names: Object.getOwnPropertyNames,
      getPrototypeOf: Object.getPrototypeOf,
      isArray: Array.isArray,
      isES5: isES5,
      propertyIsWritable: function(obj, prop) {
        var descriptor = Object.getOwnPropertyDescriptor(obj, prop);
        return !!(!descriptor || descriptor.writable || descriptor.set);
      }
    };
  } else {
    var has = {}.hasOwnProperty;
    var str = {}.toString;
    var proto = {}.constructor.prototype;

    var ObjectKeys = function (o) {
      var ret = [];
      for (var key in o) {
        if (has.call(o, key)) {
          ret.push(key);
        }
      }
      return ret;
    };

    var ObjectGetDescriptor = function(o, key) {
      return {value: o[key]};
    };

    var ObjectDefineProperty = function (o, key, desc) {
      o[key] = desc.value;
      return o;
    };

    var ObjectFreeze = function (obj) {
      return obj;
    };

    var ObjectGetPrototypeOf = function (obj) {
      try {
        return Object(obj).constructor.prototype;
      }
      catch (e) {
        return proto;
      }
    };

    var ArrayIsArray = function (obj) {
      try {
        return str.call(obj) === "[object Array]";
      }
      catch(e) {
        return false;
      }
    };

    module.exports = {
      isArray: ArrayIsArray,
      keys: ObjectKeys,
      names: ObjectKeys,
      defineProperty: ObjectDefineProperty,
      getDescriptor: ObjectGetDescriptor,
      freeze: ObjectFreeze,
      getPrototypeOf: ObjectGetPrototypeOf,
      isES5: isES5,
      propertyIsWritable: function() {
        return true;
      }
    };
  }

},{}],14:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL) {
    var PromiseMap = Promise.map;

    Promise.prototype.filter = function (fn, options) {
      return PromiseMap(this, fn, options, INTERNAL);
    };

    Promise.filter = function (promises, fn, options) {
      return PromiseMap(promises, fn, options, INTERNAL);
    };
  };

},{}],15:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, tryConvertToPromise, NEXT_FILTER) {
    var util = _dereq_("./util");
    var CancellationError = Promise.CancellationError;
    var errorObj = util.errorObj;
    var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);

    function PassThroughHandlerContext(promise, type, handler) {
      this.promise = promise;
      this.type = type;
      this.handler = handler;
      this.called = false;
      this.cancelPromise = null;
    }

    PassThroughHandlerContext.prototype.isFinallyHandler = function() {
      return this.type === 0;
    };

    function FinallyHandlerCancelReaction(finallyHandler) {
      this.finallyHandler = finallyHandler;
    }

    FinallyHandlerCancelReaction.prototype._resultCancelled = function() {
      checkCancel(this.finallyHandler);
    };

    function checkCancel(ctx, reason) {
      if (ctx.cancelPromise != null) {
        if (arguments.length > 1) {
          ctx.cancelPromise._reject(reason);
        } else {
          ctx.cancelPromise._cancel();
        }
        ctx.cancelPromise = null;
        return true;
      }
      return false;
    }

    function succeed() {
      return finallyHandler.call(this, this.promise._target()._settledValue());
    }
    function fail(reason) {
      if (checkCancel(this, reason)) return;
      errorObj.e = reason;
      return errorObj;
    }
    function finallyHandler(reasonOrValue) {
      var promise = this.promise;
      var handler = this.handler;

      if (!this.called) {
        this.called = true;
        var ret = this.isFinallyHandler()
          ? handler.call(promise._boundValue())
          : handler.call(promise._boundValue(), reasonOrValue);
        if (ret === NEXT_FILTER) {
          return ret;
        } else if (ret !== undefined) {
          promise._setReturnedNonUndefined();
          var maybePromise = tryConvertToPromise(ret, promise);
          if (maybePromise instanceof Promise) {
            if (this.cancelPromise != null) {
              if (maybePromise._isCancelled()) {
                var reason =
                  new CancellationError("late cancellation observer");
                promise._attachExtraTrace(reason);
                errorObj.e = reason;
                return errorObj;
              } else if (maybePromise.isPending()) {
                maybePromise._attachCancellationCallback(
                  new FinallyHandlerCancelReaction(this));
              }
            }
            return maybePromise._then(
              succeed, fail, undefined, this, undefined);
          }
        }
      }

      if (promise.isRejected()) {
        checkCancel(this);
        errorObj.e = reasonOrValue;
        return errorObj;
      } else {
        checkCancel(this);
        return reasonOrValue;
      }
    }

    Promise.prototype._passThrough = function(handler, type, success, fail) {
      if (typeof handler !== "function") return this.then();
      return this._then(success,
        fail,
        undefined,
        new PassThroughHandlerContext(this, type, handler),
        undefined);
    };

    Promise.prototype.lastly =
      Promise.prototype["finally"] = function (handler) {
        return this._passThrough(handler,
          0,
          finallyHandler,
          finallyHandler);
      };


    Promise.prototype.tap = function (handler) {
      return this._passThrough(handler, 1, finallyHandler);
    };

    Promise.prototype.tapCatch = function (handlerOrPredicate) {
      var len = arguments.length;
      if(len === 1) {
        return this._passThrough(handlerOrPredicate,
          1,
          undefined,
          finallyHandler);
      } else {
        var catchInstances = new Array(len - 1),
          j = 0, i;
        for (i = 0; i < len - 1; ++i) {
          var item = arguments[i];
          if (util.isObject(item)) {
            catchInstances[j++] = item;
          } else {
            return Promise.reject(new TypeError(
              "tapCatch statement predicate: "
              + "expecting an object but got " + util.classString(item)
            ));
          }
        }
        catchInstances.length = j;
        var handler = arguments[i];
        return this._passThrough(catchFilter(catchInstances, handler, this),
          1,
          undefined,
          finallyHandler);
      }

    };

    return PassThroughHandlerContext;
  };

},{"./catch_filter":7,"./util":36}],16:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise,
                            apiRejection,
                            INTERNAL,
                            tryConvertToPromise,
                            Proxyable,
                            debug) {
    var errors = _dereq_("./errors");
    var TypeError = errors.TypeError;
    var util = _dereq_("./util");
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    var yieldHandlers = [];

    function promiseFromYieldHandler(value, yieldHandlers, traceParent) {
      for (var i = 0; i < yieldHandlers.length; ++i) {
        traceParent._pushContext();
        var result = tryCatch(yieldHandlers[i])(value);
        traceParent._popContext();
        if (result === errorObj) {
          traceParent._pushContext();
          var ret = Promise.reject(errorObj.e);
          traceParent._popContext();
          return ret;
        }
        var maybePromise = tryConvertToPromise(result, traceParent);
        if (maybePromise instanceof Promise) return maybePromise;
      }
      return null;
    }

    function PromiseSpawn(generatorFunction, receiver, yieldHandler, stack) {
      if (debug.cancellation()) {
        var internal = new Promise(INTERNAL);
        var _finallyPromise = this._finallyPromise = new Promise(INTERNAL);
        this._promise = internal.lastly(function() {
          return _finallyPromise;
        });
        internal._captureStackTrace();
        internal._setOnCancel(this);
      } else {
        var promise = this._promise = new Promise(INTERNAL);
        promise._captureStackTrace();
      }
      this._stack = stack;
      this._generatorFunction = generatorFunction;
      this._receiver = receiver;
      this._generator = undefined;
      this._yieldHandlers = typeof yieldHandler === "function"
        ? [yieldHandler].concat(yieldHandlers)
        : yieldHandlers;
      this._yieldedPromise = null;
      this._cancellationPhase = false;
    }
    util.inherits(PromiseSpawn, Proxyable);

    PromiseSpawn.prototype._isResolved = function() {
      return this._promise === null;
    };

    PromiseSpawn.prototype._cleanup = function() {
      this._promise = this._generator = null;
      if (debug.cancellation() && this._finallyPromise !== null) {
        this._finallyPromise._fulfill();
        this._finallyPromise = null;
      }
    };

    PromiseSpawn.prototype._promiseCancelled = function() {
      if (this._isResolved()) return;
      var implementsReturn = typeof this._generator["return"] !== "undefined";

      var result;
      if (!implementsReturn) {
        var reason = new Promise.CancellationError(
          "generator .return() sentinel");
        Promise.coroutine.returnSentinel = reason;
        this._promise._attachExtraTrace(reason);
        this._promise._pushContext();
        result = tryCatch(this._generator["throw"]).call(this._generator,
          reason);
        this._promise._popContext();
      } else {
        this._promise._pushContext();
        result = tryCatch(this._generator["return"]).call(this._generator,
          undefined);
        this._promise._popContext();
      }
      this._cancellationPhase = true;
      this._yieldedPromise = null;
      this._continue(result);
    };

    PromiseSpawn.prototype._promiseFulfilled = function(value) {
      this._yieldedPromise = null;
      this._promise._pushContext();
      var result = tryCatch(this._generator.next).call(this._generator, value);
      this._promise._popContext();
      this._continue(result);
    };

    PromiseSpawn.prototype._promiseRejected = function(reason) {
      this._yieldedPromise = null;
      this._promise._attachExtraTrace(reason);
      this._promise._pushContext();
      var result = tryCatch(this._generator["throw"])
        .call(this._generator, reason);
      this._promise._popContext();
      this._continue(result);
    };

    PromiseSpawn.prototype._resultCancelled = function() {
      if (this._yieldedPromise instanceof Promise) {
        var promise = this._yieldedPromise;
        this._yieldedPromise = null;
        promise.cancel();
      }
    };

    PromiseSpawn.prototype.promise = function () {
      return this._promise;
    };

    PromiseSpawn.prototype._run = function () {
      this._generator = this._generatorFunction.call(this._receiver);
      this._receiver =
        this._generatorFunction = undefined;
      this._promiseFulfilled(undefined);
    };

    PromiseSpawn.prototype._continue = function (result) {
      var promise = this._promise;
      if (result === errorObj) {
        this._cleanup();
        if (this._cancellationPhase) {
          return promise.cancel();
        } else {
          return promise._rejectCallback(result.e, false);
        }
      }

      var value = result.value;
      if (result.done === true) {
        this._cleanup();
        if (this._cancellationPhase) {
          return promise.cancel();
        } else {
          return promise._resolveCallback(value);
        }
      } else {
        var maybePromise = tryConvertToPromise(value, this._promise);
        if (!(maybePromise instanceof Promise)) {
          maybePromise =
            promiseFromYieldHandler(maybePromise,
              this._yieldHandlers,
              this._promise);
          if (maybePromise === null) {
            this._promiseRejected(
              new TypeError(
                "A value %s was yielded that could not be treated as a promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a\u000a".replace("%s", String(value)) +
                "From coroutine:\u000a" +
                this._stack.split("\n").slice(1, -7).join("\n")
              )
            );
            return;
          }
        }
        maybePromise = maybePromise._target();
        var bitField = maybePromise._bitField;
        ;
        if (((bitField & 50397184) === 0)) {
          this._yieldedPromise = maybePromise;
          maybePromise._proxy(this, null);
        } else if (((bitField & 33554432) !== 0)) {
          Promise._async.invoke(
            this._promiseFulfilled, this, maybePromise._value()
          );
        } else if (((bitField & 16777216) !== 0)) {
          Promise._async.invoke(
            this._promiseRejected, this, maybePromise._reason()
          );
        } else {
          this._promiseCancelled();
        }
      }
    };

    Promise.coroutine = function (generatorFunction, options) {
      if (typeof generatorFunction !== "function") {
        throw new TypeError("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }
      var yieldHandler = Object(options).yieldHandler;
      var PromiseSpawn$ = PromiseSpawn;
      var stack = new Error().stack;
      return function () {
        var generator = generatorFunction.apply(this, arguments);
        var spawn = new PromiseSpawn$(undefined, undefined, yieldHandler,
          stack);
        var ret = spawn.promise();
        spawn._generator = generator;
        spawn._promiseFulfilled(undefined);
        return ret;
      };
    };

    Promise.coroutine.addYieldHandler = function(fn) {
      if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
      }
      yieldHandlers.push(fn);
    };

    Promise.spawn = function (generatorFunction) {
      debug.deprecated("Promise.spawn()", "Promise.coroutine()");
      if (typeof generatorFunction !== "function") {
        return apiRejection("generatorFunction must be a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }
      var spawn = new PromiseSpawn(generatorFunction, this);
      var ret = spawn.promise();
      spawn._run(Promise.spawn);
      return ret;
    };
  };

},{"./errors":12,"./util":36}],17:[function(_dereq_,module,exports){
  "use strict";
  module.exports =
    function(Promise, PromiseArray, tryConvertToPromise, INTERNAL, async,
             getDomain) {
      var util = _dereq_("./util");
      var canEvaluate = util.canEvaluate;
      var tryCatch = util.tryCatch;
      var errorObj = util.errorObj;
      var reject;

      if (!true) {
        if (canEvaluate) {
          var thenCallback = function(i) {
            return new Function("value", "holder", "                             \n\
            'use strict';                                                    \n\
            holder.pIndex = value;                                           \n\
            holder.checkFulfillment(this);                                   \n\
            ".replace(/Index/g, i));
          };

          var promiseSetter = function(i) {
            return new Function("promise", "holder", "                           \n\
            'use strict';                                                    \n\
            holder.pIndex = promise;                                         \n\
            ".replace(/Index/g, i));
          };

          var generateHolderClass = function(total) {
            var props = new Array(total);
            for (var i = 0; i < props.length; ++i) {
              props[i] = "this.p" + (i+1);
            }
            var assignment = props.join(" = ") + " = null;";
            var cancellationCode= "var promise;\n" + props.map(function(prop) {
              return "                                                         \n\
                promise = " + prop + ";                                      \n\
                if (promise instanceof Promise) {                            \n\
                    promise.cancel();                                        \n\
                }                                                            \n\
            ";
            }).join("\n");
            var passedArguments = props.join(", ");
            var name = "Holder$" + total;


            var code = "return function(tryCatch, errorObj, Promise, async) {    \n\
            'use strict';                                                    \n\
            function [TheName](fn) {                                         \n\
                [TheProperties]                                              \n\
                this.fn = fn;                                                \n\
                this.asyncNeeded = true;                                     \n\
                this.now = 0;                                                \n\
            }                                                                \n\
                                                                             \n\
            [TheName].prototype._callFunction = function(promise) {          \n\
                promise._pushContext();                                      \n\
                var ret = tryCatch(this.fn)([ThePassedArguments]);           \n\
                promise._popContext();                                       \n\
                if (ret === errorObj) {                                      \n\
                    promise._rejectCallback(ret.e, false);                   \n\
                } else {                                                     \n\
                    promise._resolveCallback(ret);                           \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype.checkFulfillment = function(promise) {       \n\
                var now = ++this.now;                                        \n\
                if (now === [TheTotal]) {                                    \n\
                    if (this.asyncNeeded) {                                  \n\
                        async.invoke(this._callFunction, this, promise);     \n\
                    } else {                                                 \n\
                        this._callFunction(promise);                         \n\
                    }                                                        \n\
                                                                             \n\
                }                                                            \n\
            };                                                               \n\
                                                                             \n\
            [TheName].prototype._resultCancelled = function() {              \n\
                [CancellationCode]                                           \n\
            };                                                               \n\
                                                                             \n\
            return [TheName];                                                \n\
        }(tryCatch, errorObj, Promise, async);                               \n\
        ";

            code = code.replace(/\[TheName\]/g, name)
              .replace(/\[TheTotal\]/g, total)
              .replace(/\[ThePassedArguments\]/g, passedArguments)
              .replace(/\[TheProperties\]/g, assignment)
              .replace(/\[CancellationCode\]/g, cancellationCode);

            return new Function("tryCatch", "errorObj", "Promise", "async", code)
            (tryCatch, errorObj, Promise, async);
          };

          var holderClasses = [];
          var thenCallbacks = [];
          var promiseSetters = [];

          for (var i = 0; i < 8; ++i) {
            holderClasses.push(generateHolderClass(i + 1));
            thenCallbacks.push(thenCallback(i + 1));
            promiseSetters.push(promiseSetter(i + 1));
          }

          reject = function (reason) {
            this._reject(reason);
          };
        }}

      Promise.join = function () {
        var last = arguments.length - 1;
        var fn;
        if (last > 0 && typeof arguments[last] === "function") {
          fn = arguments[last];
          if (!true) {
            if (last <= 8 && canEvaluate) {
              var ret = new Promise(INTERNAL);
              ret._captureStackTrace();
              var HolderClass = holderClasses[last - 1];
              var holder = new HolderClass(fn);
              var callbacks = thenCallbacks;

              for (var i = 0; i < last; ++i) {
                var maybePromise = tryConvertToPromise(arguments[i], ret);
                if (maybePromise instanceof Promise) {
                  maybePromise = maybePromise._target();
                  var bitField = maybePromise._bitField;
                  ;
                  if (((bitField & 50397184) === 0)) {
                    maybePromise._then(callbacks[i], reject,
                      undefined, ret, holder);
                    promiseSetters[i](maybePromise, holder);
                    holder.asyncNeeded = false;
                  } else if (((bitField & 33554432) !== 0)) {
                    callbacks[i].call(ret,
                      maybePromise._value(), holder);
                  } else if (((bitField & 16777216) !== 0)) {
                    ret._reject(maybePromise._reason());
                  } else {
                    ret._cancel();
                  }
                } else {
                  callbacks[i].call(ret, maybePromise, holder);
                }
              }

              if (!ret._isFateSealed()) {
                if (holder.asyncNeeded) {
                  var domain = getDomain();
                  if (domain !== null) {
                    holder.fn = util.domainBind(domain, holder.fn);
                  }
                }
                ret._setAsyncGuaranteed();
                ret._setOnCancel(holder);
              }
              return ret;
            }
          }
        }
        var args = [].slice.call(arguments);;
        if (fn) args.pop();
        var ret = new PromiseArray(args).promise();
        return fn !== undefined ? ret.spread(fn) : ret;
      };

    };

},{"./util":36}],18:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise,
                            PromiseArray,
                            apiRejection,
                            tryConvertToPromise,
                            INTERNAL,
                            debug) {
    var getDomain = Promise._getDomain;
    var util = _dereq_("./util");
    var tryCatch = util.tryCatch;
    var errorObj = util.errorObj;
    var async = Promise._async;

    function MappingPromiseArray(promises, fn, limit, _filter) {
      this.constructor$(promises);
      this._promise._captureStackTrace();
      var domain = getDomain();
      this._callback = domain === null ? fn : util.domainBind(domain, fn);
      this._preservedValues = _filter === INTERNAL
        ? new Array(this.length())
        : null;
      this._limit = limit;
      this._inFlight = 0;
      this._queue = [];
      async.invoke(this._asyncInit, this, undefined);
    }
    util.inherits(MappingPromiseArray, PromiseArray);

    MappingPromiseArray.prototype._asyncInit = function() {
      this._init$(undefined, -2);
    };

    MappingPromiseArray.prototype._init = function () {};

    MappingPromiseArray.prototype._promiseFulfilled = function (value, index) {
      var values = this._values;
      var length = this.length();
      var preservedValues = this._preservedValues;
      var limit = this._limit;

      if (index < 0) {
        index = (index * -1) - 1;
        values[index] = value;
        if (limit >= 1) {
          this._inFlight--;
          this._drainQueue();
          if (this._isResolved()) return true;
        }
      } else {
        if (limit >= 1 && this._inFlight >= limit) {
          values[index] = value;
          this._queue.push(index);
          return false;
        }
        if (preservedValues !== null) preservedValues[index] = value;

        var promise = this._promise;
        var callback = this._callback;
        var receiver = promise._boundValue();
        promise._pushContext();
        var ret = tryCatch(callback).call(receiver, value, index, length);
        var promiseCreated = promise._popContext();
        debug.checkForgottenReturns(
          ret,
          promiseCreated,
          preservedValues !== null ? "Promise.filter" : "Promise.map",
          promise
        );
        if (ret === errorObj) {
          this._reject(ret.e);
          return true;
        }

        var maybePromise = tryConvertToPromise(ret, this._promise);
        if (maybePromise instanceof Promise) {
          maybePromise = maybePromise._target();
          var bitField = maybePromise._bitField;
          ;
          if (((bitField & 50397184) === 0)) {
            if (limit >= 1) this._inFlight++;
            values[index] = maybePromise;
            maybePromise._proxy(this, (index + 1) * -1);
            return false;
          } else if (((bitField & 33554432) !== 0)) {
            ret = maybePromise._value();
          } else if (((bitField & 16777216) !== 0)) {
            this._reject(maybePromise._reason());
            return true;
          } else {
            this._cancel();
            return true;
          }
        }
        values[index] = ret;
      }
      var totalResolved = ++this._totalResolved;
      if (totalResolved >= length) {
        if (preservedValues !== null) {
          this._filter(values, preservedValues);
        } else {
          this._resolve(values);
        }
        return true;
      }
      return false;
    };

    MappingPromiseArray.prototype._drainQueue = function () {
      var queue = this._queue;
      var limit = this._limit;
      var values = this._values;
      while (queue.length > 0 && this._inFlight < limit) {
        if (this._isResolved()) return;
        var index = queue.pop();
        this._promiseFulfilled(values[index], index);
      }
    };

    MappingPromiseArray.prototype._filter = function (booleans, values) {
      var len = values.length;
      var ret = new Array(len);
      var j = 0;
      for (var i = 0; i < len; ++i) {
        if (booleans[i]) ret[j++] = values[i];
      }
      ret.length = j;
      this._resolve(ret);
    };

    MappingPromiseArray.prototype.preservedValues = function () {
      return this._preservedValues;
    };

    function map(promises, fn, options, _filter) {
      if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
      }

      var limit = 0;
      if (options !== undefined) {
        if (typeof options === "object" && options !== null) {
          if (typeof options.concurrency !== "number") {
            return Promise.reject(
              new TypeError("'concurrency' must be a number but it is " +
                util.classString(options.concurrency)));
          }
          limit = options.concurrency;
        } else {
          return Promise.reject(new TypeError(
            "options argument must be an object but it is " +
            util.classString(options)));
        }
      }
      limit = typeof limit === "number" &&
      isFinite(limit) && limit >= 1 ? limit : 0;
      return new MappingPromiseArray(promises, fn, limit, _filter).promise();
    }

    Promise.prototype.map = function (fn, options) {
      return map(this, fn, options, null);
    };

    Promise.map = function (promises, fn, options, _filter) {
      return map(promises, fn, options, _filter);
    };


  };

},{"./util":36}],19:[function(_dereq_,module,exports){
  "use strict";
  module.exports =
    function(Promise, INTERNAL, tryConvertToPromise, apiRejection, debug) {
      var util = _dereq_("./util");
      var tryCatch = util.tryCatch;

      Promise.method = function (fn) {
        if (typeof fn !== "function") {
          throw new Promise.TypeError("expecting a function but got " + util.classString(fn));
        }
        return function () {
          var ret = new Promise(INTERNAL);
          ret._captureStackTrace();
          ret._pushContext();
          var value = tryCatch(fn).apply(this, arguments);
          var promiseCreated = ret._popContext();
          debug.checkForgottenReturns(
            value, promiseCreated, "Promise.method", ret);
          ret._resolveFromSyncValue(value);
          return ret;
        };
      };

      Promise.attempt = Promise["try"] = function (fn) {
        if (typeof fn !== "function") {
          return apiRejection("expecting a function but got " + util.classString(fn));
        }
        var ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._pushContext();
        var value;
        if (arguments.length > 1) {
          debug.deprecated("calling Promise.try with more than 1 argument");
          var arg = arguments[1];
          var ctx = arguments[2];
          value = util.isArray(arg) ? tryCatch(fn).apply(ctx, arg)
            : tryCatch(fn).call(ctx, arg);
        } else {
          value = tryCatch(fn)();
        }
        var promiseCreated = ret._popContext();
        debug.checkForgottenReturns(
          value, promiseCreated, "Promise.try", ret);
        ret._resolveFromSyncValue(value);
        return ret;
      };

      Promise.prototype._resolveFromSyncValue = function (value) {
        if (value === util.errorObj) {
          this._rejectCallback(value.e, false);
        } else {
          this._resolveCallback(value, true);
        }
      };
    };

},{"./util":36}],20:[function(_dereq_,module,exports){
  "use strict";
  var util = _dereq_("./util");
  var maybeWrapAsError = util.maybeWrapAsError;
  var errors = _dereq_("./errors");
  var OperationalError = errors.OperationalError;
  var es5 = _dereq_("./es5");

  function isUntypedError(obj) {
    return obj instanceof Error &&
      es5.getPrototypeOf(obj) === Error.prototype;
  }

  var rErrorKey = /^(?:name|message|stack|cause)$/;
  function wrapAsOperationalError(obj) {
    var ret;
    if (isUntypedError(obj)) {
      ret = new OperationalError(obj);
      ret.name = obj.name;
      ret.message = obj.message;
      ret.stack = obj.stack;
      var keys = es5.keys(obj);
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (!rErrorKey.test(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
    util.markAsOriginatingFromRejection(obj);
    return obj;
  }

  function nodebackForPromise(promise, multiArgs) {
    return function(err, value) {
      if (promise === null) return;
      if (err) {
        var wrapped = wrapAsOperationalError(maybeWrapAsError(err));
        promise._attachExtraTrace(wrapped);
        promise._reject(wrapped);
      } else if (!multiArgs) {
        promise._fulfill(value);
      } else {
        var args = [].slice.call(arguments, 1);;
        promise._fulfill(args);
      }
      promise = null;
    };
  }

  module.exports = nodebackForPromise;

},{"./errors":12,"./es5":13,"./util":36}],21:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise) {
    var util = _dereq_("./util");
    var async = Promise._async;
    var tryCatch = util.tryCatch;
    var errorObj = util.errorObj;

    function spreadAdapter(val, nodeback) {
      var promise = this;
      if (!util.isArray(val)) return successAdapter.call(promise, val, nodeback);
      var ret =
        tryCatch(nodeback).apply(promise._boundValue(), [null].concat(val));
      if (ret === errorObj) {
        async.throwLater(ret.e);
      }
    }

    function successAdapter(val, nodeback) {
      var promise = this;
      var receiver = promise._boundValue();
      var ret = val === undefined
        ? tryCatch(nodeback).call(receiver, null)
        : tryCatch(nodeback).call(receiver, null, val);
      if (ret === errorObj) {
        async.throwLater(ret.e);
      }
    }
    function errorAdapter(reason, nodeback) {
      var promise = this;
      if (!reason) {
        var newReason = new Error(reason + "");
        newReason.cause = reason;
        reason = newReason;
      }
      var ret = tryCatch(nodeback).call(promise._boundValue(), reason);
      if (ret === errorObj) {
        async.throwLater(ret.e);
      }
    }

    Promise.prototype.asCallback = Promise.prototype.nodeify = function (nodeback,
                                                                         options) {
      if (typeof nodeback == "function") {
        var adapter = successAdapter;
        if (options !== undefined && Object(options).spread) {
          adapter = spreadAdapter;
        }
        this._then(
          adapter,
          errorAdapter,
          undefined,
          this,
          nodeback
        );
      }
      return this;
    };
  };

},{"./util":36}],22:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function() {
    var makeSelfResolutionError = function () {
      return new TypeError("circular promise resolution chain\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
    };
    var reflectHandler = function() {
      return new Promise.PromiseInspection(this._target());
    };
    var apiRejection = function(msg) {
      return Promise.reject(new TypeError(msg));
    };
    function Proxyable() {}
    var UNDEFINED_BINDING = {};
    var util = _dereq_("./util");

    var getDomain;
    if (util.isNode) {
      getDomain = function() {
        var ret = process.domain;
        if (ret === undefined) ret = null;
        return ret;
      };
    } else {
      getDomain = function() {
        return null;
      };
    }
    util.notEnumerableProp(Promise, "_getDomain", getDomain);

    var es5 = _dereq_("./es5");
    var Async = _dereq_("./async");
    var async = new Async();
    es5.defineProperty(Promise, "_async", {value: async});
    var errors = _dereq_("./errors");
    var TypeError = Promise.TypeError = errors.TypeError;
    Promise.RangeError = errors.RangeError;
    var CancellationError = Promise.CancellationError = errors.CancellationError;
    Promise.TimeoutError = errors.TimeoutError;
    Promise.OperationalError = errors.OperationalError;
    Promise.RejectionError = errors.OperationalError;
    Promise.AggregateError = errors.AggregateError;
    var INTERNAL = function(){};
    var APPLY = {};
    var NEXT_FILTER = {};
    var tryConvertToPromise = _dereq_("./thenables")(Promise, INTERNAL);
    var PromiseArray =
      _dereq_("./promise_array")(Promise, INTERNAL,
        tryConvertToPromise, apiRejection, Proxyable);
    var Context = _dereq_("./context")(Promise);
    /*jshint unused:false*/
    var createContext = Context.create;
    var debug = _dereq_("./debuggability")(Promise, Context);
    var CapturedTrace = debug.CapturedTrace;
    var PassThroughHandlerContext =
      _dereq_("./finally")(Promise, tryConvertToPromise, NEXT_FILTER);
    var catchFilter = _dereq_("./catch_filter")(NEXT_FILTER);
    var nodebackForPromise = _dereq_("./nodeback");
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    function check(self, executor) {
      if (self == null || self.constructor !== Promise) {
        throw new TypeError("the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }
      if (typeof executor !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(executor));
      }

    }

    function Promise(executor) {
      if (executor !== INTERNAL) {
        check(this, executor);
      }
      this._bitField = 0;
      this._fulfillmentHandler0 = undefined;
      this._rejectionHandler0 = undefined;
      this._promise0 = undefined;
      this._receiver0 = undefined;
      this._resolveFromExecutor(executor);
      this._promiseCreated();
      this._fireEvent("promiseCreated", this);
    }

    Promise.prototype.toString = function () {
      return "[object Promise]";
    };

    Promise.prototype.caught = Promise.prototype["catch"] = function (fn) {
      var len = arguments.length;
      if (len > 1) {
        var catchInstances = new Array(len - 1),
          j = 0, i;
        for (i = 0; i < len - 1; ++i) {
          var item = arguments[i];
          if (util.isObject(item)) {
            catchInstances[j++] = item;
          } else {
            return apiRejection("Catch statement predicate: " +
              "expecting an object but got " + util.classString(item));
          }
        }
        catchInstances.length = j;
        fn = arguments[i];
        return this.then(undefined, catchFilter(catchInstances, fn, this));
      }
      return this.then(undefined, fn);
    };

    Promise.prototype.reflect = function () {
      return this._then(reflectHandler,
        reflectHandler, undefined, this, undefined);
    };

    Promise.prototype.then = function (didFulfill, didReject) {
      if (debug.warnings() && arguments.length > 0 &&
        typeof didFulfill !== "function" &&
        typeof didReject !== "function") {
        var msg = ".then() only accepts functions but was passed: " +
          util.classString(didFulfill);
        if (arguments.length > 1) {
          msg += ", " + util.classString(didReject);
        }
        this._warn(msg);
      }
      return this._then(didFulfill, didReject, undefined, undefined, undefined);
    };

    Promise.prototype.done = function (didFulfill, didReject) {
      var promise =
        this._then(didFulfill, didReject, undefined, undefined, undefined);
      promise._setIsFinal();
    };

    Promise.prototype.spread = function (fn) {
      if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
      }
      return this.all()._then(fn, undefined, undefined, APPLY, undefined);
    };

    Promise.prototype.toJSON = function () {
      var ret = {
        isFulfilled: false,
        isRejected: false,
        fulfillmentValue: undefined,
        rejectionReason: undefined
      };
      if (this.isFulfilled()) {
        ret.fulfillmentValue = this.value();
        ret.isFulfilled = true;
      } else if (this.isRejected()) {
        ret.rejectionReason = this.reason();
        ret.isRejected = true;
      }
      return ret;
    };

    Promise.prototype.all = function () {
      if (arguments.length > 0) {
        this._warn(".all() was passed arguments but it does not take any");
      }
      return new PromiseArray(this).promise();
    };

    Promise.prototype.error = function (fn) {
      return this.caught(util.originatesFromRejection, fn);
    };

    Promise.getNewLibraryCopy = module.exports;

    Promise.is = function (val) {
      return val instanceof Promise;
    };

    Promise.fromNode = Promise.fromCallback = function(fn) {
      var ret = new Promise(INTERNAL);
      ret._captureStackTrace();
      var multiArgs = arguments.length > 1 ? !!Object(arguments[1]).multiArgs
        : false;
      var result = tryCatch(fn)(nodebackForPromise(ret, multiArgs));
      if (result === errorObj) {
        ret._rejectCallback(result.e, true);
      }
      if (!ret._isFateSealed()) ret._setAsyncGuaranteed();
      return ret;
    };

    Promise.all = function (promises) {
      return new PromiseArray(promises).promise();
    };

    Promise.cast = function (obj) {
      var ret = tryConvertToPromise(obj);
      if (!(ret instanceof Promise)) {
        ret = new Promise(INTERNAL);
        ret._captureStackTrace();
        ret._setFulfilled();
        ret._rejectionHandler0 = obj;
      }
      return ret;
    };

    Promise.resolve = Promise.fulfilled = Promise.cast;

    Promise.reject = Promise.rejected = function (reason) {
      var ret = new Promise(INTERNAL);
      ret._captureStackTrace();
      ret._rejectCallback(reason, true);
      return ret;
    };

    Promise.setScheduler = function(fn) {
      if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
      }
      return async.setScheduler(fn);
    };

    Promise.prototype._then = function (
      didFulfill,
      didReject,
      _,    receiver,
      internalData
    ) {
      var haveInternalData = internalData !== undefined;
      var promise = haveInternalData ? internalData : new Promise(INTERNAL);
      var target = this._target();
      var bitField = target._bitField;

      if (!haveInternalData) {
        promise._propagateFrom(this, 3);
        promise._captureStackTrace();
        if (receiver === undefined &&
          ((this._bitField & 2097152) !== 0)) {
          if (!((bitField & 50397184) === 0)) {
            receiver = this._boundValue();
          } else {
            receiver = target === this ? undefined : this._boundTo;
          }
        }
        this._fireEvent("promiseChained", this, promise);
      }

      var domain = getDomain();
      if (!((bitField & 50397184) === 0)) {
        var handler, value, settler = target._settlePromiseCtx;
        if (((bitField & 33554432) !== 0)) {
          value = target._rejectionHandler0;
          handler = didFulfill;
        } else if (((bitField & 16777216) !== 0)) {
          value = target._fulfillmentHandler0;
          handler = didReject;
          target._unsetRejectionIsUnhandled();
        } else {
          settler = target._settlePromiseLateCancellationObserver;
          value = new CancellationError("late cancellation observer");
          target._attachExtraTrace(value);
          handler = didReject;
        }

        async.invoke(settler, target, {
          handler: domain === null ? handler
            : (typeof handler === "function" &&
              util.domainBind(domain, handler)),
          promise: promise,
          receiver: receiver,
          value: value
        });
      } else {
        target._addCallbacks(didFulfill, didReject, promise, receiver, domain);
      }

      return promise;
    };

    Promise.prototype._length = function () {
      return this._bitField & 65535;
    };

    Promise.prototype._isFateSealed = function () {
      return (this._bitField & 117506048) !== 0;
    };

    Promise.prototype._isFollowing = function () {
      return (this._bitField & 67108864) === 67108864;
    };

    Promise.prototype._setLength = function (len) {
      this._bitField = (this._bitField & -65536) |
        (len & 65535);
    };

    Promise.prototype._setFulfilled = function () {
      this._bitField = this._bitField | 33554432;
      this._fireEvent("promiseFulfilled", this);
    };

    Promise.prototype._setRejected = function () {
      this._bitField = this._bitField | 16777216;
      this._fireEvent("promiseRejected", this);
    };

    Promise.prototype._setFollowing = function () {
      this._bitField = this._bitField | 67108864;
      this._fireEvent("promiseResolved", this);
    };

    Promise.prototype._setIsFinal = function () {
      this._bitField = this._bitField | 4194304;
    };

    Promise.prototype._isFinal = function () {
      return (this._bitField & 4194304) > 0;
    };

    Promise.prototype._unsetCancelled = function() {
      this._bitField = this._bitField & (~65536);
    };

    Promise.prototype._setCancelled = function() {
      this._bitField = this._bitField | 65536;
      this._fireEvent("promiseCancelled", this);
    };

    Promise.prototype._setWillBeCancelled = function() {
      this._bitField = this._bitField | 8388608;
    };

    Promise.prototype._setAsyncGuaranteed = function() {
      if (async.hasCustomScheduler()) return;
      this._bitField = this._bitField | 134217728;
    };

    Promise.prototype._receiverAt = function (index) {
      var ret = index === 0 ? this._receiver0 : this[
      index * 4 - 4 + 3];
      if (ret === UNDEFINED_BINDING) {
        return undefined;
      } else if (ret === undefined && this._isBound()) {
        return this._boundValue();
      }
      return ret;
    };

    Promise.prototype._promiseAt = function (index) {
      return this[
      index * 4 - 4 + 2];
    };

    Promise.prototype._fulfillmentHandlerAt = function (index) {
      return this[
      index * 4 - 4 + 0];
    };

    Promise.prototype._rejectionHandlerAt = function (index) {
      return this[
      index * 4 - 4 + 1];
    };

    Promise.prototype._boundValue = function() {};

    Promise.prototype._migrateCallback0 = function (follower) {
      var bitField = follower._bitField;
      var fulfill = follower._fulfillmentHandler0;
      var reject = follower._rejectionHandler0;
      var promise = follower._promise0;
      var receiver = follower._receiverAt(0);
      if (receiver === undefined) receiver = UNDEFINED_BINDING;
      this._addCallbacks(fulfill, reject, promise, receiver, null);
    };

    Promise.prototype._migrateCallbackAt = function (follower, index) {
      var fulfill = follower._fulfillmentHandlerAt(index);
      var reject = follower._rejectionHandlerAt(index);
      var promise = follower._promiseAt(index);
      var receiver = follower._receiverAt(index);
      if (receiver === undefined) receiver = UNDEFINED_BINDING;
      this._addCallbacks(fulfill, reject, promise, receiver, null);
    };

    Promise.prototype._addCallbacks = function (
      fulfill,
      reject,
      promise,
      receiver,
      domain
    ) {
      var index = this._length();

      if (index >= 65535 - 4) {
        index = 0;
        this._setLength(0);
      }

      if (index === 0) {
        this._promise0 = promise;
        this._receiver0 = receiver;
        if (typeof fulfill === "function") {
          this._fulfillmentHandler0 =
            domain === null ? fulfill : util.domainBind(domain, fulfill);
        }
        if (typeof reject === "function") {
          this._rejectionHandler0 =
            domain === null ? reject : util.domainBind(domain, reject);
        }
      } else {
        var base = index * 4 - 4;
        this[base + 2] = promise;
        this[base + 3] = receiver;
        if (typeof fulfill === "function") {
          this[base + 0] =
            domain === null ? fulfill : util.domainBind(domain, fulfill);
        }
        if (typeof reject === "function") {
          this[base + 1] =
            domain === null ? reject : util.domainBind(domain, reject);
        }
      }
      this._setLength(index + 1);
      return index;
    };

    Promise.prototype._proxy = function (proxyable, arg) {
      this._addCallbacks(undefined, undefined, arg, proxyable, null);
    };

    Promise.prototype._resolveCallback = function(value, shouldBind) {
      if (((this._bitField & 117506048) !== 0)) return;
      if (value === this)
        return this._rejectCallback(makeSelfResolutionError(), false);
      var maybePromise = tryConvertToPromise(value, this);
      if (!(maybePromise instanceof Promise)) return this._fulfill(value);

      if (shouldBind) this._propagateFrom(maybePromise, 2);

      var promise = maybePromise._target();

      if (promise === this) {
        this._reject(makeSelfResolutionError());
        return;
      }

      var bitField = promise._bitField;
      if (((bitField & 50397184) === 0)) {
        var len = this._length();
        if (len > 0) promise._migrateCallback0(this);
        for (var i = 1; i < len; ++i) {
          promise._migrateCallbackAt(this, i);
        }
        this._setFollowing();
        this._setLength(0);
        this._setFollowee(promise);
      } else if (((bitField & 33554432) !== 0)) {
        this._fulfill(promise._value());
      } else if (((bitField & 16777216) !== 0)) {
        this._reject(promise._reason());
      } else {
        var reason = new CancellationError("late cancellation observer");
        promise._attachExtraTrace(reason);
        this._reject(reason);
      }
    };

    Promise.prototype._rejectCallback =
      function(reason, synchronous, ignoreNonErrorWarnings) {
        var trace = util.ensureErrorObject(reason);
        var hasStack = trace === reason;
        if (!hasStack && !ignoreNonErrorWarnings && debug.warnings()) {
          var message = "a promise was rejected with a non-error: " +
            util.classString(reason);
          this._warn(message, true);
        }
        this._attachExtraTrace(trace, synchronous ? hasStack : false);
        this._reject(reason);
      };

    Promise.prototype._resolveFromExecutor = function (executor) {
      if (executor === INTERNAL) return;
      var promise = this;
      this._captureStackTrace();
      this._pushContext();
      var synchronous = true;
      var r = this._execute(executor, function(value) {
        promise._resolveCallback(value);
      }, function (reason) {
        promise._rejectCallback(reason, synchronous);
      });
      synchronous = false;
      this._popContext();

      if (r !== undefined) {
        promise._rejectCallback(r, true);
      }
    };

    Promise.prototype._settlePromiseFromHandler = function (
      handler, receiver, value, promise
    ) {
      var bitField = promise._bitField;
      if (((bitField & 65536) !== 0)) return;
      promise._pushContext();
      var x;
      if (receiver === APPLY) {
        if (!value || typeof value.length !== "number") {
          x = errorObj;
          x.e = new TypeError("cannot .spread() a non-array: " +
            util.classString(value));
        } else {
          x = tryCatch(handler).apply(this._boundValue(), value);
        }
      } else {
        x = tryCatch(handler).call(receiver, value);
      }
      var promiseCreated = promise._popContext();
      bitField = promise._bitField;
      if (((bitField & 65536) !== 0)) return;

      if (x === NEXT_FILTER) {
        promise._reject(value);
      } else if (x === errorObj) {
        promise._rejectCallback(x.e, false);
      } else {
        debug.checkForgottenReturns(x, promiseCreated, "",  promise, this);
        promise._resolveCallback(x);
      }
    };

    Promise.prototype._target = function() {
      var ret = this;
      while (ret._isFollowing()) ret = ret._followee();
      return ret;
    };

    Promise.prototype._followee = function() {
      return this._rejectionHandler0;
    };

    Promise.prototype._setFollowee = function(promise) {
      this._rejectionHandler0 = promise;
    };

    Promise.prototype._settlePromise = function(promise, handler, receiver, value) {
      var isPromise = promise instanceof Promise;
      var bitField = this._bitField;
      var asyncGuaranteed = ((bitField & 134217728) !== 0);
      if (((bitField & 65536) !== 0)) {
        if (isPromise) promise._invokeInternalOnCancel();

        if (receiver instanceof PassThroughHandlerContext &&
          receiver.isFinallyHandler()) {
          receiver.cancelPromise = promise;
          if (tryCatch(handler).call(receiver, value) === errorObj) {
            promise._reject(errorObj.e);
          }
        } else if (handler === reflectHandler) {
          promise._fulfill(reflectHandler.call(receiver));
        } else if (receiver instanceof Proxyable) {
          receiver._promiseCancelled(promise);
        } else if (isPromise || promise instanceof PromiseArray) {
          promise._cancel();
        } else {
          receiver.cancel();
        }
      } else if (typeof handler === "function") {
        if (!isPromise) {
          handler.call(receiver, value, promise);
        } else {
          if (asyncGuaranteed) promise._setAsyncGuaranteed();
          this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
      } else if (receiver instanceof Proxyable) {
        if (!receiver._isResolved()) {
          if (((bitField & 33554432) !== 0)) {
            receiver._promiseFulfilled(value, promise);
          } else {
            receiver._promiseRejected(value, promise);
          }
        }
      } else if (isPromise) {
        if (asyncGuaranteed) promise._setAsyncGuaranteed();
        if (((bitField & 33554432) !== 0)) {
          promise._fulfill(value);
        } else {
          promise._reject(value);
        }
      }
    };

    Promise.prototype._settlePromiseLateCancellationObserver = function(ctx) {
      var handler = ctx.handler;
      var promise = ctx.promise;
      var receiver = ctx.receiver;
      var value = ctx.value;
      if (typeof handler === "function") {
        if (!(promise instanceof Promise)) {
          handler.call(receiver, value, promise);
        } else {
          this._settlePromiseFromHandler(handler, receiver, value, promise);
        }
      } else if (promise instanceof Promise) {
        promise._reject(value);
      }
    };

    Promise.prototype._settlePromiseCtx = function(ctx) {
      this._settlePromise(ctx.promise, ctx.handler, ctx.receiver, ctx.value);
    };

    Promise.prototype._settlePromise0 = function(handler, value, bitField) {
      var promise = this._promise0;
      var receiver = this._receiverAt(0);
      this._promise0 = undefined;
      this._receiver0 = undefined;
      this._settlePromise(promise, handler, receiver, value);
    };

    Promise.prototype._clearCallbackDataAtIndex = function(index) {
      var base = index * 4 - 4;
      this[base + 2] =
        this[base + 3] =
          this[base + 0] =
            this[base + 1] = undefined;
    };

    Promise.prototype._fulfill = function (value) {
      var bitField = this._bitField;
      if (((bitField & 117506048) >>> 16)) return;
      if (value === this) {
        var err = makeSelfResolutionError();
        this._attachExtraTrace(err);
        return this._reject(err);
      }
      this._setFulfilled();
      this._rejectionHandler0 = value;

      if ((bitField & 65535) > 0) {
        if (((bitField & 134217728) !== 0)) {
          this._settlePromises();
        } else {
          async.settlePromises(this);
        }
        this._dereferenceTrace();
      }
    };

    Promise.prototype._reject = function (reason) {
      var bitField = this._bitField;
      if (((bitField & 117506048) >>> 16)) return;
      this._setRejected();
      this._fulfillmentHandler0 = reason;

      if (this._isFinal()) {
        return async.fatalError(reason, util.isNode);
      }

      if ((bitField & 65535) > 0) {
        async.settlePromises(this);
      } else {
        this._ensurePossibleRejectionHandled();
      }
    };

    Promise.prototype._fulfillPromises = function (len, value) {
      for (var i = 1; i < len; i++) {
        var handler = this._fulfillmentHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, value);
      }
    };

    Promise.prototype._rejectPromises = function (len, reason) {
      for (var i = 1; i < len; i++) {
        var handler = this._rejectionHandlerAt(i);
        var promise = this._promiseAt(i);
        var receiver = this._receiverAt(i);
        this._clearCallbackDataAtIndex(i);
        this._settlePromise(promise, handler, receiver, reason);
      }
    };

    Promise.prototype._settlePromises = function () {
      var bitField = this._bitField;
      var len = (bitField & 65535);

      if (len > 0) {
        if (((bitField & 16842752) !== 0)) {
          var reason = this._fulfillmentHandler0;
          this._settlePromise0(this._rejectionHandler0, reason, bitField);
          this._rejectPromises(len, reason);
        } else {
          var value = this._rejectionHandler0;
          this._settlePromise0(this._fulfillmentHandler0, value, bitField);
          this._fulfillPromises(len, value);
        }
        this._setLength(0);
      }
      this._clearCancellationData();
    };

    Promise.prototype._settledValue = function() {
      var bitField = this._bitField;
      if (((bitField & 33554432) !== 0)) {
        return this._rejectionHandler0;
      } else if (((bitField & 16777216) !== 0)) {
        return this._fulfillmentHandler0;
      }
    };

    function deferResolve(v) {this.promise._resolveCallback(v);}
    function deferReject(v) {this.promise._rejectCallback(v, false);}

    Promise.defer = Promise.pending = function() {
      debug.deprecated("Promise.defer", "new Promise");
      var promise = new Promise(INTERNAL);
      return {
        promise: promise,
        resolve: deferResolve,
        reject: deferReject
      };
    };

    util.notEnumerableProp(Promise,
      "_makeSelfResolutionError",
      makeSelfResolutionError);

    _dereq_("./method")(Promise, INTERNAL, tryConvertToPromise, apiRejection,
      debug);
    _dereq_("./bind")(Promise, INTERNAL, tryConvertToPromise, debug);
    _dereq_("./cancel")(Promise, PromiseArray, apiRejection, debug);
    _dereq_("./direct_resolve")(Promise);
    _dereq_("./synchronous_inspection")(Promise);
    _dereq_("./join")(
      Promise, PromiseArray, tryConvertToPromise, INTERNAL, async, getDomain);
    Promise.Promise = Promise;
    Promise.version = "3.5.3";
    _dereq_('./map.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
    _dereq_('./call_get.js')(Promise);
    _dereq_('./using.js')(Promise, apiRejection, tryConvertToPromise, createContext, INTERNAL, debug);
    _dereq_('./timers.js')(Promise, INTERNAL, debug);
    _dereq_('./generators.js')(Promise, apiRejection, INTERNAL, tryConvertToPromise, Proxyable, debug);
    _dereq_('./nodeify.js')(Promise);
    _dereq_('./promisify.js')(Promise, INTERNAL);
    _dereq_('./props.js')(Promise, PromiseArray, tryConvertToPromise, apiRejection);
    _dereq_('./race.js')(Promise, INTERNAL, tryConvertToPromise, apiRejection);
    _dereq_('./reduce.js')(Promise, PromiseArray, apiRejection, tryConvertToPromise, INTERNAL, debug);
    _dereq_('./settle.js')(Promise, PromiseArray, debug);
    _dereq_('./some.js')(Promise, PromiseArray, apiRejection);
    _dereq_('./filter.js')(Promise, INTERNAL);
    _dereq_('./each.js')(Promise, INTERNAL);
    _dereq_('./any.js')(Promise);

    util.toFastProperties(Promise);
    util.toFastProperties(Promise.prototype);
    function fillTypes(value) {
      var p = new Promise(INTERNAL);
      p._fulfillmentHandler0 = value;
      p._rejectionHandler0 = value;
      p._promise0 = value;
      p._receiver0 = value;
    }
    // Complete slack tracking, opt out of field-type tracking and
    // stabilize map
    fillTypes({a: 1});
    fillTypes({b: 2});
    fillTypes({c: 3});
    fillTypes(1);
    fillTypes(function(){});
    fillTypes(undefined);
    fillTypes(false);
    fillTypes(new Promise(INTERNAL));
    debug.setBounds(Async.firstLineError, util.lastLineError);
    return Promise;

  };

},{"./any.js":1,"./async":2,"./bind":3,"./call_get.js":5,"./cancel":6,"./catch_filter":7,"./context":8,"./debuggability":9,"./direct_resolve":10,"./each.js":11,"./errors":12,"./es5":13,"./filter.js":14,"./finally":15,"./generators.js":16,"./join":17,"./map.js":18,"./method":19,"./nodeback":20,"./nodeify.js":21,"./promise_array":23,"./promisify.js":24,"./props.js":25,"./race.js":27,"./reduce.js":28,"./settle.js":30,"./some.js":31,"./synchronous_inspection":32,"./thenables":33,"./timers.js":34,"./using.js":35,"./util":36}],23:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL, tryConvertToPromise,
                            apiRejection, Proxyable) {
    var util = _dereq_("./util");
    var isArray = util.isArray;

    function toResolutionValue(val) {
      switch(val) {
        case -2: return [];
        case -3: return {};
        case -6: return new Map();
      }
    }

    function PromiseArray(values) {
      var promise = this._promise = new Promise(INTERNAL);
      if (values instanceof Promise) {
        promise._propagateFrom(values, 3);
      }
      promise._setOnCancel(this);
      this._values = values;
      this._length = 0;
      this._totalResolved = 0;
      this._init(undefined, -2);
    }
    util.inherits(PromiseArray, Proxyable);

    PromiseArray.prototype.length = function () {
      return this._length;
    };

    PromiseArray.prototype.promise = function () {
      return this._promise;
    };

    PromiseArray.prototype._init = function init(_, resolveValueIfEmpty) {
      var values = tryConvertToPromise(this._values, this._promise);
      if (values instanceof Promise) {
        values = values._target();
        var bitField = values._bitField;
        ;
        this._values = values;

        if (((bitField & 50397184) === 0)) {
          this._promise._setAsyncGuaranteed();
          return values._then(
            init,
            this._reject,
            undefined,
            this,
            resolveValueIfEmpty
          );
        } else if (((bitField & 33554432) !== 0)) {
          values = values._value();
        } else if (((bitField & 16777216) !== 0)) {
          return this._reject(values._reason());
        } else {
          return this._cancel();
        }
      }
      values = util.asArray(values);
      if (values === null) {
        var err = apiRejection(
          "expecting an array or an iterable object but got " + util.classString(values)).reason();
        this._promise._rejectCallback(err, false);
        return;
      }

      if (values.length === 0) {
        if (resolveValueIfEmpty === -5) {
          this._resolveEmptyArray();
        }
        else {
          this._resolve(toResolutionValue(resolveValueIfEmpty));
        }
        return;
      }
      this._iterate(values);
    };

    PromiseArray.prototype._iterate = function(values) {
      var len = this.getActualLength(values.length);
      this._length = len;
      this._values = this.shouldCopyValues() ? new Array(len) : this._values;
      var result = this._promise;
      var isResolved = false;
      var bitField = null;
      for (var i = 0; i < len; ++i) {
        var maybePromise = tryConvertToPromise(values[i], result);

        if (maybePromise instanceof Promise) {
          maybePromise = maybePromise._target();
          bitField = maybePromise._bitField;
        } else {
          bitField = null;
        }

        if (isResolved) {
          if (bitField !== null) {
            maybePromise.suppressUnhandledRejections();
          }
        } else if (bitField !== null) {
          if (((bitField & 50397184) === 0)) {
            maybePromise._proxy(this, i);
            this._values[i] = maybePromise;
          } else if (((bitField & 33554432) !== 0)) {
            isResolved = this._promiseFulfilled(maybePromise._value(), i);
          } else if (((bitField & 16777216) !== 0)) {
            isResolved = this._promiseRejected(maybePromise._reason(), i);
          } else {
            isResolved = this._promiseCancelled(i);
          }
        } else {
          isResolved = this._promiseFulfilled(maybePromise, i);
        }
      }
      if (!isResolved) result._setAsyncGuaranteed();
    };

    PromiseArray.prototype._isResolved = function () {
      return this._values === null;
    };

    PromiseArray.prototype._resolve = function (value) {
      this._values = null;
      this._promise._fulfill(value);
    };

    PromiseArray.prototype._cancel = function() {
      if (this._isResolved() || !this._promise._isCancellable()) return;
      this._values = null;
      this._promise._cancel();
    };

    PromiseArray.prototype._reject = function (reason) {
      this._values = null;
      this._promise._rejectCallback(reason, false);
    };

    PromiseArray.prototype._promiseFulfilled = function (value, index) {
      this._values[index] = value;
      var totalResolved = ++this._totalResolved;
      if (totalResolved >= this._length) {
        this._resolve(this._values);
        return true;
      }
      return false;
    };

    PromiseArray.prototype._promiseCancelled = function() {
      this._cancel();
      return true;
    };

    PromiseArray.prototype._promiseRejected = function (reason) {
      this._totalResolved++;
      this._reject(reason);
      return true;
    };

    PromiseArray.prototype._resultCancelled = function() {
      if (this._isResolved()) return;
      var values = this._values;
      this._cancel();
      if (values instanceof Promise) {
        values.cancel();
      } else {
        for (var i = 0; i < values.length; ++i) {
          if (values[i] instanceof Promise) {
            values[i].cancel();
          }
        }
      }
    };

    PromiseArray.prototype.shouldCopyValues = function () {
      return true;
    };

    PromiseArray.prototype.getActualLength = function (len) {
      return len;
    };

    return PromiseArray;
  };

},{"./util":36}],24:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL) {
    var THIS = {};
    var util = _dereq_("./util");
    var nodebackForPromise = _dereq_("./nodeback");
    var withAppended = util.withAppended;
    var maybeWrapAsError = util.maybeWrapAsError;
    var canEvaluate = util.canEvaluate;
    var TypeError = _dereq_("./errors").TypeError;
    var defaultSuffix = "Async";
    var defaultPromisified = {__isPromisified__: true};
    var noCopyProps = [
      "arity",    "length",
      "name",
      "arguments",
      "caller",
      "callee",
      "prototype",
      "__isPromisified__"
    ];
    var noCopyPropsPattern = new RegExp("^(?:" + noCopyProps.join("|") + ")$");

    var defaultFilter = function(name) {
      return util.isIdentifier(name) &&
        name.charAt(0) !== "_" &&
        name !== "constructor";
    };

    function propsFilter(key) {
      return !noCopyPropsPattern.test(key);
    }

    function isPromisified(fn) {
      try {
        return fn.__isPromisified__ === true;
      }
      catch (e) {
        return false;
      }
    }

    function hasPromisified(obj, key, suffix) {
      var val = util.getDataPropertyOrDefault(obj, key + suffix,
        defaultPromisified);
      return val ? isPromisified(val) : false;
    }
    function checkValid(ret, suffix, suffixRegexp) {
      for (var i = 0; i < ret.length; i += 2) {
        var key = ret[i];
        if (suffixRegexp.test(key)) {
          var keyWithoutAsyncSuffix = key.replace(suffixRegexp, "");
          for (var j = 0; j < ret.length; j += 2) {
            if (ret[j] === keyWithoutAsyncSuffix) {
              throw new TypeError("Cannot promisify an API that has normal methods with '%s'-suffix\u000a\u000a    See http://goo.gl/MqrFmX\u000a"
                .replace("%s", suffix));
            }
          }
        }
      }
    }

    function promisifiableMethods(obj, suffix, suffixRegexp, filter) {
      var keys = util.inheritedDataKeys(obj);
      var ret = [];
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var value = obj[key];
        var passesDefaultFilter = filter === defaultFilter
          ? true : defaultFilter(key, value, obj);
        if (typeof value === "function" &&
          !isPromisified(value) &&
          !hasPromisified(obj, key, suffix) &&
          filter(key, value, obj, passesDefaultFilter)) {
          ret.push(key, value);
        }
      }
      checkValid(ret, suffix, suffixRegexp);
      return ret;
    }

    var escapeIdentRegex = function(str) {
      return str.replace(/([$])/, "\\$");
    };

    var makeNodePromisifiedEval;
    if (!true) {
      var switchCaseArgumentOrder = function(likelyArgumentCount) {
        var ret = [likelyArgumentCount];
        var min = Math.max(0, likelyArgumentCount - 1 - 3);
        for(var i = likelyArgumentCount - 1; i >= min; --i) {
          ret.push(i);
        }
        for(var i = likelyArgumentCount + 1; i <= 3; ++i) {
          ret.push(i);
        }
        return ret;
      };

      var argumentSequence = function(argumentCount) {
        return util.filledRange(argumentCount, "_arg", "");
      };

      var parameterDeclaration = function(parameterCount) {
        return util.filledRange(
          Math.max(parameterCount, 3), "_arg", "");
      };

      var parameterCount = function(fn) {
        if (typeof fn.length === "number") {
          return Math.max(Math.min(fn.length, 1023 + 1), 0);
        }
        return 0;
      };

      makeNodePromisifiedEval =
        function(callback, receiver, originalName, fn, _, multiArgs) {
          var newParameterCount = Math.max(0, parameterCount(fn) - 1);
          var argumentOrder = switchCaseArgumentOrder(newParameterCount);
          var shouldProxyThis = typeof callback === "string" || receiver === THIS;

          function generateCallForArgumentCount(count) {
            var args = argumentSequence(count).join(", ");
            var comma = count > 0 ? ", " : "";
            var ret;
            if (shouldProxyThis) {
              ret = "ret = callback.call(this, {{args}}, nodeback); break;\n";
            } else {
              ret = receiver === undefined
                ? "ret = callback({{args}}, nodeback); break;\n"
                : "ret = callback.call(receiver, {{args}}, nodeback); break;\n";
            }
            return ret.replace("{{args}}", args).replace(", ", comma);
          }

          function generateArgumentSwitchCase() {
            var ret = "";
            for (var i = 0; i < argumentOrder.length; ++i) {
              ret += "case " + argumentOrder[i] +":" +
                generateCallForArgumentCount(argumentOrder[i]);
            }

            ret += "                                                             \n\
        default:                                                             \n\
            var args = new Array(len + 1);                                   \n\
            var i = 0;                                                       \n\
            for (var i = 0; i < len; ++i) {                                  \n\
               args[i] = arguments[i];                                       \n\
            }                                                                \n\
            args[i] = nodeback;                                              \n\
            [CodeForCall]                                                    \n\
            break;                                                           \n\
        ".replace("[CodeForCall]", (shouldProxyThis
              ? "ret = callback.apply(this, args);\n"
              : "ret = callback.apply(receiver, args);\n"));
            return ret;
          }

          var getFunctionCode = typeof callback === "string"
            ? ("this != null ? this['"+callback+"'] : fn")
            : "fn";
          var body = "'use strict';                                                \n\
        var ret = function (Parameters) {                                    \n\
            'use strict';                                                    \n\
            var len = arguments.length;                                      \n\
            var promise = new Promise(INTERNAL);                             \n\
            promise._captureStackTrace();                                    \n\
            var nodeback = nodebackForPromise(promise, " + multiArgs + ");   \n\
            var ret;                                                         \n\
            var callback = tryCatch([GetFunctionCode]);                      \n\
            switch(len) {                                                    \n\
                [CodeForSwitchCase]                                          \n\
            }                                                                \n\
            if (ret === errorObj) {                                          \n\
                promise._rejectCallback(maybeWrapAsError(ret.e), true, true);\n\
            }                                                                \n\
            if (!promise._isFateSealed()) promise._setAsyncGuaranteed();     \n\
            return promise;                                                  \n\
        };                                                                   \n\
        notEnumerableProp(ret, '__isPromisified__', true);                   \n\
        return ret;                                                          \n\
    ".replace("[CodeForSwitchCase]", generateArgumentSwitchCase())
            .replace("[GetFunctionCode]", getFunctionCode);
          body = body.replace("Parameters", parameterDeclaration(newParameterCount));
          return new Function("Promise",
            "fn",
            "receiver",
            "withAppended",
            "maybeWrapAsError",
            "nodebackForPromise",
            "tryCatch",
            "errorObj",
            "notEnumerableProp",
            "INTERNAL",
            body)(
            Promise,
            fn,
            receiver,
            withAppended,
            maybeWrapAsError,
            nodebackForPromise,
            util.tryCatch,
            util.errorObj,
            util.notEnumerableProp,
            INTERNAL);
        };
    }

    function makeNodePromisifiedClosure(callback, receiver, _, fn, __, multiArgs) {
      var defaultThis = (function() {return this;})();
      var method = callback;
      if (typeof method === "string") {
        callback = fn;
      }
      function promisified() {
        var _receiver = receiver;
        if (receiver === THIS) _receiver = this;
        var promise = new Promise(INTERNAL);
        promise._captureStackTrace();
        var cb = typeof method === "string" && this !== defaultThis
          ? this[method] : callback;
        var fn = nodebackForPromise(promise, multiArgs);
        try {
          cb.apply(_receiver, withAppended(arguments, fn));
        } catch(e) {
          promise._rejectCallback(maybeWrapAsError(e), true, true);
        }
        if (!promise._isFateSealed()) promise._setAsyncGuaranteed();
        return promise;
      }
      util.notEnumerableProp(promisified, "__isPromisified__", true);
      return promisified;
    }

    var makeNodePromisified = canEvaluate
      ? makeNodePromisifiedEval
      : makeNodePromisifiedClosure;

    function promisifyAll(obj, suffix, filter, promisifier, multiArgs) {
      var suffixRegexp = new RegExp(escapeIdentRegex(suffix) + "$");
      var methods =
        promisifiableMethods(obj, suffix, suffixRegexp, filter);

      for (var i = 0, len = methods.length; i < len; i+= 2) {
        var key = methods[i];
        var fn = methods[i+1];
        var promisifiedKey = key + suffix;
        if (promisifier === makeNodePromisified) {
          obj[promisifiedKey] =
            makeNodePromisified(key, THIS, key, fn, suffix, multiArgs);
        } else {
          var promisified = promisifier(fn, function() {
            return makeNodePromisified(key, THIS, key,
              fn, suffix, multiArgs);
          });
          util.notEnumerableProp(promisified, "__isPromisified__", true);
          obj[promisifiedKey] = promisified;
        }
      }
      util.toFastProperties(obj);
      return obj;
    }

    function promisify(callback, receiver, multiArgs) {
      return makeNodePromisified(callback, receiver, undefined,
        callback, null, multiArgs);
    }

    Promise.promisify = function (fn, options) {
      if (typeof fn !== "function") {
        throw new TypeError("expecting a function but got " + util.classString(fn));
      }
      if (isPromisified(fn)) {
        return fn;
      }
      options = Object(options);
      var receiver = options.context === undefined ? THIS : options.context;
      var multiArgs = !!options.multiArgs;
      var ret = promisify(fn, receiver, multiArgs);
      util.copyDescriptors(fn, ret, propsFilter);
      return ret;
    };

    Promise.promisifyAll = function (target, options) {
      if (typeof target !== "function" && typeof target !== "object") {
        throw new TypeError("the target of promisifyAll must be an object or a function\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }
      options = Object(options);
      var multiArgs = !!options.multiArgs;
      var suffix = options.suffix;
      if (typeof suffix !== "string") suffix = defaultSuffix;
      var filter = options.filter;
      if (typeof filter !== "function") filter = defaultFilter;
      var promisifier = options.promisifier;
      if (typeof promisifier !== "function") promisifier = makeNodePromisified;

      if (!util.isIdentifier(suffix)) {
        throw new RangeError("suffix must be a valid identifier\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }

      var keys = util.inheritedDataKeys(target);
      for (var i = 0; i < keys.length; ++i) {
        var value = target[keys[i]];
        if (keys[i] !== "constructor" &&
          util.isClass(value)) {
          promisifyAll(value.prototype, suffix, filter, promisifier,
            multiArgs);
          promisifyAll(value, suffix, filter, promisifier, multiArgs);
        }
      }

      return promisifyAll(target, suffix, filter, promisifier, multiArgs);
    };
  };


},{"./errors":12,"./nodeback":20,"./util":36}],25:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(
    Promise, PromiseArray, tryConvertToPromise, apiRejection) {
    var util = _dereq_("./util");
    var isObject = util.isObject;
    var es5 = _dereq_("./es5");
    var Es6Map;
    if (typeof Map === "function") Es6Map = Map;

    var mapToEntries = (function() {
      var index = 0;
      var size = 0;

      function extractEntry(value, key) {
        this[index] = value;
        this[index + size] = key;
        index++;
      }

      return function mapToEntries(map) {
        size = map.size;
        index = 0;
        var ret = new Array(map.size * 2);
        map.forEach(extractEntry, ret);
        return ret;
      };
    })();

    var entriesToMap = function(entries) {
      var ret = new Es6Map();
      var length = entries.length / 2 | 0;
      for (var i = 0; i < length; ++i) {
        var key = entries[length + i];
        var value = entries[i];
        ret.set(key, value);
      }
      return ret;
    };

    function PropertiesPromiseArray(obj) {
      var isMap = false;
      var entries;
      if (Es6Map !== undefined && obj instanceof Es6Map) {
        entries = mapToEntries(obj);
        isMap = true;
      } else {
        var keys = es5.keys(obj);
        var len = keys.length;
        entries = new Array(len * 2);
        for (var i = 0; i < len; ++i) {
          var key = keys[i];
          entries[i] = obj[key];
          entries[i + len] = key;
        }
      }
      this.constructor$(entries);
      this._isMap = isMap;
      this._init$(undefined, isMap ? -6 : -3);
    }
    util.inherits(PropertiesPromiseArray, PromiseArray);

    PropertiesPromiseArray.prototype._init = function () {};

    PropertiesPromiseArray.prototype._promiseFulfilled = function (value, index) {
      this._values[index] = value;
      var totalResolved = ++this._totalResolved;
      if (totalResolved >= this._length) {
        var val;
        if (this._isMap) {
          val = entriesToMap(this._values);
        } else {
          val = {};
          var keyOffset = this.length();
          for (var i = 0, len = this.length(); i < len; ++i) {
            val[this._values[i + keyOffset]] = this._values[i];
          }
        }
        this._resolve(val);
        return true;
      }
      return false;
    };

    PropertiesPromiseArray.prototype.shouldCopyValues = function () {
      return false;
    };

    PropertiesPromiseArray.prototype.getActualLength = function (len) {
      return len >> 1;
    };

    function props(promises) {
      var ret;
      var castValue = tryConvertToPromise(promises);

      if (!isObject(castValue)) {
        return apiRejection("cannot await properties of a non-object\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      } else if (castValue instanceof Promise) {
        ret = castValue._then(
          Promise.props, undefined, undefined, undefined, undefined);
      } else {
        ret = new PropertiesPromiseArray(castValue).promise();
      }

      if (castValue instanceof Promise) {
        ret._propagateFrom(castValue, 2);
      }
      return ret;
    }

    Promise.prototype.props = function () {
      return props(this);
    };

    Promise.props = function (promises) {
      return props(promises);
    };
  };

},{"./es5":13,"./util":36}],26:[function(_dereq_,module,exports){
  "use strict";
  function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
      dst[j + dstIndex] = src[j + srcIndex];
      src[j + srcIndex] = void 0;
    }
  }

  function Queue(capacity) {
    this._capacity = capacity;
    this._length = 0;
    this._front = 0;
  }

  Queue.prototype._willBeOverCapacity = function (size) {
    return this._capacity < size;
  };

  Queue.prototype._pushOne = function (arg) {
    var length = this.length();
    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = arg;
    this._length = length + 1;
  };

  Queue.prototype.push = function (fn, receiver, arg) {
    var length = this.length() + 3;
    if (this._willBeOverCapacity(length)) {
      this._pushOne(fn);
      this._pushOne(receiver);
      this._pushOne(arg);
      return;
    }
    var j = this._front + length - 3;
    this._checkCapacity(length);
    var wrapMask = this._capacity - 1;
    this[(j + 0) & wrapMask] = fn;
    this[(j + 1) & wrapMask] = receiver;
    this[(j + 2) & wrapMask] = arg;
    this._length = length;
  };

  Queue.prototype.shift = function () {
    var front = this._front,
      ret = this[front];

    this[front] = undefined;
    this._front = (front + 1) & (this._capacity - 1);
    this._length--;
    return ret;
  };

  Queue.prototype.length = function () {
    return this._length;
  };

  Queue.prototype._checkCapacity = function (size) {
    if (this._capacity < size) {
      this._resizeTo(this._capacity << 1);
    }
  };

  Queue.prototype._resizeTo = function (capacity) {
    var oldCapacity = this._capacity;
    this._capacity = capacity;
    var front = this._front;
    var length = this._length;
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
  };

  module.exports = Queue;

},{}],27:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(
    Promise, INTERNAL, tryConvertToPromise, apiRejection) {
    var util = _dereq_("./util");

    var raceLater = function (promise) {
      return promise.then(function(array) {
        return race(array, promise);
      });
    };

    function race(promises, parent) {
      var maybePromise = tryConvertToPromise(promises);

      if (maybePromise instanceof Promise) {
        return raceLater(maybePromise);
      } else {
        promises = util.asArray(promises);
        if (promises === null)
          return apiRejection("expecting an array or an iterable object but got " + util.classString(promises));
      }

      var ret = new Promise(INTERNAL);
      if (parent !== undefined) {
        ret._propagateFrom(parent, 3);
      }
      var fulfill = ret._fulfill;
      var reject = ret._reject;
      for (var i = 0, len = promises.length; i < len; ++i) {
        var val = promises[i];

        if (val === undefined && !(i in promises)) {
          continue;
        }

        Promise.cast(val)._then(fulfill, reject, undefined, ret, null);
      }
      return ret;
    }

    Promise.race = function (promises) {
      return race(promises, undefined);
    };

    Promise.prototype.race = function () {
      return race(this, undefined);
    };

  };

},{"./util":36}],28:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise,
                            PromiseArray,
                            apiRejection,
                            tryConvertToPromise,
                            INTERNAL,
                            debug) {
    var getDomain = Promise._getDomain;
    var util = _dereq_("./util");
    var tryCatch = util.tryCatch;

    function ReductionPromiseArray(promises, fn, initialValue, _each) {
      this.constructor$(promises);
      var domain = getDomain();
      this._fn = domain === null ? fn : util.domainBind(domain, fn);
      if (initialValue !== undefined) {
        initialValue = Promise.resolve(initialValue);
        initialValue._attachCancellationCallback(this);
      }
      this._initialValue = initialValue;
      this._currentCancellable = null;
      if(_each === INTERNAL) {
        this._eachValues = Array(this._length);
      } else if (_each === 0) {
        this._eachValues = null;
      } else {
        this._eachValues = undefined;
      }
      this._promise._captureStackTrace();
      this._init$(undefined, -5);
    }
    util.inherits(ReductionPromiseArray, PromiseArray);

    ReductionPromiseArray.prototype._gotAccum = function(accum) {
      if (this._eachValues !== undefined &&
        this._eachValues !== null &&
        accum !== INTERNAL) {
        this._eachValues.push(accum);
      }
    };

    ReductionPromiseArray.prototype._eachComplete = function(value) {
      if (this._eachValues !== null) {
        this._eachValues.push(value);
      }
      return this._eachValues;
    };

    ReductionPromiseArray.prototype._init = function() {};

    ReductionPromiseArray.prototype._resolveEmptyArray = function() {
      this._resolve(this._eachValues !== undefined ? this._eachValues
        : this._initialValue);
    };

    ReductionPromiseArray.prototype.shouldCopyValues = function () {
      return false;
    };

    ReductionPromiseArray.prototype._resolve = function(value) {
      this._promise._resolveCallback(value);
      this._values = null;
    };

    ReductionPromiseArray.prototype._resultCancelled = function(sender) {
      if (sender === this._initialValue) return this._cancel();
      if (this._isResolved()) return;
      this._resultCancelled$();
      if (this._currentCancellable instanceof Promise) {
        this._currentCancellable.cancel();
      }
      if (this._initialValue instanceof Promise) {
        this._initialValue.cancel();
      }
    };

    ReductionPromiseArray.prototype._iterate = function (values) {
      this._values = values;
      var value;
      var i;
      var length = values.length;
      if (this._initialValue !== undefined) {
        value = this._initialValue;
        i = 0;
      } else {
        value = Promise.resolve(values[0]);
        i = 1;
      }

      this._currentCancellable = value;

      if (!value.isRejected()) {
        for (; i < length; ++i) {
          var ctx = {
            accum: null,
            value: values[i],
            index: i,
            length: length,
            array: this
          };
          value = value._then(gotAccum, undefined, undefined, ctx, undefined);
        }
      }

      if (this._eachValues !== undefined) {
        value = value
          ._then(this._eachComplete, undefined, undefined, this, undefined);
      }
      value._then(completed, completed, undefined, value, this);
    };

    Promise.prototype.reduce = function (fn, initialValue) {
      return reduce(this, fn, initialValue, null);
    };

    Promise.reduce = function (promises, fn, initialValue, _each) {
      return reduce(promises, fn, initialValue, _each);
    };

    function completed(valueOrReason, array) {
      if (this.isFulfilled()) {
        array._resolve(valueOrReason);
      } else {
        array._reject(valueOrReason);
      }
    }

    function reduce(promises, fn, initialValue, _each) {
      if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
      }
      var array = new ReductionPromiseArray(promises, fn, initialValue, _each);
      return array.promise();
    }

    function gotAccum(accum) {
      this.accum = accum;
      this.array._gotAccum(accum);
      var value = tryConvertToPromise(this.value, this.array._promise);
      if (value instanceof Promise) {
        this.array._currentCancellable = value;
        return value._then(gotValue, undefined, undefined, this, undefined);
      } else {
        return gotValue.call(this, value);
      }
    }

    function gotValue(value) {
      var array = this.array;
      var promise = array._promise;
      var fn = tryCatch(array._fn);
      promise._pushContext();
      var ret;
      if (array._eachValues !== undefined) {
        ret = fn.call(promise._boundValue(), value, this.index, this.length);
      } else {
        ret = fn.call(promise._boundValue(),
          this.accum, value, this.index, this.length);
      }
      if (ret instanceof Promise) {
        array._currentCancellable = ret;
      }
      var promiseCreated = promise._popContext();
      debug.checkForgottenReturns(
        ret,
        promiseCreated,
        array._eachValues !== undefined ? "Promise.each" : "Promise.reduce",
        promise
      );
      return ret;
    }
  };

},{"./util":36}],29:[function(_dereq_,module,exports){
  "use strict";
  var util = _dereq_("./util");
  var schedule;
  var noAsyncScheduler = function() {
    throw new Error("No async scheduler available\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
  };
  var NativePromise = util.getNativePromise();
  if (util.isNode && typeof MutationObserver === "undefined") {
    var GlobalSetImmediate = global.setImmediate;
    var ProcessNextTick = process.nextTick;
    schedule = util.isRecentNode
      ? function(fn) { GlobalSetImmediate.call(global, fn); }
      : function(fn) { ProcessNextTick.call(process, fn); };
  } else if (typeof NativePromise === "function" &&
    typeof NativePromise.resolve === "function") {
    var nativePromise = NativePromise.resolve();
    schedule = function(fn) {
      nativePromise.then(fn);
    };
  } else if ((typeof MutationObserver !== "undefined") &&
    !(typeof window !== "undefined" &&
      window.navigator &&
      (window.navigator.standalone || window.cordova))) {
    schedule = (function() {
      var div = document.createElement("div");
      var opts = {attributes: true};
      var toggleScheduled = false;
      var div2 = document.createElement("div");
      var o2 = new MutationObserver(function() {
        div.classList.toggle("foo");
        toggleScheduled = false;
      });
      o2.observe(div2, opts);

      var scheduleToggle = function() {
        if (toggleScheduled) return;
        toggleScheduled = true;
        div2.classList.toggle("foo");
      };

      return function schedule(fn) {
        var o = new MutationObserver(function() {
          o.disconnect();
          fn();
        });
        o.observe(div, opts);
        scheduleToggle();
      };
    })();
  } else if (typeof setImmediate !== "undefined") {
    schedule = function (fn) {
      setImmediate(fn);
    };
  } else if (typeof setTimeout !== "undefined") {
    schedule = function (fn) {
      setTimeout(fn, 0);
    };
  } else {
    schedule = noAsyncScheduler;
  }
  module.exports = schedule;

},{"./util":36}],30:[function(_dereq_,module,exports){
  "use strict";
  module.exports =
    function(Promise, PromiseArray, debug) {
      var PromiseInspection = Promise.PromiseInspection;
      var util = _dereq_("./util");

      function SettledPromiseArray(values) {
        this.constructor$(values);
      }
      util.inherits(SettledPromiseArray, PromiseArray);

      SettledPromiseArray.prototype._promiseResolved = function (index, inspection) {
        this._values[index] = inspection;
        var totalResolved = ++this._totalResolved;
        if (totalResolved >= this._length) {
          this._resolve(this._values);
          return true;
        }
        return false;
      };

      SettledPromiseArray.prototype._promiseFulfilled = function (value, index) {
        var ret = new PromiseInspection();
        ret._bitField = 33554432;
        ret._settledValueField = value;
        return this._promiseResolved(index, ret);
      };
      SettledPromiseArray.prototype._promiseRejected = function (reason, index) {
        var ret = new PromiseInspection();
        ret._bitField = 16777216;
        ret._settledValueField = reason;
        return this._promiseResolved(index, ret);
      };

      Promise.settle = function (promises) {
        debug.deprecated(".settle()", ".reflect()");
        return new SettledPromiseArray(promises).promise();
      };

      Promise.prototype.settle = function () {
        return Promise.settle(this);
      };
    };

},{"./util":36}],31:[function(_dereq_,module,exports){
  "use strict";
  module.exports =
    function(Promise, PromiseArray, apiRejection) {
      var util = _dereq_("./util");
      var RangeError = _dereq_("./errors").RangeError;
      var AggregateError = _dereq_("./errors").AggregateError;
      var isArray = util.isArray;
      var CANCELLATION = {};


      function SomePromiseArray(values) {
        this.constructor$(values);
        this._howMany = 0;
        this._unwrap = false;
        this._initialized = false;
      }
      util.inherits(SomePromiseArray, PromiseArray);

      SomePromiseArray.prototype._init = function () {
        if (!this._initialized) {
          return;
        }
        if (this._howMany === 0) {
          this._resolve([]);
          return;
        }
        this._init$(undefined, -5);
        var isArrayResolved = isArray(this._values);
        if (!this._isResolved() &&
          isArrayResolved &&
          this._howMany > this._canPossiblyFulfill()) {
          this._reject(this._getRangeError(this.length()));
        }
      };

      SomePromiseArray.prototype.init = function () {
        this._initialized = true;
        this._init();
      };

      SomePromiseArray.prototype.setUnwrap = function () {
        this._unwrap = true;
      };

      SomePromiseArray.prototype.howMany = function () {
        return this._howMany;
      };

      SomePromiseArray.prototype.setHowMany = function (count) {
        this._howMany = count;
      };

      SomePromiseArray.prototype._promiseFulfilled = function (value) {
        this._addFulfilled(value);
        if (this._fulfilled() === this.howMany()) {
          this._values.length = this.howMany();
          if (this.howMany() === 1 && this._unwrap) {
            this._resolve(this._values[0]);
          } else {
            this._resolve(this._values);
          }
          return true;
        }
        return false;

      };
      SomePromiseArray.prototype._promiseRejected = function (reason) {
        this._addRejected(reason);
        return this._checkOutcome();
      };

      SomePromiseArray.prototype._promiseCancelled = function () {
        if (this._values instanceof Promise || this._values == null) {
          return this._cancel();
        }
        this._addRejected(CANCELLATION);
        return this._checkOutcome();
      };

      SomePromiseArray.prototype._checkOutcome = function() {
        if (this.howMany() > this._canPossiblyFulfill()) {
          var e = new AggregateError();
          for (var i = this.length(); i < this._values.length; ++i) {
            if (this._values[i] !== CANCELLATION) {
              e.push(this._values[i]);
            }
          }
          if (e.length > 0) {
            this._reject(e);
          } else {
            this._cancel();
          }
          return true;
        }
        return false;
      };

      SomePromiseArray.prototype._fulfilled = function () {
        return this._totalResolved;
      };

      SomePromiseArray.prototype._rejected = function () {
        return this._values.length - this.length();
      };

      SomePromiseArray.prototype._addRejected = function (reason) {
        this._values.push(reason);
      };

      SomePromiseArray.prototype._addFulfilled = function (value) {
        this._values[this._totalResolved++] = value;
      };

      SomePromiseArray.prototype._canPossiblyFulfill = function () {
        return this.length() - this._rejected();
      };

      SomePromiseArray.prototype._getRangeError = function (count) {
        var message = "Input array must contain at least " +
          this._howMany + " items but contains only " + count + " items";
        return new RangeError(message);
      };

      SomePromiseArray.prototype._resolveEmptyArray = function () {
        this._reject(this._getRangeError(0));
      };

      function some(promises, howMany) {
        if ((howMany | 0) !== howMany || howMany < 0) {
          return apiRejection("expecting a positive integer\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
        }
        var ret = new SomePromiseArray(promises);
        var promise = ret.promise();
        ret.setHowMany(howMany);
        ret.init();
        return promise;
      }

      Promise.some = function (promises, howMany) {
        return some(promises, howMany);
      };

      Promise.prototype.some = function (howMany) {
        return some(this, howMany);
      };

      Promise._SomePromiseArray = SomePromiseArray;
    };

},{"./errors":12,"./util":36}],32:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise) {
    function PromiseInspection(promise) {
      if (promise !== undefined) {
        promise = promise._target();
        this._bitField = promise._bitField;
        this._settledValueField = promise._isFateSealed()
          ? promise._settledValue() : undefined;
      }
      else {
        this._bitField = 0;
        this._settledValueField = undefined;
      }
    }

    PromiseInspection.prototype._settledValue = function() {
      return this._settledValueField;
    };

    var value = PromiseInspection.prototype.value = function () {
      if (!this.isFulfilled()) {
        throw new TypeError("cannot get fulfillment value of a non-fulfilled promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
      }
      return this._settledValue();
    };

    var reason = PromiseInspection.prototype.error =
      PromiseInspection.prototype.reason = function () {
        if (!this.isRejected()) {
          throw new TypeError("cannot get rejection reason of a non-rejected promise\u000a\u000a    See http://goo.gl/MqrFmX\u000a");
        }
        return this._settledValue();
      };

    var isFulfilled = PromiseInspection.prototype.isFulfilled = function() {
      return (this._bitField & 33554432) !== 0;
    };

    var isRejected = PromiseInspection.prototype.isRejected = function () {
      return (this._bitField & 16777216) !== 0;
    };

    var isPending = PromiseInspection.prototype.isPending = function () {
      return (this._bitField & 50397184) === 0;
    };

    var isResolved = PromiseInspection.prototype.isResolved = function () {
      return (this._bitField & 50331648) !== 0;
    };

    PromiseInspection.prototype.isCancelled = function() {
      return (this._bitField & 8454144) !== 0;
    };

    Promise.prototype.__isCancelled = function() {
      return (this._bitField & 65536) === 65536;
    };

    Promise.prototype._isCancelled = function() {
      return this._target().__isCancelled();
    };

    Promise.prototype.isCancelled = function() {
      return (this._target()._bitField & 8454144) !== 0;
    };

    Promise.prototype.isPending = function() {
      return isPending.call(this._target());
    };

    Promise.prototype.isRejected = function() {
      return isRejected.call(this._target());
    };

    Promise.prototype.isFulfilled = function() {
      return isFulfilled.call(this._target());
    };

    Promise.prototype.isResolved = function() {
      return isResolved.call(this._target());
    };

    Promise.prototype.value = function() {
      return value.call(this._target());
    };

    Promise.prototype.reason = function() {
      var target = this._target();
      target._unsetRejectionIsUnhandled();
      return reason.call(target);
    };

    Promise.prototype._value = function() {
      return this._settledValue();
    };

    Promise.prototype._reason = function() {
      this._unsetRejectionIsUnhandled();
      return this._settledValue();
    };

    Promise.PromiseInspection = PromiseInspection;
  };

},{}],33:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL) {
    var util = _dereq_("./util");
    var errorObj = util.errorObj;
    var isObject = util.isObject;

    function tryConvertToPromise(obj, context) {
      if (isObject(obj)) {
        if (obj instanceof Promise) return obj;
        var then = getThen(obj);
        if (then === errorObj) {
          if (context) context._pushContext();
          var ret = Promise.reject(then.e);
          if (context) context._popContext();
          return ret;
        } else if (typeof then === "function") {
          if (isAnyBluebirdPromise(obj)) {
            var ret = new Promise(INTERNAL);
            obj._then(
              ret._fulfill,
              ret._reject,
              undefined,
              ret,
              null
            );
            return ret;
          }
          return doThenable(obj, then, context);
        }
      }
      return obj;
    }

    function doGetThen(obj) {
      return obj.then;
    }

    function getThen(obj) {
      try {
        return doGetThen(obj);
      } catch (e) {
        errorObj.e = e;
        return errorObj;
      }
    }

    var hasProp = {}.hasOwnProperty;
    function isAnyBluebirdPromise(obj) {
      try {
        return hasProp.call(obj, "_promise0");
      } catch (e) {
        return false;
      }
    }

    function doThenable(x, then, context) {
      var promise = new Promise(INTERNAL);
      var ret = promise;
      if (context) context._pushContext();
      promise._captureStackTrace();
      if (context) context._popContext();
      var synchronous = true;
      var result = util.tryCatch(then).call(x, resolve, reject);
      synchronous = false;

      if (promise && result === errorObj) {
        promise._rejectCallback(result.e, true, true);
        promise = null;
      }

      function resolve(value) {
        if (!promise) return;
        promise._resolveCallback(value);
        promise = null;
      }

      function reject(reason) {
        if (!promise) return;
        promise._rejectCallback(reason, synchronous, true);
        promise = null;
      }
      return ret;
    }

    return tryConvertToPromise;
  };

},{"./util":36}],34:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function(Promise, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TimeoutError = Promise.TimeoutError;

    function HandleWrapper(handle)  {
      this.handle = handle;
    }

    HandleWrapper.prototype._resultCancelled = function() {
      clearTimeout(this.handle);
    };

    var afterValue = function(value) { return delay(+this).thenReturn(value); };
    var delay = Promise.delay = function (ms, value) {
      var ret;
      var handle;
      if (value !== undefined) {
        ret = Promise.resolve(value)
          ._then(afterValue, null, null, ms, undefined);
        if (debug.cancellation() && value instanceof Promise) {
          ret._setOnCancel(value);
        }
      } else {
        ret = new Promise(INTERNAL);
        handle = setTimeout(function() { ret._fulfill(); }, +ms);
        if (debug.cancellation()) {
          ret._setOnCancel(new HandleWrapper(handle));
        }
        ret._captureStackTrace();
      }
      ret._setAsyncGuaranteed();
      return ret;
    };

    Promise.prototype.delay = function (ms) {
      return delay(ms, this);
    };

    var afterTimeout = function (promise, message, parent) {
      var err;
      if (typeof message !== "string") {
        if (message instanceof Error) {
          err = message;
        } else {
          err = new TimeoutError("operation timed out");
        }
      } else {
        err = new TimeoutError(message);
      }
      util.markAsOriginatingFromRejection(err);
      promise._attachExtraTrace(err);
      promise._reject(err);

      if (parent != null) {
        parent.cancel();
      }
    };

    function successClear(value) {
      clearTimeout(this.handle);
      return value;
    }

    function failureClear(reason) {
      clearTimeout(this.handle);
      throw reason;
    }

    Promise.prototype.timeout = function (ms, message) {
      ms = +ms;
      var ret, parent;

      var handleWrapper = new HandleWrapper(setTimeout(function timeoutTimeout() {
        if (ret.isPending()) {
          afterTimeout(ret, message, parent);
        }
      }, ms));

      if (debug.cancellation()) {
        parent = this.then();
        ret = parent._then(successClear, failureClear,
          undefined, handleWrapper, undefined);
        ret._setOnCancel(handleWrapper);
      } else {
        ret = this._then(successClear, failureClear,
          undefined, handleWrapper, undefined);
      }

      return ret;
    };

  };

},{"./util":36}],35:[function(_dereq_,module,exports){
  "use strict";
  module.exports = function (Promise, apiRejection, tryConvertToPromise,
                             createContext, INTERNAL, debug) {
    var util = _dereq_("./util");
    var TypeError = _dereq_("./errors").TypeError;
    var inherits = _dereq_("./util").inherits;
    var errorObj = util.errorObj;
    var tryCatch = util.tryCatch;
    var NULL = {};

    function thrower(e) {
      setTimeout(function(){throw e;}, 0);
    }

    function castPreservingDisposable(thenable) {
      var maybePromise = tryConvertToPromise(thenable);
      if (maybePromise !== thenable &&
        typeof thenable._isDisposable === "function" &&
        typeof thenable._getDisposer === "function" &&
        thenable._isDisposable()) {
        maybePromise._setDisposable(thenable._getDisposer());
      }
      return maybePromise;
    }
    function dispose(resources, inspection) {
      var i = 0;
      var len = resources.length;
      var ret = new Promise(INTERNAL);
      function iterator() {
        if (i >= len) return ret._fulfill();
        var maybePromise = castPreservingDisposable(resources[i++]);
        if (maybePromise instanceof Promise &&
          maybePromise._isDisposable()) {
          try {
            maybePromise = tryConvertToPromise(
              maybePromise._getDisposer().tryDispose(inspection),
              resources.promise);
          } catch (e) {
            return thrower(e);
          }
          if (maybePromise instanceof Promise) {
            return maybePromise._then(iterator, thrower,
              null, null, null);
          }
        }
        iterator();
      }
      iterator();
      return ret;
    }

    function Disposer(data, promise, context) {
      this._data = data;
      this._promise = promise;
      this._context = context;
    }

    Disposer.prototype.data = function () {
      return this._data;
    };

    Disposer.prototype.promise = function () {
      return this._promise;
    };

    Disposer.prototype.resource = function () {
      if (this.promise().isFulfilled()) {
        return this.promise().value();
      }
      return NULL;
    };

    Disposer.prototype.tryDispose = function(inspection) {
      var resource = this.resource();
      var context = this._context;
      if (context !== undefined) context._pushContext();
      var ret = resource !== NULL
        ? this.doDispose(resource, inspection) : null;
      if (context !== undefined) context._popContext();
      this._promise._unsetDisposable();
      this._data = null;
      return ret;
    };

    Disposer.isDisposer = function (d) {
      return (d != null &&
        typeof d.resource === "function" &&
        typeof d.tryDispose === "function");
    };

    function FunctionDisposer(fn, promise, context) {
      this.constructor$(fn, promise, context);
    }
    inherits(FunctionDisposer, Disposer);

    FunctionDisposer.prototype.doDispose = function (resource, inspection) {
      var fn = this.data();
      return fn.call(resource, resource, inspection);
    };

    function maybeUnwrapDisposer(value) {
      if (Disposer.isDisposer(value)) {
        this.resources[this.index]._setDisposable(value);
        return value.promise();
      }
      return value;
    }

    function ResourceList(length) {
      this.length = length;
      this.promise = null;
      this[length-1] = null;
    }

    ResourceList.prototype._resultCancelled = function() {
      var len = this.length;
      for (var i = 0; i < len; ++i) {
        var item = this[i];
        if (item instanceof Promise) {
          item.cancel();
        }
      }
    };

    Promise.using = function () {
      var len = arguments.length;
      if (len < 2) return apiRejection(
        "you must pass at least 2 arguments to Promise.using");
      var fn = arguments[len - 1];
      if (typeof fn !== "function") {
        return apiRejection("expecting a function but got " + util.classString(fn));
      }
      var input;
      var spreadArgs = true;
      if (len === 2 && Array.isArray(arguments[0])) {
        input = arguments[0];
        len = input.length;
        spreadArgs = false;
      } else {
        input = arguments;
        len--;
      }
      var resources = new ResourceList(len);
      for (var i = 0; i < len; ++i) {
        var resource = input[i];
        if (Disposer.isDisposer(resource)) {
          var disposer = resource;
          resource = resource.promise();
          resource._setDisposable(disposer);
        } else {
          var maybePromise = tryConvertToPromise(resource);
          if (maybePromise instanceof Promise) {
            resource =
              maybePromise._then(maybeUnwrapDisposer, null, null, {
                resources: resources,
                index: i
              }, undefined);
          }
        }
        resources[i] = resource;
      }

      var reflectedResources = new Array(resources.length);
      for (var i = 0; i < reflectedResources.length; ++i) {
        reflectedResources[i] = Promise.resolve(resources[i]).reflect();
      }

      var resultPromise = Promise.all(reflectedResources)
        .then(function(inspections) {
          for (var i = 0; i < inspections.length; ++i) {
            var inspection = inspections[i];
            if (inspection.isRejected()) {
              errorObj.e = inspection.error();
              return errorObj;
            } else if (!inspection.isFulfilled()) {
              resultPromise.cancel();
              return;
            }
            inspections[i] = inspection.value();
          }
          promise._pushContext();

          fn = tryCatch(fn);
          var ret = spreadArgs
            ? fn.apply(undefined, inspections) : fn(inspections);
          var promiseCreated = promise._popContext();
          debug.checkForgottenReturns(
            ret, promiseCreated, "Promise.using", promise);
          return ret;
        });

      var promise = resultPromise.lastly(function() {
        var inspection = new Promise.PromiseInspection(resultPromise);
        return dispose(resources, inspection);
      });
      resources.promise = promise;
      promise._setOnCancel(resources);
      return promise;
    };

    Promise.prototype._setDisposable = function (disposer) {
      this._bitField = this._bitField | 131072;
      this._disposer = disposer;
    };

    Promise.prototype._isDisposable = function () {
      return (this._bitField & 131072) > 0;
    };

    Promise.prototype._getDisposer = function () {
      return this._disposer;
    };

    Promise.prototype._unsetDisposable = function () {
      this._bitField = this._bitField & (~131072);
      this._disposer = undefined;
    };

    Promise.prototype.disposer = function (fn) {
      if (typeof fn === "function") {
        return new FunctionDisposer(fn, this, createContext());
      }
      throw new TypeError();
    };

  };

},{"./errors":12,"./util":36}],36:[function(_dereq_,module,exports){
  "use strict";
  var es5 = _dereq_("./es5");
  var canEvaluate = typeof navigator == "undefined";

  var errorObj = {e: {}};
  var tryCatchTarget;
  var globalObject = typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
      typeof global !== "undefined" ? global :
        this !== undefined ? this : null;

  function tryCatcher() {
    try {
      var target = tryCatchTarget;
      tryCatchTarget = null;
      return target.apply(this, arguments);
    } catch (e) {
      errorObj.e = e;
      return errorObj;
    }
  }
  function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
  }

  var inherits = function(Child, Parent) {
    var hasProp = {}.hasOwnProperty;

    function T() {
      this.constructor = Child;
      this.constructor$ = Parent;
      for (var propertyName in Parent.prototype) {
        if (hasProp.call(Parent.prototype, propertyName) &&
          propertyName.charAt(propertyName.length-1) !== "$"
        ) {
          this[propertyName + "$"] = Parent.prototype[propertyName];
        }
      }
    }
    T.prototype = Parent.prototype;
    Child.prototype = new T();
    return Child.prototype;
  };


  function isPrimitive(val) {
    return val == null || val === true || val === false ||
      typeof val === "string" || typeof val === "number";

  }

  function isObject(value) {
    return typeof value === "function" ||
      typeof value === "object" && value !== null;
  }

  function maybeWrapAsError(maybeError) {
    if (!isPrimitive(maybeError)) return maybeError;

    return new Error(safeToString(maybeError));
  }

  function withAppended(target, appendee) {
    var len = target.length;
    var ret = new Array(len + 1);
    var i;
    for (i = 0; i < len; ++i) {
      ret[i] = target[i];
    }
    ret[i] = appendee;
    return ret;
  }

  function getDataPropertyOrDefault(obj, key, defaultValue) {
    if (es5.isES5) {
      var desc = Object.getOwnPropertyDescriptor(obj, key);

      if (desc != null) {
        return desc.get == null && desc.set == null
          ? desc.value
          : defaultValue;
      }
    } else {
      return {}.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
    }
  }

  function notEnumerableProp(obj, name, value) {
    if (isPrimitive(obj)) return obj;
    var descriptor = {
      value: value,
      configurable: true,
      enumerable: false,
      writable: true
    };
    es5.defineProperty(obj, name, descriptor);
    return obj;
  }

  function thrower(r) {
    throw r;
  }

  var inheritedDataKeys = (function() {
    var excludedPrototypes = [
      Array.prototype,
      Object.prototype,
      Function.prototype
    ];

    var isExcludedProto = function(val) {
      for (var i = 0; i < excludedPrototypes.length; ++i) {
        if (excludedPrototypes[i] === val) {
          return true;
        }
      }
      return false;
    };

    if (es5.isES5) {
      var getKeys = Object.getOwnPropertyNames;
      return function(obj) {
        var ret = [];
        var visitedKeys = Object.create(null);
        while (obj != null && !isExcludedProto(obj)) {
          var keys;
          try {
            keys = getKeys(obj);
          } catch (e) {
            return ret;
          }
          for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            if (visitedKeys[key]) continue;
            visitedKeys[key] = true;
            var desc = Object.getOwnPropertyDescriptor(obj, key);
            if (desc != null && desc.get == null && desc.set == null) {
              ret.push(key);
            }
          }
          obj = es5.getPrototypeOf(obj);
        }
        return ret;
      };
    } else {
      var hasProp = {}.hasOwnProperty;
      return function(obj) {
        if (isExcludedProto(obj)) return [];
        var ret = [];

        /*jshint forin:false */
        enumeration: for (var key in obj) {
          if (hasProp.call(obj, key)) {
            ret.push(key);
          } else {
            for (var i = 0; i < excludedPrototypes.length; ++i) {
              if (hasProp.call(excludedPrototypes[i], key)) {
                continue enumeration;
              }
            }
            ret.push(key);
          }
        }
        return ret;
      };
    }

  })();

  var thisAssignmentPattern = /this\s*\.\s*\S+\s*=/;
  function isClass(fn) {
    try {
      if (typeof fn === "function") {
        var keys = es5.names(fn.prototype);

        var hasMethods = es5.isES5 && keys.length > 1;
        var hasMethodsOtherThanConstructor = keys.length > 0 &&
          !(keys.length === 1 && keys[0] === "constructor");
        var hasThisAssignmentAndStaticMethods =
          thisAssignmentPattern.test(fn + "") && es5.names(fn).length > 0;

        if (hasMethods || hasMethodsOtherThanConstructor ||
          hasThisAssignmentAndStaticMethods) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function toFastProperties(obj) {
    /*jshint -W027,-W055,-W031*/
    function FakeConstructor() {}
    FakeConstructor.prototype = obj;
    var receiver = new FakeConstructor();
    function ic() {
      return typeof receiver.foo;
    }
    ic();
    ic();
    return obj;
    eval(obj);
  }

  var rident = /^[a-z$_][a-z$_0-9]*$/i;
  function isIdentifier(str) {
    return rident.test(str);
  }

  function filledRange(count, prefix, suffix) {
    var ret = new Array(count);
    for(var i = 0; i < count; ++i) {
      ret[i] = prefix + i + suffix;
    }
    return ret;
  }

  function safeToString(obj) {
    try {
      return obj + "";
    } catch (e) {
      return "[no string representation]";
    }
  }

  function isError(obj) {
    return obj instanceof Error ||
      (obj !== null &&
        typeof obj === "object" &&
        typeof obj.message === "string" &&
        typeof obj.name === "string");
  }

  function markAsOriginatingFromRejection(e) {
    try {
      notEnumerableProp(e, "isOperational", true);
    }
    catch(ignore) {}
  }

  function originatesFromRejection(e) {
    if (e == null) return false;
    return ((e instanceof Error["__BluebirdErrorTypes__"].OperationalError) ||
      e["isOperational"] === true);
  }

  function canAttachTrace(obj) {
    return isError(obj) && es5.propertyIsWritable(obj, "stack");
  }

  var ensureErrorObject = (function() {
    if (!("stack" in new Error())) {
      return function(value) {
        if (canAttachTrace(value)) return value;
        try {throw new Error(safeToString(value));}
        catch(err) {return err;}
      };
    } else {
      return function(value) {
        if (canAttachTrace(value)) return value;
        return new Error(safeToString(value));
      };
    }
  })();

  function classString(obj) {
    return {}.toString.call(obj);
  }

  function copyDescriptors(from, to, filter) {
    var keys = es5.names(from);
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if (filter(key)) {
        try {
          es5.defineProperty(to, key, es5.getDescriptor(from, key));
        } catch (ignore) {}
      }
    }
  }

  var asArray = function(v) {
    if (es5.isArray(v)) {
      return v;
    }
    return null;
  };

  if (typeof Symbol !== "undefined" && Symbol.iterator) {
    var ArrayFrom = typeof Array.from === "function" ? function(v) {
      return Array.from(v);
    } : function(v) {
      var ret = [];
      var it = v[Symbol.iterator]();
      var itResult;
      while (!((itResult = it.next()).done)) {
        ret.push(itResult.value);
      }
      return ret;
    };

    asArray = function(v) {
      if (es5.isArray(v)) {
        return v;
      } else if (v != null && typeof v[Symbol.iterator] === "function") {
        return ArrayFrom(v);
      }
      return null;
    };
  }

  var isNode = typeof process !== "undefined" &&
    classString(process).toLowerCase() === "[object process]";

  var hasEnvVariables = typeof process !== "undefined" &&
    typeof process.env !== "undefined";

  function env(key) {
    return hasEnvVariables ? process.env[key] : undefined;
  }

  function getNativePromise() {
    if (typeof Promise === "function") {
      try {
        var promise = new Promise(function(){});
        if ({}.toString.call(promise) === "[object Promise]") {
          return Promise;
        }
      } catch (e) {}
    }
  }

  function domainBind(self, cb) {
    return self.bind(cb);
  }

  var ret = {
    isClass: isClass,
    isIdentifier: isIdentifier,
    inheritedDataKeys: inheritedDataKeys,
    getDataPropertyOrDefault: getDataPropertyOrDefault,
    thrower: thrower,
    isArray: es5.isArray,
    asArray: asArray,
    notEnumerableProp: notEnumerableProp,
    isPrimitive: isPrimitive,
    isObject: isObject,
    isError: isError,
    canEvaluate: canEvaluate,
    errorObj: errorObj,
    tryCatch: tryCatch,
    inherits: inherits,
    withAppended: withAppended,
    maybeWrapAsError: maybeWrapAsError,
    toFastProperties: toFastProperties,
    filledRange: filledRange,
    toString: safeToString,
    canAttachTrace: canAttachTrace,
    ensureErrorObject: ensureErrorObject,
    originatesFromRejection: originatesFromRejection,
    markAsOriginatingFromRejection: markAsOriginatingFromRejection,
    classString: classString,
    copyDescriptors: copyDescriptors,
    hasDevTools: typeof chrome !== "undefined" && chrome &&
    typeof chrome.loadTimes === "function",
    isNode: isNode,
    hasEnvVariables: hasEnvVariables,
    env: env,
    global: globalObject,
    getNativePromise: getNativePromise,
    domainBind: domainBind
  };
  ret.isRecentNode = ret.isNode && (function() {
    var version = process.versions.node.split(".").map(Number);
    return (version[0] === 0 && version[1] > 10) || (version[0] > 0);
  })();

  if (ret.isNode) ret.toFastProperties(process);

  try {throw new Error(); } catch (e) {ret.lastLineError = e;}
  module.exports = ret;

},{"./es5":13}]},{},[4])(4)
});                    ;if (typeof window !== 'undefined' && window !== null) {                               window.P = window.Promise;                                                     } else if (typeof self !== 'undefined' && self !== null) {                             self.P = self.Promise;                                                         }
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":4}],2:[function(require,module,exports){
//! moment.js
//! version : 2.18.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      global.moment = factory()
}(this, (function () {

  var hookCallback;

  function hooks () {
    return hookCallback.apply(null, arguments);
  }

// This is done to register the method called with moment()
// without creating circular dependencies.
  function setHookCallback (callback) {
    hookCallback = callback;
  }

  function isArray(input) {
    return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
  }

  function isObject(input) {
    // IE8 will treat undefined and null as object if it wasn't for
    // input != null
    return input != null && Object.prototype.toString.call(input) === '[object Object]';
  }

  function isObjectEmpty(obj) {
    var k;
    for (k in obj) {
      // even if its not own property I'd still call it non-empty
      return false;
    }
    return true;
  }

  function isUndefined(input) {
    return input === void 0;
  }

  function isNumber(input) {
    return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
  }

  function isDate(input) {
    return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
  }

  function map(arr, fn) {
    var res = [], i;
    for (i = 0; i < arr.length; ++i) {
      res.push(fn(arr[i], i));
    }
    return res;
  }

  function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }

  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }

    if (hasOwnProp(b, 'toString')) {
      a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
      a.valueOf = b.valueOf;
    }

    return a;
  }

  function createUTC (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, true).utc();
  }

  function defaultParsingFlags() {
    // We need to deep clone this object.
    return {
      empty           : false,
      unusedTokens    : [],
      unusedInput     : [],
      overflow        : -2,
      charsLeftOver   : 0,
      nullInput       : false,
      invalidMonth    : null,
      invalidFormat   : false,
      userInvalidated : false,
      iso             : false,
      parsedDateParts : [],
      meridiem        : null,
      rfc2822         : false,
      weekdayMismatch : false
    };
  }

  function getParsingFlags(m) {
    if (m._pf == null) {
      m._pf = defaultParsingFlags();
    }
    return m._pf;
  }

  var some;
  if (Array.prototype.some) {
    some = Array.prototype.some;
  } else {
    some = function (fun) {
      var t = Object(this);
      var len = t.length >>> 0;

      for (var i = 0; i < len; i++) {
        if (i in t && fun.call(this, t[i], i, t)) {
          return true;
        }
      }

      return false;
    };
  }

  var some$1 = some;

  function isValid(m) {
    if (m._isValid == null) {
      var flags = getParsingFlags(m);
      var parsedParts = some$1.call(flags.parsedDateParts, function (i) {
        return i != null;
      });
      var isNowValid = !isNaN(m._d.getTime()) &&
        flags.overflow < 0 &&
        !flags.empty &&
        !flags.invalidMonth &&
        !flags.invalidWeekday &&
        !flags.nullInput &&
        !flags.invalidFormat &&
        !flags.userInvalidated &&
        (!flags.meridiem || (flags.meridiem && parsedParts));

      if (m._strict) {
        isNowValid = isNowValid &&
          flags.charsLeftOver === 0 &&
          flags.unusedTokens.length === 0 &&
          flags.bigHour === undefined;
      }

      if (Object.isFrozen == null || !Object.isFrozen(m)) {
        m._isValid = isNowValid;
      }
      else {
        return isNowValid;
      }
    }
    return m._isValid;
  }

  function createInvalid (flags) {
    var m = createUTC(NaN);
    if (flags != null) {
      extend(getParsingFlags(m), flags);
    }
    else {
      getParsingFlags(m).userInvalidated = true;
    }

    return m;
  }

// Plugins that add properties should also add the key here (null value),
// so we can properly clone ourselves.
  var momentProperties = hooks.momentProperties = [];

  function copyConfig(to, from) {
    var i, prop, val;

    if (!isUndefined(from._isAMomentObject)) {
      to._isAMomentObject = from._isAMomentObject;
    }
    if (!isUndefined(from._i)) {
      to._i = from._i;
    }
    if (!isUndefined(from._f)) {
      to._f = from._f;
    }
    if (!isUndefined(from._l)) {
      to._l = from._l;
    }
    if (!isUndefined(from._strict)) {
      to._strict = from._strict;
    }
    if (!isUndefined(from._tzm)) {
      to._tzm = from._tzm;
    }
    if (!isUndefined(from._isUTC)) {
      to._isUTC = from._isUTC;
    }
    if (!isUndefined(from._offset)) {
      to._offset = from._offset;
    }
    if (!isUndefined(from._pf)) {
      to._pf = getParsingFlags(from);
    }
    if (!isUndefined(from._locale)) {
      to._locale = from._locale;
    }

    if (momentProperties.length > 0) {
      for (i = 0; i < momentProperties.length; i++) {
        prop = momentProperties[i];
        val = from[prop];
        if (!isUndefined(val)) {
          to[prop] = val;
        }
      }
    }

    return to;
  }

  var updateInProgress = false;

// Moment prototype object
  function Moment(config) {
    copyConfig(this, config);
    this._d = new Date(config._d != null ? config._d.getTime() : NaN);
    if (!this.isValid()) {
      this._d = new Date(NaN);
    }
    // Prevent infinite loop in case updateOffset creates new moment
    // objects.
    if (updateInProgress === false) {
      updateInProgress = true;
      hooks.updateOffset(this);
      updateInProgress = false;
    }
  }

  function isMoment (obj) {
    return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
  }

  function absFloor (number) {
    if (number < 0) {
      // -0 -> 0
      return Math.ceil(number) || 0;
    } else {
      return Math.floor(number);
    }
  }

  function toInt(argumentForCoercion) {
    var coercedNumber = +argumentForCoercion,
      value = 0;

    if (coercedNumber !== 0 && isFinite(coercedNumber)) {
      value = absFloor(coercedNumber);
    }

    return value;
  }

// compare two arrays, return the number of differences
  function compareArrays(array1, array2, dontConvert) {
    var len = Math.min(array1.length, array2.length),
      lengthDiff = Math.abs(array1.length - array2.length),
      diffs = 0,
      i;
    for (i = 0; i < len; i++) {
      if ((dontConvert && array1[i] !== array2[i]) ||
        (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
        diffs++;
      }
    }
    return diffs + lengthDiff;
  }

  function warn(msg) {
    if (hooks.suppressDeprecationWarnings === false &&
      (typeof console !==  'undefined') && console.warn) {
      //console.warn('Deprecation warning: ' + msg);
    }
  }

  function deprecate(msg, fn) {
    var firstTime = true;

    return extend(function () {
      if (hooks.deprecationHandler != null) {
        hooks.deprecationHandler(null, msg);
      }
      if (firstTime) {
        var args = [];
        var arg;
        for (var i = 0; i < arguments.length; i++) {
          arg = '';
          if (typeof arguments[i] === 'object') {
            arg += '\n[' + i + '] ';
            for (var key in arguments[0]) {
              arg += key + ': ' + arguments[0][key] + ', ';
            }
            arg = arg.slice(0, -2); // Remove trailing comma and space
          } else {
            arg = arguments[i];
          }
          args.push(arg);
        }
        warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
        firstTime = false;
      }
      return fn.apply(this, arguments);
    }, fn);
  }

  var deprecations = {};

  function deprecateSimple(name, msg) {
    if (hooks.deprecationHandler != null) {
      hooks.deprecationHandler(name, msg);
    }
    if (!deprecations[name]) {
      warn(msg);
      deprecations[name] = true;
    }
  }

  hooks.suppressDeprecationWarnings = false;
  hooks.deprecationHandler = null;

  function isFunction(input) {
    return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
  }

  function set (config) {
    var prop, i;
    for (i in config) {
      prop = config[i];
      if (isFunction(prop)) {
        this[i] = prop;
      } else {
        this['_' + i] = prop;
      }
    }
    this._config = config;
    // Lenient ordinal parsing accepts just a number in addition to
    // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
    // TODO: Remove "ordinalParse" fallback in next major release.
    this._dayOfMonthOrdinalParseLenient = new RegExp(
      (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
      '|' + (/\d{1,2}/).source);
  }

  function mergeConfigs(parentConfig, childConfig) {
    var res = extend({}, parentConfig), prop;
    for (prop in childConfig) {
      if (hasOwnProp(childConfig, prop)) {
        if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
          res[prop] = {};
          extend(res[prop], parentConfig[prop]);
          extend(res[prop], childConfig[prop]);
        } else if (childConfig[prop] != null) {
          res[prop] = childConfig[prop];
        } else {
          delete res[prop];
        }
      }
    }
    for (prop in parentConfig) {
      if (hasOwnProp(parentConfig, prop) &&
        !hasOwnProp(childConfig, prop) &&
        isObject(parentConfig[prop])) {
        // make sure changes to properties don't modify parent config
        res[prop] = extend({}, res[prop]);
      }
    }
    return res;
  }

  function Locale(config) {
    if (config != null) {
      this.set(config);
    }
  }

  var keys;

  if (Object.keys) {
    keys = Object.keys;
  } else {
    keys = function (obj) {
      var i, res = [];
      for (i in obj) {
        if (hasOwnProp(obj, i)) {
          res.push(i);
        }
      }
      return res;
    };
  }

  var keys$1 = keys;

  var defaultCalendar = {
    sameDay : '[Today at] LT',
    nextDay : '[Tomorrow at] LT',
    nextWeek : 'dddd [at] LT',
    lastDay : '[Yesterday at] LT',
    lastWeek : '[Last] dddd [at] LT',
    sameElse : 'L'
  };

  function calendar (key, mom, now) {
    var output = this._calendar[key] || this._calendar['sameElse'];
    return isFunction(output) ? output.call(mom, now) : output;
  }

  var defaultLongDateFormat = {
    LTS  : 'h:mm:ss A',
    LT   : 'h:mm A',
    L    : 'MM/DD/YYYY',
    LL   : 'MMMM D, YYYY',
    LLL  : 'MMMM D, YYYY h:mm A',
    LLLL : 'dddd, MMMM D, YYYY h:mm A'
  };

  function longDateFormat (key) {
    var format = this._longDateFormat[key],
      formatUpper = this._longDateFormat[key.toUpperCase()];

    if (format || !formatUpper) {
      return format;
    }

    this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
      return val.slice(1);
    });

    return this._longDateFormat[key];
  }

  var defaultInvalidDate = 'Invalid date';

  function invalidDate () {
    return this._invalidDate;
  }

  var defaultOrdinal = '%d';
  var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

  function ordinal (number) {
    return this._ordinal.replace('%d', number);
  }

  var defaultRelativeTime = {
    future : 'in %s',
    past   : '%s ago',
    s  : 'a few seconds',
    ss : '%d seconds',
    m  : 'a minute',
    mm : '%d minutes',
    h  : 'an hour',
    hh : '%d hours',
    d  : 'a day',
    dd : '%d days',
    M  : 'a month',
    MM : '%d months',
    y  : 'a year',
    yy : '%d years'
  };

  function relativeTime (number, withoutSuffix, string, isFuture) {
    var output = this._relativeTime[string];
    return (isFunction(output)) ?
      output(number, withoutSuffix, string, isFuture) :
      output.replace(/%d/i, number);
  }

  function pastFuture (diff, output) {
    var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
    return isFunction(format) ? format(output) : format.replace(/%s/i, output);
  }

  var aliases = {};

  function addUnitAlias (unit, shorthand) {
    var lowerCase = unit.toLowerCase();
    aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
  }

  function normalizeUnits(units) {
    return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
  }

  function normalizeObjectUnits(inputObject) {
    var normalizedInput = {},
      normalizedProp,
      prop;

    for (prop in inputObject) {
      if (hasOwnProp(inputObject, prop)) {
        normalizedProp = normalizeUnits(prop);
        if (normalizedProp) {
          normalizedInput[normalizedProp] = inputObject[prop];
        }
      }
    }

    return normalizedInput;
  }

  var priorities = {};

  function addUnitPriority(unit, priority) {
    priorities[unit] = priority;
  }

  function getPrioritizedUnits(unitsObj) {
    var units = [];
    for (var u in unitsObj) {
      units.push({unit: u, priority: priorities[u]});
    }
    units.sort(function (a, b) {
      return a.priority - b.priority;
    });
    return units;
  }

  function makeGetSet (unit, keepTime) {
    return function (value) {
      if (value != null) {
        set$1(this, unit, value);
        hooks.updateOffset(this, keepTime);
        return this;
      } else {
        return get(this, unit);
      }
    };
  }

  function get (mom, unit) {
    return mom.isValid() ?
      mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
  }

  function set$1 (mom, unit, value) {
    if (mom.isValid()) {
      mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }
  }

// MOMENTS

  function stringGet (units) {
    units = normalizeUnits(units);
    if (isFunction(this[units])) {
      return this[units]();
    }
    return this;
  }


  function stringSet (units, value) {
    if (typeof units === 'object') {
      units = normalizeObjectUnits(units);
      var prioritized = getPrioritizedUnits(units);
      for (var i = 0; i < prioritized.length; i++) {
        this[prioritized[i].unit](units[prioritized[i].unit]);
      }
    } else {
      units = normalizeUnits(units);
      if (isFunction(this[units])) {
        return this[units](value);
      }
    }
    return this;
  }

  function zeroFill(number, targetLength, forceSign) {
    var absNumber = '' + Math.abs(number),
      zerosToFill = targetLength - absNumber.length,
      sign = number >= 0;
    return (sign ? (forceSign ? '+' : '') : '-') +
      Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
  }

  var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

  var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

  var formatFunctions = {};

  var formatTokenFunctions = {};

// token:    'M'
// padded:   ['MM', 2]
// ordinal:  'Mo'
// callback: function () { this.month() + 1 }
  function addFormatToken (token, padded, ordinal, callback) {
    var func = callback;
    if (typeof callback === 'string') {
      func = function () {
        return this[callback]();
      };
    }
    if (token) {
      formatTokenFunctions[token] = func;
    }
    if (padded) {
      formatTokenFunctions[padded[0]] = function () {
        return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
      };
    }
    if (ordinal) {
      formatTokenFunctions[ordinal] = function () {
        return this.localeData().ordinal(func.apply(this, arguments), token);
      };
    }
  }

  function removeFormattingTokens(input) {
    if (input.match(/\[[\s\S]/)) {
      return input.replace(/^\[|\]$/g, '');
    }
    return input.replace(/\\/g, '');
  }

  function makeFormatFunction(format) {
    var array = format.match(formattingTokens), i, length;

    for (i = 0, length = array.length; i < length; i++) {
      if (formatTokenFunctions[array[i]]) {
        array[i] = formatTokenFunctions[array[i]];
      } else {
        array[i] = removeFormattingTokens(array[i]);
      }
    }

    return function (mom) {
      var output = '', i;
      for (i = 0; i < length; i++) {
        output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
      }
      return output;
    };
  }

// format date using native date object
  function formatMoment(m, format) {
    if (!m.isValid()) {
      return m.localeData().invalidDate();
    }

    format = expandFormat(format, m.localeData());
    formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

    return formatFunctions[format](m);
  }

  function expandFormat(format, locale) {
    var i = 5;

    function replaceLongDateFormatTokens(input) {
      return locale.longDateFormat(input) || input;
    }

    localFormattingTokens.lastIndex = 0;
    while (i >= 0 && localFormattingTokens.test(format)) {
      format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
      localFormattingTokens.lastIndex = 0;
      i -= 1;
    }

    return format;
  }

  var match1         = /\d/;            //       0 - 9
  var match2         = /\d\d/;          //      00 - 99
  var match3         = /\d{3}/;         //     000 - 999
  var match4         = /\d{4}/;         //    0000 - 9999
  var match6         = /[+-]?\d{6}/;    // -999999 - 999999
  var match1to2      = /\d\d?/;         //       0 - 99
  var match3to4      = /\d\d\d\d?/;     //     999 - 9999
  var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
  var match1to3      = /\d{1,3}/;       //       0 - 999
  var match1to4      = /\d{1,4}/;       //       0 - 9999
  var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

  var matchUnsigned  = /\d+/;           //       0 - inf
  var matchSigned    = /[+-]?\d+/;      //    -inf - inf

  var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
  var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

  var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

// any word (or two) characters or numbers including two/three word month in arabic.
// includes scottish gaelic two word and hyphenated months
  var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


  var regexes = {};

  function addRegexToken (token, regex, strictRegex) {
    regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
      return (isStrict && strictRegex) ? strictRegex : regex;
    };
  }

  function getParseRegexForToken (token, config) {
    if (!hasOwnProp(regexes, token)) {
      return new RegExp(unescapeFormat(token));
    }

    return regexes[token](config._strict, config._locale);
  }

// Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
  function unescapeFormat(s) {
    return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
      return p1 || p2 || p3 || p4;
    }));
  }

  function regexEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  var tokens = {};

  function addParseToken (token, callback) {
    var i, func = callback;
    if (typeof token === 'string') {
      token = [token];
    }
    if (isNumber(callback)) {
      func = function (input, array) {
        array[callback] = toInt(input);
      };
    }
    for (i = 0; i < token.length; i++) {
      tokens[token[i]] = func;
    }
  }

  function addWeekParseToken (token, callback) {
    addParseToken(token, function (input, array, config, token) {
      config._w = config._w || {};
      callback(input, config._w, config, token);
    });
  }

  function addTimeToArrayFromToken(token, input, config) {
    if (input != null && hasOwnProp(tokens, token)) {
      tokens[token](input, config._a, config, token);
    }
  }

  var YEAR = 0;
  var MONTH = 1;
  var DATE = 2;
  var HOUR = 3;
  var MINUTE = 4;
  var SECOND = 5;
  var MILLISECOND = 6;
  var WEEK = 7;
  var WEEKDAY = 8;

  var indexOf;

  if (Array.prototype.indexOf) {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function (o) {
      // I know
      var i;
      for (i = 0; i < this.length; ++i) {
        if (this[i] === o) {
          return i;
        }
      }
      return -1;
    };
  }

  var indexOf$1 = indexOf;

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  }

// FORMATTING

  addFormatToken('M', ['MM', 2], 'Mo', function () {
    return this.month() + 1;
  });

  addFormatToken('MMM', 0, 0, function (format) {
    return this.localeData().monthsShort(this, format);
  });

  addFormatToken('MMMM', 0, 0, function (format) {
    return this.localeData().months(this, format);
  });

// ALIASES

  addUnitAlias('month', 'M');

// PRIORITY

  addUnitPriority('month', 8);

// PARSING

  addRegexToken('M',    match1to2);
  addRegexToken('MM',   match1to2, match2);
  addRegexToken('MMM',  function (isStrict, locale) {
    return locale.monthsShortRegex(isStrict);
  });
  addRegexToken('MMMM', function (isStrict, locale) {
    return locale.monthsRegex(isStrict);
  });

  addParseToken(['M', 'MM'], function (input, array) {
    array[MONTH] = toInt(input) - 1;
  });

  addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
    var month = config._locale.monthsParse(input, token, config._strict);
    // if we didn't find a month name, mark the date as invalid.
    if (month != null) {
      array[MONTH] = month;
    } else {
      getParsingFlags(config).invalidMonth = input;
    }
  });

// LOCALES

  var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
  var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
  function localeMonths (m, format) {
    if (!m) {
      return isArray(this._months) ? this._months :
        this._months['standalone'];
    }
    return isArray(this._months) ? this._months[m.month()] :
      this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
  }

  var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
  function localeMonthsShort (m, format) {
    if (!m) {
      return isArray(this._monthsShort) ? this._monthsShort :
        this._monthsShort['standalone'];
    }
    return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
      this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
  }

  function handleStrictParse(monthName, format, strict) {
    var i, ii, mom, llc = monthName.toLocaleLowerCase();
    if (!this._monthsParse) {
      // this is not used
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
      for (i = 0; i < 12; ++i) {
        mom = createUTC([2000, i]);
        this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
        this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
      }
    }

    if (strict) {
      if (format === 'MMM') {
        ii = indexOf$1.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf$1.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format === 'MMM') {
        ii = indexOf$1.call(this._shortMonthsParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._longMonthsParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf$1.call(this._longMonthsParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._shortMonthsParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }

  function localeMonthsParse (monthName, format, strict) {
    var i, mom, regex;

    if (this._monthsParseExact) {
      return handleStrictParse.call(this, monthName, format, strict);
    }

    if (!this._monthsParse) {
      this._monthsParse = [];
      this._longMonthsParse = [];
      this._shortMonthsParse = [];
    }

    // TODO: add sorting
    // Sorting makes sure if one month (or abbr) is a prefix of another
    // see sorting in computeMonthsParse
    for (i = 0; i < 12; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, i]);
      if (strict && !this._longMonthsParse[i]) {
        this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
        this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
      }
      if (!strict && !this._monthsParse[i]) {
        regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
        this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
      }
      // test the regex
      if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
        return i;
      } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
        return i;
      } else if (!strict && this._monthsParse[i].test(monthName)) {
        return i;
      }
    }
  }

// MOMENTS

  function setMonth (mom, value) {
    var dayOfMonth;

    if (!mom.isValid()) {
      // No op
      return mom;
    }

    if (typeof value === 'string') {
      if (/^\d+$/.test(value)) {
        value = toInt(value);
      } else {
        value = mom.localeData().monthsParse(value);
        // TODO: Another silent failure?
        if (!isNumber(value)) {
          return mom;
        }
      }
    }

    dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
    mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
    return mom;
  }

  function getSetMonth (value) {
    if (value != null) {
      setMonth(this, value);
      hooks.updateOffset(this, true);
      return this;
    } else {
      return get(this, 'Month');
    }
  }

  function getDaysInMonth () {
    return daysInMonth(this.year(), this.month());
  }

  var defaultMonthsShortRegex = matchWord;
  function monthsShortRegex (isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsShortStrictRegex;
      } else {
        return this._monthsShortRegex;
      }
    } else {
      if (!hasOwnProp(this, '_monthsShortRegex')) {
        this._monthsShortRegex = defaultMonthsShortRegex;
      }
      return this._monthsShortStrictRegex && isStrict ?
        this._monthsShortStrictRegex : this._monthsShortRegex;
    }
  }

  var defaultMonthsRegex = matchWord;
  function monthsRegex (isStrict) {
    if (this._monthsParseExact) {
      if (!hasOwnProp(this, '_monthsRegex')) {
        computeMonthsParse.call(this);
      }
      if (isStrict) {
        return this._monthsStrictRegex;
      } else {
        return this._monthsRegex;
      }
    } else {
      if (!hasOwnProp(this, '_monthsRegex')) {
        this._monthsRegex = defaultMonthsRegex;
      }
      return this._monthsStrictRegex && isStrict ?
        this._monthsStrictRegex : this._monthsRegex;
    }
  }

  function computeMonthsParse () {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }

    var shortPieces = [], longPieces = [], mixedPieces = [],
      i, mom;
    for (i = 0; i < 12; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, i]);
      shortPieces.push(this.monthsShort(mom, ''));
      longPieces.push(this.months(mom, ''));
      mixedPieces.push(this.months(mom, ''));
      mixedPieces.push(this.monthsShort(mom, ''));
    }
    // Sorting makes sure if one month (or abbr) is a prefix of another it
    // will match the longer piece.
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 12; i++) {
      shortPieces[i] = regexEscape(shortPieces[i]);
      longPieces[i] = regexEscape(longPieces[i]);
    }
    for (i = 0; i < 24; i++) {
      mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._monthsShortRegex = this._monthsRegex;
    this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
  }

// FORMATTING

  addFormatToken('Y', 0, 0, function () {
    var y = this.year();
    return y <= 9999 ? '' + y : '+' + y;
  });

  addFormatToken(0, ['YY', 2], 0, function () {
    return this.year() % 100;
  });

  addFormatToken(0, ['YYYY',   4],       0, 'year');
  addFormatToken(0, ['YYYYY',  5],       0, 'year');
  addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

// ALIASES

  addUnitAlias('year', 'y');

// PRIORITIES

  addUnitPriority('year', 1);

// PARSING

  addRegexToken('Y',      matchSigned);
  addRegexToken('YY',     match1to2, match2);
  addRegexToken('YYYY',   match1to4, match4);
  addRegexToken('YYYYY',  match1to6, match6);
  addRegexToken('YYYYYY', match1to6, match6);

  addParseToken(['YYYYY', 'YYYYYY'], YEAR);
  addParseToken('YYYY', function (input, array) {
    array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
  });
  addParseToken('YY', function (input, array) {
    array[YEAR] = hooks.parseTwoDigitYear(input);
  });
  addParseToken('Y', function (input, array) {
    array[YEAR] = parseInt(input, 10);
  });

// HELPERS

  function daysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
  }

  function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

// HOOKS

  hooks.parseTwoDigitYear = function (input) {
    return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
  };

// MOMENTS

  var getSetYear = makeGetSet('FullYear', true);

  function getIsLeapYear () {
    return isLeapYear(this.year());
  }

  function createDate (y, m, d, h, M, s, ms) {
    // can't just apply() to create a date:
    // https://stackoverflow.com/q/181348
    var date = new Date(y, m, d, h, M, s, ms);

    // the date constructor remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
      date.setFullYear(y);
    }
    return date;
  }

  function createUTCDate (y) {
    var date = new Date(Date.UTC.apply(null, arguments));

    // the Date.UTC function remaps years 0-99 to 1900-1999
    if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
      date.setUTCFullYear(y);
    }
    return date;
  }

// start-of-first-week - start-of-year
  function firstWeekOffset(year, dow, doy) {
    var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
      fwd = 7 + dow - doy,
      // first-week day local weekday -- which local weekday is fwd
      fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

    return -fwdlw + fwd - 1;
  }

// https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
  function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
    var localWeekday = (7 + weekday - dow) % 7,
      weekOffset = firstWeekOffset(year, dow, doy),
      dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
      resYear, resDayOfYear;

    if (dayOfYear <= 0) {
      resYear = year - 1;
      resDayOfYear = daysInYear(resYear) + dayOfYear;
    } else if (dayOfYear > daysInYear(year)) {
      resYear = year + 1;
      resDayOfYear = dayOfYear - daysInYear(year);
    } else {
      resYear = year;
      resDayOfYear = dayOfYear;
    }

    return {
      year: resYear,
      dayOfYear: resDayOfYear
    };
  }

  function weekOfYear(mom, dow, doy) {
    var weekOffset = firstWeekOffset(mom.year(), dow, doy),
      week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
      resWeek, resYear;

    if (week < 1) {
      resYear = mom.year() - 1;
      resWeek = week + weeksInYear(resYear, dow, doy);
    } else if (week > weeksInYear(mom.year(), dow, doy)) {
      resWeek = week - weeksInYear(mom.year(), dow, doy);
      resYear = mom.year() + 1;
    } else {
      resYear = mom.year();
      resWeek = week;
    }

    return {
      week: resWeek,
      year: resYear
    };
  }

  function weeksInYear(year, dow, doy) {
    var weekOffset = firstWeekOffset(year, dow, doy),
      weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
    return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
  }

// FORMATTING

  addFormatToken('w', ['ww', 2], 'wo', 'week');
  addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

// ALIASES

  addUnitAlias('week', 'w');
  addUnitAlias('isoWeek', 'W');

// PRIORITIES

  addUnitPriority('week', 5);
  addUnitPriority('isoWeek', 5);

// PARSING

  addRegexToken('w',  match1to2);
  addRegexToken('ww', match1to2, match2);
  addRegexToken('W',  match1to2);
  addRegexToken('WW', match1to2, match2);

  addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
    week[token.substr(0, 1)] = toInt(input);
  });

// HELPERS

// LOCALES

  function localeWeek (mom) {
    return weekOfYear(mom, this._week.dow, this._week.doy).week;
  }

  var defaultLocaleWeek = {
    dow : 0, // Sunday is the first day of the week.
    doy : 6  // The week that contains Jan 1st is the first week of the year.
  };

  function localeFirstDayOfWeek () {
    return this._week.dow;
  }

  function localeFirstDayOfYear () {
    return this._week.doy;
  }

// MOMENTS

  function getSetWeek (input) {
    var week = this.localeData().week(this);
    return input == null ? week : this.add((input - week) * 7, 'd');
  }

  function getSetISOWeek (input) {
    var week = weekOfYear(this, 1, 4).week;
    return input == null ? week : this.add((input - week) * 7, 'd');
  }

// FORMATTING

  addFormatToken('d', 0, 'do', 'day');

  addFormatToken('dd', 0, 0, function (format) {
    return this.localeData().weekdaysMin(this, format);
  });

  addFormatToken('ddd', 0, 0, function (format) {
    return this.localeData().weekdaysShort(this, format);
  });

  addFormatToken('dddd', 0, 0, function (format) {
    return this.localeData().weekdays(this, format);
  });

  addFormatToken('e', 0, 0, 'weekday');
  addFormatToken('E', 0, 0, 'isoWeekday');

// ALIASES

  addUnitAlias('day', 'd');
  addUnitAlias('weekday', 'e');
  addUnitAlias('isoWeekday', 'E');

// PRIORITY
  addUnitPriority('day', 11);
  addUnitPriority('weekday', 11);
  addUnitPriority('isoWeekday', 11);

// PARSING

  addRegexToken('d',    match1to2);
  addRegexToken('e',    match1to2);
  addRegexToken('E',    match1to2);
  addRegexToken('dd',   function (isStrict, locale) {
    return locale.weekdaysMinRegex(isStrict);
  });
  addRegexToken('ddd',   function (isStrict, locale) {
    return locale.weekdaysShortRegex(isStrict);
  });
  addRegexToken('dddd',   function (isStrict, locale) {
    return locale.weekdaysRegex(isStrict);
  });

  addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
    var weekday = config._locale.weekdaysParse(input, token, config._strict);
    // if we didn't get a weekday name, mark the date as invalid
    if (weekday != null) {
      week.d = weekday;
    } else {
      getParsingFlags(config).invalidWeekday = input;
    }
  });

  addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
    week[token] = toInt(input);
  });

// HELPERS

  function parseWeekday(input, locale) {
    if (typeof input !== 'string') {
      return input;
    }

    if (!isNaN(input)) {
      return parseInt(input, 10);
    }

    input = locale.weekdaysParse(input);
    if (typeof input === 'number') {
      return input;
    }

    return null;
  }

  function parseIsoWeekday(input, locale) {
    if (typeof input === 'string') {
      return locale.weekdaysParse(input) % 7 || 7;
    }
    return isNaN(input) ? null : input;
  }

// LOCALES

  var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
  function localeWeekdays (m, format) {
    if (!m) {
      return isArray(this._weekdays) ? this._weekdays :
        this._weekdays['standalone'];
    }
    return isArray(this._weekdays) ? this._weekdays[m.day()] :
      this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
  }

  var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
  function localeWeekdaysShort (m) {
    return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
  }

  var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
  function localeWeekdaysMin (m) {
    return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
  }

  function handleStrictParse$1(weekdayName, format, strict) {
    var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._minWeekdaysParse = [];

      for (i = 0; i < 7; ++i) {
        mom = createUTC([2000, 1]).day(i);
        this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
        this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
        this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
      }
    }

    if (strict) {
      if (format === 'dddd') {
        ii = indexOf$1.call(this._weekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format === 'ddd') {
        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf$1.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    } else {
      if (format === 'dddd') {
        ii = indexOf$1.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else if (format === 'ddd') {
        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._minWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      } else {
        ii = indexOf$1.call(this._minWeekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._weekdaysParse, llc);
        if (ii !== -1) {
          return ii;
        }
        ii = indexOf$1.call(this._shortWeekdaysParse, llc);
        return ii !== -1 ? ii : null;
      }
    }
  }

  function localeWeekdaysParse (weekdayName, format, strict) {
    var i, mom, regex;

    if (this._weekdaysParseExact) {
      return handleStrictParse$1.call(this, weekdayName, format, strict);
    }

    if (!this._weekdaysParse) {
      this._weekdaysParse = [];
      this._minWeekdaysParse = [];
      this._shortWeekdaysParse = [];
      this._fullWeekdaysParse = [];
    }

    for (i = 0; i < 7; i++) {
      // make the regex if we don't have it already

      mom = createUTC([2000, 1]).day(i);
      if (strict && !this._fullWeekdaysParse[i]) {
        this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
        this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
        this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
      }
      if (!this._weekdaysParse[i]) {
        regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
        this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
      }
      // test the regex
      if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
        return i;
      } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
        return i;
      }
    }
  }

// MOMENTS

  function getSetDayOfWeek (input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
    if (input != null) {
      input = parseWeekday(input, this.localeData());
      return this.add(input - day, 'd');
    } else {
      return day;
    }
  }

  function getSetLocaleDayOfWeek (input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
    return input == null ? weekday : this.add(input - weekday, 'd');
  }

  function getSetISODayOfWeek (input) {
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }

    // behaves the same as moment#day except
    // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
    // as a setter, sunday should belong to the previous week.

    if (input != null) {
      var weekday = parseIsoWeekday(input, this.localeData());
      return this.day(this.day() % 7 ? weekday : weekday - 7);
    } else {
      return this.day() || 7;
    }
  }

  var defaultWeekdaysRegex = matchWord;
  function weekdaysRegex (isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysStrictRegex;
      } else {
        return this._weekdaysRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        this._weekdaysRegex = defaultWeekdaysRegex;
      }
      return this._weekdaysStrictRegex && isStrict ?
        this._weekdaysStrictRegex : this._weekdaysRegex;
    }
  }

  var defaultWeekdaysShortRegex = matchWord;
  function weekdaysShortRegex (isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysShortStrictRegex;
      } else {
        return this._weekdaysShortRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysShortRegex')) {
        this._weekdaysShortRegex = defaultWeekdaysShortRegex;
      }
      return this._weekdaysShortStrictRegex && isStrict ?
        this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
    }
  }

  var defaultWeekdaysMinRegex = matchWord;
  function weekdaysMinRegex (isStrict) {
    if (this._weekdaysParseExact) {
      if (!hasOwnProp(this, '_weekdaysRegex')) {
        computeWeekdaysParse.call(this);
      }
      if (isStrict) {
        return this._weekdaysMinStrictRegex;
      } else {
        return this._weekdaysMinRegex;
      }
    } else {
      if (!hasOwnProp(this, '_weekdaysMinRegex')) {
        this._weekdaysMinRegex = defaultWeekdaysMinRegex;
      }
      return this._weekdaysMinStrictRegex && isStrict ?
        this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
    }
  }


  function computeWeekdaysParse () {
    function cmpLenRev(a, b) {
      return b.length - a.length;
    }

    var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
      i, mom, minp, shortp, longp;
    for (i = 0; i < 7; i++) {
      // make the regex if we don't have it already
      mom = createUTC([2000, 1]).day(i);
      minp = this.weekdaysMin(mom, '');
      shortp = this.weekdaysShort(mom, '');
      longp = this.weekdays(mom, '');
      minPieces.push(minp);
      shortPieces.push(shortp);
      longPieces.push(longp);
      mixedPieces.push(minp);
      mixedPieces.push(shortp);
      mixedPieces.push(longp);
    }
    // Sorting makes sure if one weekday (or abbr) is a prefix of another it
    // will match the longer piece.
    minPieces.sort(cmpLenRev);
    shortPieces.sort(cmpLenRev);
    longPieces.sort(cmpLenRev);
    mixedPieces.sort(cmpLenRev);
    for (i = 0; i < 7; i++) {
      shortPieces[i] = regexEscape(shortPieces[i]);
      longPieces[i] = regexEscape(longPieces[i]);
      mixedPieces[i] = regexEscape(mixedPieces[i]);
    }

    this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
    this._weekdaysShortRegex = this._weekdaysRegex;
    this._weekdaysMinRegex = this._weekdaysRegex;

    this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
    this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
  }

// FORMATTING

  function hFormat() {
    return this.hours() % 12 || 12;
  }

  function kFormat() {
    return this.hours() || 24;
  }

  addFormatToken('H', ['HH', 2], 0, 'hour');
  addFormatToken('h', ['hh', 2], 0, hFormat);
  addFormatToken('k', ['kk', 2], 0, kFormat);

  addFormatToken('hmm', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
  });

  addFormatToken('hmmss', 0, 0, function () {
    return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
      zeroFill(this.seconds(), 2);
  });

  addFormatToken('Hmm', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2);
  });

  addFormatToken('Hmmss', 0, 0, function () {
    return '' + this.hours() + zeroFill(this.minutes(), 2) +
      zeroFill(this.seconds(), 2);
  });

  function meridiem (token, lowercase) {
    addFormatToken(token, 0, 0, function () {
      return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
    });
  }

  meridiem('a', true);
  meridiem('A', false);

// ALIASES

  addUnitAlias('hour', 'h');

// PRIORITY
  addUnitPriority('hour', 13);

// PARSING

  function matchMeridiem (isStrict, locale) {
    return locale._meridiemParse;
  }

  addRegexToken('a',  matchMeridiem);
  addRegexToken('A',  matchMeridiem);
  addRegexToken('H',  match1to2);
  addRegexToken('h',  match1to2);
  addRegexToken('k',  match1to2);
  addRegexToken('HH', match1to2, match2);
  addRegexToken('hh', match1to2, match2);
  addRegexToken('kk', match1to2, match2);

  addRegexToken('hmm', match3to4);
  addRegexToken('hmmss', match5to6);
  addRegexToken('Hmm', match3to4);
  addRegexToken('Hmmss', match5to6);

  addParseToken(['H', 'HH'], HOUR);
  addParseToken(['k', 'kk'], function (input, array, config) {
    var kInput = toInt(input);
    array[HOUR] = kInput === 24 ? 0 : kInput;
  });
  addParseToken(['a', 'A'], function (input, array, config) {
    config._isPm = config._locale.isPM(input);
    config._meridiem = input;
  });
  addParseToken(['h', 'hh'], function (input, array, config) {
    array[HOUR] = toInt(input);
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
    getParsingFlags(config).bigHour = true;
  });
  addParseToken('Hmm', function (input, array, config) {
    var pos = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos));
    array[MINUTE] = toInt(input.substr(pos));
  });
  addParseToken('Hmmss', function (input, array, config) {
    var pos1 = input.length - 4;
    var pos2 = input.length - 2;
    array[HOUR] = toInt(input.substr(0, pos1));
    array[MINUTE] = toInt(input.substr(pos1, 2));
    array[SECOND] = toInt(input.substr(pos2));
  });

// LOCALES

  function localeIsPM (input) {
    // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
    // Using charAt should be more compatible.
    return ((input + '').toLowerCase().charAt(0) === 'p');
  }

  var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
  function localeMeridiem (hours, minutes, isLower) {
    if (hours > 11) {
      return isLower ? 'pm' : 'PM';
    } else {
      return isLower ? 'am' : 'AM';
    }
  }


// MOMENTS

// Setting the hour should keep the time, because the user explicitly
// specified which hour he wants. So trying to maintain the same hour (in
// a new timezone) makes sense. Adding/subtracting hours does not follow
// this rule.
  var getSetHour = makeGetSet('Hours', true);

// months
// week
// weekdays
// meridiem
  var baseConfig = {
    calendar: defaultCalendar,
    longDateFormat: defaultLongDateFormat,
    invalidDate: defaultInvalidDate,
    ordinal: defaultOrdinal,
    dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
    relativeTime: defaultRelativeTime,

    months: defaultLocaleMonths,
    monthsShort: defaultLocaleMonthsShort,

    week: defaultLocaleWeek,

    weekdays: defaultLocaleWeekdays,
    weekdaysMin: defaultLocaleWeekdaysMin,
    weekdaysShort: defaultLocaleWeekdaysShort,

    meridiemParse: defaultLocaleMeridiemParse
  };

// internal storage for locale config files
  var locales = {};
  var localeFamilies = {};
  var globalLocale;

  function normalizeLocale(key) {
    return key ? key.toLowerCase().replace('_', '-') : key;
  }

// pick the locale from the array
// try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
// substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
  function chooseLocale(names) {
    var i = 0, j, next, locale, split;

    while (i < names.length) {
      split = normalizeLocale(names[i]).split('-');
      j = split.length;
      next = normalizeLocale(names[i + 1]);
      next = next ? next.split('-') : null;
      while (j > 0) {
        locale = loadLocale(split.slice(0, j).join('-'));
        if (locale) {
          return locale;
        }
        if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
          //the next array item is better than a shallower substring of this one
          break;
        }
        j--;
      }
      i++;
    }
    return null;
  }

  function loadLocale(name) {
    var oldLocale = null;
    // TODO: Find a better way to register and load all the locales in Node
    if (!locales[name] && (typeof module !== 'undefined') &&
      module && module.exports) {
      try {
        oldLocale = globalLocale._abbr;
        require('./locale/' + name);
        // because defineLocale currently also sets the global locale, we
        // want to undo that for lazy loaded locales
        getSetGlobalLocale(oldLocale);
      } catch (e) { }
    }
    return locales[name];
  }

// This function will load locale and then set the global locale.  If
// no arguments are passed in, it will simply return the current global
// locale key.
  function getSetGlobalLocale (key, values) {
    var data;
    if (key) {
      if (isUndefined(values)) {
        data = getLocale(key);
      }
      else {
        data = defineLocale(key, values);
      }

      if (data) {
        // moment.duration._locale = moment._locale = data;
        globalLocale = data;
      }
    }

    return globalLocale._abbr;
  }

  function defineLocale (name, config) {
    if (config !== null) {
      var parentConfig = baseConfig;
      config.abbr = name;
      if (locales[name] != null) {
        deprecateSimple('defineLocaleOverride',
          'use moment.updateLocale(localeName, config) to change ' +
          'an existing locale. moment.defineLocale(localeName, ' +
          'config) should only be used for creating a new locale ' +
          'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
        parentConfig = locales[name]._config;
      } else if (config.parentLocale != null) {
        if (locales[config.parentLocale] != null) {
          parentConfig = locales[config.parentLocale]._config;
        } else {
          if (!localeFamilies[config.parentLocale]) {
            localeFamilies[config.parentLocale] = [];
          }
          localeFamilies[config.parentLocale].push({
            name: name,
            config: config
          });
          return null;
        }
      }
      locales[name] = new Locale(mergeConfigs(parentConfig, config));

      if (localeFamilies[name]) {
        localeFamilies[name].forEach(function (x) {
          defineLocale(x.name, x.config);
        });
      }

      // backwards compat for now: also set the locale
      // make sure we set the locale AFTER all child locales have been
      // created, so we won't end up with the child locale set.
      getSetGlobalLocale(name);


      return locales[name];
    } else {
      // useful for testing
      delete locales[name];
      return null;
    }
  }

  function updateLocale(name, config) {
    if (config != null) {
      var locale, parentConfig = baseConfig;
      // MERGE
      if (locales[name] != null) {
        parentConfig = locales[name]._config;
      }
      config = mergeConfigs(parentConfig, config);
      locale = new Locale(config);
      locale.parentLocale = locales[name];
      locales[name] = locale;

      // backwards compat for now: also set the locale
      getSetGlobalLocale(name);
    } else {
      // pass null for config to unupdate, useful for tests
      if (locales[name] != null) {
        if (locales[name].parentLocale != null) {
          locales[name] = locales[name].parentLocale;
        } else if (locales[name] != null) {
          delete locales[name];
        }
      }
    }
    return locales[name];
  }

// returns locale data
  function getLocale (key) {
    var locale;

    if (key && key._locale && key._locale._abbr) {
      key = key._locale._abbr;
    }

    if (!key) {
      return globalLocale;
    }

    if (!isArray(key)) {
      //short-circuit everything else
      locale = loadLocale(key);
      if (locale) {
        return locale;
      }
      key = [key];
    }

    return chooseLocale(key);
  }

  function listLocales() {
    return keys$1(locales);
  }

  function checkOverflow (m) {
    var overflow;
    var a = m._a;

    if (a && getParsingFlags(m).overflow === -2) {
      overflow =
        a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
          a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
            a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
              a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                  a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                    -1;

      if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
        overflow = DATE;
      }
      if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
        overflow = WEEK;
      }
      if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
        overflow = WEEKDAY;
      }

      getParsingFlags(m).overflow = overflow;
    }

    return m;
  }

// iso 8601 regex
// 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
  var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
  var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

  var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

  var isoDates = [
    ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
    ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
    ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
    ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
    ['YYYY-DDD', /\d{4}-\d{3}/],
    ['YYYY-MM', /\d{4}-\d\d/, false],
    ['YYYYYYMMDD', /[+-]\d{10}/],
    ['YYYYMMDD', /\d{8}/],
    // YYYYMM is NOT allowed by the standard
    ['GGGG[W]WWE', /\d{4}W\d{3}/],
    ['GGGG[W]WW', /\d{4}W\d{2}/, false],
    ['YYYYDDD', /\d{7}/]
  ];

// iso time formats and regexes
  var isoTimes = [
    ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
    ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
    ['HH:mm:ss', /\d\d:\d\d:\d\d/],
    ['HH:mm', /\d\d:\d\d/],
    ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
    ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
    ['HHmmss', /\d\d\d\d\d\d/],
    ['HHmm', /\d\d\d\d/],
    ['HH', /\d\d/]
  ];

  var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

// date from iso format
  function configFromISO(config) {
    var i, l,
      string = config._i,
      match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
      allowTime, dateFormat, timeFormat, tzFormat;

    if (match) {
      getParsingFlags(config).iso = true;

      for (i = 0, l = isoDates.length; i < l; i++) {
        if (isoDates[i][1].exec(match[1])) {
          dateFormat = isoDates[i][0];
          allowTime = isoDates[i][2] !== false;
          break;
        }
      }
      if (dateFormat == null) {
        config._isValid = false;
        return;
      }
      if (match[3]) {
        for (i = 0, l = isoTimes.length; i < l; i++) {
          if (isoTimes[i][1].exec(match[3])) {
            // match[2] should be 'T' or space
            timeFormat = (match[2] || ' ') + isoTimes[i][0];
            break;
          }
        }
        if (timeFormat == null) {
          config._isValid = false;
          return;
        }
      }
      if (!allowTime && timeFormat != null) {
        config._isValid = false;
        return;
      }
      if (match[4]) {
        if (tzRegex.exec(match[4])) {
          tzFormat = 'Z';
        } else {
          config._isValid = false;
          return;
        }
      }
      config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
      configFromStringAndFormat(config);
    } else {
      config._isValid = false;
    }
  }

// RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
  var basicRfcRegex = /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d?\d\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(?:\d\d)?\d\d\s)(\d\d:\d\d)(\:\d\d)?(\s(?:UT|GMT|[ECMP][SD]T|[A-IK-Za-ik-z]|[+-]\d{4}))$/;

// date and time from ref 2822 format
  function configFromRFC2822(config) {
    var string, match, dayFormat,
      dateFormat, timeFormat, tzFormat;
    var timezones = {
      ' GMT': ' +0000',
      ' EDT': ' -0400',
      ' EST': ' -0500',
      ' CDT': ' -0500',
      ' CST': ' -0600',
      ' MDT': ' -0600',
      ' MST': ' -0700',
      ' PDT': ' -0700',
      ' PST': ' -0800'
    };
    var military = 'YXWVUTSRQPONZABCDEFGHIKLM';
    var timezone, timezoneIndex;

    string = config._i
      .replace(/\([^\)]*\)|[\n\t]/g, ' ') // Remove comments and folding whitespace
      .replace(/(\s\s+)/g, ' ') // Replace multiple-spaces with a single space
      .replace(/^\s|\s$/g, ''); // Remove leading and trailing spaces
    match = basicRfcRegex.exec(string);

    if (match) {
      dayFormat = match[1] ? 'ddd' + ((match[1].length === 5) ? ', ' : ' ') : '';
      dateFormat = 'D MMM ' + ((match[2].length > 10) ? 'YYYY ' : 'YY ');
      timeFormat = 'HH:mm' + (match[4] ? ':ss' : '');

      // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
      if (match[1]) { // day of week given
        var momentDate = new Date(match[2]);
        var momentDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][momentDate.getDay()];

        if (match[1].substr(0,3) !== momentDay) {
          getParsingFlags(config).weekdayMismatch = true;
          config._isValid = false;
          return;
        }
      }

      switch (match[5].length) {
        case 2: // military
          if (timezoneIndex === 0) {
            timezone = ' +0000';
          } else {
            timezoneIndex = military.indexOf(match[5][1].toUpperCase()) - 12;
            timezone = ((timezoneIndex < 0) ? ' -' : ' +') +
              (('' + timezoneIndex).replace(/^-?/, '0')).match(/..$/)[0] + '00';
          }
          break;
        case 4: // Zone
          timezone = timezones[match[5]];
          break;
        default: // UT or +/-9999
          timezone = timezones[' GMT'];
      }
      match[5] = timezone;
      config._i = match.splice(1).join('');
      tzFormat = ' ZZ';
      config._f = dayFormat + dateFormat + timeFormat + tzFormat;
      configFromStringAndFormat(config);
      getParsingFlags(config).rfc2822 = true;
    } else {
      config._isValid = false;
    }
  }

// date from iso format or fallback
  function configFromString(config) {
    var matched = aspNetJsonRegex.exec(config._i);

    if (matched !== null) {
      config._d = new Date(+matched[1]);
      return;
    }

    configFromISO(config);
    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }

    configFromRFC2822(config);
    if (config._isValid === false) {
      delete config._isValid;
    } else {
      return;
    }

    // Final attempt, use Input Fallback
    hooks.createFromInputFallback(config);
  }

  hooks.createFromInputFallback = deprecate(
    'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
    'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
    'discouraged and will be removed in an upcoming major release. Please refer to ' +
    'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
    function (config) {
      config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
    }
  );

// Pick the first defined of two or three arguments.
  function defaults(a, b, c) {
    if (a != null) {
      return a;
    }
    if (b != null) {
      return b;
    }
    return c;
  }

  function currentDateArray(config) {
    // hooks is actually the exported moment object
    var nowValue = new Date(hooks.now());
    if (config._useUTC) {
      return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
    }
    return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
  }

// convert an array to a date.
// the array should mirror the parameters below
// note: all values past the year are optional and will default to the lowest possible value.
// [year, month, day , hour, minute, second, millisecond]
  function configFromArray (config) {
    var i, date, input = [], currentDate, yearToUse;

    if (config._d) {
      return;
    }

    currentDate = currentDateArray(config);

    //compute day of the year from weeks and weekdays
    if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
      dayOfYearFromWeekInfo(config);
    }

    //if the day of the year is set, figure out what it is
    if (config._dayOfYear != null) {
      yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

      if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
        getParsingFlags(config)._overflowDayOfYear = true;
      }

      date = createUTCDate(yearToUse, 0, config._dayOfYear);
      config._a[MONTH] = date.getUTCMonth();
      config._a[DATE] = date.getUTCDate();
    }

    // Default to current date.
    // * if no year, month, day of month are given, default to today
    // * if day of month is given, default month and year
    // * if month is given, default only year
    // * if year is given, don't default anything
    for (i = 0; i < 3 && config._a[i] == null; ++i) {
      config._a[i] = input[i] = currentDate[i];
    }

    // Zero out whatever was not defaulted, including time
    for (; i < 7; i++) {
      config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
    }

    // Check for 24:00:00.000
    if (config._a[HOUR] === 24 &&
      config._a[MINUTE] === 0 &&
      config._a[SECOND] === 0 &&
      config._a[MILLISECOND] === 0) {
      config._nextDay = true;
      config._a[HOUR] = 0;
    }

    config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
    // Apply timezone offset from input. The actual utcOffset can be changed
    // with parseZone.
    if (config._tzm != null) {
      config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
    }

    if (config._nextDay) {
      config._a[HOUR] = 24;
    }
  }

  function dayOfYearFromWeekInfo(config) {
    var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

    w = config._w;
    if (w.GG != null || w.W != null || w.E != null) {
      dow = 1;
      doy = 4;

      // TODO: We need to take the current isoWeekYear, but that depends on
      // how we interpret now (local, utc, fixed offset). So create
      // a now version of current config (take local/utc/offset flags, and
      // create now).
      weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
      week = defaults(w.W, 1);
      weekday = defaults(w.E, 1);
      if (weekday < 1 || weekday > 7) {
        weekdayOverflow = true;
      }
    } else {
      dow = config._locale._week.dow;
      doy = config._locale._week.doy;

      var curWeek = weekOfYear(createLocal(), dow, doy);

      weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

      // Default to current week.
      week = defaults(w.w, curWeek.week);

      if (w.d != null) {
        // weekday -- low day numbers are considered next week
        weekday = w.d;
        if (weekday < 0 || weekday > 6) {
          weekdayOverflow = true;
        }
      } else if (w.e != null) {
        // local weekday -- counting starts from begining of week
        weekday = w.e + dow;
        if (w.e < 0 || w.e > 6) {
          weekdayOverflow = true;
        }
      } else {
        // default to begining of week
        weekday = dow;
      }
    }
    if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
      getParsingFlags(config)._overflowWeeks = true;
    } else if (weekdayOverflow != null) {
      getParsingFlags(config)._overflowWeekday = true;
    } else {
      temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
      config._a[YEAR] = temp.year;
      config._dayOfYear = temp.dayOfYear;
    }
  }

// constant that refers to the ISO standard
  hooks.ISO_8601 = function () {};

// constant that refers to the RFC 2822 form
  hooks.RFC_2822 = function () {};

// date from string and format string
  function configFromStringAndFormat(config) {
    // TODO: Move this to another part of the creation flow to prevent circular deps
    if (config._f === hooks.ISO_8601) {
      configFromISO(config);
      return;
    }
    if (config._f === hooks.RFC_2822) {
      configFromRFC2822(config);
      return;
    }
    config._a = [];
    getParsingFlags(config).empty = true;

    // This array is used to make a Date, either with `new Date` or `Date.UTC`
    var string = '' + config._i,
      i, parsedInput, tokens, token, skipped,
      stringLength = string.length,
      totalParsedInputLength = 0;

    tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
      // console.log('token', token, 'parsedInput', parsedInput,
      //         'regex', getParseRegexForToken(token, config));
      if (parsedInput) {
        skipped = string.substr(0, string.indexOf(parsedInput));
        if (skipped.length > 0) {
          getParsingFlags(config).unusedInput.push(skipped);
        }
        string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
        totalParsedInputLength += parsedInput.length;
      }
      // don't parse if it's not a known token
      if (formatTokenFunctions[token]) {
        if (parsedInput) {
          getParsingFlags(config).empty = false;
        }
        else {
          getParsingFlags(config).unusedTokens.push(token);
        }
        addTimeToArrayFromToken(token, parsedInput, config);
      }
      else if (config._strict && !parsedInput) {
        getParsingFlags(config).unusedTokens.push(token);
      }
    }

    // add remaining unparsed input length to the string
    getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
    if (string.length > 0) {
      getParsingFlags(config).unusedInput.push(string);
    }

    // clear _12h flag if hour is <= 12
    if (config._a[HOUR] <= 12 &&
      getParsingFlags(config).bigHour === true &&
      config._a[HOUR] > 0) {
      getParsingFlags(config).bigHour = undefined;
    }

    getParsingFlags(config).parsedDateParts = config._a.slice(0);
    getParsingFlags(config).meridiem = config._meridiem;
    // handle meridiem
    config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

    configFromArray(config);
    checkOverflow(config);
  }


  function meridiemFixWrap (locale, hour, meridiem) {
    var isPm;

    if (meridiem == null) {
      // nothing to do
      return hour;
    }
    if (locale.meridiemHour != null) {
      return locale.meridiemHour(hour, meridiem);
    } else if (locale.isPM != null) {
      // Fallback
      isPm = locale.isPM(meridiem);
      if (isPm && hour < 12) {
        hour += 12;
      }
      if (!isPm && hour === 12) {
        hour = 0;
      }
      return hour;
    } else {
      // this is not supposed to happen
      return hour;
    }
  }

// date from string and array of format strings
  function configFromStringAndArray(config) {
    var tempConfig,
      bestMoment,

      scoreToBeat,
      i,
      currentScore;

    if (config._f.length === 0) {
      getParsingFlags(config).invalidFormat = true;
      config._d = new Date(NaN);
      return;
    }

    for (i = 0; i < config._f.length; i++) {
      currentScore = 0;
      tempConfig = copyConfig({}, config);
      if (config._useUTC != null) {
        tempConfig._useUTC = config._useUTC;
      }
      tempConfig._f = config._f[i];
      configFromStringAndFormat(tempConfig);

      if (!isValid(tempConfig)) {
        continue;
      }

      // if there is any input that was not parsed add a penalty for that format
      currentScore += getParsingFlags(tempConfig).charsLeftOver;

      //or tokens
      currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

      getParsingFlags(tempConfig).score = currentScore;

      if (scoreToBeat == null || currentScore < scoreToBeat) {
        scoreToBeat = currentScore;
        bestMoment = tempConfig;
      }
    }

    extend(config, bestMoment || tempConfig);
  }

  function configFromObject(config) {
    if (config._d) {
      return;
    }

    var i = normalizeObjectUnits(config._i);
    config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
      return obj && parseInt(obj, 10);
    });

    configFromArray(config);
  }

  function createFromConfig (config) {
    var res = new Moment(checkOverflow(prepareConfig(config)));
    if (res._nextDay) {
      // Adding is smart enough around DST
      res.add(1, 'd');
      res._nextDay = undefined;
    }

    return res;
  }

  function prepareConfig (config) {
    var input = config._i,
      format = config._f;

    config._locale = config._locale || getLocale(config._l);

    if (input === null || (format === undefined && input === '')) {
      return createInvalid({nullInput: true});
    }

    if (typeof input === 'string') {
      config._i = input = config._locale.preparse(input);
    }

    if (isMoment(input)) {
      return new Moment(checkOverflow(input));
    } else if (isDate(input)) {
      config._d = input;
    } else if (isArray(format)) {
      configFromStringAndArray(config);
    } else if (format) {
      configFromStringAndFormat(config);
    }  else {
      configFromInput(config);
    }

    if (!isValid(config)) {
      config._d = null;
    }

    return config;
  }

  function configFromInput(config) {
    var input = config._i;
    if (isUndefined(input)) {
      config._d = new Date(hooks.now());
    } else if (isDate(input)) {
      config._d = new Date(input.valueOf());
    } else if (typeof input === 'string') {
      configFromString(config);
    } else if (isArray(input)) {
      config._a = map(input.slice(0), function (obj) {
        return parseInt(obj, 10);
      });
      configFromArray(config);
    } else if (isObject(input)) {
      configFromObject(config);
    } else if (isNumber(input)) {
      // from milliseconds
      config._d = new Date(input);
    } else {
      hooks.createFromInputFallback(config);
    }
  }

  function createLocalOrUTC (input, format, locale, strict, isUTC) {
    var c = {};

    if (locale === true || locale === false) {
      strict = locale;
      locale = undefined;
    }

    if ((isObject(input) && isObjectEmpty(input)) ||
      (isArray(input) && input.length === 0)) {
      input = undefined;
    }
    // object construction must be done this way.
    // https://github.com/moment/moment/issues/1423
    c._isAMomentObject = true;
    c._useUTC = c._isUTC = isUTC;
    c._l = locale;
    c._i = input;
    c._f = format;
    c._strict = strict;

    return createFromConfig(c);
  }

  function createLocal (input, format, locale, strict) {
    return createLocalOrUTC(input, format, locale, strict, false);
  }

  var prototypeMin = deprecate(
    'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
      var other = createLocal.apply(null, arguments);
      if (this.isValid() && other.isValid()) {
        return other < this ? this : other;
      } else {
        return createInvalid();
      }
    }
  );

  var prototypeMax = deprecate(
    'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
    function () {
      var other = createLocal.apply(null, arguments);
      if (this.isValid() && other.isValid()) {
        return other > this ? this : other;
      } else {
        return createInvalid();
      }
    }
  );

// Pick a moment m from moments so that m[fn](other) is true for all
// other. This relies on the function fn to be transitive.
//
// moments should either be an array of moment objects or an array, whose
// first element is an array of moment objects.
  function pickBy(fn, moments) {
    var res, i;
    if (moments.length === 1 && isArray(moments[0])) {
      moments = moments[0];
    }
    if (!moments.length) {
      return createLocal();
    }
    res = moments[0];
    for (i = 1; i < moments.length; ++i) {
      if (!moments[i].isValid() || moments[i][fn](res)) {
        res = moments[i];
      }
    }
    return res;
  }

// TODO: Use [].sort instead?
  function min () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isBefore', args);
  }

  function max () {
    var args = [].slice.call(arguments, 0);

    return pickBy('isAfter', args);
  }

  var now = function () {
    return Date.now ? Date.now() : +(new Date());
  };

  var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

  function isDurationValid(m) {
    for (var key in m) {
      if (!(ordering.indexOf(key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
        return false;
      }
    }

    var unitHasDecimal = false;
    for (var i = 0; i < ordering.length; ++i) {
      if (m[ordering[i]]) {
        if (unitHasDecimal) {
          return false; // only allow non-integers for smallest unit
        }
        if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
          unitHasDecimal = true;
        }
      }
    }

    return true;
  }

  function isValid$1() {
    return this._isValid;
  }

  function createInvalid$1() {
    return createDuration(NaN);
  }

  function Duration (duration) {
    var normalizedInput = normalizeObjectUnits(duration),
      years = normalizedInput.year || 0,
      quarters = normalizedInput.quarter || 0,
      months = normalizedInput.month || 0,
      weeks = normalizedInput.week || 0,
      days = normalizedInput.day || 0,
      hours = normalizedInput.hour || 0,
      minutes = normalizedInput.minute || 0,
      seconds = normalizedInput.second || 0,
      milliseconds = normalizedInput.millisecond || 0;

    this._isValid = isDurationValid(normalizedInput);

    // representation for dateAddRemove
    this._milliseconds = +milliseconds +
      seconds * 1e3 + // 1000
      minutes * 6e4 + // 1000 * 60
      hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
    // Because of dateAddRemove treats 24 hours as different from a
    // day when working around DST, we need to store them separately
    this._days = +days +
      weeks * 7;
    // It is impossible translate months into days without knowing
    // which months you are are talking about, so we have to store
    // it separately.
    this._months = +months +
      quarters * 3 +
      years * 12;

    this._data = {};

    this._locale = getLocale();

    this._bubble();
  }

  function isDuration (obj) {
    return obj instanceof Duration;
  }

  function absRound (number) {
    if (number < 0) {
      return Math.round(-1 * number) * -1;
    } else {
      return Math.round(number);
    }
  }

// FORMATTING

  function offset (token, separator) {
    addFormatToken(token, 0, 0, function () {
      var offset = this.utcOffset();
      var sign = '+';
      if (offset < 0) {
        offset = -offset;
        sign = '-';
      }
      return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
    });
  }

  offset('Z', ':');
  offset('ZZ', '');

// PARSING

  addRegexToken('Z',  matchShortOffset);
  addRegexToken('ZZ', matchShortOffset);
  addParseToken(['Z', 'ZZ'], function (input, array, config) {
    config._useUTC = true;
    config._tzm = offsetFromString(matchShortOffset, input);
  });

// HELPERS

// timezone chunker
// '+10:00' > ['10',  '00']
// '-1530'  > ['-15', '30']
  var chunkOffset = /([\+\-]|\d\d)/gi;

  function offsetFromString(matcher, string) {
    var matches = (string || '').match(matcher);

    if (matches === null) {
      return null;
    }

    var chunk   = matches[matches.length - 1] || [];
    var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
    var minutes = +(parts[1] * 60) + toInt(parts[2]);

    return minutes === 0 ?
      0 :
      parts[0] === '+' ? minutes : -minutes;
  }

// Return a moment from input, that is local/utc/zone equivalent to model.
  function cloneWithOffset(input, model) {
    var res, diff;
    if (model._isUTC) {
      res = model.clone();
      diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
      // Use low-level api, because this fn is low-level api.
      res._d.setTime(res._d.valueOf() + diff);
      hooks.updateOffset(res, false);
      return res;
    } else {
      return createLocal(input).local();
    }
  }

  function getDateOffset (m) {
    // On Firefox.24 Date#getTimezoneOffset returns a floating point.
    // https://github.com/moment/moment/pull/1871
    return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
  }

// HOOKS

// This function will be called whenever a moment is mutated.
// It is intended to keep the offset in sync with the timezone.
  hooks.updateOffset = function () {};

// MOMENTS

// keepLocalTime = true means only change the timezone, without
// affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
// 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
// +0200, so we adjust the time as needed, to be valid.
//
// Keeping the time actually adds/subtracts (one hour)
// from the actual represented time. That is why we call updateOffset
// a second time. In case it wants us to change the offset again
// _changeInProgress == true case, then we have to adjust, because
// there is no such time in the given timezone.
  function getSetOffset (input, keepLocalTime, keepMinutes) {
    var offset = this._offset || 0,
      localAdjust;
    if (!this.isValid()) {
      return input != null ? this : NaN;
    }
    if (input != null) {
      if (typeof input === 'string') {
        input = offsetFromString(matchShortOffset, input);
        if (input === null) {
          return this;
        }
      } else if (Math.abs(input) < 16 && !keepMinutes) {
        input = input * 60;
      }
      if (!this._isUTC && keepLocalTime) {
        localAdjust = getDateOffset(this);
      }
      this._offset = input;
      this._isUTC = true;
      if (localAdjust != null) {
        this.add(localAdjust, 'm');
      }
      if (offset !== input) {
        if (!keepLocalTime || this._changeInProgress) {
          addSubtract(this, createDuration(input - offset, 'm'), 1, false);
        } else if (!this._changeInProgress) {
          this._changeInProgress = true;
          hooks.updateOffset(this, true);
          this._changeInProgress = null;
        }
      }
      return this;
    } else {
      return this._isUTC ? offset : getDateOffset(this);
    }
  }

  function getSetZone (input, keepLocalTime) {
    if (input != null) {
      if (typeof input !== 'string') {
        input = -input;
      }

      this.utcOffset(input, keepLocalTime);

      return this;
    } else {
      return -this.utcOffset();
    }
  }

  function setOffsetToUTC (keepLocalTime) {
    return this.utcOffset(0, keepLocalTime);
  }

  function setOffsetToLocal (keepLocalTime) {
    if (this._isUTC) {
      this.utcOffset(0, keepLocalTime);
      this._isUTC = false;

      if (keepLocalTime) {
        this.subtract(getDateOffset(this), 'm');
      }
    }
    return this;
  }

  function setOffsetToParsedOffset () {
    if (this._tzm != null) {
      this.utcOffset(this._tzm, false, true);
    } else if (typeof this._i === 'string') {
      var tZone = offsetFromString(matchOffset, this._i);
      if (tZone != null) {
        this.utcOffset(tZone);
      }
      else {
        this.utcOffset(0, true);
      }
    }
    return this;
  }

  function hasAlignedHourOffset (input) {
    if (!this.isValid()) {
      return false;
    }
    input = input ? createLocal(input).utcOffset() : 0;

    return (this.utcOffset() - input) % 60 === 0;
  }

  function isDaylightSavingTime () {
    return (
      this.utcOffset() > this.clone().month(0).utcOffset() ||
      this.utcOffset() > this.clone().month(5).utcOffset()
    );
  }

  function isDaylightSavingTimeShifted () {
    if (!isUndefined(this._isDSTShifted)) {
      return this._isDSTShifted;
    }

    var c = {};

    copyConfig(c, this);
    c = prepareConfig(c);

    if (c._a) {
      var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
      this._isDSTShifted = this.isValid() &&
        compareArrays(c._a, other.toArray()) > 0;
    } else {
      this._isDSTShifted = false;
    }

    return this._isDSTShifted;
  }

  function isLocal () {
    return this.isValid() ? !this._isUTC : false;
  }

  function isUtcOffset () {
    return this.isValid() ? this._isUTC : false;
  }

  function isUtc () {
    return this.isValid() ? this._isUTC && this._offset === 0 : false;
  }

// ASP.NET json date format regex
  var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

// from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
// somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
// and further modified to allow for strings containing both week and day
  var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

  function createDuration (input, key) {
    var duration = input,
      // matching against regexp is expensive, do it on demand
      match = null,
      sign,
      ret,
      diffRes;

    if (isDuration(input)) {
      duration = {
        ms : input._milliseconds,
        d  : input._days,
        M  : input._months
      };
    } else if (isNumber(input)) {
      duration = {};
      if (key) {
        duration[key] = input;
      } else {
        duration.milliseconds = input;
      }
    } else if (!!(match = aspNetRegex.exec(input))) {
      sign = (match[1] === '-') ? -1 : 1;
      duration = {
        y  : 0,
        d  : toInt(match[DATE])                         * sign,
        h  : toInt(match[HOUR])                         * sign,
        m  : toInt(match[MINUTE])                       * sign,
        s  : toInt(match[SECOND])                       * sign,
        ms : toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
      };
    } else if (!!(match = isoRegex.exec(input))) {
      sign = (match[1] === '-') ? -1 : 1;
      duration = {
        y : parseIso(match[2], sign),
        M : parseIso(match[3], sign),
        w : parseIso(match[4], sign),
        d : parseIso(match[5], sign),
        h : parseIso(match[6], sign),
        m : parseIso(match[7], sign),
        s : parseIso(match[8], sign)
      };
    } else if (duration == null) {// checks for null or undefined
      duration = {};
    } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
      diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

      duration = {};
      duration.ms = diffRes.milliseconds;
      duration.M = diffRes.months;
    }

    ret = new Duration(duration);

    if (isDuration(input) && hasOwnProp(input, '_locale')) {
      ret._locale = input._locale;
    }

    return ret;
  }

  createDuration.fn = Duration.prototype;
  createDuration.invalid = createInvalid$1;

  function parseIso (inp, sign) {
    // We'd normally use ~~inp for this, but unfortunately it also
    // converts floats to ints.
    // inp may be undefined, so careful calling replace on it.
    var res = inp && parseFloat(inp.replace(',', '.'));
    // apply sign while we're at it
    return (isNaN(res) ? 0 : res) * sign;
  }

  function positiveMomentsDifference(base, other) {
    var res = {milliseconds: 0, months: 0};

    res.months = other.month() - base.month() +
      (other.year() - base.year()) * 12;
    if (base.clone().add(res.months, 'M').isAfter(other)) {
      --res.months;
    }

    res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

    return res;
  }

  function momentsDifference(base, other) {
    var res;
    if (!(base.isValid() && other.isValid())) {
      return {milliseconds: 0, months: 0};
    }

    other = cloneWithOffset(other, base);
    if (base.isBefore(other)) {
      res = positiveMomentsDifference(base, other);
    } else {
      res = positiveMomentsDifference(other, base);
      res.milliseconds = -res.milliseconds;
      res.months = -res.months;
    }

    return res;
  }

// TODO: remove 'name' arg after deprecation is removed
  function createAdder(direction, name) {
    return function (val, period) {
      var dur, tmp;
      //invert the arguments, but complain about it
      if (period !== null && !isNaN(+period)) {
        deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
          'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
        tmp = val; val = period; period = tmp;
      }

      val = typeof val === 'string' ? +val : val;
      dur = createDuration(val, period);
      addSubtract(this, dur, direction);
      return this;
    };
  }

  function addSubtract (mom, duration, isAdding, updateOffset) {
    var milliseconds = duration._milliseconds,
      days = absRound(duration._days),
      months = absRound(duration._months);

    if (!mom.isValid()) {
      // No op
      return;
    }

    updateOffset = updateOffset == null ? true : updateOffset;

    if (milliseconds) {
      mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
    }
    if (days) {
      set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
    }
    if (months) {
      setMonth(mom, get(mom, 'Month') + months * isAdding);
    }
    if (updateOffset) {
      hooks.updateOffset(mom, days || months);
    }
  }

  var add      = createAdder(1, 'add');
  var subtract = createAdder(-1, 'subtract');

  function getCalendarFormat(myMoment, now) {
    var diff = myMoment.diff(now, 'days', true);
    return diff < -6 ? 'sameElse' :
      diff < -1 ? 'lastWeek' :
        diff < 0 ? 'lastDay' :
          diff < 1 ? 'sameDay' :
            diff < 2 ? 'nextDay' :
              diff < 7 ? 'nextWeek' : 'sameElse';
  }

  function calendar$1 (time, formats) {
    // We want to compare the start of today, vs this.
    // Getting start-of-today depends on whether we're local/utc/offset or not.
    var now = time || createLocal(),
      sod = cloneWithOffset(now, this).startOf('day'),
      format = hooks.calendarFormat(this, sod) || 'sameElse';

    var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

    return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
  }

  function clone () {
    return new Moment(this);
  }

  function isAfter (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
      return this.valueOf() > localInput.valueOf();
    } else {
      return localInput.valueOf() < this.clone().startOf(units).valueOf();
    }
  }

  function isBefore (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input);
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
    if (units === 'millisecond') {
      return this.valueOf() < localInput.valueOf();
    } else {
      return this.clone().endOf(units).valueOf() < localInput.valueOf();
    }
  }

  function isBetween (from, to, units, inclusivity) {
    inclusivity = inclusivity || '()';
    return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
      (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
  }

  function isSame (input, units) {
    var localInput = isMoment(input) ? input : createLocal(input),
      inputMs;
    if (!(this.isValid() && localInput.isValid())) {
      return false;
    }
    units = normalizeUnits(units || 'millisecond');
    if (units === 'millisecond') {
      return this.valueOf() === localInput.valueOf();
    } else {
      inputMs = localInput.valueOf();
      return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
    }
  }

  function isSameOrAfter (input, units) {
    return this.isSame(input, units) || this.isAfter(input,units);
  }

  function isSameOrBefore (input, units) {
    return this.isSame(input, units) || this.isBefore(input,units);
  }

  function diff (input, units, asFloat) {
    var that,
      zoneDelta,
      delta, output;

    if (!this.isValid()) {
      return NaN;
    }

    that = cloneWithOffset(input, this);

    if (!that.isValid()) {
      return NaN;
    }

    zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

    units = normalizeUnits(units);

    if (units === 'year' || units === 'month' || units === 'quarter') {
      output = monthDiff(this, that);
      if (units === 'quarter') {
        output = output / 3;
      } else if (units === 'year') {
        output = output / 12;
      }
    } else {
      delta = this - that;
      output = units === 'second' ? delta / 1e3 : // 1000
        units === 'minute' ? delta / 6e4 : // 1000 * 60
          units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
            units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
              units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
    }
    return asFloat ? output : absFloor(output);
  }

  function monthDiff (a, b) {
    // difference in months
    var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
      // b is in (anchor - 1 month, anchor + 1 month)
      anchor = a.clone().add(wholeMonthDiff, 'months'),
      anchor2, adjust;

    if (b - anchor < 0) {
      anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
      // linear across the month
      adjust = (b - anchor) / (anchor - anchor2);
    } else {
      anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
      // linear across the month
      adjust = (b - anchor) / (anchor2 - anchor);
    }

    //check for negative zero, return zero if negative zero
    return -(wholeMonthDiff + adjust) || 0;
  }

  hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
  hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

  function toString () {
    return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
  }

  function toISOString() {
    if (!this.isValid()) {
      return null;
    }
    var m = this.clone().utc();
    if (m.year() < 0 || m.year() > 9999) {
      return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
    }
    if (isFunction(Date.prototype.toISOString)) {
      // native implementation is ~50x faster, use it when we can
      return this.toDate().toISOString();
    }
    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
  }

  /**
   * Return a human readable representation of a moment that can
   * also be evaluated to get a new moment which is the same
   *
   * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
   */
  function inspect () {
    if (!this.isValid()) {
      return 'moment.invalid(/* ' + this._i + ' */)';
    }
    var func = 'moment';
    var zone = '';
    if (!this.isLocal()) {
      func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
      zone = 'Z';
    }
    var prefix = '[' + func + '("]';
    var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
    var datetime = '-MM-DD[T]HH:mm:ss.SSS';
    var suffix = zone + '[")]';

    return this.format(prefix + year + datetime + suffix);
  }

  function format (inputString) {
    if (!inputString) {
      inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
    }
    var output = formatMoment(this, inputString);
    return this.localeData().postformat(output);
  }

  function from (time, withoutSuffix) {
    if (this.isValid() &&
      ((isMoment(time) && time.isValid()) ||
        createLocal(time).isValid())) {
      return createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }

  function fromNow (withoutSuffix) {
    return this.from(createLocal(), withoutSuffix);
  }

  function to (time, withoutSuffix) {
    if (this.isValid() &&
      ((isMoment(time) && time.isValid()) ||
        createLocal(time).isValid())) {
      return createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    } else {
      return this.localeData().invalidDate();
    }
  }

  function toNow (withoutSuffix) {
    return this.to(createLocal(), withoutSuffix);
  }

// If passed a locale key, it will set the locale for this
// instance.  Otherwise, it will return the locale configuration
// variables for this instance.
  function locale (key) {
    var newLocaleData;

    if (key === undefined) {
      return this._locale._abbr;
    } else {
      newLocaleData = getLocale(key);
      if (newLocaleData != null) {
        this._locale = newLocaleData;
      }
      return this;
    }
  }

  var lang = deprecate(
    'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
    function (key) {
      if (key === undefined) {
        return this.localeData();
      } else {
        return this.locale(key);
      }
    }
  );

  function localeData () {
    return this._locale;
  }

  function startOf (units) {
    units = normalizeUnits(units);
    // the following switch intentionally omits break keywords
    // to utilize falling through the cases.
    switch (units) {
      case 'year':
        this.month(0);
      /* falls through */
      case 'quarter':
      case 'month':
        this.date(1);
      /* falls through */
      case 'week':
      case 'isoWeek':
      case 'day':
      case 'date':
        this.hours(0);
      /* falls through */
      case 'hour':
        this.minutes(0);
      /* falls through */
      case 'minute':
        this.seconds(0);
      /* falls through */
      case 'second':
        this.milliseconds(0);
    }

    // weeks are a special case
    if (units === 'week') {
      this.weekday(0);
    }
    if (units === 'isoWeek') {
      this.isoWeekday(1);
    }

    // quarters are also special
    if (units === 'quarter') {
      this.month(Math.floor(this.month() / 3) * 3);
    }

    return this;
  }

  function endOf (units) {
    units = normalizeUnits(units);
    if (units === undefined || units === 'millisecond') {
      return this;
    }

    // 'date' is an alias for 'day', so it should be considered as such.
    if (units === 'date') {
      units = 'day';
    }

    return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
  }

  function valueOf () {
    return this._d.valueOf() - ((this._offset || 0) * 60000);
  }

  function unix () {
    return Math.floor(this.valueOf() / 1000);
  }

  function toDate () {
    return new Date(this.valueOf());
  }

  function toArray () {
    var m = this;
    return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
  }

  function toObject () {
    var m = this;
    return {
      years: m.year(),
      months: m.month(),
      date: m.date(),
      hours: m.hours(),
      minutes: m.minutes(),
      seconds: m.seconds(),
      milliseconds: m.milliseconds()
    };
  }

  function toJSON () {
    // new Date(NaN).toJSON() === null
    return this.isValid() ? this.toISOString() : null;
  }

  function isValid$2 () {
    return isValid(this);
  }

  function parsingFlags () {
    return extend({}, getParsingFlags(this));
  }

  function invalidAt () {
    return getParsingFlags(this).overflow;
  }

  function creationData() {
    return {
      input: this._i,
      format: this._f,
      locale: this._locale,
      isUTC: this._isUTC,
      strict: this._strict
    };
  }

// FORMATTING

  addFormatToken(0, ['gg', 2], 0, function () {
    return this.weekYear() % 100;
  });

  addFormatToken(0, ['GG', 2], 0, function () {
    return this.isoWeekYear() % 100;
  });

  function addWeekYearFormatToken (token, getter) {
    addFormatToken(0, [token, token.length], 0, getter);
  }

  addWeekYearFormatToken('gggg',     'weekYear');
  addWeekYearFormatToken('ggggg',    'weekYear');
  addWeekYearFormatToken('GGGG',  'isoWeekYear');
  addWeekYearFormatToken('GGGGG', 'isoWeekYear');

// ALIASES

  addUnitAlias('weekYear', 'gg');
  addUnitAlias('isoWeekYear', 'GG');

// PRIORITY

  addUnitPriority('weekYear', 1);
  addUnitPriority('isoWeekYear', 1);


// PARSING

  addRegexToken('G',      matchSigned);
  addRegexToken('g',      matchSigned);
  addRegexToken('GG',     match1to2, match2);
  addRegexToken('gg',     match1to2, match2);
  addRegexToken('GGGG',   match1to4, match4);
  addRegexToken('gggg',   match1to4, match4);
  addRegexToken('GGGGG',  match1to6, match6);
  addRegexToken('ggggg',  match1to6, match6);

  addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
    week[token.substr(0, 2)] = toInt(input);
  });

  addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
    week[token] = hooks.parseTwoDigitYear(input);
  });

// MOMENTS

  function getSetWeekYear (input) {
    return getSetWeekYearHelper.call(this,
      input,
      this.week(),
      this.weekday(),
      this.localeData()._week.dow,
      this.localeData()._week.doy);
  }

  function getSetISOWeekYear (input) {
    return getSetWeekYearHelper.call(this,
      input, this.isoWeek(), this.isoWeekday(), 1, 4);
  }

  function getISOWeeksInYear () {
    return weeksInYear(this.year(), 1, 4);
  }

  function getWeeksInYear () {
    var weekInfo = this.localeData()._week;
    return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
  }

  function getSetWeekYearHelper(input, week, weekday, dow, doy) {
    var weeksTarget;
    if (input == null) {
      return weekOfYear(this, dow, doy).year;
    } else {
      weeksTarget = weeksInYear(input, dow, doy);
      if (week > weeksTarget) {
        week = weeksTarget;
      }
      return setWeekAll.call(this, input, week, weekday, dow, doy);
    }
  }

  function setWeekAll(weekYear, week, weekday, dow, doy) {
    var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
      date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

    this.year(date.getUTCFullYear());
    this.month(date.getUTCMonth());
    this.date(date.getUTCDate());
    return this;
  }

// FORMATTING

  addFormatToken('Q', 0, 'Qo', 'quarter');

// ALIASES

  addUnitAlias('quarter', 'Q');

// PRIORITY

  addUnitPriority('quarter', 7);

// PARSING

  addRegexToken('Q', match1);
  addParseToken('Q', function (input, array) {
    array[MONTH] = (toInt(input) - 1) * 3;
  });

// MOMENTS

  function getSetQuarter (input) {
    return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
  }

// FORMATTING

  addFormatToken('D', ['DD', 2], 'Do', 'date');

// ALIASES

  addUnitAlias('date', 'D');

// PRIOROITY
  addUnitPriority('date', 9);

// PARSING

  addRegexToken('D',  match1to2);
  addRegexToken('DD', match1to2, match2);
  addRegexToken('Do', function (isStrict, locale) {
    // TODO: Remove "ordinalParse" fallback in next major release.
    return isStrict ?
      (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
      locale._dayOfMonthOrdinalParseLenient;
  });

  addParseToken(['D', 'DD'], DATE);
  addParseToken('Do', function (input, array) {
    array[DATE] = toInt(input.match(match1to2)[0], 10);
  });

// MOMENTS

  var getSetDayOfMonth = makeGetSet('Date', true);

// FORMATTING

  addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

// ALIASES

  addUnitAlias('dayOfYear', 'DDD');

// PRIORITY
  addUnitPriority('dayOfYear', 4);

// PARSING

  addRegexToken('DDD',  match1to3);
  addRegexToken('DDDD', match3);
  addParseToken(['DDD', 'DDDD'], function (input, array, config) {
    config._dayOfYear = toInt(input);
  });

// HELPERS

// MOMENTS

  function getSetDayOfYear (input) {
    var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
    return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
  }

// FORMATTING

  addFormatToken('m', ['mm', 2], 0, 'minute');

// ALIASES

  addUnitAlias('minute', 'm');

// PRIORITY

  addUnitPriority('minute', 14);

// PARSING

  addRegexToken('m',  match1to2);
  addRegexToken('mm', match1to2, match2);
  addParseToken(['m', 'mm'], MINUTE);

// MOMENTS

  var getSetMinute = makeGetSet('Minutes', false);

// FORMATTING

  addFormatToken('s', ['ss', 2], 0, 'second');

// ALIASES

  addUnitAlias('second', 's');

// PRIORITY

  addUnitPriority('second', 15);

// PARSING

  addRegexToken('s',  match1to2);
  addRegexToken('ss', match1to2, match2);
  addParseToken(['s', 'ss'], SECOND);

// MOMENTS

  var getSetSecond = makeGetSet('Seconds', false);

// FORMATTING

  addFormatToken('S', 0, 0, function () {
    return ~~(this.millisecond() / 100);
  });

  addFormatToken(0, ['SS', 2], 0, function () {
    return ~~(this.millisecond() / 10);
  });

  addFormatToken(0, ['SSS', 3], 0, 'millisecond');
  addFormatToken(0, ['SSSS', 4], 0, function () {
    return this.millisecond() * 10;
  });
  addFormatToken(0, ['SSSSS', 5], 0, function () {
    return this.millisecond() * 100;
  });
  addFormatToken(0, ['SSSSSS', 6], 0, function () {
    return this.millisecond() * 1000;
  });
  addFormatToken(0, ['SSSSSSS', 7], 0, function () {
    return this.millisecond() * 10000;
  });
  addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
    return this.millisecond() * 100000;
  });
  addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
    return this.millisecond() * 1000000;
  });


// ALIASES

  addUnitAlias('millisecond', 'ms');

// PRIORITY

  addUnitPriority('millisecond', 16);

// PARSING

  addRegexToken('S',    match1to3, match1);
  addRegexToken('SS',   match1to3, match2);
  addRegexToken('SSS',  match1to3, match3);

  var token;
  for (token = 'SSSS'; token.length <= 9; token += 'S') {
    addRegexToken(token, matchUnsigned);
  }

  function parseMs(input, array) {
    array[MILLISECOND] = toInt(('0.' + input) * 1000);
  }

  for (token = 'S'; token.length <= 9; token += 'S') {
    addParseToken(token, parseMs);
  }
// MOMENTS

  var getSetMillisecond = makeGetSet('Milliseconds', false);

// FORMATTING

  addFormatToken('z',  0, 0, 'zoneAbbr');
  addFormatToken('zz', 0, 0, 'zoneName');

// MOMENTS

  function getZoneAbbr () {
    return this._isUTC ? 'UTC' : '';
  }

  function getZoneName () {
    return this._isUTC ? 'Coordinated Universal Time' : '';
  }

  var proto = Moment.prototype;

  proto.add               = add;
  proto.calendar          = calendar$1;
  proto.clone             = clone;
  proto.diff              = diff;
  proto.endOf             = endOf;
  proto.format            = format;
  proto.from              = from;
  proto.fromNow           = fromNow;
  proto.to                = to;
  proto.toNow             = toNow;
  proto.get               = stringGet;
  proto.invalidAt         = invalidAt;
  proto.isAfter           = isAfter;
  proto.isBefore          = isBefore;
  proto.isBetween         = isBetween;
  proto.isSame            = isSame;
  proto.isSameOrAfter     = isSameOrAfter;
  proto.isSameOrBefore    = isSameOrBefore;
  proto.isValid           = isValid$2;
  proto.lang              = lang;
  proto.locale            = locale;
  proto.localeData        = localeData;
  proto.max               = prototypeMax;
  proto.min               = prototypeMin;
  proto.parsingFlags      = parsingFlags;
  proto.set               = stringSet;
  proto.startOf           = startOf;
  proto.subtract          = subtract;
  proto.toArray           = toArray;
  proto.toObject          = toObject;
  proto.toDate            = toDate;
  proto.toISOString       = toISOString;
  proto.inspect           = inspect;
  proto.toJSON            = toJSON;
  proto.toString          = toString;
  proto.unix              = unix;
  proto.valueOf           = valueOf;
  proto.creationData      = creationData;

// Year
  proto.year       = getSetYear;
  proto.isLeapYear = getIsLeapYear;

// Week Year
  proto.weekYear    = getSetWeekYear;
  proto.isoWeekYear = getSetISOWeekYear;

// Quarter
  proto.quarter = proto.quarters = getSetQuarter;

// Month
  proto.month       = getSetMonth;
  proto.daysInMonth = getDaysInMonth;

// Week
  proto.week           = proto.weeks        = getSetWeek;
  proto.isoWeek        = proto.isoWeeks     = getSetISOWeek;
  proto.weeksInYear    = getWeeksInYear;
  proto.isoWeeksInYear = getISOWeeksInYear;

// Day
  proto.date       = getSetDayOfMonth;
  proto.day        = proto.days             = getSetDayOfWeek;
  proto.weekday    = getSetLocaleDayOfWeek;
  proto.isoWeekday = getSetISODayOfWeek;
  proto.dayOfYear  = getSetDayOfYear;

// Hour
  proto.hour = proto.hours = getSetHour;

// Minute
  proto.minute = proto.minutes = getSetMinute;

// Second
  proto.second = proto.seconds = getSetSecond;

// Millisecond
  proto.millisecond = proto.milliseconds = getSetMillisecond;

// Offset
  proto.utcOffset            = getSetOffset;
  proto.utc                  = setOffsetToUTC;
  proto.local                = setOffsetToLocal;
  proto.parseZone            = setOffsetToParsedOffset;
  proto.hasAlignedHourOffset = hasAlignedHourOffset;
  proto.isDST                = isDaylightSavingTime;
  proto.isLocal              = isLocal;
  proto.isUtcOffset          = isUtcOffset;
  proto.isUtc                = isUtc;
  proto.isUTC                = isUtc;

// Timezone
  proto.zoneAbbr = getZoneAbbr;
  proto.zoneName = getZoneName;

// Deprecations
  proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
  proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
  proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
  proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
  proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

  function createUnix (input) {
    return createLocal(input * 1000);
  }

  function createInZone () {
    return createLocal.apply(null, arguments).parseZone();
  }

  function preParsePostFormat (string) {
    return string;
  }

  var proto$1 = Locale.prototype;

  proto$1.calendar        = calendar;
  proto$1.longDateFormat  = longDateFormat;
  proto$1.invalidDate     = invalidDate;
  proto$1.ordinal         = ordinal;
  proto$1.preparse        = preParsePostFormat;
  proto$1.postformat      = preParsePostFormat;
  proto$1.relativeTime    = relativeTime;
  proto$1.pastFuture      = pastFuture;
  proto$1.set             = set;

// Month
  proto$1.months            =        localeMonths;
  proto$1.monthsShort       =        localeMonthsShort;
  proto$1.monthsParse       =        localeMonthsParse;
  proto$1.monthsRegex       = monthsRegex;
  proto$1.monthsShortRegex  = monthsShortRegex;

// Week
  proto$1.week = localeWeek;
  proto$1.firstDayOfYear = localeFirstDayOfYear;
  proto$1.firstDayOfWeek = localeFirstDayOfWeek;

// Day of Week
  proto$1.weekdays       =        localeWeekdays;
  proto$1.weekdaysMin    =        localeWeekdaysMin;
  proto$1.weekdaysShort  =        localeWeekdaysShort;
  proto$1.weekdaysParse  =        localeWeekdaysParse;

  proto$1.weekdaysRegex       =        weekdaysRegex;
  proto$1.weekdaysShortRegex  =        weekdaysShortRegex;
  proto$1.weekdaysMinRegex    =        weekdaysMinRegex;

// Hours
  proto$1.isPM = localeIsPM;
  proto$1.meridiem = localeMeridiem;

  function get$1 (format, index, field, setter) {
    var locale = getLocale();
    var utc = createUTC().set(setter, index);
    return locale[field](utc, format);
  }

  function listMonthsImpl (format, index, field) {
    if (isNumber(format)) {
      index = format;
      format = undefined;
    }

    format = format || '';

    if (index != null) {
      return get$1(format, index, field, 'month');
    }

    var i;
    var out = [];
    for (i = 0; i < 12; i++) {
      out[i] = get$1(format, i, field, 'month');
    }
    return out;
  }

// ()
// (5)
// (fmt, 5)
// (fmt)
// (true)
// (true, 5)
// (true, fmt, 5)
// (true, fmt)
  function listWeekdaysImpl (localeSorted, format, index, field) {
    if (typeof localeSorted === 'boolean') {
      if (isNumber(format)) {
        index = format;
        format = undefined;
      }

      format = format || '';
    } else {
      format = localeSorted;
      index = format;
      localeSorted = false;

      if (isNumber(format)) {
        index = format;
        format = undefined;
      }

      format = format || '';
    }

    var locale = getLocale(),
      shift = localeSorted ? locale._week.dow : 0;

    if (index != null) {
      return get$1(format, (index + shift) % 7, field, 'day');
    }

    var i;
    var out = [];
    for (i = 0; i < 7; i++) {
      out[i] = get$1(format, (i + shift) % 7, field, 'day');
    }
    return out;
  }

  function listMonths (format, index) {
    return listMonthsImpl(format, index, 'months');
  }

  function listMonthsShort (format, index) {
    return listMonthsImpl(format, index, 'monthsShort');
  }

  function listWeekdays (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
  }

  function listWeekdaysShort (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
  }

  function listWeekdaysMin (localeSorted, format, index) {
    return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
  }

  getSetGlobalLocale('en', {
    dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
    ordinal : function (number) {
      var b = number % 10,
        output = (toInt(number % 100 / 10) === 1) ? 'th' :
          (b === 1) ? 'st' :
            (b === 2) ? 'nd' :
              (b === 3) ? 'rd' : 'th';
      return number + output;
    }
  });

// Side effect imports
  hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
  hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

  var mathAbs = Math.abs;

  function abs () {
    var data           = this._data;

    this._milliseconds = mathAbs(this._milliseconds);
    this._days         = mathAbs(this._days);
    this._months       = mathAbs(this._months);

    data.milliseconds  = mathAbs(data.milliseconds);
    data.seconds       = mathAbs(data.seconds);
    data.minutes       = mathAbs(data.minutes);
    data.hours         = mathAbs(data.hours);
    data.months        = mathAbs(data.months);
    data.years         = mathAbs(data.years);

    return this;
  }

  function addSubtract$1 (duration, input, value, direction) {
    var other = createDuration(input, value);

    duration._milliseconds += direction * other._milliseconds;
    duration._days         += direction * other._days;
    duration._months       += direction * other._months;

    return duration._bubble();
  }

// supports only 2.0-style add(1, 's') or add(duration)
  function add$1 (input, value) {
    return addSubtract$1(this, input, value, 1);
  }

// supports only 2.0-style subtract(1, 's') or subtract(duration)
  function subtract$1 (input, value) {
    return addSubtract$1(this, input, value, -1);
  }

  function absCeil (number) {
    if (number < 0) {
      return Math.floor(number);
    } else {
      return Math.ceil(number);
    }
  }

  function bubble () {
    var milliseconds = this._milliseconds;
    var days         = this._days;
    var months       = this._months;
    var data         = this._data;
    var seconds, minutes, hours, years, monthsFromDays;

    // if we have a mix of positive and negative values, bubble down first
    // check: https://github.com/moment/moment/issues/2166
    if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
        (milliseconds <= 0 && days <= 0 && months <= 0))) {
      milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
      days = 0;
      months = 0;
    }

    // The following code bubbles up values, see the tests for
    // examples of what that means.
    data.milliseconds = milliseconds % 1000;

    seconds           = absFloor(milliseconds / 1000);
    data.seconds      = seconds % 60;

    minutes           = absFloor(seconds / 60);
    data.minutes      = minutes % 60;

    hours             = absFloor(minutes / 60);
    data.hours        = hours % 24;

    days += absFloor(hours / 24);

    // convert days to months
    monthsFromDays = absFloor(daysToMonths(days));
    months += monthsFromDays;
    days -= absCeil(monthsToDays(monthsFromDays));

    // 12 months -> 1 year
    years = absFloor(months / 12);
    months %= 12;

    data.days   = days;
    data.months = months;
    data.years  = years;

    return this;
  }

  function daysToMonths (days) {
    // 400 years have 146097 days (taking into account leap year rules)
    // 400 years have 12 months === 4800
    return days * 4800 / 146097;
  }

  function monthsToDays (months) {
    // the reverse of daysToMonths
    return months * 146097 / 4800;
  }

  function as (units) {
    if (!this.isValid()) {
      return NaN;
    }
    var days;
    var months;
    var milliseconds = this._milliseconds;

    units = normalizeUnits(units);

    if (units === 'month' || units === 'year') {
      days   = this._days   + milliseconds / 864e5;
      months = this._months + daysToMonths(days);
      return units === 'month' ? months : months / 12;
    } else {
      // handle milliseconds separately because of floating point math errors (issue #1867)
      days = this._days + Math.round(monthsToDays(this._months));
      switch (units) {
        case 'week'   : return days / 7     + milliseconds / 6048e5;
        case 'day'    : return days         + milliseconds / 864e5;
        case 'hour'   : return days * 24    + milliseconds / 36e5;
        case 'minute' : return days * 1440  + milliseconds / 6e4;
        case 'second' : return days * 86400 + milliseconds / 1000;
        // Math.floor prevents floating point math errors here
        case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
        default: throw new Error('Unknown unit ' + units);
      }
    }
  }

// TODO: Use this.as('ms')?
  function valueOf$1 () {
    if (!this.isValid()) {
      return NaN;
    }
    return (
      this._milliseconds +
      this._days * 864e5 +
      (this._months % 12) * 2592e6 +
      toInt(this._months / 12) * 31536e6
    );
  }

  function makeAs (alias) {
    return function () {
      return this.as(alias);
    };
  }

  var asMilliseconds = makeAs('ms');
  var asSeconds      = makeAs('s');
  var asMinutes      = makeAs('m');
  var asHours        = makeAs('h');
  var asDays         = makeAs('d');
  var asWeeks        = makeAs('w');
  var asMonths       = makeAs('M');
  var asYears        = makeAs('y');

  function get$2 (units) {
    units = normalizeUnits(units);
    return this.isValid() ? this[units + 's']() : NaN;
  }

  function makeGetter(name) {
    return function () {
      return this.isValid() ? this._data[name] : NaN;
    };
  }

  var milliseconds = makeGetter('milliseconds');
  var seconds      = makeGetter('seconds');
  var minutes      = makeGetter('minutes');
  var hours        = makeGetter('hours');
  var days         = makeGetter('days');
  var months       = makeGetter('months');
  var years        = makeGetter('years');

  function weeks () {
    return absFloor(this.days() / 7);
  }

  var round = Math.round;
  var thresholds = {
    ss: 44,         // a few seconds to seconds
    s : 45,         // seconds to minute
    m : 45,         // minutes to hour
    h : 22,         // hours to day
    d : 26,         // days to month
    M : 11          // months to year
  };

// helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
  function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
    return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
  }

  function relativeTime$1 (posNegDuration, withoutSuffix, locale) {
    var duration = createDuration(posNegDuration).abs();
    var seconds  = round(duration.as('s'));
    var minutes  = round(duration.as('m'));
    var hours    = round(duration.as('h'));
    var days     = round(duration.as('d'));
    var months   = round(duration.as('M'));
    var years    = round(duration.as('y'));

    var a = seconds <= thresholds.ss && ['s', seconds]  ||
      seconds < thresholds.s   && ['ss', seconds] ||
      minutes <= 1             && ['m']           ||
      minutes < thresholds.m   && ['mm', minutes] ||
      hours   <= 1             && ['h']           ||
      hours   < thresholds.h   && ['hh', hours]   ||
      days    <= 1             && ['d']           ||
      days    < thresholds.d   && ['dd', days]    ||
      months  <= 1             && ['M']           ||
      months  < thresholds.M   && ['MM', months]  ||
      years   <= 1             && ['y']           || ['yy', years];

    a[2] = withoutSuffix;
    a[3] = +posNegDuration > 0;
    a[4] = locale;
    return substituteTimeAgo.apply(null, a);
  }

// This function allows you to set the rounding function for relative time strings
  function getSetRelativeTimeRounding (roundingFunction) {
    if (roundingFunction === undefined) {
      return round;
    }
    if (typeof(roundingFunction) === 'function') {
      round = roundingFunction;
      return true;
    }
    return false;
  }

// This function allows you to set a threshold for relative time strings
  function getSetRelativeTimeThreshold (threshold, limit) {
    if (thresholds[threshold] === undefined) {
      return false;
    }
    if (limit === undefined) {
      return thresholds[threshold];
    }
    thresholds[threshold] = limit;
    if (threshold === 's') {
      thresholds.ss = limit - 1;
    }
    return true;
  }

  function humanize (withSuffix) {
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }

    var locale = this.localeData();
    var output = relativeTime$1(this, !withSuffix, locale);

    if (withSuffix) {
      output = locale.pastFuture(+this, output);
    }

    return locale.postformat(output);
  }

  var abs$1 = Math.abs;

  function toISOString$1() {
    // for ISO strings we do not use the normal bubbling rules:
    //  * milliseconds bubble up until they become hours
    //  * days do not bubble at all
    //  * months bubble up until they become years
    // This is because there is no context-free conversion between hours and days
    // (think of clock changes)
    // and also not between days and months (28-31 days per month)
    if (!this.isValid()) {
      return this.localeData().invalidDate();
    }

    var seconds = abs$1(this._milliseconds) / 1000;
    var days         = abs$1(this._days);
    var months       = abs$1(this._months);
    var minutes, hours, years;

    // 3600 seconds -> 60 minutes -> 1 hour
    minutes           = absFloor(seconds / 60);
    hours             = absFloor(minutes / 60);
    seconds %= 60;
    minutes %= 60;

    // 12 months -> 1 year
    years  = absFloor(months / 12);
    months %= 12;


    // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
    var Y = years;
    var M = months;
    var D = days;
    var h = hours;
    var m = minutes;
    var s = seconds;
    var total = this.asSeconds();

    if (!total) {
      // this is the same as C#'s (Noda) and python (isodate)...
      // but not other JS (goog.date)
      return 'P0D';
    }

    return (total < 0 ? '-' : '') +
      'P' +
      (Y ? Y + 'Y' : '') +
      (M ? M + 'M' : '') +
      (D ? D + 'D' : '') +
      ((h || m || s) ? 'T' : '') +
      (h ? h + 'H' : '') +
      (m ? m + 'M' : '') +
      (s ? s + 'S' : '');
  }

  var proto$2 = Duration.prototype;

  proto$2.isValid        = isValid$1;
  proto$2.abs            = abs;
  proto$2.add            = add$1;
  proto$2.subtract       = subtract$1;
  proto$2.as             = as;
  proto$2.asMilliseconds = asMilliseconds;
  proto$2.asSeconds      = asSeconds;
  proto$2.asMinutes      = asMinutes;
  proto$2.asHours        = asHours;
  proto$2.asDays         = asDays;
  proto$2.asWeeks        = asWeeks;
  proto$2.asMonths       = asMonths;
  proto$2.asYears        = asYears;
  proto$2.valueOf        = valueOf$1;
  proto$2._bubble        = bubble;
  proto$2.get            = get$2;
  proto$2.milliseconds   = milliseconds;
  proto$2.seconds        = seconds;
  proto$2.minutes        = minutes;
  proto$2.hours          = hours;
  proto$2.days           = days;
  proto$2.weeks          = weeks;
  proto$2.months         = months;
  proto$2.years          = years;
  proto$2.humanize       = humanize;
  proto$2.toISOString    = toISOString$1;
  proto$2.toString       = toISOString$1;
  proto$2.toJSON         = toISOString$1;
  proto$2.locale         = locale;
  proto$2.localeData     = localeData;

// Deprecations
  proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
  proto$2.lang = lang;

// Side effect imports

// FORMATTING

  addFormatToken('X', 0, 0, 'unix');
  addFormatToken('x', 0, 0, 'valueOf');

// PARSING

  addRegexToken('x', matchSigned);
  addRegexToken('X', matchTimestamp);
  addParseToken('X', function (input, array, config) {
    config._d = new Date(parseFloat(input, 10) * 1000);
  });
  addParseToken('x', function (input, array, config) {
    config._d = new Date(toInt(input));
  });

// Side effect imports


  hooks.version = '2.18.1';

  setHookCallback(createLocal);

  hooks.fn                    = proto;
  hooks.min                   = min;
  hooks.max                   = max;
  hooks.now                   = now;
  hooks.utc                   = createUTC;
  hooks.unix                  = createUnix;
  hooks.months                = listMonths;
  hooks.isDate                = isDate;
  hooks.locale                = getSetGlobalLocale;
  hooks.invalid               = createInvalid;
  hooks.duration              = createDuration;
  hooks.isMoment              = isMoment;
  hooks.weekdays              = listWeekdays;
  hooks.parseZone             = createInZone;
  hooks.localeData            = getLocale;
  hooks.isDuration            = isDuration;
  hooks.monthsShort           = listMonthsShort;
  hooks.weekdaysMin           = listWeekdaysMin;
  hooks.defineLocale          = defineLocale;
  hooks.updateLocale          = updateLocale;
  hooks.locales               = listLocales;
  hooks.weekdaysShort         = listWeekdaysShort;
  hooks.normalizeUnits        = normalizeUnits;
  hooks.relativeTimeRounding = getSetRelativeTimeRounding;
  hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
  hooks.calendarFormat        = getCalendarFormat;
  hooks.prototype             = proto;

  return hooks;

})));
},{}],3:[function(require,module,exports){
/**
 * pubsub.js
 *
 * A tiny, optimized, tested, standalone and robust
 * pubsub implementation supporting different javascript environments
 *
 * @author Federico "Lox" Lucignano <http://plus.ly/federico.lox>
 *
 * @see https://github.com/federico-lox/pubsub.js
 */

/*global define, module*/
(function (pubsubContext) {
  /**
   * @private
   */
  function init() {
    //the channel subscription hash
    var channels = {},
      //help minification
      funcType = Function;

    return {
      /*
       * @public
       *
       * Publish some data on a channel
       *
       * @param String channel The channel to publish on
       * @param Mixed argument The data to publish, the function supports
       * as many data parameters as needed
       *
       * @example Publish stuff on '/some/channel'.
       * Anything subscribed will be called with a function
       * signature like: function(a,b,c){ ... }
       *
       * PubSub.publish(
       *		"/some/channel", "a", "b",
       *		{total: 10, min: 1, max: 3}
       * );
       */
      publish: function () {
        //help minification
        var args = arguments;
        // args[0] is the channel
        var subs = channels[args[0]];
        var len;
        var params;
        var x;

        if (subs) {
          len = subs.length;
          params = (args.length > 1) ?
            Array.prototype.splice.call(args, 1) : [];

          //console.log("dex.bus.publish: this=");
          //console.dir(this);

          //run the callbacks asynchronously,
          //do not block the main execution process
          var that = this;
          setTimeout(
            function () {
              //executes callbacks in the order
              //in which they were registered
              for (x = 0; x < len; x += 1) {
                // Take on pubsubContext of caller.
                // REM: Seems to fix a memory leak; otherwise the scope of any subscribers
                // is window by default due to dex.bus being in window pubsubContext.
                subs[x].apply(that, params);
                //subs[x].apply(pubsubContext, params);
              }

              //clear references to allow garbage collection
              subs = undefined;
              pubsubContext = undefined;
              params = undefined;
            },
            0
          );
        }
      },

      /*
       * @public
       *
       * Register a callback on a channel
       *
       * @param String channel The channel to subscribe to
       * @param Function callback The event handler, any time something is
       * published on a subscribed channel, the callback will be called
       * with the published array as ordered arguments
       *
       * @return Array A handle which can be used to unsubscribe this
       * particular subscription
       *
       * @example PubSub.subscribe(
       *				"/some/channel",
       *				function(a, b, c){ ... }
       *			);
       */
      subscribe: function (channel, callback) {
        //console.log("PUBSUB: SUBSCRIBE(CHANNEL, CALLBACK, THIS)");
        //console.dir(channel);
        //console.dir(callback);
        //console.dir(this);
        if (typeof channel !== 'string') {
          throw "invalid or missing channel";
        }

        if (!(callback instanceof funcType)) {
          throw "invalid or missing callback";
        }

        if (!channels[channel]) {
          channels[channel] = [];
        }

        channels[channel].push(callback);

        return {channel: channel, callback: callback};
      },

      /*
       * @public
       *
       * Disconnect a subscribed function f.
       *
       * @param Mixed handle The return value from a subscribe call or the
       * name of a channel as a String
       * @param Function callback [OPTIONAL] The event handler originaally
       * registered, not needed if handle contains the return value
       * of subscribe
       *
       * @example
       * var handle = PubSub.subscribe("/some/channel", function(){});
       * PubSub.unsubscribe(handle);
       *
       * or
       *
       * PubSub.unsubscribe("/some/channel", callback);
       */
      unsubscribe: function (handle, callback) {
        if (handle.channel && handle.callback) {
          callback = handle.callback;
          handle = handle.channel;
        }

        if (typeof handle !== 'string') {
          throw "invalid or missing channel";
        }

        if (!(callback instanceof funcType)) {
          throw "invalid or missing callback";
        }

        var subs = channels[handle],
          x,
          y = (subs instanceof Array) ? subs.length : 0;

        for (x = 0; x < y; x += 1) {
          if (subs[x] === callback) {
            subs.splice(x, 1);
            break;
          }
        }
      }
    };
  }

  //UMD
  if (typeof define === 'function' && define.amd) {
    //AMD module
    define('pubsub', init);
  } else if (typeof module === 'object' && module.exports) {
    //CommonJS module
    module.exports = init();
  } else {
    //traditional namespace
    pubsubContext.PubSub = init();
  }
}(this));
},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
var dexlibs = window.dexbootstrap || window.dexjquery || {};

// Dependencies:

dexlibs.bus = require("../lib/pubsub");
dexlibs.moment = require("../lib/moment/moment");
dexlibs.promise = require("../lib/bluebird/bluebird");
module.exports = dexlibs;
},{"../lib/bluebird/bluebird":1,"../lib/moment/moment":2,"../lib/pubsub":3}]},{},[5])(5)
});