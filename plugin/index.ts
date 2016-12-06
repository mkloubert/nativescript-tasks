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

import { Observable } from 'data/observable';
import TypeUtils = require('utils/types');

/**
 * Describes a task function.
 * 
 * @param {TState} [state] The optional value to submit to the function.
 * 
 * @return {TResult} The result of the function.
 */
export type TaskFunc<TState, TResult> = (state?: TState) => TResult;

/**
 * Describes a task context.
 */
export interface TaskContext<TState> {
    /**
     * The optional value that was submitted to the function.
     */
    state?: TState;
}

/**
 * Describes a result of a task.
 */
export interface TaskResult<TState, TResult> {
    /**
     * The result data (on success)
     */
    data?: TResult;

    /**
     * The error (if occurred)
     */
    error?: any;

    /**
     * The submitted value.
     */
    state?: TState;
}

/**
 * List of task states.
 */
export enum TaskStatus {
    /**
     * The task has been initialized but has not yet been invoked.
     */
    Created,

    /**
     * The task completed due to an unhandled exception.
     */
    Faulted,

    /**
     * The task completed execution successfully.
     */
    RanToCompletion,

    /**
     * The task is running but has not yet completed.
     */
    Running,

    /**
     * The task has been scheduled for execution but has not yet begun executing.
     */
    WaitingToRun,
}

/**
 * A task.
 */
export class Task<TState, TResult> extends Observable {
    /**
     * Stores the function to invoke.
     */
    protected readonly _FUNC: TaskFunc<TState, TResult>;
    /**
     * Stores the error of the last execution.
     */
    protected _error: any;
    /**
     * Stores the current task state.
     */
    protected _status: TaskStatus;
    
    /**
     * Initializes a new instance of that class.
     * 
     * @param {TaskFunc<TState, TResult>} func The function to invoke.
     */
    constructor(func: TaskFunc<TState, TResult>) {
        super();

        if (!TypeUtils.isNullOrUndefined(func)) {
            if (typeof func !== "function") {
                throw "'func' must be a function!";
            }
        }
        
        this._FUNC = func;

        this.updateStatus(TaskStatus.Created);
    }

    /**
     * Gets the error of the last execution.
     */
    public get error(): any {
        return this._error;
    }

    /**
     * Gets the underyling function to invoke.
     */
    public get func(): TaskFunc<TState, TResult> {
        return this._FUNC;
    }

    /**
     * Starts the task.
     * 
     * @param {TState} [state] The optional value to submit to the function.
     * 
     * @return {Promise<TaskResult<TState, TResult>>} The promise.
     */
    public start<TState>(state?: TState): Promise<TaskResult<TState, TResult>> {
        let me = this;

        return new Promise<TaskResult<TState, TResult>>((resolve, reject) => {
            let completed = (err: any, data?: TResult) => {
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
                    completed(new Error(`Cannot start while in '${TaskStatus[me._status]}' state!`));
                    return;
            }

            try {
                me.updateStatus(TaskStatus.WaitingToRun);

                let worker = new Worker('./worker');

                worker.onmessage = function(msg) {
                    worker.terminate();

                    let result = msg.data;
                    if (result) {
                        result = JSON.parse(result);
                    }

                    me.updateStatus(TaskStatus.RanToCompletion);
                    completed(null, result);
                };

                worker.onerror = function(err) {
                    me.updateStatus(TaskStatus.Faulted);

                    completed(err);
                };

                let func: any;
                if (me._FUNC) {
                    func = {};
                    
                    let funcStr = '' + me._FUNC;

                    func.body = funcStr.match(/function[^{]+\{([\s\S]*)\}$/)[1];

                    // s. https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
                    //
                    // author: humbletim (https://stackoverflow.com/users/1684079/humbletim)
                    func.args = funcStr.replace(/[/][/].*$/mg,'')  // strip single-line comments
                                       .replace(/\s+/g, '')  // strip white space
                                       .replace(/[/][*][^/*]*[*][/]/g, '')  // strip multi-line comments  
                                       .split('){', 1)[0].replace(/^[^(]*[(]/, '')  // extract the parameters  
                                       .replace(/=[^,]+/g, '')  // strip any ES6 defaults  
                                       .split(',')
                                       .filter(x => x);  // split & filter [""];
                }

                me.updateStatus(TaskStatus.Running);
                worker.postMessage(JSON.stringify({ 
                    func: func,
                    state: state,
                }));
            }
            catch (e) {
                me.updateStatus(TaskStatus.Faulted);

                completed(e);
            }
        });
    }

    /**
     * Gets the current status.
     */
    public get status(): TaskStatus {
        return this._status;
    }

    /**
     * Updates the error value.
     * 
     * @param {TaskStatus} newValue The new value.
     * 
     * @return {boolean} Property change has been raised for 'error' property or not.
     */
    protected updateError(newValue: any): boolean {
        if (newValue !== this._error) {
            this._error = newValue;

            this.notifyPropertyChange("error", newValue);
            return true;
        }

        return false;
    }

    /**
     * Updates the current status.
     * 
     * @param {TaskStatus} newValue The new value.
     * 
     * @return {boolean} Property change has been raised for 'status' property or not.
     */
    protected updateStatus(newValue: TaskStatus): boolean {
        if (newValue !== this._status) {
            this._status = newValue;

            this.notifyPropertyChange("status", newValue);
            return true;
        }

        return false;
    }
}

/**
 * Creates a new task.
 * 
 * @param {TaskFunc<TResult>} func The function to invoke.
 * 
 * @return {Task<TResult>} The new task.
 */
export function newTask<TResult>(func: TaskFunc<any, TResult>): Task<any, TResult> {
    return new Task<any, TResult>(func);
}

/**
 * Creates and starts a new task.
 * 
 * @param {TaskFunc<TResult>} func The function to invoke.
 * @param {TaskFunc<TResult>} func The function to invoke.
 * 
 * @return {Promise<TResult>} The promise.
 */
export function startNew<TResult, TState>(func: TaskFunc<TState, TResult>, state?: TState): Promise<TaskResult<TState, TResult>> {
    return newTask<TResult>(func).start(state);
}
