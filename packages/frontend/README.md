# Frontend - SvelteKit

A modern SvelteKit-based frontend for the IntelliChat AI support widget.

## Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) - A lightweight, fast web framework
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Icons**: [Lucide Svelte](https://lucide.dev/) - Beautiful icon library
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast build tool and dev server

## Project Structure

```
src/
├── app.css              # Global styles and animations
├── routes/
│   ├── +layout.svelte   # Root layout component
│   └── +page.svelte     # Home page
├── components/
│   └── ChatWidget.svelte # Main chat widget component
└── lib/                 # (Optional) Shared utilities and stores
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

```bash
# From the root directory
pnpm install

# Or from the frontend directory
cd packages/frontend
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev

# The app will be available at http://localhost:5173
```

### Building

```bash
# Build for production
pnpm build

# Preview the production build
pnpm preview
```

## Features

- **Multi-view Chat Widget**
  - Welcome screen with quick actions
  - Details capture form
  - Real-time chat interface
  - WhatsApp integration link

- **Responsive Design**
  - Mobile-friendly layout
  - Smooth animations and transitions
  - Auto-scrolling message list

- **Rich UI Components**
  - Message bubbles with timestamps
  - Loading states
  - Error handling
  - Keyboard shortcuts (Enter to send, Shift+Enter for newline)

## Configuration

Create a `.env.local` file in the `packages/frontend` directory:

```env
PUBLIC_API_URL=http://localhost:3001
```

## Tailwind CSS

Tailwind CSS is already configured with:
- Responsive design
- Custom colors and utilities
- PostCSS integration

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Migration from Next.js

This project was migrated from Next.js 16 to SvelteKit. Key changes:

### File Structure
- `app/` → `routes/` (SvelteKit routing)
- `app/layout.tsx` → `routes/+layout.svelte`
- `app/page.tsx` → `routes/+page.svelte`
- React components → Svelte components (`.svelte` files)

### Component Changes
- React hooks (`useState`, `useRef`, etc.) → Svelte reactive variables
- React event handlers → Svelte event directives (`on:click`, `on:submit`)
- React JSX → Svelte templating
- React Context → Svelte stores (if needed)

### Styling
- CSS Modules → Scoped `<style>` blocks in Svelte
- Tailwind classes remain the same

### Benefits of SvelteKit
- ✅ Smaller bundle size than Next.js
- ✅ Faster build times
- ✅ Less boilerplate with reactive variables
- ✅ Simpler component API
- ✅ Built-in file-based routing
- ✅ Server-side rendering support built-in

## Type Safety

This project is configured with TypeScript in strict mode. All components and utilities are fully typed.

## Performance

- Fast dev server startup (< 100ms)
- Instant HMR (Hot Module Reload)
- Optimized production builds
- Minimal JavaScript shipped to browser

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge) with ES2020+ support.

## License

Private - Part of IntelliChat AI assignment project.
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
