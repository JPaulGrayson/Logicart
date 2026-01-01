/**
 * LogiGo Interpreter - Shared Execution Engine
 * 
 * Step-through code execution with variable tracking,
 * breakpoints, and time travel support.
 */

import * as acorn from 'acorn';

export interface ExecutionState {
    variables: Record<string, any>;
    callStack: Array<{
        functionName: string;
        variables: Record<string, any>;
    }>;
    currentNodeId: string | null;
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
    output: string[];
    error?: string;
}

export interface InterpreterStep {
    nodeId: string;
    state: ExecutionState;
    timestamp: number;
}

export interface Breakpoint {
    nodeId: string;
    line?: number;
    condition?: string; // e.g., "x > 5"
    enabled: boolean;
}

export interface VariableHistory {
    name: string;
    values: Array<{
        step: number;
        value: any;
        timestamp: number;
    }>;
}

export class Interpreter {
    private ast: any;
    private code: string;
    private state: ExecutionState;
    private nodeMap: Map<string, string>;
    private steps: InterpreterStep[];
    private currentStepIndex: number;
    private breakpoints: Map<string, Breakpoint>;
    private variableHistory: Map<string, VariableHistory>;

    constructor(code: string, nodeMap: Map<string, string>) {
        this.code = code;
        this.nodeMap = nodeMap;
        this.steps = [];
        this.currentStepIndex = 0;
        this.breakpoints = new Map();
        this.variableHistory = new Map();
        this.state = {
            variables: {},
            callStack: [],
            currentNodeId: null,
            status: 'idle',
            output: []
        };

        try {
            this.ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
        } catch (e: any) {
            this.state.status = 'error';
            this.state.error = e.message;
            this.ast = null;
        }
    }

    // ============== BREAKPOINTS ==============

    addBreakpoint(nodeId: string, options?: { line?: number; condition?: string }): void {
        this.breakpoints.set(nodeId, {
            nodeId,
            line: options?.line,
            condition: options?.condition,
            enabled: true
        });
    }

    removeBreakpoint(nodeId: string): void {
        this.breakpoints.delete(nodeId);
    }

    toggleBreakpoint(nodeId: string): boolean {
        const bp = this.breakpoints.get(nodeId);
        if (bp) {
            bp.enabled = !bp.enabled;
            return bp.enabled;
        }
        // Create new breakpoint
        this.addBreakpoint(nodeId);
        return true;
    }

    getBreakpoints(): Breakpoint[] {
        return Array.from(this.breakpoints.values());
    }

    hasBreakpoint(nodeId: string): boolean {
        const bp = this.breakpoints.get(nodeId);
        return bp?.enabled ?? false;
    }

    private checkBreakpointCondition(bp: Breakpoint): boolean {
        if (!bp.condition) return true;

        try {
            // Simple condition evaluation (variable comparisons)
            const fn = new Function(...Object.keys(this.state.variables), `return ${bp.condition}`);
            return fn(...Object.values(this.state.variables));
        } catch {
            return true; // If condition fails to evaluate, trigger breakpoint
        }
    }

    // ============== VARIABLE HISTORY ==============

    private recordVariableChange(name: string, value: any): void {
        if (!this.variableHistory.has(name)) {
            this.variableHistory.set(name, { name, values: [] });
        }

        this.variableHistory.get(name)!.values.push({
            step: this.currentStepIndex,
            value: JSON.parse(JSON.stringify(value)), // Deep clone
            timestamp: Date.now()
        });
    }

    getVariableHistory(name?: string): VariableHistory[] {
        if (name) {
            const history = this.variableHistory.get(name);
            return history ? [history] : [];
        }
        return Array.from(this.variableHistory.values());
    }

    getVariableAtStep(name: string, step: number): any {
        const history = this.variableHistory.get(name);
        if (!history) return undefined;

        // Find the last value at or before the given step
        let lastValue = undefined;
        for (const entry of history.values) {
            if (entry.step <= step) {
                lastValue = entry.value;
            } else {
                break;
            }
        }
        return lastValue;
    }

    // ============== EXECUTION ==============

