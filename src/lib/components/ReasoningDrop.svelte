<script lang="ts">
	import { goto } from '$app/navigation';
	import { ARISTOTLE_FALL } from '$lib/physics';
	import type { Copy } from '$lib/i18n';

	type Scene = 0 | 1 | 2;
	type Phase = 'idle' | 'holding' | 'falling' | 'done';

	let {
		copy,
		onDone,
		nextUrl
	}: { copy: Copy; onDone?: () => void; nextUrl?: string } = $props();

	let scene = $state<Scene>(0);
	let phase = $state<Phase>('idle');
	let p = $state<number[]>([0, 0, 0]);

	const labelM = $derived(copy.otherLang === 'en' ? '8 磅 (M)' : '8 lb (M)');
	const labelL = $derived(copy.otherLang === 'en' ? '1 磅 (m)' : '1 lb (m)');
	const label9 = $derived(copy.otherLang === 'en' ? '9 磅 (更重·更快?)' : '9 lb (faster?)');
	const labelDrag = $derived(copy.otherLang === 'en' ? 'M + m (拖慢)' : 'M + m (drag)');

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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			if (phase === 'idle') {
				e.preventDefault();
				hold();
			} else if (phase === 'holding') {
				e.preventDefault();
				release();
			} else if (phase === 'done' && scene < 2) {
				e.preventDefault();
				next();
			} else if (phase === 'done' && scene === 2 && nextUrl) {
				e.preventDefault();
				void goto(nextUrl);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="lab">
	<!-- Dialectic Stage Progress Pills -->
	<div class="stepper mono">
		<button class="step" class:active={scene === 0} class:passed={scene > 0} onclick={() => { scene = 0; phase = 'idle'; p = [0,0,0]; }}>
			<span class="step-num">I</span>
			<span class="step-label">{copy.otherLang === 'en' ? '前提假设' : 'Premise'}</span>
		</button>
		<span class="step-arrow">→</span>
		<button class="step" class:active={scene === 1} class:passed={scene > 1} onclick={() => { scene = 1; phase = 'idle'; p = [0,0,0]; }}>
			<span class="step-num">II</span>
			<span class="step-label">{copy.otherLang === 'en' ? '推论：拖慢' : 'Drag'}</span>
		</button>
		<span class="step-arrow">→</span>
		<button class="step" class:active={scene === 2} onclick={() => { scene = 2; phase = 'idle'; p = [0,0,0]; }}>
			<span class="step-num">III</span>
			<span class="step-label">{copy.otherLang === 'en' ? '推论：更快' : 'Faster'}</span>
		</button>
	</div>

	<!-- Proposition Banner -->
	<div class="statement-wrap">
		<p class="say serif">
			{scene === 0 ? copy.reasoning.premise : scene === 1 ? copy.reasoning.drag : copy.reasoning.heavier}
		</p>
	</div>

	<!-- The Thought Stage with Mass Drop Tracks -->
	<div
		class="stage"
		class:holding={phase === 'holding'}
		class:falling={phase === 'falling'}
		class:done={phase === 'done'}
		role="button"
		tabindex="0"
		aria-label={phase === 'idle' ? copy.holdHint : copy.release}
		onpointerdown={hold}
		onpointerup={release}
	>
		<div class="drop">
			{#if scene === 0}
				<!-- Track 1: Heavy -->
				<div class="col" style:--p={p[0]}>
					<span class="track-label mono">{labelM}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
					<div class="ball heavy">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
				<!-- Track 2: Light -->
				<div class="col" style:--p={p[1]}>
					<span class="track-label mono">{labelL}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
					<div class="ball light">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
			{:else if scene === 1}
				<!-- Track 1: Heavy alone -->
				<div class="col" style:--p={p[0]}>
					<span class="track-label mono">{labelM}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
					<div class="ball heavy">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
				<!-- Track 2: Tied pair (m drags M) -->
				<div class="col combo" style:--p={p[1]}>
					<span class="track-label mono active-label">{labelDrag}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
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
					<div class="ball light">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
					<div class="ball heavy">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
				<!-- Track 3: Light alone -->
				<div class="col" style:--p={p[2]}>
					<span class="track-label mono">{labelL}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
					<div class="ball light">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
			{:else}
				<!-- Scene 2: Reductio ad absurdum -->
				<!-- Track 1: Bound body 9lb -->
				<div class="col combo" style:--p={p[0]}>
					<span class="track-label mono active-label">{label9}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
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
					<div class="ball light">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
					<div class="ball heavy">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
				<!-- Track 2: Heavy alone -->
				<div class="col" style:--p={p[1]}>
					<span class="track-label mono">{labelM}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
					<div class="ball heavy">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
				<!-- Track 3: Light alone -->
				<div class="col" style:--p={p[2]}>
					<span class="track-label mono">{labelL}</span>
					{#if phase === 'holding'}<div class="guide" aria-hidden="true"></div>{/if}
					<div class="ball light">
						{#if phase === 'idle'}<span class="reticle" aria-hidden="true"></span>{/if}
					</div>
				</div>
			{/if}
		</div>
		<div class="floor"></div>

		{#if phase === 'done'}
			<div class="stage-center-action">
				{#if scene < 2}
					<button class="step-btn mono" onclick={next}>
						<span>{scene === 0 ? (copy.otherLang === 'en' ? '若将两球捆绑？ →' : 'If tied together? →') : (copy.otherLang === 'en' ? '但合体总重 9 磅…… →' : 'Yet total mass is 9 lb... →')}</span>
					</button>
				{:else}
					<div class="collapse-box">
						<p class="reductio-verdict serif">{copy.reasoning.qualifier}</p>
						{#if nextUrl}
							<div class="verdict-action">
								<a class="forward-btn serif" href={nextUrl}>
									<span>{copy.intoEcho} →</span>
								</a>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else if phase === 'idle' || phase === 'holding'}
			<div class="stage-center-hint" aria-hidden="true">
				<p class="hint serif" class:quiet={phase === 'idle'} class:active={phase === 'holding'}>
					{phase === 'idle' ? copy.holdHint : copy.release}
				</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.lab {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		min-height: 0;
		justify-content: space-between;
		position: relative;
	}

	.stepper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.8rem;
		margin-bottom: 0.5rem;
		z-index: 5;
	}

	.step {
		background: none;
		border: 1px solid rgba(212, 165, 116, 0.2);
		border-radius: 999px;
		padding: 0.25rem 0.75rem;
		color: var(--text-dim);
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.step.active {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(212, 165, 116, 0.1);
	}

	.step.passed {
		border-color: rgba(212, 165, 116, 0.4);
		color: var(--text);
	}

	.step-num {
		font-weight: 600;
	}

	.step-arrow {
		color: rgba(212, 165, 116, 0.3);
		font-size: 0.75rem;
	}

	.statement-wrap {
		text-align: center;
		min-height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.say {
		margin: 0;
		font-size: clamp(1.15rem, 2.2vw, 1.45rem);
		color: var(--text);
		max-width: 44rem;
		line-height: 1.4;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
	}

	.stage {
		position: relative;
		flex: 1 1 auto;
		min-height: 180px;
		max-height: 48vh;
		cursor: grab;
		touch-action: none;
		margin: 0.5rem 0;
	}

	.stage.holding {
		cursor: grabbing;
	}

	.stage.falling,
	.stage.done {
		cursor: default;
	}

	.drop {
		position: absolute;
		inset: 2rem 0 0.55rem;
		display: flex;
		justify-content: space-evenly;
		align-items: stretch;
	}

	.col {
		position: relative;
		width: 5.5rem;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.track-label {
		position: absolute;
		top: -1.6rem;
		font-size: 0.72rem;
		color: var(--text-dim);
		letter-spacing: 0.05em;
		white-space: nowrap;
		pointer-events: none;
	}

	.active-label {
		color: var(--accent);
		font-weight: 500;
	}

	.guide {
		position: absolute;
		left: 50%;
		top: 0.5rem;
		bottom: 0.4rem;
		width: 0;
		border-left: 1px dashed color-mix(in srgb, var(--accent) 50%, transparent);
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 1;
	}

	.ball {
		position: absolute;
		left: 50%;
		border-radius: 50%;
		transform: translateX(-50%);
		background: radial-gradient(circle at 35% 30%, #e8c89a, #b07a3a 55%, #6a4a28);
		box-shadow: 0 0.35rem 0.8rem rgba(0, 0, 0, 0.6);
		transition: transform 0.15s ease-out;
		z-index: 2;
	}

	.reticle {
		position: absolute;
		inset: -6px;
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

	/* Bottom-aligned release baseline at 3.3rem from the top:
	   - Heavy (height 2rem): top = 1.3rem -> bottom = 3.3rem
	   - Light (height 1.25rem): top = 2.05rem -> bottom = 3.3rem
	   - Combo: heavy at bottom (top = 1.3rem -> bottom = 3.3rem)
	            light on top (top = 0.2rem -> bottom = 1.45rem)
	            cord tie at junction (top = 1.28rem)
	   At floor (p = 1):
	   - All bottoms reach 100%, completing equal distance (100% - 3.3rem)
	*/
	.heavy {
		width: 2rem;
		height: 2rem;
		top: calc(1.3rem + var(--p, 0) * (100% - 3.3rem));
	}

	.light {
		width: 1.25rem;
		height: 1.25rem;
		top: calc(2.05rem + var(--p, 0) * (100% - 3.3rem));
	}

	.holding .ball {
		transform: translate(-50%, -0.22rem);
	}

	.combo .light {
		top: calc(0.1rem + var(--p, 0) * (100% - 3.3rem));
	}

	.combo .heavy {
		top: calc(1.3rem + var(--p, 0) * (100% - 3.3rem));
	}

	.floor {
		position: absolute;
		bottom: 0.4rem;
		left: 10%;
		right: 10%;
		height: 2px;
		background: color-mix(in srgb, var(--accent) 35%, #2a241c);
		box-shadow: 0 0 8px rgba(212, 165, 116, 0.2);
	}

	.arrow {
		position: absolute;
		left: 50%;
		width: 0.85rem;
		height: 2.2rem;
		transform: translateX(-50%);
		z-index: 3;
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
		top: -2.1rem;
		color: #7ec8c8;
	}

	.down {
		top: 3.45rem;
		color: #c47a4a;
	}

	.merged {
		top: 3.45rem;
		width: 1.1rem;
		height: 2.5rem;
	}

	.stage-center-hint {
		position: absolute;
		top: 48%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 5;
		pointer-events: none;
		text-align: center;
		user-select: none;
		animation: hint-fade 0.5s ease-out;
	}

	@keyframes hint-fade {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-50% + 6px));
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.hint {
		margin: 0;
		color: var(--accent);
		font-size: clamp(1.05rem, 2vw, 1.25rem);
		letter-spacing: 0.06em;
		transition: all 0.2s ease;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
	}

	.hint.quiet {
		opacity: 0.8;
	}

	.hint.active {
		opacity: 1;
		font-weight: 600;
		color: #fff8ec;
		transform: scale(1.06);
		text-shadow: 0 0 20px rgba(212, 165, 116, 0.7);
	}

	.stage-center-action {
		position: absolute;
		top: 48%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 44rem;
		padding: 0 1rem;
		box-sizing: border-box;
		pointer-events: auto;
		animation: center-emerge 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes center-emerge {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-50% + 12px)) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	.step-btn {
		padding: 0.65rem 1.6rem;
		border-radius: 999px;
		background: rgba(18, 14, 10, 0.92);
		border: 1px solid var(--accent);
		color: var(--accent);
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 165, 116, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
	}

	.step-btn:hover {
		transform: translateY(-2px) scale(1.03);
		background: rgba(212, 165, 116, 0.16);
		box-shadow: 0 6px 24px rgba(212, 165, 116, 0.5);
	}

	.collapse-box {
		animation: box-fade 0.8s ease-out;
		text-align: center;
		max-width: 42rem;
		padding: 0.6rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
	}

	@keyframes box-fade {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.reductio-verdict {
		margin: 0;
		font-size: clamp(1rem, 1.8vw, 1.2rem);
		color: var(--accent);
		line-height: 1.45;
		letter-spacing: 0.02em;
	}

	.verdict-action {
		margin-top: 0.2rem;
	}

	.forward-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1.45rem;
		border-radius: 999px;
		background: rgba(18, 14, 10, 0.92);
		border: 1px solid var(--accent);
		color: var(--accent);
		text-decoration: none;
		font-size: 0.95rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 16px rgba(212, 165, 116, 0.3);
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
		animation: btn-fade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
	}

	.forward-btn:hover {
		transform: translateY(-2px) scale(1.03);
		background: rgba(212, 165, 116, 0.16);
		box-shadow: 0 6px 24px rgba(212, 165, 116, 0.5);
	}

	@keyframes btn-fade {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
