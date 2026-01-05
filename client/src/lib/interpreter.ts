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

// Maximum steps to collect before aborting (prevents stack overflow on recursive algorithms)
// Set to 5000 as a balance between showing useful execution traces and preventing browser freezes
const MAX_STEPS = 5000;

// Number of trailing steps to keep for crash path visualization
const CRASH_PATH_TAIL_SIZE = 50;

export interface CrashPathData {
  nodeIds: Set<string>;
  edgePairs: Array<{ source: string; target: string }>;
  tailSteps: InterpreterStep[];
}

export class Interpreter {
  private ast: any;
  private code: string;
  private state: ExecutionState;
  private nodeMap: Map<string, string>;
  private steps: InterpreterStep[];
  private currentStepIndex: number;
  private functionDeclarations: Map<string, any> = new Map();
  private stepLimitExceeded: boolean = false;
  private crashPathData: CrashPathData | null = null;
  
  // Helper: Set variable and sync with current call frame
  private setVariable(name: string, value: any): void {
    this.state.variables[name] = value;
    // Also update the current call frame's variables if we're inside a function
    if (this.state.callStack.length > 0) {
      const currentFrame = this.state.callStack[this.state.callStack.length - 1];
      currentFrame.variables[name] = value;
    }
  }
  
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
      try {
        this.ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'module' });
      } catch {
        this.ast = acorn.parse(code, { ecmaVersion: 2020, locations: true, sourceType: 'script' });
      }
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
    this.stepLimitExceeded = false;
    this.crashPathData = null;
    this.state.status = 'running';
    
    const body = this.ast.body;
    
    // Build a map of function declarations for later lookup
    this.functionDeclarations = new Map();
    for (const node of body) {
      if (node.type === 'FunctionDeclaration' && node.id) {
        this.functionDeclarations.set(node.id.name, node);
      }
    }
    
    try {
      // Collect top-level statements that are NOT function declarations
      const topLevelStatements = body.filter((node: any) => 
        node.type !== 'FunctionDeclaration'
      );
      
      // If there are top-level statements, execute them (they may include function calls)
      if (topLevelStatements.length > 0) {
        this.collectSteps(topLevelStatements);
        
        // Check if we hit the step limit
        if (this.stepLimitExceeded) {
          this.buildCrashPathData();
          this.state.status = 'error';
          this.state.error = 'STEP_LIMIT: Infinite loop detected! The crash path is highlighted.';
          return false;
        }
        
        return this.steps.length > 0;
      }
      
      // Fallback: If no top-level statements, find and execute a specific function
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
          this.setVariable(param.name, args[idx]);
        });
      }
      
      // Collect all execution steps
      this.collectSteps(targetFunction.body.body);
      
      // Check if we hit the step limit
      if (this.stepLimitExceeded) {
        this.buildCrashPathData();
        this.state.status = 'error';
        this.state.error = 'STEP_LIMIT: Infinite loop detected! The crash path is highlighted.';
        return false;
      }
      
      return true;
    } catch (e: any) {
      // Catch stack overflow errors (RangeError: Maximum call stack size exceeded)
      if (e instanceof RangeError && e.message.includes('call stack')) {
        this.state.status = 'error';
        this.state.error = 'RECURSION_DEPTH: This recursive algorithm is too deep for autoplay. Try using Step mode (S key) to step through manually.';
        return false;
      }
      // Re-throw other errors
      throw e;
    }
  }
  
  // Check if the error is a step limit/recursion issue
  isStepLimitError(): boolean {
    return this.state.error?.startsWith('STEP_LIMIT:') || 
           this.state.error?.startsWith('RECURSION_DEPTH:') || false;
  }
  
  // Get user-friendly error message
  getUserFriendlyError(): string | null {
    if (!this.state.error) return null;
    if (this.state.error.startsWith('STEP_LIMIT:') || this.state.error.startsWith('RECURSION_DEPTH:')) {
      return this.state.error.split(': ')[1];
    }
    return this.state.error;
  }
  
  // Build crash path data from the last N steps when step limit is exceeded
  private buildCrashPathData(): void {
    const tailSize = Math.min(CRASH_PATH_TAIL_SIZE, this.steps.length);
    const tailSteps = this.steps.slice(-tailSize);
    
    // Extract unique node IDs from the tail
    const nodeIds = new Set<string>();
    tailSteps.forEach(step => nodeIds.add(step.nodeId));
    
    // Build edge pairs from consecutive steps
    const edgePairs: Array<{ source: string; target: string }> = [];
    for (let i = 0; i < tailSteps.length - 1; i++) {
      const source = tailSteps[i].nodeId;
      const target = tailSteps[i + 1].nodeId;
      // Only add if not a duplicate (we want unique edges for visualization)
      if (!edgePairs.some(e => e.source === source && e.target === target)) {
        edgePairs.push({ source, target });
      }
    }
    
    this.crashPathData = {
      nodeIds,
      edgePairs,
      tailSteps
    };
  }
  
  // Get crash path data for visualization (null if no crash)
  getCrashPathData(): CrashPathData | null {
    return this.crashPathData;
  }
  
  // Check if there's an active crash path
  hasCrashPath(): boolean {
    return this.crashPathData !== null;
  }
  
  private collectSteps(statements: any[], depth: number = 0): any {
    for (const stmt of statements) {
      // Check step limit to prevent stack overflow on deeply recursive algorithms
      if (this.steps.length >= MAX_STEPS) {
        this.stepLimitExceeded = true;
        return { type: 'step_limit' };
      }
      
      // Use location as the key to match with nodeMap
      const locKey = stmt.loc ? `${stmt.loc.start.line}:${stmt.loc.start.column}` : null;
      const nodeId = locKey ? this.nodeMap.get(locKey) : null;
      
      if (stmt.type === 'VariableDeclaration') {
        // First evaluate and assign the variable
        for (const decl of stmt.declarations) {
          const value = this.evaluateExpression(decl.init);
          this.setVariable(decl.id.name, value);
        }
        
        // Then push step with state AFTER assignment so variable is visible
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
          });
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
          if (result?.type === 'return' || result?.type === 'break' || result?.type === 'continue' || result?.type === 'step_limit') return result;
        } else if (stmt.alternate) {
          const alternateStmts = stmt.alternate.type === 'BlockStatement'
            ? stmt.alternate.body
            : [stmt.alternate];
          const result = this.collectSteps(alternateStmts, depth + 1);
          if (result?.type === 'return' || result?.type === 'break' || result?.type === 'continue' || result?.type === 'step_limit') return result;
        }
      } else if (stmt.type === 'ForStatement') {
        // Execute init FIRST, then capture step
        if (stmt.init) {
          if (stmt.init.type === 'VariableDeclaration') {
            for (const decl of stmt.init.declarations) {
              const value = this.evaluateExpression(decl.init);
              this.setVariable(decl.id.name, value);
            }
          } else {
            this.evaluateExpression(stmt.init);
          }
          
          // Add step AFTER init evaluation so variable is visible
          const initLocKey = stmt.init.loc ? `${stmt.init.loc.start.line}:${stmt.init.loc.start.column}` : null;
          const initNodeId = initLocKey ? this.nodeMap.get(initLocKey) : null;
          if (initNodeId) {
            this.steps.push({
              nodeId: initNodeId,
              state: this.cloneState()
            });
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
          
          if (result?.type === 'return' || result?.type === 'step_limit') return result;
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
          
          if (result?.type === 'return' || result?.type === 'step_limit') return result;
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
          
          if (result?.type === 'return' || result?.type === 'step_limit') return result;
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
        // Execute the expression first
        this.evaluateExpression(stmt.expression);
        
        // Then push step with state AFTER execution
        if (nodeId) {
          this.steps.push({
            nodeId,
            state: this.cloneState()
          });
        }
      }
    }
  }
  
  private evaluateExpression(expr: any): any {
    if (!expr) return undefined;
    
    switch (expr.type) {
      case 'Literal':
        return expr.value;
      
      case 'ArrayExpression':
        return expr.elements.map((el: any) => this.evaluateExpression(el));
      
      case 'ObjectExpression':
        const obj: Record<string, any> = {};
        for (const prop of expr.properties) {
          const key = prop.key.name || prop.key.value;
          obj[key] = this.evaluateExpression(prop.value);
        }
        return obj;
      
      case 'NewExpression':
        // Handle common constructors
        if (expr.callee.type === 'Identifier') {
          const constructorName = expr.callee.name;
          const args = expr.arguments.map((arg: any) => this.evaluateExpression(arg));
          if (constructorName === 'Set') return new Set(args[0] || []);
          if (constructorName === 'Map') return new Map(args[0] || []);
          if (constructorName === 'Date') return args.length > 0 ? new Date(args[0]) : new Date();
          if (constructorName === 'Array') return args.length === 1 && typeof args[0] === 'number' ? new Array(args[0]) : args;
        }
        return undefined;
        
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
          const funcDecl = this.functionDeclarations.get(fnName) || this.ast.body.find((node: any) => 
            node.type === 'FunctionDeclaration' && node.id.name === fnName
          );
          
          if (funcDecl) {
            // Track variables before call for scope cleanup
            const preCallVars = new Set(Object.keys(this.state.variables));
            
            // Push call frame FIRST so setVariable can sync to it
            const callFrame = {
              functionName: fnName,
              variables: {} as Record<string, any>
            };
            this.state.callStack.push(callFrame);
            
            // Set up parameters using setVariable to sync with call frame
            funcDecl.params.forEach((param: any, idx: number) => {
              this.setVariable(param.name, args[idx]);
            });
            
            // Execute function body - steps capture state during traversal
            // setVariable keeps call frame in sync throughout execution
            const result = this.collectSteps(funcDecl.body.body);
            
            // Pop from call stack
            this.state.callStack.pop();
            
            // Cleanup: remove variables declared inside the function
            // Keep pre-existing variables (they may have been modified)
            const postCallVars: Record<string, any> = {};
            for (const name of preCallVars) {
              postCallVars[name] = this.state.variables[name];
            }
            this.state.variables = postCallVars;
            
            if (result?.type === 'return') {
              return result.value;
            }
            // Propagate step limit to break out of execution
            if (result?.type === 'step_limit') {
              return undefined;
            }
          }
        }
        break;
        
      case 'AssignmentExpression':
        const rightValue = this.evaluateExpression(expr.right);
        const leftName = expr.left.name;
        
        if (expr.operator === '=') {
          this.setVariable(leftName, rightValue);
          return rightValue;
        } else if (expr.operator === '+=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue + rightValue;
          this.setVariable(leftName, newValue);
          return newValue;
        } else if (expr.operator === '-=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue - rightValue;
          this.setVariable(leftName, newValue);
          return newValue;
        } else if (expr.operator === '*=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue * rightValue;
          this.setVariable(leftName, newValue);
          return newValue;
        } else if (expr.operator === '/=') {
          const leftValue = this.state.variables[leftName];
          const newValue = leftValue / rightValue;
          this.setVariable(leftName, newValue);
          return newValue;
        }
        return rightValue;
        
      case 'UpdateExpression':
        const varName = expr.argument.name;
        const currentValue = this.state.variables[varName];
        
        if (expr.operator === '++') {
          const newValue = currentValue + 1;
          this.setVariable(varName, newValue);
          return expr.prefix ? newValue : currentValue;
        } else if (expr.operator === '--') {
          const newValue = currentValue - 1;
          this.setVariable(varName, newValue);
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
  
  /**
   * Step Indexing Convention:
   * - currentStepIndex: Count of steps executed (0 to steps.length)
   *   - 0 = before any execution
   *   - n = after executing n steps (showing state from steps[n-1])
   * - steps[]: 0-based array of execution snapshots
   * - Display: "Step X/Y" where X = currentStepIndex, Y = steps.length
   */
  
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
