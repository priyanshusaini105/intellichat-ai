<script lang="ts">
	import { onMount } from 'svelte';
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

	type ChatView = 'welcome' | 'chat' | 'details';

	interface ChatMessage {
		id: string;
		sender: 'user' | 'agent';
		text: string;
		time: string;
	}

	let isOpen = false;
	let view: ChatView = 'welcome';
	let messages: ChatMessage[] = [];
	let input = '';
	let hasAskedDetails = false;
	let pendingMessage: string | null = null;
	let details = {
		name: '',
		email: '',
		phone: ''
	};

	let messageListRef: HTMLDivElement;

	const quickQuestions = [
		'Hey, I want to subscribe to Spur.',
		'I want to book a demo call.',
		'What are your support hours?'
	];

	function makeId() {
		return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `id-${Math.random().toString(16).slice(2)}`;
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

	function simulateAgentReply(prompt: string) {
		const replyText = prompt.toLowerCase().includes('demo')
			? 'I can help with a demo. What time works best for you?'
			: prompt.toLowerCase().includes('subscribe')
				? 'Great! I can guide you through plans and pricing.'
				: 'Thanks for reaching out! Tell me a bit more and I\'ll help right away.';

		setTimeout(() => {
			addMessages([
				{
					id: makeId(),
					sender: 'agent',
					text: replyText,
					time: 'just now'
				}
			]);
		}, 600);
	}

	function handleSend() {
		if (!input.trim()) return;

		const userMessage = input.trim();
		input = '';

		// Gate the very first message behind the details form
		if (messages.length === 0 && !hasAskedDetails) {
			pendingMessage = userMessage;
			view = 'details';
			return;
		}

		addMessages([
			{
				id: makeId(),
				sender: 'user',
				text: userMessage,
				time: 'just now'
			}
		]);

		simulateAgentReply(userMessage);
	}

	function handleQuickQuestion(question: string) {
		view = 'chat';
		input = '';

		if (messages.length === 0 && !hasAskedDetails) {
			pendingMessage = question;
			view = 'details';
			return;
		}

		addMessages([
			{
				id: makeId(),
				sender: 'user',
				text: question,
				time: 'just now'
			}
		]);

		simulateAgentReply(question);
	}

	function handleDetailSubmit(event: SubmitEvent) {
		event.preventDefault();
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

			addMessages([
				{
					id: makeId(),
					sender: 'agent',
					text: `Thanks ${details.name || 'there'}! I've got your details.`,
					time: 'just now'
				}
			]);

			simulateAgentReply(pendingMessage);
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

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function handleSkipDetails() {
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
			simulateAgentReply(pendingMessage);
			pendingMessage = null;
		}
	}

	const headerTitle = view === 'welcome' ? 'Spur Support' : 'Spur Support';
	const headerIcon = view === 'welcome' ? Sparkles : MessageCircle;

	onMount(() => {
		// Ensure scrollToBottom is called when messages update
		if (messages.length > 0) {
			scrollToBottom();
		}
	});
</script>

<!-- Floating button - always visible -->
<button
	on:click={() => (isOpen = !isOpen)}
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
							on:click={() => (view = 'welcome')}
							class="rounded-full p-2 text-white transition hover:bg-white/10"
							aria-label="Go back"
						>
							<ArrowLeft class="h-5 w-5" />
						</button>
					{/if}
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
						<svelte:component this={headerIcon} class="h-5 w-5" />
					</div>
					<div>
						<p class="text-sm font-semibold leading-tight">{headerTitle}</p>
						<p class="text-xs text-white/80">We're online</p>
					</div>
				</div>
				<button
					on:click={() => (isOpen = false)}
					class="rounded-full p-2 text-white transition hover:bg-white/10"
					aria-label="Close widget"
				>
					<X class="h-5 w-5" />
				</button>
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
								<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
									<Sparkles class="h-6 w-6" />
								</div>
							</div>
						</div>

						<div class="space-y-3">
							<div class="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
								<p class="text-sm font-semibold text-slate-800">Start a conversation</p>
								<p class="text-xs text-slate-500">We usually respond within 10 minutes</p>
								<button
									on:click={() => (view = 'chat')}
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
										on:click={() => handleQuickQuestion(question)}
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
						</div>

						<div class="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-inner">
							<div class="flex items-center gap-2">
								<textarea
									bind:value={input}
									on:keydown={handleKeyDown}
									placeholder="Type your message..."
									rows="1"
									class="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none"
								/>
								<button
									on:click={handleSend}
									class="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a73e8] text-white shadow-md transition hover:bg-[#155ec2] disabled:cursor-not-allowed disabled:bg-slate-300"
									disabled={!input.trim()}
									aria-label="Send message"
								>
									<Send class="h-5 w-5" />
								</button>
							</div>
						</div>
					</div>
				{:else if view === 'details'}
					<!-- Details Form -->
					<form class="space-y-4" on:submit={handleDetailSubmit}>
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
								on:click={handleSkipDetails}
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
			<div class="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
				<div class="flex items-center gap-2 text-slate-600">
					<div class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[#1a73e8]">
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
