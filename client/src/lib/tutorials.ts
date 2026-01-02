import { Tutorial } from '../contexts/TutorialContext';

export const tutorials: Tutorial[] = [
    {
        id: 'agent-nudge',
        name: 'The Agent Bridge',
        description: 'Learn how to partner with the Agent to turn natural language into robust flowcharts.',
        steps: [
            {
                title: 'Welcome to LogiGo',
                content: "I'm your LogiGo Agent. For the best experience, snap this window to the right and keep our chat window open on the left so you can see both at once!",
                position: 'center'
            },
            {
                targetId: 'code-editor-container',
                title: 'Ask Me Anything',
                content: 'In our personal chat window (where we are talking now), try saying: "Write a function to optimize a travel route using Dijkstra\'s algorithm."',
                actionRequired: 'input',
                position: 'right'
            },
            {
                targetId: 'flow-viewport',
                title: 'Instant Visualization',
                content: 'As soon as I write the code, notice how the flowchart appears instantly. You can see the logic paths clearly without reading a single line of text.',
                position: 'left'
            },
            {
                targetId: 'editor-toolbar',
                title: 'Natural Language Labels',
                content: 'Flowcharts can be dense. Ask me to "Add descriptive labels to this flow" to swap code snippets for human-readable steps.',
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
        name: 'Coding Without Code',
        description: 'Experience pure natural language development where the Agent handles the implementation details.',
        steps: [
            {
                title: 'The Agent Partnership',
                content: "In this mode, you don't write code. You describe intent. I'll show you how to lead the dance through natural language.",
                position: 'center'
            },
            {
                targetId: 'code-editor-container',
                title: 'Intent & Verification',
                content: 'Describe what you want (e.g., "Build an email validator"). Don\'t read the code I write—look at the flowchart to verify the logic "shape". If it looks right, the code is right.',
                actionRequired: 'input',
                position: 'right'
            },
            {
                targetId: 'editor-toolbar',
                title: 'Iterative Refinement',
                content: 'If you see an issue in the flow, just tell me. "Add a domain check to that." The flow updates instantly. This is "Vibe Coding"—managing architecture, not characters.',
                position: 'bottom'
            }
        ]
    }
];
