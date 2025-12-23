<script lang="ts">
	import {
		ArrowLeft,
		MessageCircle,
		Send,
		Sparkles,
		Wand2,
		X,
		Zap,
		Clock,
		MessageSquare
	} from 'lucide-svelte';
	import { chatApi } from '$lib/services/chatApi';
	import { onMount } from 'svelte';

	type ChatView = 'welcome' | 'chat' | 'details';

	interface ChatMessage {
		id: string;
		sender: 'user' | 'agent';
		text: string;
		time: string;
	}

	let isOpen = $state(false);
	let view: ChatView = $state('welcome');
	let messages: ChatMessage[] = $state([]);
	let input = $state('');
	let hasAskedDetails = $state(false);
	let pendingMessage: string | null = $state(null);
	let isLoading = $state(false);
	let error: string | null = $state(null);
	let details = $state({
		name: '',
		email: '',
		phone: ''
	});

	let messageListRef: HTMLDivElement | undefined = $state();

	const quickQuestions = [
		'What is your shipping policy?',
		'How do I return an item?',
		'What are your support hours?'
	];

	// Load conversation history on mount
	onMount(async () => {
		try {
			const history = await chatApi.getHistory();
			if (history?.data?.messages && history.data.messages.length > 0) {
				// Convert API messages to UI format
				messages = history.data.messages.map((msg) => ({
					id: msg.id,
					sender: msg.sender === 'ai' ? 'agent' : 'user',
					text: msg.content,
					time: formatTime(msg.timestamp)
				}));
				view = 'chat';
				hasAskedDetails = true;
			}
		} catch (err) {
			console.error('Failed to load history:', err);
			// Continue without history
		}
	});

	function makeId() {
		return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `id-${Math.random().toString(16).slice(2)}`;
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		return date.toLocaleDateString();
	}

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (messageListRef) {
				messageListRef.scrollTo({
					top: messageListRef.scrollHeight,
					behavior: 'smooth'
				});
			}
		});
	}

	function addMessages(newMessages: ChatMessage[]) {
		messages = [...messages, ...newMessages];
		scrollToBottom();
	}

	async function sendMessageToApi(userMessage: string) {
		isLoading = true;
		error = null;

		try {
			const response = await chatApi.sendMessage(userMessage);

			// Add AI response
			addMessages([
				{
					id: makeId(),
					sender: 'agent',
					text: response.reply,
					time: 'just now'
				}
			]);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send message';
			console.error('Error sending message:', err);

			// Add error message
			addMessages([
				{
					id: makeId(),
					sender: 'agent',
					text: "I'm having trouble connecting right now. Please try again in a moment.",
					time: 'just now'
				}
			]);
		} finally {
			isLoading = false;
		}
	}

	async function handleSend() {
		if (!input.trim() || isLoading) return;

		const userMessage = input.trim();
		input = '';

		if (messages.length === 0 && !hasAskedDetails) {
			pendingMessage = userMessage;
			view = 'details';
			return;
		}

		// Add user message immediately
		addMessages([
			{
				id: makeId(),
				sender: 'user',
				text: userMessage,
				time: 'just now'
			}
		]);

		// Send to API
		await sendMessageToApi(userMessage);
	}

	async function handleQuickQuestion(question: string) {
		if (isLoading) return;

		view = 'chat';
		input = '';

		if (messages.length === 0 && !hasAskedDetails) {
			pendingMessage = question;
			view = 'details';
			return;
		}

		// Add user message
		addMessages([
			{
				id: makeId(),
				sender: 'user',
				text: question,
				time: 'just now'
			}
		]);

		// Send to API
		await sendMessageToApi(question);
	}

	async function handleDetailSubmit(event: SubmitEvent) {
		event.preventDefault();
		hasAskedDetails = true;
		view = 'chat';

		if (pendingMessage) {
			// Add user message
			addMessages([
				{
					id: makeId(),
					sender: 'user',
					text: pendingMessage,
					time: 'just now'
				}
			]);

			// Add acknowledgment
			addMessages([
				{
					id: makeId(),
					sender: 'agent',
					text: `Thanks ${details.name || 'there'}! I've got your details.`,
					time: 'just now'
				}
			]);

			// Send pending message to API
			await sendMessageToApi(pendingMessage);
			pendingMessage = null;
		} else {
			addMessages([
				{
					id: makeId(),
					sender: 'agent',
					text: `Thanks ${details.name || 'there'}! I've got your details. How can I assist you further?`,
					time: 'just now'
				}
			]);
		}
	}

	function handleNewConversation() {
		if (confirm('Start a new conversation? This will clear your current chat history.')) {
			chatApi.clearSession();
			messages = [];
			error = null;
			view = 'welcome';
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	async function handleSkipDetails() {
		hasAskedDetails = true;
		view = 'chat';
		if (pendingMessage) {
			addMessages([
				{
					id: makeId(),
					sender: 'user',
					text: pendingMessage,
					time: 'just now'
				}
			]);
			await sendMessageToApi(pendingMessage);
			pendingMessage = null;
		}
	}

	const headerTitle = $derived(view === 'welcome' ? 'Spur Support' : 'Spur Support');
	const headerIcon = $derived(view === 'welcome' ? Sparkles : MessageCircle);

	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

<!-- Floating button - always visible -->
<button
	onclick={() => (isOpen = !isOpen)}
	class="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-xl shadow-blue-200 transition hover:scale-105"
	aria-label={isOpen ? 'Close support widget' : 'Open support widget'}
>
	{#if isOpen}
		<X class="h-6 w-6 animate-rotate-in" />
	{:else}
		<MessageSquare class="h-6 w-6" />
	{/if}
</button>

<!-- Widget popup -->
{#if isOpen}
	<div class="fixed bottom-24 right-6 z-20 w-full max-w-[430px] animate-pop">
		<div
			class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-100/40 ring-1 ring-slate-100"
		>
			<!-- Header -->
			<div class="flex items-center justify-between bg-[#1a73e8] px-4 py-3 text-white">
				<div class="flex items-center gap-2">
					{#if view !== 'welcome'}
						<button
							onclick={() => (view = 'welcome')}
							class="rounded-full p-2 text-white transition hover:bg-white/10"
							aria-label="Go back"
						>
							<ArrowLeft class="h-5 w-5" />
						</button>
					{/if}
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
						{#if view === 'welcome'}
							<Sparkles class="h-5 w-5" />
						{:else}
							<MessageCircle class="h-5 w-5" />
						{/if}
					</div>
					<div>
						<p class="text-sm font-semibold leading-tight">{headerTitle}</p>
						<p class="text-xs text-white/80">We're online</p>
					</div>
				</div>
				<div class="flex items-center gap-1">
					{#if view === 'chat' && messages.length > 0}
						<button
							onclick={handleNewConversation}
							class="rounded-full p-2 text-white transition hover:bg-white/10"
							aria-label="New conversation"
							title="Start new conversation"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
						</button>
					{/if}
					<button
						onclick={() => (isOpen = false)}
						class="rounded-full p-2 text-white transition hover:bg-white/10"
						aria-label="Close widget"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="bg-slate-50/60 p-6">
				{#if view === 'welcome'}
					<!-- Welcome View -->
					<div class="space-y-6">
						<div
							class="rounded-3xl bg-gradient-to-br from-[#1a73e8] via-[#1d82ff] to-[#0f5ad3] p-6 text-white shadow-lg"
						>
							<div class="flex items-start justify-between">
								<div class="space-y-2">
									<p class="text-sm uppercase tracking-wide text-white/80">Spur Support</p>
									<h2 class="text-2xl font-semibold leading-snug">
										Hey 👋, how can we help you today?
									</h2>
									<p class="text-sm text-white/80">We usually respond within 10 minutes</p>
								</div>
								<div
									class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"
								>
									<Sparkles class="h-6 w-6" />
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<div class="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
								<p class="text-sm font-semibold text-slate-800">Start a conversation</p>
								<p class="text-xs text-slate-500">We usually respond within 10 minutes</p>
								<button
									onclick={() => (view = 'chat')}
									class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#155ec2]"
								>
									<span>Chat with us</span>
									<Zap class="h-4 w-4" />
								</button>
							</div>
						</div>

						<div class="space-y-2">
							<p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Ask quick questions
							</p>
							<div class="flex flex-wrap gap-2">
								{#each quickQuestions as question (question)}
									<button
										onclick={() => handleQuickQuestion(question)}
										class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
									>
										{question}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{:else if view === 'chat'}
					<!-- Chat View -->
					<div class="flex h-[420px] flex-col">
						<div
							class="thin-scrollbar flex-1 space-y-4 overflow-y-auto pr-1"
							bind:this={messageListRef}
						>
							{#if error}
								<div class="rounded-lg bg-red-50 border border-red-200 p-3 mb-3 animate-fade-up">
									<div class="flex items-start gap-2">
										<svg class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<div class="flex-1">
											<p class="text-sm text-red-800">{error}</p>
											<button
												onclick={() => error = null}
												class="mt-1 text-xs text-red-600 hover:text-red-700 underline"
											>
												Dismiss
											</button>
										</div>
									</div>
								</div>
							{/if}

							{#each messages as message (message.id)}
								<div class={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
									<div
										class={`${
											message.sender === 'user'
												? 'bg-[#1a73e8] text-white'
												: 'bg-slate-100 text-slate-800'
										} max-w-[80%] rounded-2xl px-4 py-3 shadow-sm animate-fade-up`}
									>
										<p class="text-sm leading-relaxed">{message.text}</p>
										<p
											class={`mt-1 text-[11px] ${
												message.sender === 'user' ? 'text-white/80' : 'text-slate-500'
											}`}
										>
											{message.time}
										</p>
									</div>
								</div>
							{/each}

							{#if isLoading}
								<div class="flex justify-start animate-fade-up">
									<div class="bg-slate-100 text-slate-800 max-w-[80%] rounded-2xl px-4 py-3 shadow-sm">
										<div class="flex items-center gap-2">
											<div class="flex gap-1">
												<div class="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 0ms"></div>
												<div class="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 150ms"></div>
												<div class="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style="animation-delay: 300ms"></div>
											</div>
											<p class="text-xs text-slate-500">Agent is typing...</p>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<div class="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
							<div class="flex items-center gap-2">
								<textarea
									bind:value={input}
									onkeydown={handleKeyDown}
									placeholder="Type your message..."
									rows="1"
									class="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none"
								></textarea>
								<button
									onclick={handleSend}
									class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a73e8] text-white shadow-md transition hover:bg-[#155ec2] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50"
									disabled={!input.trim() || isLoading}
									aria-label="Send message"
								>
									{#if isLoading}
										<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									{:else}
										<Send class="h-5 w-5" />
									{/if}
								</button>
							</div>
						</div>
					</div>
				{:else if view === 'details'}
					<!-- Details Form -->
					<form class="space-y-4" onsubmit={handleDetailSubmit}>
						<div class="space-y-3">
							<p class="text-sm text-slate-600">
								Please share your details so we can assist you better:
							</p>
							{#if pendingMessage}
								<div class="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
									<p class="text-xs uppercase tracking-wide text-slate-500">Pending message</p>
									<p class="mt-1">"{pendingMessage}"</p>
								</div>
							{/if}
							<input
								type="text"
								placeholder="Your Name"
								bind:value={details.name}
								required
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
							/>
							<input
								type="email"
								placeholder="Your Email"
								bind:value={details.email}
								required
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
							/>
							<input
								type="tel"
								placeholder="Your Phone Number"
								bind:value={details.phone}
								required
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100"
							/>
						</div>

						<div class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
							We'll use these details to contact you if we get disconnected.
						</div>

						<div class="flex items-center justify-end gap-3 pt-2">
							<button
								type="button"
								onclick={handleSkipDetails}
								class="text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-900"
							>
								Skip for now
							</button>
							<button
								type="submit"
								class="inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#155ec2]"
							>
								<span>Continue</span>
								<Send class="h-4 w-4" />
							</button>
						</div>
					</form>
				{/if}
			</div>

			<!-- Footer -->
			<div
				class="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"
			>
				<div class="flex items-center gap-2 text-slate-600">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[#1a73e8]"
					>
						<Wand2 class="h-4 w-4" />
					</div>
					<span>Powered by spurnow.com</span>
				</div>
				<div class="flex items-center gap-3 text-slate-400">
					<div class="flex items-center gap-1">
						<Clock class="h-4 w-4" />
						<span>10 min avg. reply</span>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.animate-pop) {
		animation: pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	:global(.animate-fade-up) {
		animation: fade-up 0.3s ease-out;
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-rotate-in) {
		animation: rotate-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes rotate-in {
		from {
			opacity: 0;
			transform: rotate(-180deg) scale(0.8);
		}
		to {
			opacity: 1;
			transform: rotate(0deg) scale(1);
		}
	}

	:global(.thin-scrollbar) {
		scrollbar-width: thin;
		scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
	}

	:global(.thin-scrollbar::-webkit-scrollbar) {
		width: 0.5rem;
	}

	:global(.thin-scrollbar::-webkit-scrollbar-track) {
		background: transparent;
	}

	:global(.thin-scrollbar::-webkit-scrollbar-thumb) {
		background: rgba(100, 116, 139, 0.3);
		border-radius: 0.25rem;
	}

	:global(.thin-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: rgba(100, 116, 139, 0.5);
	}
</style>
