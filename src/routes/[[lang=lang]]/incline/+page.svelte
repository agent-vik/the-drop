<script lang="ts">
	import { goto } from '$app/navigation';
	import InclineWorkshop from '$lib/components/InclineWorkshop.svelte';
	import { unlockAndPlay } from '$lib/film.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
	const text = $derived(data.copy.rooms.incline);

	function toMoon() {
		unlockAndPlay();
		void goto(roomPath(data.locale, 'vacuum'));
	}
</script>

<p class="num mono">04.2</p>
<h1>{text.title}</h1>
<p class="line serif">{text.line}</p>
<InclineWorkshop copy={data.copy} onReady={() => (open = true)} />
{#if open}
	<button class="go" onclick={toMoon}>{data.copy.toMoon}</button>
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
	.go {
		display: inline-block;
		margin-top: 1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.65rem 1.1rem;
		color: var(--accent);
	}
</style>
