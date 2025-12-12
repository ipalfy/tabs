# Agent Guidelines for Tab Inspector Chrome Extension

## Build Commands
- `npm run build` - Production build
- `npm run dev` - Development server
- `npm run watch` - Watch mode build

## Lint & Format
- `npm run lint` - Lint with Biome (auto-fix enabled)
- `npm run format` - Format code with Biome
- `npm run check` - Full Biome check (lint + format)

## Code Style
- **Imports**: React imports first, then external libs, then local imports
- **Formatting**: 2-space indent, 120 line width, single quotes
- **Types**: Strict TypeScript, no unused locals/parameters
- **Naming**: camelCase variables/functions, PascalCase components/types
- **Error Handling**: Try-catch with console.error logging
- **React**: Functional components with hooks, forwardRef for custom components
- **Paths**: Use `@/*` alias for src directory imports

## Testing
No test framework configured - run manual testing for Chrome extension functionality.

## Architecture
- React + TypeScript Chrome extension
- Vite for bundling
- Tailwind CSS for styling
- Biome for linting/formatting
- Uses Chrome APIs for tabs/windows management