<script lang="ts">
	import ReasoningDrop from '$lib/components/ReasoningDrop.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
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
		<ReasoningDrop copy={data.copy} onDone={() => (open = true)} />
	</div>

	<!-- Forward Portal to Echo Room -->
	{#if open}
		<div class="forward-bar">
			<a class="next-link" href={roomPath(data.locale, 'echo')}>
				<span>{data.copy.intoEcho} →</span>
			</a>
		</div>
	{/if}
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

	.forward-bar {
		position: absolute;
		bottom: 1.2rem;
		right: var(--system-pad, 2rem);
		z-index: 25;
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

	.next-link {
		display: inline-flex;
		align-items: center;
		padding: 0.55rem 1.2rem;
		border-radius: 999px;
		background: rgba(18, 14, 10, 0.88);
		border: 1px solid var(--accent);
		color: var(--accent);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 12px rgba(212, 165, 116, 0.25);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.next-link:hover {
		transform: translateX(4px) scale(1.03);
		box-shadow: 0 6px 24px rgba(212, 165, 116, 0.4);
	}

	@media (max-width: 640px) {
		.reasoning-room {
			padding-top: 3.8rem;
		}
		.forward-bar {
			bottom: 0.8rem;
			right: 50%;
			transform: translateX(50%);
		}
	}
</style>
