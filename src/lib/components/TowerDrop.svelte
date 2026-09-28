<script lang="ts">
	import { fallProgress, TOWER_FALL_SECONDS } from '$lib/physics';

	export type Phase = 'idle' | 'holding' | 'falling' | 'landed' | 'faded';

	let {
		balls = 2,
		autoReset = false,
		showStopwatch = false,
		releaseHint = '',
		retryLabel = '',
		stopHint = '',
		phase = $bindable('idle'),
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
		phase?: Phase;
		onLanded?: () => void;
		onFaded?: () => void;
		onTimed?: (seconds: number | null) => void;
	} = $props();
	let progress = $state(0);
	let clock = $state(0);
	let stoppedAt = $state<number | null>(null);
	let groove = $state(true);

	let start = $state(0);
	let frame = 0;
	let landedTriggered = false;

	function resetBalls() {
		cancelAnimationFrame(frame);
		phase = 'idle';
		progress = 0;
		clock = 0;
		stoppedAt = null;
		groove = true;
		landedTriggered = false;
	}

	function hold(event?: PointerEvent) {
		if (phase !== 'idle') return;
		if (event) {
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		}
		phase = 'holding';
		groove = false;
	}

	function release() {
		if (phase !== 'holding') return;
		phase = 'falling';
		start = performance.now();
		landedTriggered = false;
		tick();
	}

	function stopClock() {
		if (!showStopwatch || stoppedAt !== null || start === 0) return;
		stoppedAt = (performance.now() - start) / 1000;
		onTimed?.(Number(stoppedAt.toFixed(1)));
		if (progress >= 1 && autoReset) {
			setTimeout(() => {
				resetBalls();
			}, 1200);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			if (phase === 'idle') {
				e.preventDefault();
				hold();
			} else if (phase === 'holding') {
				e.preventDefault();
				release();
			} else if (showStopwatch && stoppedAt === null && start > 0) {
				e.preventDefault();
				stopClock();
			}
		}
	}

	function tick() {
		const elapsed = (performance.now() - start) / 1000;
		clock = elapsed;

		if (elapsed < TOWER_FALL_SECONDS) {
			progress = fallProgress(elapsed, TOWER_FALL_SECONDS);
		} else {
			progress = 1;
			if (!landedTriggered) {
				landedTriggered = true;
				onLanded?.();
			}
		}

		if (!showStopwatch) {
			if (elapsed >= TOWER_FALL_SECONDS) {
				progress = 1;
				phase = 'landed';
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
		} else {
			if (stoppedAt !== null) {
				if (progress >= 1) {
					phase = 'landed';
					if (autoReset) {
						setTimeout(() => {
							resetBalls();
						}, 1200);
					}
					return;
				}
			} else {
				if (elapsed >= 6.0) {
					phase = 'landed';
					onTimed?.(null);
					setTimeout(() => {
						resetBalls();
					}, 900);
					return;
				}
			}
		}

		frame = requestAnimationFrame(tick);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="tower"
	class:holding={phase === 'holding'}
	class:falling={phase === 'falling'}
	class:landed={phase === 'landed'}
	class:faded={phase === 'faded'}
	data-balls={balls}
>
	<img class="shaft" src="/images/tower-plate.webp" alt="" />
	{#if phase === 'idle' || phase === 'faded'}
		<div class="groove" class:empty={phase === 'faded'}></div>
	{/if}
	<div
		class="hit"
		role="button"
		tabindex="0"
		aria-label={releaseHint}
		onpointerdown={hold}
		onpointerup={release}
		onpointercancel={release}
	>
		{#if phase === 'holding' && releaseHint}
			<p class="hint">{releaseHint}</p>
		{/if}
	</div>
	{#if phase !== 'faded'}
		<div class="pair" style:--p={progress}>
			<div class="ball heavy">
				{#if phase === 'idle'}
					<span class="reticle" aria-hidden="true"></span>
				{/if}
			</div>
			{#if balls === 2}
				<div class="ball light">
					{#if phase === 'idle'}
						<span class="reticle" aria-hidden="true"></span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
	{#if phase === 'landed'}
		<div class="impact-ripple" aria-hidden="true"></div>
	{/if}
	{#if phase === 'holding'}
		<div class="guide"></div>
	{/if}
	{#if showStopwatch}
		<button
			class="watch mono"
			class:awake={start > 0 && stoppedAt === null}
			onclick={stopClock}
			aria-label="Stop stopwatch"
		>
			{(stoppedAt ?? (start > 0 ? clock : 0)).toFixed(1)}s
		</button>
		{#if start > 0 && stopHint && stoppedAt === null}
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
		left: 80.8%;
		top: 11.2%;
		width: 3.6rem;
		height: 2.8rem;
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
		left: 80.8%;
		top: 14.05%;
		width: 1.85rem;
		height: 0.22rem;
		transform: translateX(-50%);
		border-radius: 1px;
		background: #16110c;
		box-shadow: inset 0 1px 1px #0009;
		z-index: 1;
		pointer-events: none;
	}

	.groove.empty {
		opacity: 0.55;
	}

	.pair {
		position: absolute;
		left: 80.8%;
		top: calc(11.55% + var(--p, 0) * (84.8% - 1.7rem));
		display: flex;
		align-items: flex-end;
		gap: 0.28rem;
		transform: translateX(-50%);
		will-change: top;
		z-index: 2;
		pointer-events: none;
	}

	.holding .pair {
		top: calc(10.9% + var(--p, 0) * (84.8% - 1.7rem));
	}

	.ball {
		position: relative;
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

	.reticle {
		position: absolute;
		inset: -5px;
		border-radius: 50%;
		border: 1px dashed color-mix(in srgb, var(--accent) 75%, transparent);
		pointer-events: none;
		animation: reticle-pulse 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes reticle-pulse {
		0%,
		100% {
			transform: scale(0.95);
			opacity: 0.35;
		}
		50% {
			transform: scale(1.18);
			opacity: 0.85;
		}
	}

	.hit:hover ~ .pair .reticle {
		transform: scale(1.02);
		border: 1.5px solid var(--accent);
		box-shadow: 0 0 10px var(--accent);
		opacity: 1;
		animation: none;
	}

	.guide {
		position: absolute;
		left: 80.8%;
		top: 15.2%;
		width: 0;
		height: 80%;
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

	.falling .hit,
	.landed .hit {
		pointer-events: none;
	}

	.watch {
		position: absolute;
		left: 88%;
		top: 17%;
		right: auto;
		opacity: 0.35;
		font-size: 1.1rem;
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
		padding: 0.28rem 0.5rem;
		border-radius: 2px;
		z-index: 5;
		cursor: pointer;
	}

	.watch.awake {
		opacity: 1;
	}

	.watch:hover {
		border-color: var(--accent);
	}

	.retry {
		position: absolute;
		bottom: 1.6%;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.75rem;
		color: var(--text-dim);
		opacity: 0.4;
		z-index: 3;
	}

	.retry:hover {
		opacity: 0.85;
	}

	.impact-ripple {
		position: absolute;
		left: 80.8%;
		bottom: 3.2%;
		width: 4.8rem;
		height: 1.5rem;
		transform: translateX(-50%);
		border-radius: 50%;
		border: 1.5px solid var(--accent);
		box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 70%, transparent);
		pointer-events: none;
		animation: impact-ring 0.65s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
		z-index: 1;
	}

	@keyframes impact-ring {
		0% {
			transform: translateX(-50%) scale(0.3);
			opacity: 0.95;
		}
		100% {
			transform: translateX(-50%) scale(1.6);
			opacity: 0;
		}
	}
</style>
