<script lang="ts">
	import VacuumFilm from '$lib/components/VacuumFilm.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
	const text = $derived(data.copy.rooms.vacuum);
</script>

<p class="num mono">05</p>
<h1>{text.title}</h1>
<p class="line serif">{text.line}</p>
<VacuumFilm onEnded={() => (open = true)} />
{#if open}
	<a class="go" href={roomPath(data.locale, 'exit')}>{data.copy.continue}</a>
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
		animation: hush 2.4s ease forwards;
	}

	@keyframes hush {
		0%,
		40% {
			opacity: 1;
		}
		100% {
			opacity: 0.22;
		}
	}
	.go {
		display: inline-block;
		margin-top: 1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.65rem 1.1rem;
		color: var(--accent);
	}
</style>
