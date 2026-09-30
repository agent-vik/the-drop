<script lang="ts">
	import { fallProgress, TOWER_FALL_SECONDS } from '$lib/physics';

	export type Phase = 'idle' | 'holding' | 'falling' | 'landed' | 'faded';

	let {
		balls = 2,
		autoReset = false,
		showStopwatch = false,
		hideFloatingWatch = false,
		releaseHint = '',
		retryLabel = '',
		stopHint = '',
		rhythmHint = '',
		duration = TOWER_FALL_SECONDS,
		enableKeydown = true,
		phase = $bindable('idle'),
		clock = $bindable(0),
		stoppedAt = $bindable<number | null>(null),
		onLanded,
		onFaded,
		onTimed,
		children
	}: {
		balls?: 1 | 2;
		autoReset?: boolean;
		showStopwatch?: boolean;
		hideFloatingWatch?: boolean;
		releaseHint?: string;
		retryLabel?: string;
		stopHint?: string;
		rhythmHint?: string;
		duration?: number;
		enableKeydown?: boolean;
		phase?: Phase;
		clock?: number;
		stoppedAt?: number | null;
		onLanded?: () => void;
		onFaded?: () => void;
		onTimed?: (seconds: number | null) => void;
		children?: import('svelte').Snippet;
	} = $props();
	let progress = $state(0);
	let groove = $state(true);

	let start = $state(0);
	let frame = 0;
	let landedTriggered = false;
	let resetTimer: any = null;

	function scheduleReset(delayMs = 900) {
		if (!autoReset) return;
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => {
			if (phase === 'landed') {
				resetBalls();
			}
		}, delayMs);
	}

	export function triggerStop() {
		stopClock();
	}

	export function triggerReset() {
		resetBalls();
	}

	export function triggerDrop() {
		if (phase === 'idle') {
			phase = 'falling';
			start = performance.now();
			groove = false;
			landedTriggered = false;
			tick();
		}
	}

	function resetBalls() {
		clearTimeout(resetTimer);
		cancelAnimationFrame(frame);
		phase = 'idle';
		progress = 0;
		clock = 0;
		stoppedAt = null;
		groove = true;
		landedTriggered = false;
	}

	function handleHitPointerDown(event?: PointerEvent) {
		if (phase === 'falling' && showStopwatch) {
			event?.stopPropagation();
			stopClock();
			return;
		}
		if (phase === 'landed') {
			event?.stopPropagation();
			resetBalls();
			hold(event);
			return;
		}
		hold(event);
	}

	function handleTowerPointerDown(event: PointerEvent) {
		if (!showStopwatch) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('.rig-console') || target?.closest('.balcony-rig')) {
			return;
		}
		if (phase === 'falling') {
			event.stopPropagation();
			stopClock();
		} else if (phase === 'landed') {
			event.stopPropagation();
			resetBalls();
			hold(event);
		}
	}

	function handleTowerPointerUp(event: PointerEvent) {
		if (!showStopwatch) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('.rig-console') || target?.closest('.balcony-rig')) {
			return;
		}
		if (phase === 'holding') {
			release();
		}
	}

	function hold(event?: PointerEvent) {
		if (phase !== 'idle') return;
		if (event) {
			try {
				(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
			} catch {}
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
		onTimed?.(Number(stoppedAt.toFixed(2)));
		if (progress >= 1) {
			phase = 'landed';
			scheduleReset(900);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!enableKeydown) return;
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
			} else if (phase === 'landed') {
				e.preventDefault();
				resetBalls();
				hold();
			}
		}
	}

	function tick() {
		const elapsed = (performance.now() - start) / 1000;
		clock = elapsed;

		if (elapsed < duration) {
			progress = fallProgress(elapsed, duration);
		} else {
			progress = 1;
			if (!landedTriggered) {
				landedTriggered = true;
				if (typeof navigator !== 'undefined' && navigator.vibrate) {
					try {
						navigator.vibrate(40);
					} catch {}
				}
				onLanded?.();
			}
		}

		if (!showStopwatch) {
			if (elapsed >= duration) {
				progress = 1;
				phase = 'landed';
				if (autoReset) {
					scheduleReset(900);
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
					scheduleReset(900);
					return;
				}
			} else {
				const maxWatchTime = Math.max(duration + 1.2, 1.6);
				if (elapsed >= maxWatchTime) {
					phase = 'landed';
					stoppedAt = null;
					onTimed?.(null);
					scheduleReset(900);
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
	role="presentation"
	class:holding={phase === 'holding'}
	class:falling={phase === 'falling'}
	class:landed={phase === 'landed'}
	class:faded={phase === 'faded'}
	data-balls={balls}
	onpointerdown={handleTowerPointerDown}
	onpointerup={handleTowerPointerUp}
	onpointercancel={handleTowerPointerUp}
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
		onpointerdown={handleHitPointerDown}
		onpointerup={release}
		onpointercancel={release}
	>
		{#if phase === 'holding' && releaseHint}
			<p class="hint">{releaseHint}</p>
		{/if}
	</div>
	{#if phase === 'idle' && rhythmHint}
		<div class="balcony-rhythm mono" aria-hidden="true">
			{rhythmHint}
		</div>
	{/if}
	{#if phase === 'falling' && showStopwatch}
		<div class="drop-stop-beacon" aria-hidden="true"></div>
	{/if}
	{#if phase !== 'faded'}
		<div
			class="pair"
			class:clickable={showStopwatch && (phase === 'falling' || phase === 'landed')}
			style:--p={progress}
		>
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
	{#if showStopwatch && !hideFloatingWatch}
		<div class="watch-dock">
			<button
				class="watch mono"
				class:awake={start > 0 && stoppedAt === null}
				onclick={stopClock}
				aria-label="Stop stopwatch"
			>
				<span class="watch-icon" aria-hidden="true">⏱</span>
				<span class="watch-val">{(stoppedAt ?? (start > 0 ? clock : 0)).toFixed(duration < 1 ? 2 : 1)}s</span>
			</button>
			{#if start > 0 && stopHint && stoppedAt === null}
				<p class="hint stop">{stopHint}</p>
			{/if}
		</div>
	{/if}
	{#if phase === 'faded' && retryLabel}
		<button class="retry" onclick={resetBalls}>{retryLabel}</button>
	{/if}
	{@render children?.()}
</div>

<style>
	.tower {
		position: relative;
		width: min(100%, calc(min(78vh, 36rem) * 400 / 990));
		aspect-ratio: 400 / 990;
		height: auto;
		container-type: size;
		pointer-events: auto;
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
		z-index: 30;
	}

	.holding .hit {
		cursor: grabbing;
	}

	.balcony-rhythm {
		position: absolute;
		left: 80.8%;
		top: 6.2%;
		transform: translateX(-50%);
		background: rgba(16, 12, 8, 0.94);
		border: 1px solid rgba(212, 165, 116, 0.65);
		color: #f7d49e;
		font-size: 0.68rem;
		padding: 0.2rem 0.52rem;
		border-radius: 999px;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6), 0 0 10px rgba(212, 165, 116, 0.3);
		z-index: 25;
		animation: rhythm-bounce 1.4s infinite ease-in-out;
	}

	.balcony-rhythm::after {
		content: '';
		position: absolute;
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 4px solid rgba(212, 165, 116, 0.85);
	}

	@keyframes rhythm-bounce {
		0%,
		100% {
			transform: translateX(-50%) translateY(0);
		}
		50% {
			transform: translateX(-50%) translateY(-3px);
		}
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

	.pair.clickable {
		pointer-events: auto;
		cursor: pointer;
	}

	.pair.clickable .ball {
		cursor: pointer;
	}

	.landed .pair.clickable .ball:hover {
		filter: brightness(1.2);
		transform: scale(1.06);
		transition: transform 0.15s ease, filter 0.15s ease;
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

	.falling .hit {
		pointer-events: auto;
		cursor: pointer;
	}

	.landed .hit {
		pointer-events: none;
	}

	.drop-stop-beacon {
		position: absolute;
		left: 80.8%;
		top: 13.8%;
		width: 2.2rem;
		height: 2.2rem;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 1.5px solid var(--accent);
		box-shadow: 0 0 14px var(--accent);
		pointer-events: none;
		animation: beacon-pulse 0.4s infinite alternate;
		z-index: 3;
	}

	@keyframes beacon-pulse {
		from {
			transform: translate(-50%, -50%) scale(0.85);
			opacity: 0.5;
		}
		to {
			transform: translate(-50%, -50%) scale(1.35);
			opacity: 1;
		}
	}

	.watch-dock {
		position: absolute;
		left: calc(80.8% + 1.8rem);
		top: calc(11.55% + 0.85rem);
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.4rem;
		z-index: 5;
		pointer-events: auto;
	}

	.watch {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.4rem 1rem;
		border-radius: 999px;
		background: rgba(18, 14, 10, 0.88);
		border: 1px solid rgba(212, 165, 116, 0.35);
		color: var(--accent);
		font-size: 0.92rem;
		letter-spacing: 0.04em;
		cursor: pointer;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
		opacity: 0.65;
		transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
		white-space: nowrap;
	}

	.watch-icon {
		font-size: 0.88rem;
		opacity: 0.85;
	}

	.watch-val {
		font-weight: 600;
	}

	.watch.awake {
		opacity: 1;
		border-color: var(--accent);
		background: rgba(212, 165, 116, 0.2);
		box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 50%, transparent);
		transform: scale(1.04);
	}

	.watch:hover {
		opacity: 1;
		border-color: var(--accent);
		background: rgba(212, 165, 116, 0.24);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
	}

	.hint.stop {
		position: static;
		transform: none;
		font-size: 0.76rem;
		color: var(--accent);
		white-space: nowrap;
		margin: 0;
		opacity: 0.92;
		letter-spacing: 0.02em;
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
