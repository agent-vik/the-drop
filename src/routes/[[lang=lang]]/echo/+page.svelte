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
		board = [...board, value];
	}
</script>

<div class="echo-room">
	<!-- Observer's Log Station (Left Panel) -->
	<aside class="logbook">
		<header class="logbook-head">
			<div class="tag-row">
				<span class="num mono">04.1</span>
				<span class="sep">·</span>
				<span class="title-tag">{text.title}</span>
				<span class="sep">·</span>
				<span class="meta mono">{data.locale === 'zh' ? '54米 · 现实观测' : '54m · Real Drop'}</span>
			</div>
			<p class="summary serif">{text.line}</p>
			<p class="guide-note">{data.copy.stopwatch}</p>
		</header>

		<!-- Measurement Ledger Slots -->
		<div class="ledger">
			<div class="ledger-header mono">
				<span>{data.locale === 'zh' ? '观测记录簿' : 'Observer’s Log'}</span>
				<span class="count">{board.length} / 3</span>
			</div>
			<div class="slots">
				{#each [0, 1, 2] as idx}
					{@const entry = board[idx]}
					<div class="slot" class:filled={entry !== undefined}>
						<span class="slot-idx mono">#{idx + 1}</span>
						<span class="slot-val mono">
							{#if entry === undefined}
								<span class="pending">—</span>
							{:else if entry === null}
								<span class="missed">{data.copy.unrecorded}</span>
							{:else}
								<span class="measured">{entry.toFixed(1)}s</span>
							{/if}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Historical Verdict & Forward Portal once 3 trials are recorded -->
		{#if board.length >= 3}
			<div class="revelation-card">
				<p class="dilemma-note serif">
					{data.locale === 'zh'
						? '人眼的反应延迟约为 0.2–0.3 秒。在极速坠落中，肉体生理极限让垂直自由落体无法被精确测量。'
						: 'Human visual reaction delay is ~0.2–0.3s. In violent free fall, physiology makes vertical timing impossible.'}
				</p>
				<p class="solution-note serif">{data.copy.laidFlat}</p>
				<a class="next-link" href={roomPath(data.locale, 'incline')}>
					<span>{data.locale === 'zh' ? '前往 1604 斜面工坊 →' : 'To the 1604 Workshop →'}</span>
				</a>
			</div>
		{/if}
	</aside>

	<!-- Tower Drop Component with Stopwatch (Positioned on the Right) -->
	<div class="tower-stage">
		<TowerDrop
			balls={1}
			autoReset
			showStopwatch
			releaseHint={data.copy.release}
			stopHint={hint ? data.copy.stopwatch : ''}
			onTimed={record}
		/>
	</div>
</div>

<style>
	.echo-room {
		position: absolute;
		inset: 0;
		display: flex;
		overflow: hidden;
		user-select: none;
		padding: 5rem var(--system-pad, 2.5rem) 1.5rem;
		box-sizing: border-box;
	}

	.logbook {
		position: relative;
		z-index: 10;
		width: min(88vw, 24rem);
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		pointer-events: auto;
	}

	.logbook-head {
		animation: head-fade 0.8s ease-out;
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
		font-size: clamp(1.2rem, 2vw, 1.4rem);
		color: var(--text);
		line-height: 1.35;
	}

	.guide-note {
		margin: 0.4rem 0 0;
		font-size: 0.85rem;
		color: var(--text-dim);
		line-height: 1.4;
	}

	.ledger {
		background: rgba(18, 14, 10, 0.75);
		border: 1px solid rgba(212, 165, 116, 0.22);
		border-radius: 8px;
		padding: 0.85rem 1rem;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.ledger-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--accent);
		letter-spacing: 0.06em;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(212, 165, 116, 0.15);
		margin-bottom: 0.6rem;
	}

	.count {
		opacity: 0.8;
	}

	.slots {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.slot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.35rem 0.5rem;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.25);
		border: 1px dashed rgba(212, 165, 116, 0.15);
		font-size: 0.88rem;
		transition: all 0.3s ease;
	}

	.slot.filled {
		border-style: solid;
		border-color: rgba(212, 165, 116, 0.35);
		background: rgba(212, 165, 116, 0.06);
	}

	.slot-idx {
		color: var(--text-dim);
		font-size: 0.75rem;
	}

	.pending {
		color: rgba(212, 165, 116, 0.3);
	}

	.missed {
		color: #e06c75;
		font-size: 0.78rem;
	}

	.measured {
		color: var(--accent);
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.revelation-card {
		background: rgba(18, 14, 10, 0.88);
		border: 1px solid var(--accent);
		border-radius: 8px;
		padding: 1rem;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 165, 116, 0.2);
		animation: card-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	@keyframes card-appear {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.dilemma-note {
		margin: 0;
		font-size: 0.88rem;
		color: var(--text-dim);
		line-height: 1.45;
	}

	.solution-note {
		margin: 0;
		font-size: 0.95rem;
		color: var(--text);
		font-weight: 500;
	}

	.next-link {
		color: var(--accent);
		text-decoration: none;
		font-size: 0.88rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		transition: transform 0.2s ease;
	}

	.next-link:hover {
		transform: translateX(4px);
	}

	.tower-stage {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.echo-room {
			padding: 4rem 1.2rem 1.2rem;
		}
		.logbook {
			width: 100%;
			max-width: 22rem;
		}
	}
</style>
