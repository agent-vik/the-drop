<script lang="ts">
	import { ARISTOTLE_FALL } from '$lib/physics';
	import type { Copy } from '$lib/i18n';

	type Scene = 0 | 1 | 2;
	type Phase = 'idle' | 'holding' | 'falling' | 'done';

	let { copy, onDone }: { copy: Copy; onDone?: () => void } = $props();

	let scene = $state<Scene>(0);
	let phase = $state<Phase>('idle');
	let p = $state<number[]>([0, 0, 0]);

	const times = ARISTOTLE_FALL;

	let start = 0;
	let frame = 0;

	function hold() {
		if (phase !== 'idle') return;
		phase = 'holding';
	}

	function release() {
		if (phase !== 'holding') return;
		phase = 'falling';
		start = performance.now();
		tick();
	}

	function tick() {
		const elapsed = (performance.now() - start) / 1000;
		const t = times[scene];
		p = t.map((d) => Math.min(1, (elapsed / d) ** 2));
		if (elapsed >= Math.max(...t)) {
			phase = 'done';
			if (scene === 2) onDone?.();
			return;
		}
		frame = requestAnimationFrame(tick);
	}

	function next() {
		if (scene === 2) return;
		cancelAnimationFrame(frame);
		scene = (scene + 1) as Scene;
		phase = 'idle';
		p = [0, 0, 0];
	}
</script>

<div class="lab">
	<p class="say serif">
		{scene === 0 ? copy.reasoning.premise : scene === 1 ? copy.reasoning.drag : copy.reasoning.heavier}
	</p>

	<div
		class="stage"
		role="button"
		tabindex="0"
		onpointerdown={hold}
		onpointerup={release}
		onkeydown={(e) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				if (phase === 'idle') hold();
				else if (phase === 'holding') release();
			}
		}}
	>
		<div class="drop">
			{#if scene === 0}
				<div class="col" style:--p={p[0]}><div class="ball heavy"></div></div>
				<div class="col" style:--p={p[1]}><div class="ball light"></div></div>
			{:else if scene === 1}
				<div class="col" style:--p={p[0]}><div class="ball heavy"></div></div>
				<div class="col combo" style:--p={p[1]}>
					{#if phase === 'idle' || phase === 'holding'}
						<span class="arrow up" aria-hidden="true">
							<svg viewBox="0 0 12 32">
								<polygon points="6,0 11,8 1,8" />
								<rect x="5" y="7" width="2" height="25" />
							</svg>
						</span>
						<span class="arrow down" aria-hidden="true">
							<svg viewBox="0 0 12 32">
								<rect x="5" y="0" width="2" height="25" />
								<polygon points="1,24 11,24 6,32" />
							</svg>
						</span>
					{/if}
					<div class="ball light"></div>
					<div class="ball heavy"></div>
				</div>
				<div class="col" style:--p={p[2]}><div class="ball light"></div></div>
			{:else}
				<div class="col combo" style:--p={p[0]}>
					{#if phase === 'idle' || phase === 'holding'}
						<span class="arrow merged" aria-hidden="true">
							<svg viewBox="0 0 16 36">
								<rect x="6" y="0" width="2" height="26" fill="#c47a4a" />
								<rect x="8" y="0" width="2" height="26" fill="#7ec8c8" />
								<polygon points="1,26 8,26 8,36" fill="#c47a4a" />
								<polygon points="8,26 15,26 8,36" fill="#7ec8c8" />
							</svg>
						</span>
					{/if}
					<div class="ball light"></div>
					<div class="ball heavy"></div>
				</div>
				<div class="col" style:--p={p[1]}><div class="ball heavy"></div></div>
				<div class="col" style:--p={p[2]}><div class="ball light"></div></div>
			{/if}
		</div>
		<div class="floor"></div>
	</div>

	{#if phase === 'holding'}
		<p class="hint">{copy.release}</p>
	{/if}
	{#if phase === 'done' && scene < 2}
		<button class="go" onclick={next}>{copy.continue}</button>
	{/if}
	{#if phase === 'done' && scene === 2}
		<p class="say serif">{copy.reasoning.qualifier}</p>
	{/if}
</div>

<style>
	.lab {
		width: 100%;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		gap: 0.6rem;
	}

	.say {
		min-height: 2.6rem;
		margin: 0 0 0.8rem;
		font-size: clamp(1.15rem, 2vw, 1.4rem);
		color: var(--text-dim);
		max-width: 40rem;
	}

	.stage {
		position: relative;
		flex: 1 1 auto;
		min-height: 22rem;
		height: 0;
		cursor: grab;
		touch-action: none;
	}

	.drop {
		position: absolute;
		inset: 2.6rem 0 0.55rem;
		display: flex;
		justify-content: space-evenly;
	}

	.col {
		position: relative;
		width: 4.5rem;
		height: 100%;
	}

	.ball {
		position: absolute;
		left: 50%;
		border-radius: 50%;
		transform: translateX(-50%);
		background: radial-gradient(circle at 35% 30%, #e8c89a, #b07a3a 55%, #6a4a28);
		box-shadow: 0 0.25rem 0.5rem #0005;
	}

	.heavy {
		width: 1.7rem;
		height: 1.7rem;
		top: calc(var(--p, 0) * (100% - 1.7rem));
	}

	.light {
		width: 1.05rem;
		height: 1.05rem;
		top: calc(var(--p, 0) * (100% - 1.05rem));
	}

	.combo .light {
		top: calc(var(--p, 0) * (100% - 2.62rem));
	}

	.combo .heavy {
		top: calc(0.92rem + var(--p, 0) * (100% - 2.62rem));
	}

	.floor {
		position: absolute;
		bottom: 0.4rem;
		left: 8%;
		right: 8%;
		height: 3px;
		background: color-mix(in srgb, var(--accent) 35%, #2a241c);
	}

	.arrow {
		position: absolute;
		left: 50%;
		width: 0.85rem;
		height: 2.2rem;
		transform: translateX(-50%);
		z-index: 2;
		pointer-events: none;
	}

	.arrow svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.up svg,
	.down svg {
		fill: currentColor;
	}

	.up {
		top: -2.35rem;
		color: #7ec8c8;
	}

	.down {
		top: 2.55rem;
		color: #c47a4a;
	}

	.merged {
		top: 2.75rem;
		width: 1.1rem;
		height: 2.5rem;
	}

	.hint,
	.go {
		margin-top: 1rem;
		color: var(--accent);
	}

	.go {
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.55rem 1rem;
	}
</style>
