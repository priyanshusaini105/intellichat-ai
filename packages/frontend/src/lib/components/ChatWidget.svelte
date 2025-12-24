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
	import type { ConversationSummary } from '$lib/services/chatApi';

	type ChatView = 'welcome' | 'chat' | 'details' | 'history' | 'all-history';

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
	let conversationMetadata = $state<{
		sessionId: string;
		messageCount: number;
		createdAt: string;
		updatedAt: string;
	} | null>(null);
	let allConversations = $state<ConversationSummary[]>([]);
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
		// Load all conversations list
		allConversations = chatApi.getAllConversations();

		try {
			const history = await chatApi.getHistory();
			if (history?.data?.messages && history.data.messages.length > 0) {
				// Save metadata
				conversationMetadata = {
					sessionId: history.data.sessionId,
					messageCount: history.data.messageCount,
					createdAt: history.data.createdAt,
					updatedAt: history.data.updatedAt
				};

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

	function formatFullTime(timestamp: string): string {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	function formatDuration(startTime: string, endTime: string): string {
		const start = new Date(startTime);
		const end = new Date(endTime);
		const diffMs = end.getTime() - start.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return '< 1m';
		if (diffMins < 60) return `${diffMins}m`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
		return `${Math.floor(diffMins / 1440)}d`;
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

			// Update metadata
			if (conversationMetadata) {
				conversationMetadata.messageCount += 2; // User + AI message
				conversationMetadata.updatedAt = new Date().toISOString();
			} else {
				// First message, initialize metadata
				conversationMetadata = {
					sessionId: response.sessionId,
					messageCount: 2,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				};
			}

			// Save conversation summary manually
			if (typeof window !== 'undefined' && response.sessionId) {
				const conversations = chatApi.getAllConversations();
				const existingIndex = conversations.findIndex((c) => c.sessionId === response.sessionId);

				const summary = {
					sessionId: response.sessionId,
					messageCount: conversationMetadata.messageCount,
					lastMessage: userMessage.slice(0, 100),
					createdAt: conversationMetadata.createdAt,
					updatedAt: conversationMetadata.updatedAt
				};

				if (existingIndex >= 0) {
					conversations[existingIndex] = summary;
				} else {
					conversations.unshift(summary);
				}

				localStorage.setItem('chatConversations', JSON.stringify(conversations.slice(0, 50)));
			}

			// Refresh conversations list
			allConversations = chatApi.getAllConversations();

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
			conversationMetadata = null;
			error = null;
			view = 'welcome';
			// Refresh conversations list
			allConversations = chatApi.getAllConversations();
		}
	}

	async function handleLoadConversation(sessionId: string) {
		try {
			isLoading = true;
			const history = await chatApi.loadConversation(sessionId);

			if (history?.data?.messages) {
				conversationMetadata = {
					sessionId: history.data.sessionId,
					messageCount: history.data.messageCount,
					createdAt: history.data.createdAt,
					updatedAt: history.data.updatedAt
				};

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
			error = 'Failed to load conversation';
			console.error('Error loading conversation:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleDeleteConversation(sessionId: string) {
		if (confirm('Delete this conversation? This action cannot be undone.')) {
			chatApi.deleteConversation(sessionId);
			allConversations = chatApi.getAllConversations();

			// If we deleted the current conversation, reset
			if (conversationMetadata?.sessionId === sessionId) {
				messages = [];
				conversationMetadata = null;
				view = 'welcome';
			}
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

	const headerTitle = $derived(
		view === 'welcome'
			? 'Spur Support'
			: view === 'history'
				? 'Conversation Info'
				: view === 'all-history'
					? 'All Conversations'
					: 'Spur Support'
	);

	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

<!-- Floating button - always visible -->
<button
	onclick={() => (isOpen = !isOpen)}
	class="active-press hover-lift fixed right-6 bottom-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a73e8] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
	class:animate-pulse-shadow={!isOpen}
	aria-label={isOpen ? 'Close support widget' : 'Open support widget'}
>
	{#if isOpen}
		<X class="animate-rotate-in h-6 w-6" />
	{:else}
		<MessageSquare class="h-6 w-6 transition-transform duration-300" />
	{/if}
</button>

<!-- Widget popup -->
{#if isOpen}
	<div class="animate-widget-open fixed right-6 bottom-24 z-20 w-full max-w-[430px]">
		<div
			class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 shadow-blue-100/40 ring-slate-100"
		>
			<!-- Header -->
			<div class="flex items-center justify-between bg-[#1a73e8] px-4 py-3 text-white">
				<div class="flex items-center gap-2">
					{#if view !== 'welcome'}
						<button
							on:click={() =>
								(view =
									view === 'history' ? 'chat' : view === 'all-history' ? 'welcome' : 'welcome')}
							class="active-press rounded-full p-2 text-white transition-all duration-200 hover:bg-white/20 hover:scale-110"
							aria-label="Go back"
						>
							<ArrowLeft class="h-5 w-5" />
						</button>
					{/if}
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-all duration-300 hover:bg-white/30">
						{#if view === 'welcome'}
							<Sparkles class="animate-fade-scale-in h-5 w-5" />
						{:else if view === 'history' || view === 'all-history'}
							<Clock class="animate-fade-scale-in h-5 w-5" />
						{:else}
							<MessageCircle class="animate-fade-scale-in h-5 w-5" />
						{/if}
					</div>
					<div>
						<p class="text-sm leading-tight font-semibold">{headerTitle}</p>
						<p class="text-xs text-white/80">We're online</p>
					</div>
				</div>
				<div class="flex items-center gap-1">
					{#if view === 'chat' && messages.length > 0}
						<button
							on:click={() => (view = 'history')}
							class="active-press rounded-full p-2 text-white transition-all duration-200 hover:bg-white/20 hover:scale-110"
							aria-label="View history"
							title="View conversation info"
						>
							<Clock class="h-5 w-5" />
						</button>
						<button
							on:click={handleNewConversation}
							class="active-press rounded-full p-2 text-white transition-all duration-200 hover:bg-white/20 hover:scale-110"
							aria-label="New conversation"
							title="Start new conversation"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
						</button>
					{/if}
					<button
						on:click={() => (isOpen = false)}
						class="active-press rounded-full p-2 text-white transition-all duration-200 hover:bg-white/20 hover:scale-110"
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
					<div class="animate-fade-scale-in space-y-6">
						<div
							class="hover-lift rounded-3xl bg-gradient-to-br from-[#1a73e8] via-[#1d82ff] to-[#0f5ad3] p-6 text-white shadow-lg transition-all duration-300"
						>
							<div class="flex items-start justify-between">
								<div class="space-y-2">
									<p class="text-sm tracking-wide text-white/80 uppercase">Spur Support</p>
									<h2 class="text-2xl leading-snug font-semibold">
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
							<div class="hover-lift animate-fade-up-stagger rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md" style="animation-delay: 100ms">
								<p class="text-sm font-semibold text-slate-800">Start a conversation</p>
								<p class="text-xs text-slate-500">We usually respond within 10 minutes</p>
								<button
									on:click={() => (view = 'chat')}
									class="active-press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:bg-[#155ec2] hover:shadow-xl hover:scale-[1.02]"
								>
									<span>Chat with us</span>
									<Zap class="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
								</button>
							</div>

							<!-- Always show History button -->
							<div class="hover-lift animate-fade-up-stagger rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md" style="animation-delay: 200ms">
								<div class="mb-3 flex items-center justify-between">
									<div>
										<p class="text-sm font-semibold text-slate-800">Conversation History</p>
										<p class="text-xs text-slate-500">
											{#if allConversations.length > 0}
												{allConversations.length} saved {allConversations.length === 1
													? 'chat'
													: 'chats'}
											{:else}
												No saved chats yet
											{/if}
										</p>
									</div>
									<Clock class="h-5 w-5 text-slate-400" />
								</div>
								<button
									on:click={() => (view = 'all-history')}
									class="active-press inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-400 hover:scale-[1.02]"
								>
									<span>{allConversations.length > 0 ? 'View All History' : 'View History'}</span>
									<ArrowLeft class="h-4 w-4 rotate-180 transition-transform duration-300 group-hover:translate-x-1" />
								</button>
							</div>
						</div>

						<div class="space-y-2">
							<p class="animate-fade-up-stagger text-xs font-semibold tracking-wide text-slate-500 uppercase" style="animation-delay: 300ms">
								Ask quick questions
							</p>
							<div class="flex flex-wrap gap-2">
								{#each quickQuestions as question, i (question)}
									<button
										on:click={() => handleQuickQuestion(question)}
										class="active-press animate-fade-up-stagger rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm hover:scale-105"
										style="animation-delay: {350 + i * 50}ms"
									>
										{question}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{:else if view === 'chat'}
					<!-- Chat View -->
					<div class="animate-fade-scale-in flex h-[420px] flex-col">
						<div
							class="thin-scrollbar flex-1 space-y-4 overflow-y-auto pr-1"
							bind:this={messageListRef}
						>
							{#if error}
								<div class="animate-message-pop mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
									<div class="flex items-start gap-2">
										<svg
											class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<div class="flex-1">
											<p class="text-sm text-red-800">{error}</p>
											<button
												on:click={() => (error = null)}
												class="active-press mt-1 text-xs text-red-600 underline transition-all duration-200 hover:text-red-700"
											>
												Dismiss
											</button>
										</div>
									</div>
								</div>
							{/if}

							{#each messages as message, i (message.id)}
								<div class={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
									<div
										class={`${
											message.sender === 'user'
												? 'bg-[#1a73e8] text-white'
												: 'bg-slate-100 text-slate-800'
										} animate-message-pop max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md`}
										style="animation-delay: {i * 50}ms"
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
								<div class="animate-fade-up flex justify-start">
									<div
										class="max-w-[80%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-800 shadow-sm"
									>
										<div class="flex items-center gap-2">
											<div class="flex gap-1">
												<div
													class="animate-bounce-dot-1 h-2 w-2 rounded-full bg-slate-400"
												></div>
												<div
													class="animate-bounce-dot-2 h-2 w-2 rounded-full bg-slate-400"
												></div>
												<div
													class="animate-bounce-dot-3 h-2 w-2 rounded-full bg-slate-400"
												></div>
											</div>
											<p class="text-xs text-slate-500">Agent is typing...</p>
										</div>
									</div>
								</div>
							{/if}
						</div>

						<div class="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner transition-all duration-300 focus-within:border-blue-300 focus-within:shadow-md">
							<div class="flex items-center gap-2">
								<textarea
									bind:value={input}
									on:keydown={handleKeyDown}
									on:focus={(e) => e.currentTarget.parentElement?.parentElement?.classList.add('animate-input-focus')}
									placeholder="Type your message..."
									rows="1"
									class="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 transition-all duration-200"
								></textarea>
								<button
									on:click={handleSend}
									class="active-press inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a73e8] text-white shadow-md transition-all duration-300 hover:bg-[#155ec2] hover:shadow-lg hover:scale-110 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-50 disabled:hover:scale-100"
									disabled={!input.trim() || isLoading}
									aria-label="Send message"
								>
									{#if isLoading}
										<svg
											class="animate-spin-smooth h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
									{:else}
										<Send class="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
									{/if}
								</button>
							</div>
						</div>
					</div>
				{:else if view === 'details'}
					<!-- Details Form -->
					<form class="animate-fade-scale-in space-y-4" on:submit={handleDetailSubmit}>
						<div class="space-y-3">
							<p class="text-sm text-slate-600">
								Please share your details so we can assist you better:
							</p>
							{#if pendingMessage}
								<div class="animate-message-pop rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
									<p class="text-xs tracking-wide text-slate-500 uppercase">Pending message</p>
									<p class="mt-1">"{pendingMessage}"</p>
								</div>
							{/if}
							<input
								type="text"
								placeholder="Your Name"
								bind:value={details.name}
								required
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100 focus:scale-[1.01]"
							/>
							<input
								type="email"
								placeholder="Your Email"
								bind:value={details.email}
								required
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100 focus:scale-[1.01]"
							/>
							<input
								type="tel"
								placeholder="Your Phone Number"
								bind:value={details.phone}
								required
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 focus:border-[#1a73e8] focus:ring-2 focus:ring-blue-100 focus:scale-[1.01]"
							/>
						</div>

						<div
							class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"
						>
							We'll use these details to contact you if we get disconnected.
						</div>

						<div class="flex items-center justify-end gap-3 pt-2">
							<button
								type="button"
								on:click={handleSkipDetails}
								class="active-press text-sm font-semibold text-slate-600 underline underline-offset-4 transition-all duration-200 hover:text-slate-900 hover:scale-105"
							>
								Skip for now
							</button>
							<button
								type="submit"
								class="active-press inline-flex items-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:bg-[#155ec2] hover:shadow-xl hover:scale-105"
							>
								<span>Continue</span>
								<Send class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
							</button>
						</div>
					</form>
				{:else if view === 'history'}
					<!-- History View -->
					<div class="animate-fade-scale-in space-y-4">
						{#if conversationMetadata}
							<!-- Conversation Info Card -->
							<div
								class="hover-lift animate-fade-up-stagger rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 transition-all duration-300 hover:shadow-md"
							>
								<div class="flex items-start gap-3">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm"
									>
										<MessageSquare class="h-6 w-6 text-[#1a73e8]" />
									</div>
									<div class="flex-1">
										<h3 class="text-sm font-semibold text-slate-900">Current Conversation</h3>
										<p class="mt-1 text-xs text-slate-600">
											Session ID: {conversationMetadata.sessionId.slice(0, 8)}...
										</p>
									</div>
								</div>
							</div>

							<!-- Stats Grid -->
							<div class="grid grid-cols-2 gap-3">
								<div class="hover-lift animate-fade-up-stagger rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-md" style="animation-delay: 100ms">
									<div class="flex items-center gap-2">
										<div class="rounded-lg bg-blue-100 p-2 transition-transform duration-300 group-hover:scale-110">
											<MessageCircle class="h-4 w-4 text-[#1a73e8]" />
										</div>
										<div>
											<p class="text-xs text-slate-500">Messages</p>
											<p class="text-lg font-bold text-slate-900">
												{conversationMetadata.messageCount}
											</p>
										</div>
									</div>
								</div>

								<div class="hover-lift animate-fade-up-stagger rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:shadow-md" style="animation-delay: 150ms">
									<div class="flex items-center gap-2">
										<div class="rounded-lg bg-green-100 p-2 transition-transform duration-300 group-hover:scale-110">
											<Clock class="h-4 w-4 text-green-600" />
										</div>
										<div>
											<p class="text-xs text-slate-500">Active</p>
											<p class="text-lg font-bold text-slate-900">
												{formatDuration(
													conversationMetadata.createdAt,
													conversationMetadata.updatedAt
												)}
											</p>
										</div>
									</div>
								</div>
							</div>

							<!-- Timeline -->
							<div class="rounded-xl border border-slate-200 bg-white p-4">
								<h4 class="mb-3 text-sm font-semibold text-slate-900">Timeline</h4>
								<div class="space-y-3">
									<div class="flex items-start gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<svg
												class="h-4 w-4 text-green-600"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 4v16m8-8H4"
												/>
											</svg>
										</div>
										<div class="flex-1">
											<p class="text-xs font-medium text-slate-700">Conversation Started</p>
											<p class="text-xs text-slate-500">
												{formatFullTime(conversationMetadata.createdAt)}
											</p>
										</div>
									</div>

									<div class="flex items-start gap-3">
										<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
											<Clock class="h-4 w-4 text-[#1a73e8]" />
										</div>
										<div class="flex-1">
											<p class="text-xs font-medium text-slate-700">Last Message</p>
											<p class="text-xs text-slate-500">
												{formatFullTime(conversationMetadata.updatedAt)}
											</p>
										</div>
									</div>
								</div>
							</div>

							<!-- Actions -->
							<div class="animate-fade-up-stagger flex gap-2" style="animation-delay: 300ms">
								<button
									on:click={() => (view = 'chat')}
									class="active-press flex-1 rounded-xl bg-[#1a73e8] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:bg-[#155ec2] hover:shadow-xl hover:scale-105"
								>
									Continue Chat
								</button>
								<button
									on:click={handleNewConversation}
									class="active-press rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:scale-105"
								>
									New
								</button>
							</div>
						{:else}
							<!-- No History -->
							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
								<div
									class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
								>
									<Clock class="h-8 w-8 text-slate-400" />
								</div>
								<h3 class="mb-1 text-sm font-semibold text-slate-900">No History Yet</h3>
								<p class="mb-4 text-xs text-slate-500">
									Start a conversation to see your chat history
								</p>
								<button
									on:click={() => (view = 'welcome')}
									class="rounded-xl bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#155ec2]"
								>
									Start Chatting
								</button>
							</div>
						{/if}
					</div>
				{:else if view === 'all-history'}
					<!-- All Conversations History View -->
					<div class="animate-fade-scale-in space-y-4">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-slate-900">All Conversations</h3>
								<p class="text-xs text-slate-500">{allConversations.length} total chats</p>
							</div>
						</div>

						{#if allConversations.length > 0}
							<div class="thin-scrollbar max-h-[420px] space-y-2 overflow-y-auto">
								{#each allConversations as conversation, i (conversation.sessionId)}
									<div
										class="hover-lift animate-fade-up-stagger rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:border-blue-200 hover:shadow-md"
										style="animation-delay: {i * 50}ms"
									>
										<div class="flex items-start justify-between gap-3">
											<button
												on:click={() => handleLoadConversation(conversation.sessionId)}
												class="flex-1 text-left transition-all duration-200 hover:scale-[1.01]"
											>
												<div class="mb-1 flex items-center gap-2">
													<MessageSquare class="h-4 w-4 text-[#1a73e8]" />
													<p class="text-xs text-slate-500">
														{formatFullTime(conversation.createdAt)}
													</p>
												</div>
												<p class="mb-2 line-clamp-2 text-sm text-slate-800">
													{conversation.lastMessage || 'New conversation'}
												</p>
												<div class="flex items-center gap-3 text-xs text-slate-500">
													<span class="flex items-center gap-1">
														<MessageCircle class="h-3 w-3" />
														{conversation.messageCount} messages
													</span>
													<span class="flex items-center gap-1">
														<Clock class="h-3 w-3" />
														{formatTime(conversation.updatedAt)}
													</span>
												</div>
											</button>
											<button
												on:click={() => handleDeleteConversation(conversation.sessionId)}
												class="active-press rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:scale-110"
												aria-label="Delete conversation"
											>
												<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
								<div
									class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100"
								>
									<Clock class="h-8 w-8 text-slate-400" />
								</div>
								<h3 class="mb-1 text-sm font-semibold text-slate-900">No Conversations Yet</h3>
								<p class="mb-4 text-xs text-slate-500">
									Start chatting to build your conversation history
								</p>
								<button
									on:click={() => (view = 'welcome')}
									class="rounded-xl bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#155ec2]"
								>
									Start Chatting
								</button>
							</div>
						{/if}
					</div>
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
	/* Component-specific styles - global animations are in app.css */
	
	/* Enhanced scrollbar for message list */
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
		transition: background 0.2s ease;
	}

	:global(.thin-scrollbar::-webkit-scrollbar-thumb:hover) {
		background: rgba(100, 116, 139, 0.5);
	}
	
	/* Auto-growing textarea */
	textarea {
		field-sizing: content;
		max-height: 120px;
	}
	
	/* Smooth transitions for all interactive elements */
	button {
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>
