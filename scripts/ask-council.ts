#!/usr/bin/env npx tsx
import { askCouncil, type ChairmanModel, type APIKeys } from '../server/councilService';
import * as readline from 'readline';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function printHeader() {
  console.log(`
${COLORS.cyan}${COLORS.bold}╔═══════════════════════════════════════════════════════════════╗
║                   🏛️  HEADLESS COUNCIL                        ║
║               AI Model Arena - CLI Interface                   ║
╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
}

function printUsage() {
  console.log(`${COLORS.yellow}Usage:${COLORS.reset}
  npx tsx scripts/ask-council.ts [options]

${COLORS.yellow}Options:${COLORS.reset}
  --mode <code|debug>     Mode of operation (default: code)
  --chairman <model>      Chairman model: openai, gemini, anthropic, xai (default: openai)
  --prompt "<text>"       Your prompt/question (or use interactive mode)
  --interactive, -i       Interactive mode

${COLORS.yellow}Environment Variables:${COLORS.reset}
  OPENAI_API_KEY          OpenAI API key
  GEMINI_API_KEY          Google Gemini API key
  ANTHROPIC_API_KEY       Anthropic Claude API key
  XAI_API_KEY             xAI Grok API key

${COLORS.yellow}Examples:${COLORS.reset}
  npx tsx scripts/ask-council.ts --mode code --prompt "Write a binary search function"
  npx tsx scripts/ask-council.ts --mode debug --prompt "Why is my loop running infinitely?"
  npx tsx scripts/ask-council.ts -i
`);
}

function getAPIKeys(): APIKeys {
  return {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    xai: process.env.XAI_API_KEY,
  };
}

function parseArgs(args: string[]): {
  mode: 'code' | 'debug';
  chairman: ChairmanModel;
  prompt?: string;
  interactive: boolean;
  help: boolean;
} {
  let mode: 'code' | 'debug' = 'code';
  let chairman: ChairmanModel = 'openai';
  let prompt: string | undefined;
  let interactive = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      mode = args[++i] as 'code' | 'debug';
    } else if (arg === '--chairman' && args[i + 1]) {
      chairman = args[++i] as ChairmanModel;
    } else if (arg === '--prompt' && args[i + 1]) {
      prompt = args[++i];
    } else if (arg === '--interactive' || arg === '-i') {
      interactive = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    }
  }

  return { mode, chairman, prompt, interactive, help };
}

function printModelResult(result: { model: string; provider: string; content: string; error?: string; latencyMs: number }) {
  const providerColors: Record<string, string> = {
    'OpenAI': COLORS.green,
    'Gemini': COLORS.blue,
    'Claude': COLORS.magenta,
    'Grok': COLORS.yellow,
  };
  const color = providerColors[result.provider] || COLORS.white;

  console.log(`\n${color}${COLORS.bold}━━━ ${result.provider} (${result.model}) ━━━${COLORS.reset}`);
  console.log(`${COLORS.dim}Latency: ${result.latencyMs}ms${COLORS.reset}`);

  if (result.error) {
    console.log(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
  } else {
    console.log(result.content);
  }
}

function printVerdict(verdict: { content: string; error?: string; latencyMs: number }) {
  console.log(`\n${COLORS.cyan}${COLORS.bold}════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bold}                    🏆 CHAIRMAN VERDICT                         ${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bold}════════════════════════════════════════════════════════════════${COLORS.reset}`);
  console.log(`${COLORS.dim}Latency: ${verdict.latencyMs}ms${COLORS.reset}\n`);

  if (verdict.error) {
    console.log(`${COLORS.red}Error: ${verdict.error}${COLORS.reset}`);
  } else {
    console.log(verdict.content);
  }
}

async function runInteractiveMode(mode: 'code' | 'debug', chairman: ChairmanModel, keys: APIKeys) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  };

  console.log(`${COLORS.green}Interactive mode. Type 'exit' to quit, 'mode' to switch modes.${COLORS.reset}\n`);

  while (true) {
    const prompt = await askQuestion(`${COLORS.cyan}[${mode}]${COLORS.reset} Enter your prompt: `);

    if (prompt.toLowerCase() === 'exit') {
      console.log(`${COLORS.yellow}Goodbye!${COLORS.reset}`);
      rl.close();
      break;
    }

    if (prompt.toLowerCase() === 'mode') {
      mode = mode === 'code' ? 'debug' : 'code';
      console.log(`${COLORS.green}Switched to ${mode} mode${COLORS.reset}`);
      continue;
    }

    if (!prompt.trim()) {
      continue;
    }

    console.log(`\n${COLORS.dim}Consulting the council...${COLORS.reset}`);

    try {
      const result = await askCouncil(prompt, mode, keys, chairman);

      for (const modelResult of result.results) {
        printModelResult(modelResult);
      }

      printVerdict(result.verdict);
    } catch (error: any) {
      console.log(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    }

    console.log('\n');
  }
}

async function main() {
  printHeader();

  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const keys = getAPIKeys();
  const configuredKeys = Object.entries(keys).filter(([, v]) => v).map(([k]) => k);

  if (configuredKeys.length === 0) {
    console.log(`${COLORS.red}Error: No API keys configured. Please set at least one API key environment variable.${COLORS.reset}`);
    printUsage();
    process.exit(1);
  }

  console.log(`${COLORS.green}Configured API keys: ${configuredKeys.join(', ')}${COLORS.reset}`);
  console.log(`${COLORS.dim}Mode: ${args.mode} | Chairman: ${args.chairman}${COLORS.reset}\n`);

  if (args.interactive) {
    await runInteractiveMode(args.mode, args.chairman, keys);
  } else if (args.prompt) {
    console.log(`${COLORS.dim}Consulting the council...${COLORS.reset}`);

    try {
      const result = await askCouncil(args.prompt, args.mode, keys, args.chairman);

      for (const modelResult of result.results) {
        printModelResult(modelResult);
      }

      printVerdict(result.verdict);
    } catch (error: any) {
      console.log(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
      process.exit(1);
    }
  } else {
    console.log(`${COLORS.yellow}No prompt provided. Use --prompt or -i for interactive mode.${COLORS.reset}`);
    printUsage();
    process.exit(1);
  }
}

main();
