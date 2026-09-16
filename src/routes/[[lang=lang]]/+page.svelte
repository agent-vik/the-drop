<script lang="ts">
	import TowerDrop from '$lib/components/TowerDrop.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
	const text = $derived(data.copy.rooms.legend);
</script>

<p class="num mono">01</p>
<h1>{text.title}</h1>
<p class="line serif">{text.line}</p>
<TowerDrop
	balls={2}
	releaseHint={data.copy.release}
	retryLabel={data.copy.retry}
	onFaded={() => (open = true)}
/>
{#if open}
	<a class="go" href={roomPath(data.locale, 'cracks')}>{data.copy.continue}</a>
{/if}

<style>
	.num {
		margin: 0;
		color: var(--accent);
		letter-spacing: 0.12em;
		font-size: 0.8rem;
	}
	h1 {
		margin: 0.3rem 0 0;
		font-size: clamp(2.2rem, 6vw, 3.4rem);
	}
	.line {
		color: var(--text-dim);
		font-size: 1.25rem;
	}
	.go {
		margin-top: 1.5rem;
		display: inline-block;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.65rem 1.1rem;
		color: var(--accent);
	}
</style>
