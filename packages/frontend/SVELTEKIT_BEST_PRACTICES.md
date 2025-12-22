# SvelteKit Best Practices Guide

## Table of Contents
1. [Project Structure](#project-structure)
2. [Routing Patterns](#routing-patterns)
3. [Component Organization](#component-organization)
4. [State Management](#state-management)
5. [TypeScript Integration](#typescript-integration)
6. [Performance Optimization](#performance-optimization)
7. [SEO & SSR](#seo--ssr)
8. [Error Handling](#error-handling)

---

## Project Structure

### ✅ Current Structure (Compliant)

```
packages/frontend/
├── src/
│   ├── lib/                      # ← Reusable code (SvelteKit standard)
│   │   └── components/
│   │       └── ChatWidget.svelte
│   ├── routes/                   # ← File-based routing
│   │   ├── +layout.svelte        # Root layout
│   │   └── +page.svelte          # Home page
│   ├── app.css                   # Global styles
│   └── app.html                  # HTML template
├── static/                       # ← Public assets (served as-is)
│   └── [future: favicon.ico]
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

### 📁 Recommended Expansions

```
src/lib/
├── components/          # UI components
│   ├── chat/           # Feature-specific components
│   │   ├── ChatWidget.svelte
│   │   ├── MessageBubble.svelte
│   │   └── ChatInput.svelte
│   └── ui/             # Generic UI components
│       ├── Button.svelte
│       ├── Input.svelte
│       └── Modal.svelte
├── types/              # TypeScript types
│   ├── chat.ts
│   └── api.ts
├── utils/              # Utility functions
│   ├── formatDate.ts
│   └── validators.ts
├── stores/             # Svelte stores (global state)
│   └── chatStore.ts
├── api/                # API client
│   └── chatApi.ts
└── config/             # Configuration
    └── constants.ts
```

**Why `lib/`?**
- Built-in `$lib` alias: `import X from '$lib/components/X.svelte'`
- Auto-exported for packages (if publishing to npm)
- Clear separation from routes

---

## Routing Patterns

### File Naming Conventions

| File Type | Naming | Purpose |
|-----------|--------|---------|
| `+page.svelte` | Page component | Defines a route |
| `+page.ts` | Page load | Client-side data loading |
| `+page.server.ts` | Server load | SSR data loading |
| `+layout.svelte` | Layout | Wraps child routes |
| `+layout.ts` | Layout load | Shared data loading |
| `+error.svelte` | Error page | Custom error UI |
| `+server.ts` | API endpoint | Backend API routes |

### Example: Blog Post Route

```
routes/
├── blog/
│   ├── +page.svelte          # /blog (list)
│   ├── +page.server.ts       # Fetch posts from DB
│   ├── [slug]/
│   │   ├── +page.svelte      # /blog/hello-world
│   │   ├── +page.server.ts   # Fetch post by slug
│   │   └── +error.svelte     # 404 for missing posts
│   └── +layout.svelte        # Blog layout (sidebar)
```

### Dynamic Routes

```typescript
// routes/chat/[id]/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const { id } = params;
  const conversation = await fetchConversation(id);
  return { conversation };
};
```

```svelte
<!-- routes/chat/[id]/+page.svelte -->
<script lang="ts">
  export let data; // Auto-typed from +page.server.ts
  $: ({ conversation } = data);
</script>

<h1>{conversation.title}</h1>
```

---

## Component Organization

### Component Structure Template

```svelte
<script lang="ts">
  // 1. Imports
  import { onMount } from 'svelte';
  import type { ChatMessage } from '$lib/types/chat';
  
  // 2. Props (use `export let`)
  export let messages: ChatMessage[] = [];
  export let onSend: (msg: string) => void;
  
  // 3. Local state
  let input = '';
  let isTyping = false;
  
  // 4. Reactive declarations
  $: hasMessages = messages.length > 0;
  $: canSend = input.trim().length > 0;
  
  // 5. Functions
  function handleSubmit() {
    if (!canSend) return;
    onSend(input);
    input = '';
  }
  
  // 6. Lifecycle
  onMount(() => {
    console.log('Component mounted');
  });
</script>

<!-- 7. Template -->
<div class="chat">
  {#if hasMessages}
    {#each messages as message (message.id)}
      <div>{message.content}</div>
    {/each}
  {:else}
    <p>No messages yet</p>
  {/if}
  
  <form on:submit|preventDefault={handleSubmit}>
    <input bind:value={input} placeholder="Type..." />
    <button type="submit" disabled={!canSend}>Send</button>
  </form>
</div>

<!-- 8. Scoped styles -->
<style>
  .chat {
    padding: 1rem;
  }
</style>
```

### Props vs. State

```svelte
<script lang="ts">
  // ✅ Props (data from parent)
  export let userId: string;
  export let onLogout: () => void;
  
  // ✅ Local state (component-specific)
  let showMenu = false;
  let notifications = 0;
  
  // ✅ Reactive computed values
  $: hasNotifications = notifications > 0;
</script>
```

### Event Dispatching

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    submit: { message: string };
    cancel: void;
  }>();
  
  let message = '';
  
  function handleSubmit() {
    dispatch('submit', { message });
  }
</script>

<button on:click={() => dispatch('cancel')}>Cancel</button>
<button on:click={handleSubmit}>Submit</button>
```

**Usage:**
```svelte
<ChatForm
  on:submit={(e) => console.log(e.detail.message)}
  on:cancel={() => console.log('Cancelled')}
/>
```

---

## State Management

### 1. Component State (Simple)

```svelte
<script lang="ts">
  let count = 0; // Reactive by default
  
  function increment() {
    count += 1; // UI auto-updates
  }
</script>
```

### 2. Svelte Stores (Global State)

**Create Store:**
```typescript
// lib/stores/chatStore.ts
import { writable } from 'svelte/store';
import type { ChatMessage } from '$lib/types/chat';

export const messages = writable<ChatMessage[]>([]);

export function addMessage(msg: ChatMessage) {
  messages.update(m => [...m, msg]);
}

export function clearMessages() {
  messages.set([]);
}
```

**Use Store:**
```svelte
<script lang="ts">
  import { messages, addMessage } from '$lib/stores/chatStore';
  
  // Auto-subscribe with $prefix
  $: messageCount = $messages.length;
</script>

<p>Total messages: {messageCount}</p>
<button on:click={() => addMessage({...})}>Add</button>

{#each $messages as msg}
  <div>{msg.content}</div>
{/each}
```

### 3. Context API (Component Tree)

**Provide Context:**
```svelte
<!-- routes/+layout.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  
  setContext('theme', {
    primary: '#3b82f6',
    secondary: '#8b5cf6'
  });
</script>
```

**Consume Context:**
```svelte
<script lang="ts">
  import { getContext } from 'svelte';
  
  const theme = getContext<{ primary: string }>('theme');
</script>

<div style="color: {theme.primary}">Themed text</div>
```

### When to Use What?

| Scenario | Solution |
|----------|----------|
| Single component data | `let` state |
| Shared across components | Svelte store |
| Parent-child communication | Props + events |
| Deep component tree | Context API |
| Server data | `+page.server.ts` |

---

## TypeScript Integration

### Component Props Typing

```svelte
<script lang="ts">
  import type { ChatMessage, ChatView } from '$lib/types/chat';
  
  // Typed props
  export let messages: ChatMessage[];
  export let currentView: ChatView = 'welcome';
  export let onSend: (msg: string) => Promise<void>;
  
  // Optional props
  export let placeholder: string | undefined = undefined;
</script>
```

### Type Definitions

```typescript
// lib/types/chat.ts
export type ChatView = 'welcome' | 'details' | 'chat';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
}
```

### Generic Components

```svelte
<script lang="ts" generics="T">
  export let items: T[];
  export let renderItem: (item: T) => string;
</script>

{#each items as item}
  <div>{renderItem(item)}</div>
{/each}
```

**Usage:**
```svelte
<List items={messages} renderItem={(m) => m.content} />
```

---

## Performance Optimization

### 1. Keyed Each Blocks

```svelte
<!-- ✅ GOOD: Keyed by unique ID -->
{#each messages as message (message.id)}
  <MessageBubble {message} />
{/each}

<!-- ❌ BAD: Index as key (causes re-renders) -->
{#each messages as message, i (i)}
  <MessageBubble {message} />
{/each}
```

### 2. Reactive Statements (Avoid Over-Computation)

```svelte
<script lang="ts">
  export let messages: ChatMessage[];
  
  // ✅ GOOD: Only recalculates when messages change
  $: unreadCount = messages.filter(m => !m.read).length;
  
  // ❌ BAD: Runs on every re-render
  let unreadCount = 0;
  function updateCount() {
    unreadCount = messages.filter(m => !m.read).length;
  }
  $: updateCount(); // Unnecessary
</script>
```

### 3. Component Lazy Loading

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  let ChatWidget;
  
  onMount(async () => {
    const module = await import('$lib/components/ChatWidget.svelte');
    ChatWidget = module.default;
  });
</script>

{#if ChatWidget}
  <svelte:component this={ChatWidget} />
{/if}
```

### 4. Virtual Scrolling (Large Lists)

Use `svelte-virtual-list` for 1000+ items:

```bash
pnpm add -D svelte-virtual-list
```

```svelte
<script lang="ts">
  import VirtualList from 'svelte-virtual-list';
  
  let messages = [...]; // 10,000 messages
</script>

<VirtualList items={messages} let:item>
  <MessageBubble message={item} />
</VirtualList>
```

---

## SEO & SSR

### Enable SSR for Pages

```typescript
// routes/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const data = await fetchSEOData();
  return {
    title: 'Chat Widget Demo',
    description: 'Interactive Spur support widget',
    ogImage: '/og-image.png'
  };
};
```

```svelte
<!-- routes/+page.svelte -->
<script lang="ts">
  export let data;
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />
  <meta property="og:image" content={data.ogImage} />
</svelte:head>
```

### Prerendering Static Pages

```typescript
// routes/+page.ts
export const prerender = true; // Generate at build time
```

### CSR Only (When Needed)

```typescript
// routes/dashboard/+page.ts
export const ssr = false; // Client-side only
```

---

## Error Handling

### Custom Error Pages

```svelte
<!-- routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error">
  <h1>{$page.status}</h1>
  <p>{$page.error?.message || 'Something went wrong'}</p>
  <a href="/">Go home</a>
</div>
```

### Throwing Errors in Load Functions

```typescript
// routes/chat/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const conversation = await fetchConversation(params.id);
  
  if (!conversation) {
    throw error(404, 'Conversation not found');
  }
  
  return { conversation };
};
```

### Try-Catch in Components

```svelte
<script lang="ts">
  let errorMessage = '';
  
  async function sendMessage(msg: string) {
    try {
      await chatApi.send(msg);
    } catch (err) {
      errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to send message';
    }
  }
</script>

{#if errorMessage}
  <div class="error">{errorMessage}</div>
{/if}
```

---

## Additional Best Practices

### 1. Use `bind:` Sparingly

```svelte
<!-- ✅ GOOD: Two-way binding for form inputs -->
<input bind:value={name} />

<!-- ❌ AVOID: Binding complex objects (causes reactivity issues) -->
<Child bind:user={currentUser} />

<!-- ✅ BETTER: Pass props + events -->
<Child user={currentUser} on:update={(e) => currentUser = e.detail} />
```

### 2. Avoid `$:` Loops

```svelte
<!-- ❌ BAD: Infinite loop -->
<script>
  let x = 0;
  $: x = x + 1; // Updates infinitely
</script>

<!-- ✅ GOOD: Conditional reactive statement -->
<script>
  let x = 0;
  let y = 0;
  $: if (x > 0) y = x * 2;
</script>
```

### 3. Use Actions for DOM Manipulation

```typescript
// lib/actions/clickOutside.ts
export function clickOutside(node: HTMLElement, callback: () => void) {
  const handleClick = (event: MouseEvent) => {
    if (!node.contains(event.target as Node)) {
      callback();
    }
  };
  
  document.addEventListener('click', handleClick);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick);
    }
  };
}
```

**Usage:**
```svelte
<script lang="ts">
  import { clickOutside } from '$lib/actions/clickOutside';
  let showMenu = false;
</script>

<div use:clickOutside={() => showMenu = false}>
  {#if showMenu}
    <Menu />
  {/if}
</div>
```

### 4. Environment Variables

```javascript
// .env
PUBLIC_API_URL=http://localhost:3001
SECRET_KEY=xxx  # Server-only
```

**Access:**
```typescript
import { PUBLIC_API_URL } from '$env/static/public';
import { SECRET_KEY } from '$env/static/private';

// Or dynamic (for SSR)
import { env } from '$env/dynamic/public';
```

---

## Resources

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [SvelteKit FAQ](https://kit.svelte.dev/faq)
- [Svelte Discord](https://svelte.dev/chat)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Project:** Spur Support Widget (SvelteKit Migration)
