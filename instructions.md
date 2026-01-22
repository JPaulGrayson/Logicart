# Implementation Plan: LogicArt Security, Licensing, and CLI

Please implement the following complete specification to secure the application and enable the "Headless Council" feature.

## Phase 1: Backend Security & Licensing
**Goal:** Secure the API using Voyai's JWT system and enforce feature gates.

1.  **Dependencies:**
    * Install `jsonwebtoken` and `@types/jsonwebtoken`.

2.  **The Public Key:**
    * Create a constant for the Voyai Public Key (use exactly this key):
    ```text
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs5IIaW4LRZ2FsutCP/LZ
    Q2zEC8KS+y5kMqGMt8A4tRX7DWHAcfz4Yo+vgp3klufZMN5tW9mTFYpDTWjGO/b8
    pNNSYFg8EYCX6tDmsLo1Svcz8ciAUvtQITF72pufSkuDAAeNemotjLFEM/zNidTK
    khvavCdSAUfgsZNkrmzqlDYtEDZU1DfDgeiEJXIWEKGlOxH00C23dSg0JHuKXPft
    hD9MZHt4AGW12AMtbbJTlDXp2th8xnxMJEK0Pc6TRiuUIlxTpScB8POO+rGLCyGB
    PwCz+Z5KNKxgozCbEZk99lhr+jgCdHir6jzL4C5A/rXKYZdBLV51GhR6rK+UM+0M
    6QIDAQAB
    -----END PUBLIC KEY-----
    ```

3.  **Middleware (`server/middleware.ts`):**
    * Create `requireFounderTier`.
    * It must verify the JWT from the `Authorization` header using the **RS256 Public Key** above.
    * It should check that `payload.appId === 'logicart'`.
    * **Secure Routes:** Apply this middleware to:
        * `POST /api/arena/save`
        * `GET /api/arena/history`

## Phase 2: Frontend Gates & Auth
**Goal:** Manage user entitlements in the UI.

1.  **Auth Flow (`App.tsx`):**
    * Check for `?token=...` in the URL.
    * If found, store it in `localStorage` ('voyai_token') and clean the URL.

2.  **License Hook (`hooks/useLicense.ts`):**
    * Decode the JWT (client-side) and expose these flags:
        * `hasHistory`: `features.history_database` (Boolean)
        * `hasRescue`: `features.rabbit_hole_rescue` (Boolean)
        * `hasGitSync`: `features.github_sync` (Boolean)

3.  **UI Gates:**
    * **Header:** Add "Login with Voyai" button. Redirects to: `https://voyai.org/login?return_to=<YOUR_REPL_URL>&app=logicart`
    * **Git Sync:** If `!hasGitSync`, disable the "Sync to GitHub" button and show a tooltip: *"Pro Feature. Use Export to File instead."*
    * **History:** If `!hasHistory`, clicking "Save" should trigger an Upgrade Modal/Alert.
    * **Rescue:** If `!hasRescue`, disable the "Rescue Me" button in the Arena.

## Phase 3: The "Headless Council" (CLI Bridge)
**Goal:** Enable "Dogfooding" so we can consult the AI Council from the command line.

1.  **Refactor Council Service:**
    * Extract the logic for calling the 4 Models and the Chairman from `server/arena.ts`.
    * Move it into a reusable service: `server/services/councilService.ts`.
    * Ensure it returns a clean Verdict string.

2.  **Create CLI Script (`scripts/ask-council.ts`):**
    * It should accept a command line argument.
    * **File Support:**
        * If the argument is a filename (e.g., `prompt.md`), read the file content.
        * If no argument, look for a default `council_prompt.md`.
        * If it's a string, use it directly.
    * Call `councilService.getVerdict(prompt)`.
    * **Output:** Print *only* the Chairman's Verdict to the console.

3.  **NPM Command:**
    * Add to `package.json`: `"council": "ts-node scripts/ask-council.ts"`