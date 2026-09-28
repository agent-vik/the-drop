<script lang="ts">
	import { onMount } from 'svelte';
	import { enterVacuum, film, filmFailed, leaveVacuum } from '$lib/film.svelte';

	let { onEnded }: { onEnded?: () => void } = $props();

	onMount(() => {
		enterVacuum();
		const wait = window.setTimeout(() => {
			if (film.ended) return;
			const node = film.node;
			if (!node || node.readyState < 2) filmFailed();
		}, 4000);
		return () => {
			clearTimeout(wait);
			leaveVacuum();
		};
	});

	$effect(() => {
		if (film.ended) onEnded?.();
	});
</script>

<div class="moon" class:done={film.ended}></div>

<style>
	.moon {
		width: 100%;
		min-height: 0;
		flex: 1;
	}

	.moon.done {
		opacity: 0;
		flex: 0 0 0;
		height: 0;
		overflow: hidden;
	}
</style>