    prepare(functionName?: string, args: any[] = []): boolean {
        if (!this.ast) return false;

        this.reset();
        this.steps = [];
        this.variableHistory.clear();
        this.state.status = 'running';

        const body = this.ast.body;
        const targetFunction = body.find((node: any) =>
            node.type === 'FunctionDeclaration' &&
            (!functionName || node.id.name === functionName)
        );

        if (!targetFunction) {
            this.state.error = `Function ${functionName || 'default'} not found`;
            this.state.status = 'error';
            return false;
        }

        // Initialize function parameters
        if (targetFunction.params && args) {
            targetFunction.params.forEach((param: any, idx: number) => {
                this.state.variables[param.name] = args[idx];
                this.recordVariableChange(param.name, args[idx]);
            });
        }

        this.collectSteps(targetFunction.body.body);
        return true;
    }

    private collectSteps(statements: any[], depth: number = 0): any {
        for (const stmt of statements) {
            const locKey = stmt.loc ? `${stmt.loc.start.line}:${stmt.loc.start.column}` : null;
            const nodeId = locKey ? this.nodeMap.get(locKey) : null;

            if (stmt.type === 'VariableDeclaration') {
                if (nodeId) {
                    this.steps.push({
                        nodeId,
                        state: this.cloneState(),
                        timestamp: Date.now()
                    });
                }

                for (const decl of stmt.declarations) {
                    const value = this.evaluateExpression(decl.init);
                    this.state.variables[decl.id.name] = value;
                    this.recordVariableChange(decl.id.name, value);
                }
            } else if (stmt.type === 'ReturnStatement') {
                if (nodeId) {
                    this.steps.push({
                        nodeId,
                        state: this.cloneState(),
                        timestamp: Date.now()
                    });
                }

                const returnValue = stmt.argument
                    ? this.evaluateExpression(stmt.argument)
                    : undefined;
                return { type: 'return', value: returnValue };
            } else if (stmt.type === 'IfStatement') {
                if (nodeId) {
                    this.steps.push({
                        nodeId,
                        state: this.cloneState(),
                        timestamp: Date.now()
                    });
                }

                const testResult = this.evaluateExpression(stmt.test);

                if (testResult) {
                    const consequentStmts = stmt.consequent.type === 'BlockStatement'
                        ? stmt.consequent.body
                        : [stmt.consequent];
                    const result = this.collectSteps(consequentStmts, depth + 1);
                    if (result?.type === 'return') return result;
                } else if (stmt.alternate) {
                    const alternateStmts = stmt.alternate.type === 'BlockStatement'
                        ? stmt.alternate.body
                        : [stmt.alternate];
                    const result = this.collectSteps(alternateStmts, depth + 1);
                    if (result?.type === 'return') return result;
                }
            } else if (stmt.type === 'ForStatement') {
                if (stmt.init) {
                    if (stmt.init.type === 'VariableDeclaration') {
                        for (const decl of stmt.init.declarations) {
                            const value = this.evaluateExpression(decl.init);
                            this.state.variables[decl.id.name] = value;
                            this.recordVariableChange(decl.id.name, value);
                        }
                    }
                }

                let iterations = 0;
                const maxIterations = 1000;

                while (iterations < maxIterations) {
                    const conditionResult = stmt.test ? this.evaluateExpression(stmt.test) : true;

                    if (nodeId) {
                        this.steps.push({
                            nodeId,
                            state: this.cloneState(),
                            timestamp: Date.now()
                        });
                    }

                    if (!conditionResult) break;

                    const bodyStmts = stmt.body.type === 'BlockStatement'
                        ? stmt.body.body
                        : [stmt.body];
                    const result = this.collectSteps(bodyStmts, depth + 1);

                    if (result?.type === 'return') return result;
                    if (result?.type === 'break') break;

                    if (stmt.update) {
                        this.evaluateExpression(stmt.update);
                    }

                    iterations++;
                }
            } else if (stmt.type === 'ExpressionStatement') {
                if (nodeId) {
                    this.steps.push({
                        nodeId,
                        state: this.cloneState(),
                        timestamp: Date.now()
                    });
                }

                this.evaluateExpression(stmt.expression);
            }
        }
    }

