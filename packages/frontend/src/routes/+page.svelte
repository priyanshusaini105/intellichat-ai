<script lang="ts">
	import ChatWidget from '$lib/components/ChatWidget.svelte';
</script>

<main
	class="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100"
>
	<div class="pointer-events-none absolute inset-0 opacity-70">
		<div class="absolute -left-32 top-10 h-72 w-72 rounded-full bg-blue-200 blur-3xl"></div>
		<div class="absolute right-0 top-20 h-64 w-64 rounded-full bg-indigo-200 blur-3xl"></div>
	</div>

	<div
		class="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between"
	>
		<section class="max-w-2xl space-y-6">
			<div
				class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-[#1a73e8]"
			>
				<span class="h-2 w-2 rounded-full bg-[#1a73e8]"></span>
				Live preview
			</div>
			<h1 class="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
				Spur Support chatbot widget
			</h1>
			<p class="max-w-xl text-lg text-slate-600">
				A polished, multi-state chat widget that mirrors the Spur design: welcome handoff, contact
				details capture, and live conversation view.
			</p>
			<div class="flex flex-wrap gap-3 text-sm text-slate-600">
				<div class="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					Shows welcome screen
				</div>
				<div class="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
					<span class="h-2 w-2 rounded-full bg-orange-400"></span>
					Requires contact details
				</div>
				<div class="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
					<span class="h-2 w-2 rounded-full bg-blue-500"></span>
					Real-time chat
				</div>
			</div>
		</section>

		<ChatWidget />
	</div>
</main>

