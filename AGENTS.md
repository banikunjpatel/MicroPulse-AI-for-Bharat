# Monorepo Project

# Always use PNPM package manager

## Agent Instructions
- Always read requirements.md file before starting any new feature.
- Always read AGENTS.md file before starting any new feature.
- Always create a plan before starting any new feature.
- Always divide work into smaller tasks and implement them one by one.

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Run tests: `pnpm test`

## Coding Conventions
- Prefer TypeScript (.tsx/.ts) for all new components and utilities.
- Use Next.js built-in components like `next/image` and `next/link` for optimization.
- Use useState for component-level state. Use Zustand for global state management.
- Use postgres database with queries that cannot be exploited with SQL injection.
- Use Shadcn UI components in frontend wherever possible.

## Development Standards
- Test Driven Development Style. Add or update tests for the code you change, even if nobody asked.
- Always create Playwright E2E tests for all newely created features
- Follow DRY(Don't repeat yourself) concept. Write re-usable functions and libraries.
- Always divide code into smaller components and functions.
- Always use better-auth for authentication.


## Project Structure
./app/
├── public/                    # Static assets
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/           # Reusable components
│   │   ├── ui/              # Shadcn UI components
│   │   └── common/          # Common components
│   ├── lib/                 # Utility libraries
│   │   ├── store/           # Redux store configuration
│   │   ├── utils.ts         # Utility functions
│   │   └── validations.ts   # Zod schemas
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── styles/              # Global styles
│   └── constants/           # Application constants
├── tests/                   # Test files
├── docs/                    # Documentation
├── .env.example            # Environment variables template
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json

## Common Issues

### Issue 1: Hydration Mismatch Errors

**Solution**:

- Ensure server and client render the same content
- Use `useEffect` for client-only code
- Use `dynamic` imports with `ssr: false` for client-only components
- Check for differences in date/time formatting between server and client

### Issue 2: Performance Issues with Large Lists

**Solution**:

- Implement virtualization for large datasets
- Use pagination or infinite scrolling
- Optimize re-renders with `React.memo` and `useMemo`
- Consider server-side filtering and sorting

### Issue 3: TypeScript Type Errors in Production Build

**Solution**:

- Enable strict mode in TypeScript configuration
- Fix all type errors before deployment
- Use proper type definitions for third-party libraries
- Implement proper error boundaries for runtime type issues

### Issue 4: SEO and Meta Tags Not Working

**Solution**:

- Use Next.js `Metadata` API in App Router
- Implement proper Open Graph tags
- Ensure meta tags are rendered server-side
- Test with social media debuggers

## Reference Resources

- [Next.js Official Documentation](https://nextjs.org/docs)
- [React Official Documentation](https://react.dev/)
- [TypeScript Official Documentation](https://www.typescriptlang.org/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
