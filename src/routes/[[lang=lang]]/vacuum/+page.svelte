<script lang="ts">
	import VacuumFilm from '$lib/components/VacuumFilm.svelte';
	import { film } from '$lib/film.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
	const text = $derived(data.copy.rooms.vacuum);
</script>

<div class="vacuum-room">
	<!-- Atmospheric Cinematic Header -->
	<header class="lunar-head" class:back={film.ended}>
		<div class="tag-row">
			<span class="num mono">05</span>
			<span class="sep">·</span>
			<span class="title-tag">{text.title}</span>
			<span class="sep">·</span>
			<span class="meta mono">{data.locale === 'zh' ? '月球雨海 · 1971' : 'Mare Imbrium · 1971'}</span>
		</div>
		<p class="summary serif">{text.line}</p>
	</header>

	<div class="film-container">
		<VacuumFilm onEnded={() => (open = true)} />
	</div>

	<!-- Forward Portal once film is viewed -->
	{#if open}
		<div class="exit-portal">
			<span class="quote serif">
				{data.locale === 'zh' ? '“我想，没有什么比在月球上验证伽利略先生的发现更合适的了。”' : '“Nothing could be more appropriate than to confirm the findings of Mr. Galileo.”'}
			</span>
			<a class="exit-link" href={roomPath(data.locale, 'exit')}>
				<span>{data.copy.intoCorridors} →</span>
			</a>
		</div>
	{/if}
</div>

<style>
	.vacuum-room {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
		padding: 4.8rem var(--system-pad, 2rem) 1.5rem;
		box-sizing: border-box;
	}

	.lunar-head {
		z-index: 10;
		max-width: min(85vw, 42rem);
		animation: recede 1.6s ease 0.35s forwards;
		pointer-events: none;
	}

	.lunar-head.back {
		animation: head-return 0.8s ease-out forwards;
		pointer-events: auto;
	}

	@keyframes recede {
		to {
			opacity: 0;
			transform: translateY(-8px);
		}
	}

	@keyframes head-return {
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
		font-size: clamp(1.1rem, 2.2vw, 1.4rem);
		color: var(--text);
		line-height: 1.35;
		text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
	}

	.film-container {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		display: flex;
	}

	.exit-portal {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem 1.6rem;
		max-width: min(92vw, 44rem);
		text-align: center;
		border-radius: 12px;
		background: rgba(8, 8, 12, 0.85);
		border: 1px solid rgba(212, 165, 116, 0.35);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 165, 116, 0.15);
		animation: portal-fade 1s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes portal-fade {
		from {
			opacity: 0;
			transform: translate(-50%, 16px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.quote {
		font-size: 0.9rem;
		color: var(--text-dim);
		line-height: 1.4;
		font-style: italic;
	}

	.exit-link {
		color: var(--accent);
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 1.2rem;
		border-radius: 999px;
		border: 1px solid var(--accent);
		background: rgba(212, 165, 116, 0.1);
		transition: all 0.25s ease;
	}

	.exit-link:hover {
		background: var(--accent);
		color: #0b0a08;
		transform: scale(1.04);
		box-shadow: 0 0 16px rgba(212, 165, 116, 0.4);
	}

	@media (max-width: 640px) {
		.vacuum-room {
			padding-top: 3.8rem;
		}
		.exit-portal {
			bottom: 0.8rem;
			width: calc(100vw - 2rem);
			padding: 0.8rem 1rem;
		}
	}
</style>
