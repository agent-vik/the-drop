<script lang="ts">
	import TowerDrop from '$lib/components/TowerDrop.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let board = $state<(number | null)[]>([]);
	let hint = $state(true);
	const text = $derived(data.copy.rooms.echo);
	const valid = $derived(board.filter((n): n is number => n !== null).length);

	function record(value: number | null) {
		hint = false;
		board = [...board, value].slice(-5);
	}
</script>

<p class="num mono">04.1</p>
<h1>{text.title}</h1>
<p class="line serif">{text.line}</p>
<TowerDrop
	balls={1}
	autoReset
	showStopwatch
	releaseHint={data.copy.release}
	stopHint={hint ? data.copy.stopwatch : ''}
	onTimed={record}
/>
<ol class="mono">
	{#each board as row, i (i)}
		<li>{row === null ? data.copy.unrecorded : `${row.toFixed(1)}s`}</li>
	{/each}
</ol>
{#if valid >= 3}
	<p class="line serif">{data.copy.laidFlat}</p>
	<a class="go" href={roomPath(data.locale, 'incline')}>{data.copy.continue}</a>
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
	}
	ol {
		color: var(--text-dim);
		padding-left: 1.2rem;
	}
	.go {
		display: inline-block;
		margin-top: 1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.65rem 1.1rem;
		color: var(--accent);
	}
</style>
