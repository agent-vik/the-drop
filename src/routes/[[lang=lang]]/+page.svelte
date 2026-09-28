<script lang="ts">
	import TowerDrop, { type Phase } from '$lib/components/TowerDrop.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let phase = $state<Phase>('idle');
	let revealed = $state(false);
	const text = $derived(data.copy.rooms.legend);
</script>

<div class="legend-room" class:revealed>
	<div class="narrative-pane">
		{#if !revealed}
			<div
				class="pre-drop"
				class:active-hold={phase === 'holding'}
				class:fading={phase === 'falling' || phase === 'landed'}
			>
				<span class="location-badge mono">{data.locale === 'zh' ? '比萨 · 约 1590' : 'Pisa · c. 1590'}</span>
				<p class="action-call serif">
					{#if phase === 'holding'}
						{data.copy.release}
					{:else}
						{data.copy.holdHint}
					{/if}
				</p>
			</div>
		{:else}
			<div class="revelation-card">
				<p class="num mono">01</p>
				<h1 class="title serif">{text.title}</h1>
				<p class="summary serif">{text.line}</p>
				<div class="narrative-body serif">
					<p>
						{#if data.locale === 'zh'}
							四百年来，两颗重量悬殊的球同时落地的奇迹被反复传颂。<br />
							但那座塔上，真的发生过这一切吗？
						{:else}
							For four centuries, the simultaneous impact of unequal spheres was retold as truth.<br />
							Yet upon that leaning tower, did anyone ever see it fall?
						{/if}
					</p>
				</div>
				<div class="gateway">
					<a class="forward-link serif" href={roomPath(data.locale, 'cracks')}>
						<span>{data.copy.intoArchive}</span>
						<span class="link-arrow" aria-hidden="true">&rarr;</span>
					</a>
				</div>
			</div>
		{/if}
	</div>

	<TowerDrop
		balls={2}
		bind:phase
		releaseHint={data.copy.release}
		retryLabel={data.copy.retry}
		onFaded={() => {
			revealed = true;
		}}
	/>
</div>

<style>
	.legend-room {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		flex: 1 1 auto;
		min-height: 0;
	}

	.narrative-pane {
		position: relative;
		z-index: 3;
		width: min(44vw, 32rem);
		margin-left: max(0.5rem, calc(8vw - 2.5rem));
		pointer-events: auto;
	}

	/* Pre-drop state: Minimalist, atmospheric invitation */
	.pre-drop {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		transition: opacity 0.4s ease, transform 0.4s ease;
	}

	.location-badge {
		font-size: 0.82rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
		opacity: 0.72;
		margin-bottom: 1.1rem;
	}

	.action-call {
		font-size: clamp(1.6rem, 2.8vw, 2.4rem);
		color: var(--text);
		line-height: 1.35;
		margin: 0;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.7);
		transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.pre-drop.active-hold .action-call {
		color: var(--accent);
		transform: scale(1.04);
		text-shadow: 0 0 24px color-mix(in srgb, var(--accent) 50%, transparent);
	}

	.pre-drop.fading {
		opacity: 0;
		transform: translateY(-12px);
		pointer-events: none;
	}

	/* Post-drop state: Revelation unfolds */
	.revelation-card {
		animation: revelation-emerge 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes revelation-emerge {
		0% {
			opacity: 0;
			transform: translateY(22px);
			filter: blur(4px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
			filter: blur(0);
		}
	}

	.num {
		margin: 0 0 0.5rem 0;
		color: var(--accent);
		letter-spacing: 0.16em;
		font-size: 0.85rem;
		opacity: 0.85;
	}

	.title {
		font-size: clamp(2.4rem, 4.8vw, 3.6rem);
		font-weight: 400;
		line-height: 1.1;
		margin: 0 0 0.8rem 0;
		color: var(--text);
		letter-spacing: 0.02em;
	}

	.summary {
		font-size: clamp(1.2rem, 1.8vw, 1.45rem);
		color: var(--accent);
		margin: 0 0 1.5rem 0;
		line-height: 1.4;
	}

	.narrative-body {
		font-size: 1.05rem;
		line-height: 1.85;
		color: var(--text-dim);
		margin-bottom: 2.2rem;
		max-width: 27rem;
	}

	.narrative-body p {
		margin: 0;
	}

	.gateway {
		display: flex;
		align-items: center;
	}

	.forward-link {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--text);
		font-size: 1.18rem;
		text-decoration: none;
		padding-bottom: 0.35rem;
		border-bottom: 1.5px solid color-mix(in srgb, var(--accent) 45%, transparent);
		transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
		cursor: pointer;
	}

	.forward-link:hover {
		color: var(--accent);
		border-bottom-color: var(--accent);
		transform: translateX(6px);
	}

	.link-arrow {
		transition: transform 0.3s ease;
	}

	.forward-link:hover .link-arrow {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.legend-room {
			align-items: flex-start;
		}

		.narrative-pane {
			width: 100%;
			max-width: 22rem;
			margin-left: 0;
			padding-top: 1rem;
		}

		.title {
			font-size: 2.2rem;
		}

		.narrative-body {
			font-size: 0.95rem;
			line-height: 1.6;
			margin-bottom: 1.5rem;
		}
	}
</style>
