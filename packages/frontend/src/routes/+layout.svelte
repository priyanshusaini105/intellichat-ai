<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Spur Support Widget</title>
	<meta name="description" content="Interactive demo of the Spur support chatbot widget" />
</svelte:head>

{@render children()}
