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

<div class="incline-room">
	<!-- Atmospheric Workshop Curatorial Head (No PPT template) -->
	<header class="workshop-head">
		<div class="tag-row">
			<span class="num mono">04.2</span>
			<span class="sep">·</span>
			<span class="title-tag">{text.title}</span>
			<span class="sep">·</span>
			<span class="meta mono">{data.locale === 'zh' ? '帕多瓦 · 1604' : 'Padova · 1604'}</span>
		</div>
		<p class="summary serif">{text.line}</p>
	</header>

	<!-- The Full Workshop Stage -->
	<div class="workshop-viewport">
		<InclineWorkshop copy={data.copy} onReady={() => (open = true)} />
	</div>

	<!-- Forward Portal to Moon Drop -->
	{#if open}
		<div class="moon-bar">
			<div class="law-tag serif">{data.copy.curveLaw}</div>
			<button class="moon-btn" onclick={toMoon}>
				<span>{data.copy.toMoon} →</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.incline-room {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
		padding: 4.6rem var(--system-pad, 2rem) 1.2rem;
		box-sizing: border-box;
	}

	.workshop-head {
		z-index: 10;
		max-width: min(85vw, 42rem);
		animation: head-fade 0.8s ease-out;
		flex: 0 0 auto;
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
		display: flex;
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

	.meta {
		opacity: 0.7;
	}

	.summary {
		margin: 0.35rem 0 0;
		font-size: clamp(1rem, 1.8vw, 1.25rem);
		color: var(--text-dim);
		line-height: 1.35;
	}

	.workshop-viewport {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		position: relative;
		display: flex;
	}

	.moon-bar {
		position: absolute;
		bottom: 1.2rem;
		right: var(--system-pad, 2rem);
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 1.2rem;
		padding: 0.55rem 1.1rem;
		border-radius: 999px;
		background: rgba(18, 14, 10, 0.92);
		border: 1px solid var(--accent);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 165, 116, 0.25);
		animation: emerge 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes emerge {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.law-tag {
		font-size: 0.92rem;
		color: var(--text);
	}

	.moon-btn {
		background: none;
		border: none;
		color: var(--accent);
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		padding: 0;
		transition: transform 0.2s ease;
	}

	.moon-btn:hover {
		transform: translateX(4px);
	}

	@media (max-width: 640px) {
		.incline-room {
			padding-top: 3.8rem;
		}
		.moon-bar {
			bottom: 0.8rem;
			right: 50%;
			transform: translateX(50%);
			width: calc(100vw - 2rem);
			justify-content: space-between;
		}
	}
</style>
