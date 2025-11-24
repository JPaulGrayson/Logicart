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
  private nodeMap: Map<string, string>;
  private steps: InterpreterStep[];
  private currentStepIndex: number;
  
  constructor(code: string, nodeMap: Map<string, string>) {
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
      this.ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });
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
    for (const stmt of statements) {
      // Use location as the key to match with nodeMap
      const locKey = stmt.loc ? `${stmt.loc.start.line}:${stmt.loc.start.column}` : null;
      const nodeId = locKey ? this.nodeMap.get(locKey) : null;
      
      if (stmt.type === 'VariableDeclaration') {
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
          });
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
      } else if (stmt.type === 'BreakStatement') {
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
          });
        }
        return { type: 'break' };
      } else if (stmt.type === 'ContinueStatement') {
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
          });
        }
        return { type: 'continue' };
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
          if (result?.type === 'return' || result?.type === 'break' || result?.type === 'continue') return result;
        } else if (stmt.alternate) {
          const alternateStmts = stmt.alternate.type === 'BlockStatement'
            ? stmt.alternate.body
            : [stmt.alternate];
          const result = this.collectSteps(alternateStmts, depth + 1);
          if (result?.type === 'return' || result?.type === 'break' || result?.type === 'continue') return result;
        }
      } else if (stmt.type === 'ForStatement') {
        // Execute init
        if (stmt.init) {
          // Add step for init
          const initLocKey = stmt.init.loc ? `${stmt.init.loc.start.line}:${stmt.init.loc.start.column}` : null;
          const initNodeId = initLocKey ? this.nodeMap.get(initLocKey) : null;
          if (initNodeId) {
            this.steps.push({
              nodeId: initNodeId,
              state: this.cloneState()
            });
          }
          
          if (stmt.init.type === 'VariableDeclaration') {
            for (const decl of stmt.init.declarations) {
              const value = this.evaluateExpression(decl.init);
              this.state.variables[decl.id.name] = value;
            }
          } else {
            this.evaluateExpression(stmt.init);
          }
        }
        
        // Loop iteration
        while (true) {
          // Check condition
          const conditionResult = stmt.test ? this.evaluateExpression(stmt.test) : true;
          
          // Add step for condition check
          const condLocKey = stmt.test?.loc ? `${stmt.test.loc.start.line}:${stmt.test.loc.start.column}` : null;
          const condNodeId = condLocKey ? this.nodeMap.get(condLocKey) : null;
          if (condNodeId) {
            this.steps.push({
              nodeId: condNodeId,
              state: this.cloneState()
            });
          }
          
          if (!conditionResult) break;
          
          // Execute body
          const bodyStmts = stmt.body.type === 'BlockStatement'
            ? stmt.body.body
            : [stmt.body];
          const result = this.collectSteps(bodyStmts, depth + 1);
          
          if (result?.type === 'return') return result;
          if (result?.type === 'break') break;
          // continue just proceeds to update
          
          // Execute update
          if (stmt.update) {
            this.evaluateExpression(stmt.update);
            
            // Add step for update
            const updateLocKey = stmt.update.loc ? `${stmt.update.loc.start.line}:${stmt.update.loc.start.column}` : null;
            const updateNodeId = updateLocKey ? this.nodeMap.get(updateLocKey) : null;
            if (updateNodeId) {
              this.steps.push({
                nodeId: updateNodeId,
                state: this.cloneState()
              });
            }
          }
        }
      } else if (stmt.type === 'WhileStatement') {
        while (true) {
          // Check condition
          const conditionResult = this.evaluateExpression(stmt.test);
          
          // Add step for condition check
          const condLocKey = stmt.test?.loc ? `${stmt.test.loc.start.line}:${stmt.test.loc.start.column}` : null;
          const condNodeId = condLocKey ? this.nodeMap.get(condLocKey) : null;
          if (condNodeId) {
            this.steps.push({
              nodeId: condNodeId,
              state: this.cloneState()
            });
          }
          
          if (!conditionResult) break;
          
          // Execute body
          const bodyStmts = stmt.body.type === 'BlockStatement'
            ? stmt.body.body
            : [stmt.body];
          const result = this.collectSteps(bodyStmts, depth + 1);
          
          if (result?.type === 'return') return result;
          if (result?.type === 'break') break;
          // continue just loops back
        }
      } else if (stmt.type === 'DoWhileStatement') {
        do {
          // Execute body first
          const bodyStmts = stmt.body.type === 'BlockStatement'
            ? stmt.body.body
            : [stmt.body];
          const result = this.collectSteps(bodyStmts, depth + 1);
          
          if (result?.type === 'return') return result;
          if (result?.type === 'break') break;
          
          // Check condition
          const conditionResult = this.evaluateExpression(stmt.test);
          
          // Add step for condition check
          const condLocKey = stmt.test?.loc ? `${stmt.test.loc.start.line}:${stmt.test.loc.start.column}` : null;
          const condNodeId = condLocKey ? this.nodeMap.get(condLocKey) : null;
          if (condNodeId) {
            this.steps.push({
              nodeId: condNodeId,
              state: this.cloneState()
            });
          }
          
          if (!conditionResult) break;
        } while (true);
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
        
      case 'MemberExpression':
        const object = this.evaluateExpression(expr.object);
        if (expr.computed) {
          // array[index] or obj[key]
          const property = this.evaluateExpression(expr.property);
          return object?.[property];
        } else {
          // obj.property
          const propName = expr.property.name;
          return object?.[propName];
        }
        break;
        
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
        // Handle Math methods and other built-in functions
        if (expr.callee.type === 'MemberExpression') {
          const obj = this.evaluateExpression(expr.callee.object);
          const methodName = expr.callee.property.name;
          const args = expr.arguments.map((arg: any) => this.evaluateExpression(arg));
          
          // Support common Math methods
          if (obj === Math || expr.callee.object.name === 'Math') {
            if (methodName === 'round') return Math.round(args[0]);
            if (methodName === 'floor') return Math.floor(args[0]);
            if (methodName === 'ceil') return Math.ceil(args[0]);
            if (methodName === 'abs') return Math.abs(args[0]);
            if (methodName === 'sqrt') return Math.sqrt(args[0]);
            if (methodName === 'sin') return Math.sin(args[0]);
            if (methodName === 'cos') return Math.cos(args[0]);
            if (methodName === 'atan2') return Math.atan2(args[0], args[1]);
          }
        } else if (expr.callee.type === 'Identifier') {
          const fnName = expr.callee.name;
          const args = expr.arguments.map((arg: any) => this.evaluateExpression(arg));
          
          // Check if it's a function in the AST
          const funcDecl = this.ast.body.find((node: any) => 
            node.type === 'FunctionDeclaration' && node.id.name === fnName
          );
          
          if (funcDecl) {
            // Save current state
            const savedVars = { ...this.state.variables };
            
            // Set up parameters
            funcDecl.params.forEach((param: any, idx: number) => {
              this.state.variables[param.name] = args[idx];
            });
            
            // Execute function body
            const statements = funcDecl.body.body;
            for (const stmt of statements) {
              if (stmt.type === 'ReturnStatement') {
                const result = this.evaluateExpression(stmt.argument);
                // Restore state
                this.state.variables = savedVars;
                return result;
              } else if (stmt.type === 'VariableDeclaration') {
                for (const decl of stmt.declarations) {
                  this.state.variables[decl.id.name] = this.evaluateExpression(decl.init);
                }
              } else if (stmt.type === 'ExpressionStatement') {
                this.evaluateExpression(stmt.expression);
              }
            }
            
            // Restore state
            this.state.variables = savedVars;
          }
        }
        break;
        
      case 'AssignmentExpression':
        const rightValue = this.evaluateExpression(expr.right);
        const leftName = expr.left.name;
        
        if (expr.operator === '=') {
          this.state.variables[leftName] = rightValue;
          return rightValue;
        } else if (expr.operator === '+=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue + rightValue;
          this.state.variables[leftName] = newValue;
          return newValue;
        } else if (expr.operator === '-=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue - rightValue;
          this.state.variables[leftName] = newValue;
          return newValue;
        } else if (expr.operator === '*=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue * rightValue;
          this.state.variables[leftName] = newValue;
          return newValue;
        } else if (expr.operator === '/=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue / rightValue;
          this.state.variables[leftName] = newValue;
          return newValue;
        }
        return rightValue;
        
      case 'UpdateExpression':
        const varName = expr.argument.name;
        const currentValue = this.state.variables[varName];
        
        if (expr.operator === '++') {
          const newValue = currentValue + 1;
          this.state.variables[varName] = newValue;
          return expr.prefix ? newValue : currentValue;
        } else if (expr.operator === '--') {
          const newValue = currentValue - 1;
          this.state.variables[varName] = newValue;
          return expr.prefix ? newValue : currentValue;
        }
        break;
        
      case 'LogicalExpression':
        const leftLog = this.evaluateExpression(expr.left);
        if (expr.operator === '&&') {
          return leftLog && this.evaluateExpression(expr.right);
        } else if (expr.operator === '||') {
          return leftLog || this.evaluateExpression(expr.right);
        }
        break;
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
  
  jumpToStep(targetStep: number): InterpreterStep | null {
    if (targetStep >= 0 && targetStep <= this.steps.length) {
      this.currentStepIndex = targetStep;
      
      if (targetStep > 0 && targetStep <= this.steps.length) {
        const step = this.steps[targetStep - 1];
        this.state = { ...step.state };
        return step;
      } else if (targetStep === 0) {
        // Jump to beginning (before any execution)
        this.state = {
          variables: {},
          callStack: [],
          currentNodeId: null,
          status: 'idle',
          output: []
        };
        return null;
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
