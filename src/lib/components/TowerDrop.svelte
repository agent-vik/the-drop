<script lang="ts">
	import { fallProgress, TOWER_FALL_SECONDS } from '$lib/physics';

	type Phase = 'idle' | 'holding' | 'falling' | 'landed' | 'faded';

	let {
		balls = 2,
		autoReset = false,
		showStopwatch = false,
		releaseHint = '',
		retryLabel = '',
		stopHint = '',
		onLanded,
		onFaded,
		onTimed
	}: {
		balls?: 1 | 2;
		autoReset?: boolean;
		showStopwatch?: boolean;
		releaseHint?: string;
		retryLabel?: string;
		stopHint?: string;
		onLanded?: () => void;
		onFaded?: () => void;
		onTimed?: (seconds: number | null) => void;
	} = $props();

	let phase = $state<Phase>('idle');
	let progress = $state(0);
	let clock = $state(0);
	let stoppedAt = $state<number | null>(null);
	let groove = $state(true);

	let start = 0;
	let frame = 0;

	function resetBalls() {
		cancelAnimationFrame(frame);
		phase = 'idle';
		progress = 0;
		clock = 0;
		stoppedAt = null;
		groove = true;
	}

	function hold(event: PointerEvent) {
		if (phase !== 'idle') return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		phase = 'holding';
		groove = false;
	}

	function release() {
		if (phase !== 'holding') return;
		phase = 'falling';
		start = performance.now();
		tick();
	}

	function stopClock() {
		if (!showStopwatch || phase !== 'falling' || stoppedAt !== null) return;
		stoppedAt = clock;
	}

	function tick() {
		const elapsed = (performance.now() - start) / 1000;
		clock = elapsed;
		progress = fallProgress(elapsed, TOWER_FALL_SECONDS);
		if (elapsed >= TOWER_FALL_SECONDS) {
			progress = 1;
			phase = 'landed';
			if (showStopwatch && stoppedAt === null) {
				onTimed?.(null);
			} else if (showStopwatch) {
				onTimed?.(Number(stoppedAt!.toFixed(1)));
			}
			onLanded?.();
			if (autoReset) {
				setTimeout(() => {
					resetBalls();
				}, 900);
			} else {
				setTimeout(() => {
					phase = 'faded';
					groove = true;
					onFaded?.();
				}, 1800);
			}
			return;
		}
		frame = requestAnimationFrame(tick);
	}
</script>

<div
	class="tower"
	class:holding={phase === 'holding'}
	class:faded={phase === 'faded'}
	data-balls={balls}
>
	<img class="shaft" src="/images/tower-plate.webp" alt="" />
	{#if phase === 'idle' || phase === 'faded'}
		<div class="groove" class:empty={phase === 'faded'}></div>
	{/if}
	{#if phase !== 'faded'}
		<div class="pair" class:breathing={phase === 'idle'} style:--p={progress}>
			<div class="ball heavy"></div>
			{#if balls === 2}
				<div class="ball light"></div>
			{/if}
		</div>
	{/if}
	{#if phase === 'holding'}
		<div class="guide"></div>
	{/if}
	<div
		class="hit"
		role="button"
		tabindex="0"
		aria-label={releaseHint}
		onpointerdown={hold}
		onpointerup={release}
		onpointercancel={release}
		onkeydown={(e) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				if (phase === 'idle') phase = 'holding';
				else if (phase === 'holding') release();
			}
		}}
	>
		{#if phase === 'holding' && releaseHint}
			<p class="hint">{releaseHint}</p>
		{/if}
	</div>
	{#if showStopwatch}
		<button class="watch mono" class:awake={phase === 'falling' || phase === 'holding'} onclick={stopClock}>
			{(stoppedAt ?? (phase === 'falling' ? clock : 0)).toFixed(1)}s
		</button>
		{#if phase === 'falling' && stopHint && stoppedAt === null}
			<p class="hint stop">{stopHint}</p>
		{/if}
	{/if}
	{#if phase === 'faded' && retryLabel}
		<button class="retry" onclick={resetBalls}>{retryLabel}</button>
	{/if}
</div>

<style>
	.tower {
		position: relative;
		width: min(100%, calc(min(78vh, 36rem) * 400 / 990));
		aspect-ratio: 400 / 990;
		height: auto;
		container-type: size;
	}

	.shaft {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
	}

	.hit {
		position: absolute;
		left: 77.5%;
		top: 10.4%;
		width: 4.4rem;
		height: 3.2rem;
		transform: translateX(-50%);
		cursor: grab;
		touch-action: none;
		z-index: 3;
	}

	.holding .hit {
		cursor: grabbing;
	}

	.groove {
		position: absolute;
		left: 77.5%;
		top: 14.2%;
		width: 3.6rem;
		height: 0.38rem;
		transform: translateX(-50%);
		border-radius: 99px;
		background: #1a140e;
		box-shadow: inset 0 1px 2px #0008;
		z-index: 1;
		pointer-events: none;
	}

	.groove.empty {
		opacity: 0.55;
	}

	.pair {
		position: absolute;
		left: 77.5%;
		top: calc(11.4% + var(--p, 0) * (86.6% - 1.7rem));
		display: flex;
		align-items: flex-end;
		gap: 0.28rem;
		transform: translateX(-50%);
		will-change: top;
		z-index: 2;
		pointer-events: none;
	}

	.holding .pair {
		top: calc(10.8% + var(--p, 0) * (86.6% - 1.7rem));
	}

	.ball {
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #e8c89a, #b07a3a 55%, #6a4a28);
		box-shadow: 0 0.2rem 0.4rem #0006;
	}

	.heavy {
		width: 1.7rem;
		height: 1.7rem;
	}

	.light {
		width: 1.05rem;
		height: 1.05rem;
	}

	.breathing .ball {
		animation: breath 2.8s ease-in-out infinite;
	}

	@keyframes breath {
		0%,
		100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.18);
		}
	}

	.guide {
		position: absolute;
		left: 77.5%;
		top: 16%;
		width: 0;
		height: 81%;
		border-left: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 2;
	}

	.hint {
		position: absolute;
		top: -1.8rem;
		left: 50%;
		transform: translateX(-50%);
		white-space: nowrap;
		font-size: 0.8rem;
		color: var(--accent);
		margin: 0;
	}

	.hint.stop {
		top: auto;
		bottom: -2.2rem;
		right: 0;
		left: auto;
		transform: none;
	}

	.watch {
		position: absolute;
		right: 4%;
		top: 40%;
		opacity: 0.35;
		font-size: 1.1rem;
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		padding: 0.35rem 0.55rem;
		border-radius: 2px;
	}

	.watch.awake {
		opacity: 1;
	}

	.retry {
		position: absolute;
		bottom: 8%;
		left: 72%;
		transform: none;
		font-size: 0.75rem;
		color: var(--text-dim);
		opacity: 0.4;
		z-index: 3;
	}

	.retry:hover {
		opacity: 0.85;
	}
</style>
