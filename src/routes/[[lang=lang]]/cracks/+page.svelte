<script lang="ts">
	import ArchiveWalk from '$lib/components/ArchiveWalk.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
	const text = $derived(data.copy.rooms.cracks);
</script>

<p class="num mono">02</p>
<h1>{text.title}</h1>
<p class="line serif">{text.line}</p>
<ArchiveWalk copy={data.copy} onOpened={() => (open = true)} />
{#if open}
	<p class="line serif">{data.copy.heChose}</p>
	<a class="go" href={roomPath(data.locale, 'reasoning')}>{data.copy.continue}</a>
{/if}

<style>
	.num {
		margin: 0;
		color: var(--accent);
		font-size: 0.8rem;
		letter-spacing: 0.12em;
	}
	h1 {
		margin: 0.3rem 0 0;
		font-size: clamp(2.2rem, 6vw, 3.4rem);
	}
	.line {
		color: var(--text-dim);
		font-size: 1.2rem;
	}
	.go {
		margin-top: 1.2rem;
		display: inline-block;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.65rem 1.1rem;
		color: var(--accent);
	}
</style>
