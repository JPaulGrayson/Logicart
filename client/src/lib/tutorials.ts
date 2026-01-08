import { Tutorial } from '../contexts/TutorialContext';

export const tutorials: Tutorial[] = [
    {
        id: 'agent-nudge',
        name: 'The Agent Bridge',
        description: 'Learn how LogicArt transforms code into interactive flowcharts.',
        steps: [
            {
                title: 'Welcome to LogicArt',
                content: "LogicArt instantly transforms JavaScript code into visual flowcharts. Let's explore how it works!",
                position: 'center'
            },
            {
                targetId: 'code-editor-container',
                title: 'The Code Editor',
                content: 'This is where your code lives. Try pasting or typing any JavaScript function here. The flowchart updates in real-time as you type.',
                position: 'right'
            },
            {
                targetId: 'flow-viewport',
                title: 'Instant Visualization',
                content: 'As soon as code appears in the editor, the flowchart renders instantly. You can see the logic paths clearly without reading a single line of text.',
                position: 'left'
            },
            {
                targetId: 'editor-toolbar',
                title: 'Explore the Toolbar',
                content: 'Use the toolbar to run code step-by-step, export your flowchart, or try sample algorithms from the Examples menu.',
                position: 'bottom'
            }
        ]
    },
    {
        id: 'vibe-master',
        name: 'The Vibe Master',
        description: 'Master spatial reasoning with Sections and Ghost Diff.',
        steps: [
            {
                title: 'Adding Altitude',
                content: 'Add `// --- SECTION NAME ---` to your code. This groups logic into high-level containers that you can collapse. Manage "cities," not just "buildings."',
                targetId: 'code-editor-container',
                position: 'right'
            },
            {
                targetId: 'ghost-diff-toggle',
                title: 'The Ghost of Code Past',
                content: 'Refactor your code and toggle Ghost Diff. Green shows your new logic; red shows the "ghost" of what was there before. Never lose your place again.',
                position: 'bottom'
            }
        ]
    },
    {
        id: 'coding-without-code',
        name: 'AI-Assisted Coding',
        description: 'Use LogicArt with AI assistants for visual code development.',
        steps: [
            {
                title: 'The Visual Advantage',
                content: "When working with AI coding assistants, LogicArt helps you verify generated code visually. You can understand the logic shape without reading every line.",
                position: 'center'
            },
            {
                targetId: 'code-editor-container',
                title: 'Paste & Verify',
                content: 'Paste AI-generated code here. Instead of reading every line, look at the flowchart to verify the logic "shape". If the flow looks right, the code is right.',
                position: 'right'
            },
            {
                targetId: 'editor-toolbar',
                title: 'Iterative Refinement',
                content: 'If you spot an issue in the flow, you know exactly what to ask the AI to fix. This is "Vibe Coding"—managing architecture visually, not characters.',
                position: 'bottom'
            }
        ]
    }
];
