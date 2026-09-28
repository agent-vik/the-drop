<script lang="ts">
	import ReasoningDrop from '$lib/components/ReasoningDrop.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const text = $derived(data.copy.rooms.reasoning);
</script>

<div class="reasoning-room">
	<!-- Minimal Curatorial Header (No PPT Template) -->
	<header class="thought-head">
		<div class="tag-row">
			<span class="num mono">03</span>
			<span class="sep">·</span>
			<span class="title-tag">{text.title}</span>
			<span class="sep">·</span>
			<span class="genre mono">{data.locale === 'zh' ? '思想实验' : 'Thought Experiment'}</span>
		</div>
		<p class="summary serif">{text.line}</p>
	</header>

	<!-- Main Arena -->
	<div class="arena-viewport">
		<ReasoningDrop
			copy={data.copy}
			nextUrl={roomPath(data.locale, 'echo')}
		/>
	</div>
</div>

<style>
	.reasoning-room {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
		padding: 4.8rem var(--system-pad, 2rem) 1.5rem;
		box-sizing: border-box;
	}

	.thought-head {
		margin-bottom: 0.8rem;
		max-width: min(85vw, 42rem);
		align-self: center;
		text-align: center;
		animation: head-fade 0.8s ease-out;
		z-index: 5;
	}

	@keyframes head-fade {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.tag-row {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		color: var(--accent);
		opacity: 0.9;
	}

	.sep {
		opacity: 0.4;
	}

	.genre {
		opacity: 0.7;
	}

	.summary {
		margin: 0.35rem 0 0;
		font-size: clamp(0.95rem, 1.8vw, 1.15rem);
		color: var(--text-dim);
		line-height: 1.4;
	}

	.arena-viewport {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		max-width: 52rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		position: relative;
	}

	@media (max-width: 640px) {
		.reasoning-room {
			padding-top: 3.8rem;
		}
	}
</style>
