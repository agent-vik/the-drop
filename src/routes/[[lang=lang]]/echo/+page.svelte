<script lang="ts">
	import { goto } from '$app/navigation';
	import TowerDrop, { type Phase } from '$lib/components/TowerDrop.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface TrialEntry {
		id: number;
		time: number;
	}

	let towerRef = $state<any>(null);
	let phase = $state<Phase>('idle');
	let clock = $state(0);
	let stoppedAt = $state<number | null>(null);
	let trials = $state<TrialEntry[]>([]);
	let nextId = 1;
	let lastMissed = $state(false);

	const text = $derived(data.copy.rooms.echo);
	const TARGET_TIME = 0.56;
	const AXIS_MAX = 1.0;

	// Always 3 display slots for ledger chips
	const displaySlots = $derived.by(() => {
		if (trials.length < 3) {
			const slots: (TrialEntry | { id: number; time: null })[] = [];
			for (let i = 0; i < 3; i++) {
				if (i < trials.length) {
					slots.push(trials[i]);
				} else {
					slots.push({ id: i + 1, time: null });
				}
			}
			return slots;
		}
		return trials.slice(-3);
	});

	function handleAction() {
		if (phase === 'idle') {
			lastMissed = false;
			towerRef?.triggerDrop();
		} else if (phase === 'falling') {
			towerRef?.triggerStop();
		} else if (phase === 'landed') {
			towerRef?.triggerReset();
			requestAnimationFrame(() => {
				towerRef?.triggerDrop();
			});
		}
	}

	function handleStagePointerDown(e: PointerEvent) {
		const target = e.target as HTMLElement | null;
		if (
			target?.closest('.forward-btn') ||
			target?.closest('.reset-btn') ||
			target?.closest('.retry-link') ||
			target?.closest('a')
		) {
			return;
		}
		if (phase === 'falling') {
			e.stopPropagation();
			towerRef?.triggerStop();
		} else if (phase === 'landed') {
			e.stopPropagation();
			towerRef?.triggerReset();
			requestAnimationFrame(() => {
				towerRef?.triggerDrop();
			});
		}
	}

	function resetAll() {
		trials = [];
		nextId = 1;
		lastMissed = false;
		towerRef?.triggerReset();
	}

	function onTimedRecord(seconds: number | null) {
		if (seconds !== null) {
			trials = [...trials, { id: nextId++, time: seconds }];
			lastMissed = false;
		} else {
			lastMissed = true;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			if (trials.length >= 3 && e.target instanceof HTMLAnchorElement) {
				void goto(roomPath(data.locale, 'incline'));
			} else {
				handleAction();
			}
		}
	}

	function calcOffsetMs(val: number) {
		const diff = Math.round((val - TARGET_TIME) * 1000);
		return diff > 0 ? `+${diff}ms` : `${diff}ms`;
	}

	function calcPercent(val: number) {
		const clamped = Math.min(Math.max(val, 0.02), AXIS_MAX - 0.02);
		return (clamped / AXIS_MAX) * 100;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="echo-room" class:falling={phase === 'falling'} role="presentation" onpointerdown={handleStagePointerDown}>
	<!-- Apparatus Container: Tower + Mounted Side Rig -->
	<div class="apparatus-stage">
		<TowerDrop
			bind:this={towerRef}
			balls={1}
			showStopwatch
			hideFloatingWatch
			enableKeydown={false}
			duration={TARGET_TIME}
			autoReset={true}
			rhythmHint={data.locale === 'zh' ? '① 点球 → ② 拍屏' : '① Drop → ② Tap'}
			bind:phase
			bind:clock
			bind:stoppedAt
			onTimed={onTimedRecord}
		>
			<!-- Side-Mounted Observation Rig attached to Tower Balcony -->
			<div class="balcony-rig">
				<!-- Mechanical Brass Strut connecting Balcony to Rig -->
				<div class="brass-strut">
					<span class="strut-bracket left"></span>
					<span class="strut-bar"></span>
					<span class="strut-bracket right"></span>
				</div>

				<!-- Instrument Console Body -->
				<div class="rig-console">
					<!-- Header Bar -->
					<div class="rig-head">
						<div class="rig-tag-row">
							<span class="tag-num mono">04.1</span>
							<span class="tag-dot">·</span>
							<span class="tag-title">{text.title}</span>
							<span class="tag-dot">·</span>
							<span class="tag-meta mono">{data.locale === 'zh' ? '54米落体' : '54m Drop'}</span>
						</div>
						<div class="rig-actions">
							{#if trials.length > 0}
								<button class="reset-btn mono" onclick={resetAll} title="清空记录重新测量">
									↺ {data.locale === 'zh' ? '清空' : 'Reset'}
								</button>
							{/if}
							<span class="trial-counter mono">
								{#if trials.length < 3}
									{trials.length} / 3
								{:else}
									{data.locale === 'zh' ? `已测 ${trials.length} 次` : `${trials.length} trials`}
								{/if}
							</span>
						</div>
					</div>

					<h2 class="rig-line serif">{text.line}</h2>

					<!-- Status & Guidance Prompt -->
					<button
						class="prompt-strip mono"
						class:falling={phase === 'falling'}
						class:landed={phase === 'landed'}
						onclick={handleAction}
					>
						{#if phase === 'idle'}
							{#if lastMissed}
								<span class="prompt-text teach-miss">
									{data.locale === 'zh'
										? '太快了？小球撞地瞬间随手拍屏即可 · 点球重试'
										: 'Too fast? Tap anywhere on impact · Tap ball to retry'}
								</span>
							{:else if trials.length > 0}
								<span class="prompt-text step-guide">
									<span class="step-txt">
										{data.locale === 'zh'
											? `上次 ${trials[trials.length - 1].time.toFixed(2)}s · 点球继续`
											: `Last ${trials[trials.length - 1].time.toFixed(2)}s · Drop again`}
									</span>
									<span class="step-arr">&rarr;</span>
									<span class="step-badge">②</span>
									<span class="step-txt">{data.locale === 'zh' ? '触地拍屏' : 'Tap to stop'}</span>
								</span>
							{:else}
								<span class="prompt-text step-guide">
									<span class="step-badge">①</span>
									<span class="step-txt">{data.locale === 'zh' ? '点球释放' : 'Drop ball'}</span>
									<span class="step-arr">&rarr;</span>
									<span class="step-badge">②</span>
									<span class="step-txt">{data.locale === 'zh' ? '触地拍屏' : 'Tap anywhere to stop'}</span>
								</span>
							{/if}
						{:else if phase === 'falling'}
							<span class="prompt-text active-fall">
								⏱ {clock.toFixed(2)}s · {data.locale === 'zh' ? '触地拍停！[轻按屏幕任意处]' : 'Impact Stop! [Tap anywhere]'}
							</span>
						{:else if phase === 'landed'}
							<span class="prompt-text">
								{#if stoppedAt !== null}
									⏱ {stoppedAt.toFixed(2)}s · {trials.length < 3
										? data.locale === 'zh'
											? '点球再次测定'
											: 'Drop again'
										: data.locale === 'zh'
											? '点球可继续测定 · 或前往斜面工坊 →'
											: 'Drop again or proceed →'}
								{:else}
									<span class="teach-miss">
										{data.locale === 'zh' ? '太快了？小球撞地瞬间，随手拍按屏幕任意处即可！' : 'Too fast? When sphere hits ground, tap anywhere!'}
									</span>
								{/if}
							</span>
						{/if}
					</button>

					<!-- Time & Reaction Scatter Axis -->
					<div class="scatter-section">
						<div class="axis-track">
							<!-- Physiological Delay Band: Visual-Motor Latency window after impact (200~280ms) -->
							<div
								class="delay-band"
								style="left: {(TARGET_TIME / AXIS_MAX) * 100}%; width: {(0.25 / AXIS_MAX) * 100}%"
								title="人类生理反应延迟区间 (+200~280ms)"
							>
								<span class="delay-tag mono">{data.locale === 'zh' ? '生理反应区间' : 'Latency'}</span>
							</div>

							<!-- Target Benchmark -->
							<div class="benchmark-line" style="left: {calcPercent(TARGET_TIME)}%">
								<span class="benchmark-label mono">{TARGET_TIME.toFixed(2)}s {data.locale === 'zh' ? '理论' : 'theory'}</span>
								<span class="benchmark-pin"></span>
							</div>

							<!-- Plotted Trial Beads (All Trials retained on axis) -->
							{#each trials as entry, idx (entry.id)}
								{@const isRecent = idx >= trials.length - 3}
								{@const leftPos = calcPercent(entry.time)}
								{@const isLate = entry.time > TARGET_TIME + 0.04}
								{@const isEarly = entry.time < TARGET_TIME - 0.04}
								<div
									class="trial-dot mono"
									class:history={!isRecent}
									class:recent={isRecent}
									class:late={isLate}
									class:early={isEarly}
									style="left: {leftPos}%"
									title="#{entry.id}: {entry.time.toFixed(2)}s ({calcOffsetMs(entry.time)})"
								>
									<span class="dot-num">{entry.id}</span>
								</div>
							{/each}

							<!-- Axis Scale Limits -->
							<div class="axis-scale mono">
								<span>0.00s</span>
								<span class="scale-mid">{(AXIS_MAX / 2).toFixed(2)}s</span>
								<span>{AXIS_MAX.toFixed(2)}s</span>
							</div>
						</div>

						<!-- Ledger Chips Row (Rolling Last 3 Slots) -->
						<div class="ledger-chips mono">
							{#each displaySlots as entry (entry.id)}
								<div class="ledger-chip" class:filled={entry.time !== null}>
									<span class="chip-idx">#{entry.id}</span>
									{#if entry.time !== null}
										<span class="chip-val">{entry.time.toFixed(2)}s</span>
										<span
											class="chip-diff"
											class:late={entry.time > TARGET_TIME + 0.04}
											class:early={entry.time < TARGET_TIME - 0.04}
										>
											({calcOffsetMs(entry.time)})
										</span>
									{:else}
										<span class="chip-empty">—</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>

					<!-- Historical Verdict & Forward Card (Revealed after 3 trials) -->
					{#if trials.length >= 3}
						<div class="revelation-card">
							<p class="revelation-lead serif">
								{data.locale === 'zh'
									? '生理反应极限（~250ms）吞没了整个下落时间。'
									: 'Human neural latency (~250ms) swallows the entire fall.'}
							</p>
							<p class="revelation-body serif">
								{data.locale === 'zh'
									? '在垂直落体中，肉体无法测准重力。于是，他把问题放平。'
									: 'In vertical free fall, physiology makes precision timing impossible. So he laid it flat.'}
							</p>
							<div class="revelation-foot">
								<a class="forward-btn serif" href={roomPath(data.locale, 'incline')}>
									<span>{data.locale === 'zh' ? '前往 1604 · 斜面工坊' : 'To the 1604 Workshop'}</span>
									<span class="arrow" aria-hidden="true">&rarr;</span>
								</a>
								<button class="retry-link mono" onclick={resetAll}>
									↺ {data.locale === 'zh' ? '重新观测' : 'Retry'}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</TowerDrop>
	</div>
</div>

<style>
	.echo-room {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		user-select: none;
		padding: 3.8rem var(--system-pad, 2rem) 1.5rem;
		box-sizing: border-box;
	}

	.echo-room.falling {
		cursor: crosshair;
	}

	.echo-room.falling::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border: 2px solid rgba(247, 212, 158, 0.45);
		box-shadow: inset 0 0 32px rgba(247, 212, 158, 0.12), inset 0 0 80px rgba(212, 165, 116, 0.08);
		animation: shutter-pulse 0.35s infinite alternate ease-in-out;
		z-index: 99;
	}

	@keyframes shutter-pulse {
		from {
			opacity: 0.55;
		}
		to {
			opacity: 1;
		}
	}

	/* Apparatus Stage */
	.apparatus-stage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		max-height: calc(100vh - 5.5rem);
		/* Offset slightly to the left so tower + right rig are centered as an ensemble */
		transform: translateX(max(-10rem, -8vw));
	}

	.apparatus-stage :global(.tower) {
		height: min(72vh, 38rem) !important;
		width: calc(min(72vh, 38rem) * 400 / 990) !important;
		aspect-ratio: 400 / 990;
		position: relative;
	}

	/* Balcony Rig: Anchored to Tower's Release Balcony (to the right of the ball) */
	.balcony-rig {
		position: absolute;
		left: calc(80.8% + 1.65rem);
		top: 11.2%;
		display: flex;
		align-items: flex-start;
		z-index: 20;
		pointer-events: none;
	}

	/* Mechanical Brass Strut */
	.brass-strut {
		position: relative;
		width: 2.2rem;
		height: 4px;
		margin-top: 1.35rem;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		pointer-events: none;
	}

	.strut-bar {
		width: 100%;
		height: 2px;
		background: linear-gradient(90deg, #d4a574 0%, #b07a3a 50%, #d4a574 100%);
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(212, 165, 116, 0.4);
	}

	.strut-bracket {
		width: 6px;
		height: 10px;
		background: #8e622d;
		border: 1px solid #d4a574;
		border-radius: 1px;
		box-shadow: 0 1px 3px #000;
		flex-shrink: 0;
	}

	.strut-bracket.left {
		margin-left: -3px;
	}

	.strut-bracket.right {
		margin-right: -3px;
	}

	/* Rig Console */
	.rig-console {
		width: min(85vw, 24rem);
		background: rgba(16, 12, 8, 0.94);
		border: 1px solid rgba(212, 165, 116, 0.35);
		border-radius: 8px;
		padding: 0.9rem 1.15rem;
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.75), 0 0 16px rgba(212, 165, 116, 0.15);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		box-sizing: border-box;
		animation: rig-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: auto;
	}

	@keyframes rig-appear {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Rig Header */
	.rig-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.45rem;
		border-bottom: 1px solid rgba(212, 165, 116, 0.18);
	}

	.rig-tag-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.76rem;
		color: var(--accent);
		opacity: 0.9;
	}

	.tag-dot {
		opacity: 0.35;
	}

	.tag-meta {
		opacity: 0.7;
	}

	.rig-actions {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.75rem;
	}

	.reset-btn {
		background: none;
		border: none;
		color: var(--text-dim);
		cursor: pointer;
		font-size: 0.72rem;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		transition: all 0.2s ease;
	}

	.reset-btn:hover {
		color: var(--accent);
		background: rgba(212, 165, 116, 0.12);
	}

	.trial-counter {
		color: var(--accent);
		font-weight: 600;
	}

	.rig-line {
		margin: 0;
		font-size: 1.15rem;
		color: var(--text);
		font-weight: 400;
		line-height: 1.3;
	}

	/* Prompt Strip */
	.prompt-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.7rem;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(212, 165, 116, 0.2);
		font-size: 0.8rem;
		color: var(--text-dim);
		transition: all 0.2s ease;
	}

	.prompt-strip.falling {
		border-color: #f7d49e;
		background: rgba(212, 165, 116, 0.15);
		box-shadow: 0 0 12px rgba(212, 165, 116, 0.35);
	}

	.active-fall {
		color: #f7d49e;
		font-weight: 600;
		animation: pulse-txt 0.4s infinite alternate;
	}

	@keyframes pulse-txt {
		from {
			opacity: 0.7;
		}
		to {
			opacity: 1;
		}
	}

	.step-guide {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		justify-content: center;
	}

	.step-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 50%;
		background: rgba(212, 165, 116, 0.22);
		border: 1px solid rgba(212, 165, 116, 0.65);
		color: #f7d49e;
		font-size: 0.7rem;
		font-weight: 600;
		line-height: 1;
		flex-shrink: 0;
	}

	.step-txt {
		color: var(--text);
		font-size: 0.76rem;
		letter-spacing: 0.02em;
	}

	.step-arr {
		color: rgba(212, 165, 116, 0.6);
		font-size: 0.82rem;
		margin: 0 0.15rem;
	}

	.teach-miss {
		color: #f7d49e;
		font-size: 0.74rem;
		font-weight: 500;
		animation: pulse-txt 0.8s infinite alternate;
		letter-spacing: 0.01em;
	}

	/* Scatter Axis Section */
	.scatter-section {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding-top: 0.2rem;
	}

	.axis-track {
		position: relative;
		height: 1.8rem;
		border-bottom: 1px solid rgba(212, 165, 116, 0.35);
		margin: 0.9rem 0 0.8rem;
	}

	.delay-band {
		position: absolute;
		top: 0;
		bottom: 0;
		background: rgba(212, 165, 116, 0.09);
		border-left: 1px dashed rgba(212, 165, 116, 0.25);
		border-right: 1px dashed rgba(212, 165, 116, 0.25);
		pointer-events: none;
	}

	.delay-tag {
		position: absolute;
		bottom: 0.15rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.55rem;
		color: rgba(212, 165, 116, 0.45);
		white-space: nowrap;
	}

	.benchmark-line {
		position: absolute;
		top: -0.2rem;
		bottom: 0;
		width: 1px;
		background: #f7d49e;
		box-shadow: 0 0 8px rgba(212, 165, 116, 0.8);
		transform: translateX(-50%);
		z-index: 2;
	}

	.benchmark-pin {
		position: absolute;
		bottom: -2px;
		left: 50%;
		transform: translateX(-50%);
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #f7d49e;
		box-shadow: 0 0 6px #f7d49e;
	}

	.benchmark-label {
		position: absolute;
		top: -1.15rem;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.62rem;
		color: #f7d49e;
		white-space: nowrap;
	}

	.trial-dot {
		position: absolute;
		top: 100%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: #f7d49e;
		color: #120e0a;
		font-size: 0.58rem;
		font-weight: 700;
		border: 1px solid #fff;
		box-shadow: 0 0 10px rgba(247, 212, 158, 0.9);
		z-index: 4;
		animation: dot-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes dot-in {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.2);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	.trial-dot.late {
		background: #ff7b72;
		color: #fff;
		box-shadow: 0 0 10px rgba(255, 123, 114, 0.9);
	}

	.trial-dot.early {
		background: #79c0ff;
		color: #120e0a;
		box-shadow: 0 0 10px rgba(121, 192, 255, 0.9);
	}

	.trial-dot.recent {
		z-index: 5;
	}

	.trial-dot.history {
		opacity: 0.52;
		transform: translate(-50%, -50%) scale(0.85);
		box-shadow: 0 0 4px rgba(247, 212, 158, 0.4);
		z-index: 3;
		cursor: default;
		transition: all 0.2s ease;
	}

	.trial-dot.history:hover {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1.1);
		z-index: 7;
		box-shadow: 0 0 10px rgba(247, 212, 158, 0.9);
	}

	.axis-scale {
		position: absolute;
		bottom: -1.15rem;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		font-size: 0.6rem;
		color: var(--text-dim);
		opacity: 0.6;
	}

	.scale-mid {
		transform: translateX(-50%);
		position: absolute;
		left: 50%;
	}

	/* Ledger Chips */
	.ledger-chips {
		display: flex;
		justify-content: space-between;
		gap: 0.4rem;
	}

	.ledger-chip {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.25rem 0.35rem;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px dashed rgba(212, 165, 116, 0.18);
		font-size: 0.72rem;
		color: var(--text-dim);
	}

	.ledger-chip.filled {
		border-style: solid;
		border-color: rgba(212, 165, 116, 0.4);
		background: rgba(212, 165, 116, 0.08);
		color: var(--text);
	}

	.chip-idx {
		font-size: 0.64rem;
		opacity: 0.6;
	}

	.chip-val {
		color: var(--accent);
		font-weight: 600;
	}

	.chip-diff {
		font-size: 0.64rem;
		color: var(--accent);
	}

	.chip-diff.late {
		color: #ff7b72;
	}

	.chip-diff.early {
		color: #79c0ff;
	}

	.chip-empty {
		opacity: 0.3;
	}

	/* Revelation Card */
	.revelation-card {
		margin-top: 0.3rem;
		padding-top: 0.6rem;
		border-top: 1px solid rgba(212, 165, 116, 0.25);
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		animation: card-appear 0.5s ease-out;
	}

	@keyframes card-appear {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.revelation-lead {
		margin: 0;
		font-size: 0.88rem;
		color: #f7d49e;
		font-weight: 500;
		line-height: 1.35;
	}

	.revelation-body {
		margin: 0;
		font-size: 0.78rem;
		color: var(--text-dim);
		line-height: 1.35;
	}

	.revelation-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.3rem;
	}

	.forward-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.38rem 0.85rem;
		border-radius: 999px;
		background: rgba(212, 165, 116, 0.15);
		border: 1px solid var(--accent);
		color: var(--accent);
		font-size: 0.84rem;
		text-decoration: none;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.forward-btn:hover {
		background: rgba(212, 165, 116, 0.3);
		color: #fff;
		transform: translateX(2px);
	}

	.retry-link {
		background: none;
		border: none;
		color: var(--text-dim);
		font-size: 0.72rem;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.retry-link:hover {
		opacity: 1;
		color: var(--accent);
	}

	@media (max-width: 900px) {
		.echo-room {
			align-items: flex-end;
			justify-content: center;
		}

		.apparatus-stage {
			height: 52%;
			bottom: 0;
			position: absolute;
			transform: none;
		}

		.balcony-rig {
			position: fixed;
			top: 3.8rem;
			left: 50%;
			transform: translateX(-50%);
			width: min(92vw, 24rem);
			z-index: 30;
		}

		.brass-strut {
			display: none;
		}

		.rig-console {
			width: 100%;
			padding: 0.75rem 0.9rem;
			gap: 0.5rem;
		}
	}
</style>
