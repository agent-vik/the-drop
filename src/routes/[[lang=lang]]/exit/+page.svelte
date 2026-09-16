<script lang="ts">
	import ExitCorridors from '$lib/components/ExitCorridors.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const text = $derived(data.copy.rooms.exit);
</script>

<p class="num mono">↗</p>
<h1>{text.title}</h1>
<ExitCorridors copy={data.copy} locale={data.locale} />

<style>
	.num {
		margin: 0;
		color: var(--accent);
		font-size: 0.8rem;
	}
	h1 {
		margin: 0.3rem 0 1rem;
		font-size: clamp(2.2rem, 6vw, 3.4rem);
	}
</style>
