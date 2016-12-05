// The MIT License (MIT)
// 
// Copyright (c) Marcel Joachim Kloubert <marcel.kloubert@gmx.net>
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
"use strict";
var observable_1 = require('data/observable');
var TypeUtils = require('utils/types');
/**
 * List of task states.
 */
(function (TaskStatus) {
    /**
     * The task has been initialized but has not yet been invoked.
     */
    TaskStatus[TaskStatus["Created"] = 0] = "Created";
    /**
     * The task completed due to an unhandled exception.
     */
    TaskStatus[TaskStatus["Faulted"] = 1] = "Faulted";
    /**
     * The task completed execution successfully.
     */
    TaskStatus[TaskStatus["RanToCompletion"] = 2] = "RanToCompletion";
    /**
     * The task is running but has not yet completed.
     */
    TaskStatus[TaskStatus["Running"] = 3] = "Running";
    /**
     * The task has been scheduled for execution but has not yet begun executing.
     */
    TaskStatus[TaskStatus["WaitingToRun"] = 4] = "WaitingToRun";
})(exports.TaskStatus || (exports.TaskStatus = {}));
var TaskStatus = exports.TaskStatus;
/**
 * A task.
 */
var Task = (function (_super) {
    __extends(Task, _super);
    /**
     * Initializes a new instance of that class.
     *
     * @param {TaskFunc<TState, TResult>} func The function to invoke.
     */
    function Task(func) {
        _super.call(this);
        if (!TypeUtils.isNullOrUndefined(func)) {
            if (typeof func !== "function") {
                throw "'func' must be a function!";
            }
        }
        this._FUNC = func;
        this.updateStatus(TaskStatus.Created);
    }
    Object.defineProperty(Task.prototype, "error", {
        /**
         * Gets the error of the last execution.
         */
        get: function () {
            return this._error;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Task.prototype, "func", {
        /**
         * Gets the underyling function to invoke.
         */
        get: function () {
            return this._FUNC;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts the task.
     *
     * @param {TState} [state] The optional value to submit to the function.
     *
     * @return {Promise<TaskResult<TState, TResult>>} The promise.
     */
    Task.prototype.start = function (state) {
        var me = this;
        return new Promise(function (resolve, reject) {
            var completed = function (err, data) {
                if (err) {
                    reject({
                        error: err,
                        state: state,
                    });
                }
                else {
                    resolve({
                        data: data,
                        state: state,
                    });
                }
                me.updateError(err);
            };
            switch (me._status) {
                case TaskStatus.Created:
                case TaskStatus.Faulted:
                case TaskStatus.RanToCompletion:
                    break;
                default:
                    completed(new Error("Cannot start while in '" + TaskStatus[me._status] + "' state!"));
                    return;
            }
            try {
                me.updateStatus(TaskStatus.WaitingToRun);
                var worker_1 = new Worker('./worker');
                worker_1.onmessage = function (msg) {
                    worker_1.terminate();
                    me.updateStatus(TaskStatus.RanToCompletion);
                    completed(null, JSON.parse(msg.data));
                };
                worker_1.onerror = function (err) {
                    me.updateStatus(TaskStatus.Faulted);
                    completed(err);
                };
                var func = void 0;
                if (me._FUNC) {
                    func = {};
                    var funcStr = '' + me._FUNC;
                    func.body = funcStr.match(/function[^{]+\{([\s\S]*)\}$/)[1];
                    // s. https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
                    //
                    // author: humbletim (https://stackoverflow.com/users/1684079/humbletim)
                    func.args = funcStr.replace(/[/][/].*$/mg, '') // strip single-line comments
                        .replace(/\s+/g, '') // strip white space
                        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
                        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
                        .replace(/=[^,]+/g, '') // strip any ES6 defaults  
                        .split(',')
                        .filter(function (x) { return x; }); // split & filter [""];
                }
                me.updateStatus(TaskStatus.Running);
                worker_1.postMessage(JSON.stringify({
                    func: func,
                    state: state,
                }));
            }
            catch (e) {
                me.updateStatus(TaskStatus.Faulted);
                completed(e);
            }
        });
    };
    Object.defineProperty(Task.prototype, "status", {
        /**
         * Gets the current status.
         */
        get: function () {
            return this._status;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Updates the error value.
     *
     * @param {TaskStatus} newValue The new value.
     *
     * @return {boolean} Property change has been raised for 'error' property or not.
     */
    Task.prototype.updateError = function (newValue) {
        if (newValue !== this._error) {
            this._error = newValue;
            this.notifyPropertyChange("error", newValue);
            return true;
        }
        return false;
    };
    /**
     * Updates the current status.
     *
     * @param {TaskStatus} newValue The new value.
     *
     * @return {boolean} Property change has been raised for 'status' property or not.
     */
    Task.prototype.updateStatus = function (newValue) {
        if (newValue !== this._status) {
            this._status = newValue;
            this.notifyPropertyChange("status", newValue);
            return true;
        }
        return false;
    };
    return Task;
}(observable_1.Observable));
exports.Task = Task;
/**
 * Creates a new task.
 *
 * @param {TaskFunc<TResult>} func The function to invoke.
 *
 * @return {Task<TResult>} The new task.
 */
function newTask(func) {
    return new Task(func);
}
exports.newTask = newTask;
/**
 * Creates and starts a new task.
 *
 * @param {TaskFunc<TResult>} func The function to invoke.
 * @param {TaskFunc<TResult>} func The function to invoke.
 *
 * @return {Promise<TResult>} The promise.
 */
function startNew(func, state) {
    return newTask(func).start(state);
}
exports.startNew = startNew;
//# sourceMappingURL=index.js.map