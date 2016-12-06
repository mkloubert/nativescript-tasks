import { Observable } from 'data/observable';
/**
 * Describes a task function.
 *
 * @param {TState} [state] The optional value to submit to the function.
 *
 * @return {TResult} The result of the function.
 */
export declare type TaskFunc<TState, TResult> = (state?: TState) => TResult;
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
export declare enum TaskStatus {
    /**
     * The task has been initialized but has not yet been invoked.
     */
    Created = 0,
    /**
     * The task completed due to an unhandled exception.
     */
    Faulted = 1,
    /**
     * The task completed execution successfully.
     */
    RanToCompletion = 2,
    /**
     * The task is running but has not yet completed.
     */
    Running = 3,
    /**
     * The task has been scheduled for execution but has not yet begun executing.
     */
    WaitingToRun = 4,
}
/**
 * A task.
 */
export declare class Task<TState, TResult> extends Observable {
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
    constructor(func: TaskFunc<TState, TResult>);
    /**
     * Gets the error of the last execution.
     */
    readonly error: any;
    /**
     * Gets the underyling function to invoke.
     */
    readonly func: TaskFunc<TState, TResult>;
    /**
     * Starts the task.
     *
     * @param {TState} [state] The optional value to submit to the function.
     *
     * @return {Promise<TaskResult<TState, TResult>>} The promise.
     */
    start<TState>(state?: TState): Promise<TaskResult<TState, TResult>>;
    /**
     * Gets the current status.
     */
    readonly status: TaskStatus;
    /**
     * Updates the error value.
     *
     * @param {TaskStatus} newValue The new value.
     *
     * @return {boolean} Property change has been raised for 'error' property or not.
     */
    protected updateError(newValue: any): boolean;
    /**
     * Updates the current status.
     *
     * @param {TaskStatus} newValue The new value.
     *
     * @return {boolean} Property change has been raised for 'status' property or not.
     */
    protected updateStatus(newValue: TaskStatus): boolean;
}
/**
 * Creates a new task.
 *
 * @param {TaskFunc<TResult>} func The function to invoke.
 *
 * @return {Task<TResult>} The new task.
 */
export declare function newTask<TResult>(func: TaskFunc<any, TResult>): Task<any, TResult>;
/**
 * Creates and starts a new task.
 *
 * @param {TaskFunc<TResult>} func The function to invoke.
 * @param {TaskFunc<TResult>} func The function to invoke.
 *
 * @return {Promise<TResult>} The promise.
 */
export declare function startNew<TResult, TState>(func: TaskFunc<TState, TResult>, state?: TState): Promise<TaskResult<TState, TResult>>;
