# Code style

## General
- Simple and explicit over clever and abstract
- If a function needs a comment to be understood, rewrite it instead
- No dead code — if it's not used, delete it
- No TODO comments in committed code — either do it or open an issue

## Naming
- Variables and functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case
- Names must describe what something IS or DOES — no x, temp, data, stuff
- Boolean variables start with is, has, or can — e.g. isLoading, hasError

## Functions
- One function, one job — if you need "and" to describe it, split it
- Max ~20 lines per function — if longer, decompose it
- No functions with more than 3 parameters — use an options object instead
- Pure functions where possible — no hidden side effects

## JavaScript specific
- const by default, let only when reassignment is needed, never var
- Always use === never ==
- No implicit type coercion
- Async/await over raw Promises
- Always handle the catch on every async call
- No nested ternaries

## CSS specific
- Class names: kebab-case
- Never use inline styles except for dynamic values set by JS
- Never use !important
- Group properties: layout → box model → typography → visual → animation
- No magic numbers — use CSS custom properties for anything reused

## Files
- One clear responsibility per file
- No file longer than 200 lines — split it if it gets there
- Imports at the top, grouped: browser APIs → internal modules → constants

## What Claude Code must never do
- Never change formatting or style of code outside the current task
- Never rename variables or functions unless asked
- Never reorganise file structure unless asked
- Never add abstractions or refactors that weren't requested
- Never auto-fix linting issues in unrelated files