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
}

export class Interpreter {
  private ast: any;
  private code: string;
  private state: ExecutionState;
  private nodeMap: Map<any, string>;
  private steps: InterpreterStep[];
  private currentStepIndex: number;
  
  constructor(code: string, nodeMap: Map<any, string>) {
    this.code = code;
    this.nodeMap = nodeMap;
    this.steps = [];
    this.currentStepIndex = 0;
    this.state = {
      variables: {},
      callStack: [],
      currentNodeId: null,
      status: 'idle',
      output: []
    };
    
    try {
      this.ast = acorn.parse(code, { ecmaVersion: 2020 });
    } catch (e: any) {
      this.state.status = 'error';
      this.state.error = e.message;
      this.ast = null;
    }
  }

  // Prepare execution steps
  prepare(functionName?: string, args: any[] = []): boolean {
    if (!this.ast) return false;
    
    this.reset();
    this.steps = [];
    this.state.status = 'running';
    
    // Find the function declaration
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
      });
    }
    
    // Collect all execution steps
    this.collectSteps(targetFunction.body.body);
    
    return true;
  }
  
  private collectSteps(statements: any[], depth: number = 0): any {
    console.log('collectSteps called with', statements.length, 'statements');
    for (const stmt of statements) {
      const nodeId = this.nodeMap.get(stmt);
      console.log('Statement type:', stmt.type, 'nodeId:', nodeId, 'stmt:', stmt);
      
      if (stmt.type === 'VariableDeclaration') {
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
          });
        } else {
          console.warn('No nodeId found for VariableDeclaration');
        }
        
        for (const decl of stmt.declarations) {
          const value = this.evaluateExpression(decl.init);
          this.state.variables[decl.id.name] = value;
        }
      } else if (stmt.type === 'ReturnStatement') {
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
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
            state: this.cloneState()
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
      } else if (stmt.type === 'ExpressionStatement') {
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
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
        
      case 'BinaryExpression':
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
        
      case 'UnaryExpression':
        const argument = this.evaluateExpression(expr.argument);
        switch (expr.operator) {
          case '-': return -argument;
          case '+': return +argument;
          case '!': return !argument;
          default: return undefined;
        }
        
      case 'CallExpression':
        // For recursive calls, we'll evaluate them inline (simplified)
        if (expr.callee.type === 'Identifier') {
          const fnName = expr.callee.name;
          const args = expr.arguments.map((arg: any) => this.evaluateExpression(arg));
          
          // Simple recursion simulation for factorial
          if (fnName === 'factorial') {
            const n = args[0];
            if (n <= 1) return 1;
            return n * this.evaluateExpression({
              type: 'CallExpression',
              callee: { type: 'Identifier', name: 'factorial' },
              arguments: [{ type: 'Literal', value: n - 1 }]
            });
          }
        }
        break;
        
      case 'AssignmentExpression':
        const assignValue = this.evaluateExpression(expr.right);
        this.state.variables[expr.left.name] = assignValue;
        return assignValue;
    }
    
    return undefined;
  }
  
  // Navigation methods
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