    private evaluateExpression(expr: any): any {
        if (!expr) return undefined;

        switch (expr.type) {
            case 'Literal':
                return expr.value;

            case 'Identifier':
                return this.state.variables[expr.name];

            case 'BinaryExpression': {
                const left = this.evaluateExpression(expr.left);
                const right = this.evaluateExpression(expr.right);

                switch (expr.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': return left / right;
                    case '%': return left % right;
                    case '<': return left < right;
                    case '>': return left > right;
                    case '<=': return left <= right;
                    case '>=': return left >= right;
                    case '==': return left == right;
                    case '===': return left === right;
                    case '!=': return left != right;
                    case '!==': return left !== right;
                    default: return undefined;
                }
            }

            case 'UnaryExpression': {
                const argument = this.evaluateExpression(expr.argument);
                switch (expr.operator) {
                    case '-': return -argument;
                    case '+': return +argument;
                    case '!': return !argument;
                    default: return undefined;
                }
            }

            case 'AssignmentExpression': {
                const rightValue = this.evaluateExpression(expr.right);
                const leftName = expr.left.name;

                let newValue = rightValue;
                if (expr.operator === '+=') {
                    newValue = this.state.variables[leftName] + rightValue;
                } else if (expr.operator === '-=') {
                    newValue = this.state.variables[leftName] - rightValue;
                }

                this.state.variables[leftName] = newValue;
                this.recordVariableChange(leftName, newValue);
                return newValue;
            }

            case 'UpdateExpression': {
                const varName = expr.argument.name;
                const currentValue = this.state.variables[varName];
                const newValue = expr.operator === '++' ? currentValue + 1 : currentValue - 1;
                this.state.variables[varName] = newValue;
                this.recordVariableChange(varName, newValue);
                return expr.prefix ? newValue : currentValue;
            }

            case 'LogicalExpression': {
                const leftLog = this.evaluateExpression(expr.left);
                if (expr.operator === '&&') {
                    return leftLog && this.evaluateExpression(expr.right);
                } else if (expr.operator === '||') {
                    return leftLog || this.evaluateExpression(expr.right);
                }
                break;
            }
        }

        return undefined;
    }

    // ============== NAVIGATION ==============

    stepForward(): InterpreterStep | null {
        if (this.currentStepIndex < this.steps.length) {
            const step = this.steps[this.currentStepIndex];
            this.state = { ...step.state };
            this.currentStepIndex++;
            return step;
        }

        if (this.currentStepIndex === this.steps.length) {
            this.state.status = 'completed';
        }

        return null;
    }

    stepBackward(): InterpreterStep | null {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            const step = this.steps[this.currentStepIndex];
            this.state = { ...step.state };
            return step;
        }
        return null;
    }

    runUntilBreakpoint(): InterpreterStep | null {
        while (this.currentStepIndex < this.steps.length) {
            const step = this.stepForward();
            if (step && this.hasBreakpoint(step.nodeId)) {
                const bp = this.breakpoints.get(step.nodeId)!;
                if (this.checkBreakpointCondition(bp)) {
                    return step;
                }
            }
        }
        return null;
    }

    getCurrentStep(): InterpreterStep | null {
        if (this.currentStepIndex > 0 && this.currentStepIndex <= this.steps.length) {
            return this.steps[this.currentStepIndex - 1];
        }
        return null;
    }

    getAllSteps(): InterpreterStep[] {
        return this.steps;
    }

    getProgress(): { current: number; total: number } {
        return {
            current: this.currentStepIndex,
            total: this.steps.length
        };
    }

    private cloneState(): ExecutionState {
        return {
            variables: { ...this.state.variables },
            callStack: this.state.callStack.map(frame => ({
                functionName: frame.functionName,
                variables: { ...frame.variables }
            })),
            currentNodeId: this.state.currentNodeId,
            status: this.state.status,
            output: [...this.state.output],
            error: this.state.error
        };
    }

    getState(): ExecutionState {
        return this.cloneState();
    }

    reset(): void {
        this.state = {
            variables: {},
            callStack: [],
            currentNodeId: null,
            status: 'idle',
            output: []
        };
        this.currentStepIndex = 0;
    }
}
