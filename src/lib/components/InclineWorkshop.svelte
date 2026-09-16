<script lang="ts">
	import { INCLINE } from '$lib/physics';
	import type { Copy } from '$lib/i18n';

	type Mode = 'practice' | 'measure' | 'reveal';
	type Mark = 'quarter' | 'half' | 'full';

	let { copy, onReady }: { copy: Copy; onReady?: () => void } = $props();

	let mode = $state<Mode>('practice');
	let rolling = $state(false);
	let t = $state(0);
	let p = $state(0);
	let water = $state(0);
	let waterStopped = $state(false);
	let hint = $state(false);
	let message = $state('');
	let means = $state<Record<Mark, { sum: number; n: number }>>({
		quarter: { sum: 0, n: 0 },
		half: { sum: 0, n: 0 },
		full: { sum: 0, n: 0 }
	});

	let start = 0;
	let frame = 0;
	const duration = INCLINE.full;
	const flight = INCLINE.flight;
	const rest = INCLINE.rest;
	const windowSize = 0.07;

	/** Plate percents, measured on incline-beam.webp (768×1365 source). */
	const plate = { w: 768, h: 1365 };
	const beam = { x: 17.32, y: 8.0, dx: 53.83, dy: 77.5 };
	const tip = { x: beam.x + beam.dx, y: beam.y + beam.dy };
	const dish = { x: 75.5, y: 95.0 };
	const tipPx = { x: (tip.x / 100) * plate.w, y: (tip.y / 100) * plate.h };
	const vx = (((dish.x - tip.x) / 100) * plate.w) / flight;
	const vy0 = vx * ((beam.dy / 100) * plate.h) / ((beam.dx / 100) * plate.w);
	const g =
		(2 * (((dish.y - tip.y) / 100) * plate.h - vy0 * flight)) / (flight * flight);

	const alongPx = { x: (beam.dx / 100) * plate.w, y: (beam.dy / 100) * plate.h };
	const hyp = Math.hypot(alongPx.x, alongPx.y);
	const nx = alongPx.y / hyp;
	const ny = -alongPx.x / hyp;
	const grooveMarks = (
		[
			{ u: 0.25, label: '¼' },
			{ u: 0.5, label: '½' },
			{ u: 1, label: '1' }
		] as const
	).map(({ u, label }) => {
		const cx = ((beam.x + u * beam.dx) / 100) * plate.w;
		const cy = ((beam.y + u * beam.dy) / 100) * plate.h;
		const inner = 46 + 24 * u;
		const outer = 40 + 22 * u;
		return {
			label,
			x1: cx - nx * inner,
			y1: cy - ny * inner,
			x2: cx + nx * outer,
			y2: cy + ny * outer,
			width: 3.2 + 0.8 * u,
			left: ((cx + nx * (outer + 16)) / plate.w) * 100,
			top: ((cy + ny * (outer + 10)) / plate.h) * 100
		};
	});

	let ballX = $state(beam.x);
	let ballY = $state(beam.y);

	function placeOnBeam(alongBeam: number) {
		const u = Math.min(alongBeam, 1);
		ballX = beam.x + u * beam.dx;
		ballY = beam.y + u * beam.dy;
	}

	function placeInFlight(tf: number) {
		const tFly = Math.min(Math.max(tf, 0), flight);
		ballX = ((tipPx.x + vx * tFly) / plate.w) * 100;
		ballY = ((tipPx.y + vy0 * tFly + 0.5 * g * tFly * tFly) / plate.h) * 100;
	}

	function along(elapsed: number) {
		return (elapsed / duration) ** 2;
	}

	function startRun() {
		if (rolling || mode === 'reveal') return;
		rolling = true;
		waterStopped = false;
		message = '';
		t = 0;
		p = 0;
		water = 0;
		start = performance.now();
		placeOnBeam(0);
		tick();
	}

	function finishRun(text = '') {
		cancelAnimationFrame(frame);
		rolling = false;
		if (text) message = text;
		resetRun();
	}

	function resetRun() {
		t = 0;
		p = 0;
		water = 0;
		waterStopped = false;
		placeOnBeam(0);
		if (mode !== 'measure') message = '';
	}

	function tick() {
		const elapsed = (performance.now() - start) / 1000;
		t = elapsed;
		p = along(elapsed);

		if (elapsed <= duration) {
			placeOnBeam(p);
			if (!waterStopped) water = Math.min(1, elapsed / duration);
		} else {
			placeInFlight(elapsed - duration);
			if (elapsed >= duration + flight && !waterStopped) {
				waterStopped = true;
				if (mode === 'measure') message = copy.invalid;
			}
		}

		if (elapsed >= duration + flight + rest) {
			if (mode === 'measure' && !waterStopped && message === '') finishRun(copy.invalid);
			else finishRun();
			return;
		}
		frame = requestAnimationFrame(tick);
	}

	function markAt(pos: number): Mark | null {
		const hits: { mark: Mark; at: number }[] = [
			{ mark: 'quarter', at: 0.25 },
			{ mark: 'half', at: 0.5 },
			{ mark: 'full', at: 1 }
		];
		return hits.find((h) => Math.abs(pos - h.at) <= windowSize)?.mark ?? null;
	}

	function stopWater() {
		if (!rolling || waterStopped) return;
		waterStopped = true;
		water = Math.min(1, t / duration);
		if (mode !== 'measure') return;

		const pos = along(t);
		if (pos < 0.25 - windowSize) {
			message = copy.tooEarly;
			return;
		}
		const hit = markAt(Math.min(pos, 1));
		if (!hit || pos > 1 + windowSize) {
			message = copy.invalid;
			return;
		}
		means[hit] = {
			sum: means[hit].sum + t,
			n: means[hit].n + 1
		};
		means = { ...means };
		message = '';
	}

	function beginOfficial() {
		mode = 'measure';
		hint = true;
		setTimeout(() => (hint = false), 6000);
	}

	const complete = $derived(means.quarter.n >= 1 && means.half.n >= 1 && means.full.n >= 1);
	const tilt = $derived(-12 * (1 - water));

	$effect(() => {
		if (mode === 'reveal') onReady?.();
	});

	function mean(mark: Mark) {
		const cell = means[mark];
		if (!cell.n) return '—';
		return `${(cell.sum / cell.n).toFixed(2)} ×${cell.n}`;
	}
</script>

<div class="shop">
	<div class="beam">
		<div class="plate">
			<img class="plank" src="/images/incline-beam.webp" alt="" />
			<svg class="marks" viewBox="0 0 {plate.w} {plate.h}" aria-hidden="true">
				{#each grooveMarks as m}
					<line
						x1={m.x1}
						y1={m.y1}
						x2={m.x2}
						y2={m.y2}
						stroke-width={m.width}
					/>
				{/each}
			</svg>
			<div class="ball" style:left="{ballX}%" style:top="{ballY}%"></div>
			{#each grooveMarks as m}
				<span class="tick" style:left="{m.left}%" style:top="{m.top}%">{m.label}</span>
			{/each}
			<button class="gate" onclick={startRun} disabled={rolling || mode === 'reveal'} aria-label="release"></button>
		</div>
	</div>
	<div class="clock" style:--w={water} style:--tilt="{tilt}deg">
		<div class="vat">
			<img class="vat-plate" src="/images/water-vat.webp" alt="" />
			<button class="spout" onclick={stopWater} disabled={!rolling || waterStopped} aria-label="stop water"></button>
			{#if rolling && !waterStopped}
				<span class="stream" aria-hidden="true"></span>
			{/if}
		</div>
		<div class="scale">
			<img class="post" src="/images/balance-post.webp" alt="" />
			<div class="rig">
				<span class="arm" aria-hidden="true"></span>
				<img class="hang left" src="/images/balance-weights.webp" alt="" />
				<div class="hang right">
					<div class="fill"></div>
					<img src="/images/balance-jar.webp" alt="" />
				</div>
			</div>
		</div>
	</div>
	<div class="desk">
		{#if hint}
			<p class="hint">{copy.aimHint}</p>
		{/if}
		{#if message}
			<p class="hint">{message}</p>
		{/if}
		{#if mode === 'practice'}
			<button class="go" onclick={beginOfficial}>{copy.startMeasure}</button>
		{/if}
		{#if mode === 'measure'}
			<table class="mono">
				<tbody>
					<tr><td>¼</td><td>{mean('quarter')}</td></tr>
					<tr><td>½</td><td>{mean('half')}</td></tr>
					<tr><td>1</td><td>{mean('full')}</td></tr>
				</tbody>
			</table>
			{#if complete}
				<button class="go" onclick={() => (mode = 'reveal')}>{copy.drawCurve}</button>
			{/if}
		{/if}
	</div>
	{#if mode === 'reveal'}
		<div class="veil">
			<svg viewBox="0 0 120 80" aria-hidden="true">
				<path d="M8 72 Q 40 40 70 22 T 112 8" fill="none" stroke="#d4a574" stroke-width="1.2" />
				<text x="10" y="12" fill="#d4a574" font-size="6">d ∝ t²</text>
			</svg>
		</div>
	{/if}
</div>

<style>
	.shop {
		position: relative;
		width: 100%;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(10.5rem, 15.5rem);
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 0.55rem 0.8rem;
		align-items: stretch;
		overflow: visible;
	}

	.beam {
		position: relative;
		grid-column: 1 / -1;
		grid-row: 1 / 3;
		width: 100%;
		min-height: 0;
		display: grid;
		place-items: center;
	}

	.plate {
		position: relative;
		width: min(100%, calc(min(72vh, 40rem) * 768 / 1365));
		aspect-ratio: 768 / 1365;
	}

	.plank {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
		filter: drop-shadow(0 1.2rem 2rem #0006);
	}

	.marks {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
		z-index: 1;
	}

	.marks line {
		stroke: #2a1608;
		stroke-linecap: square;
		vector-effect: non-scaling-stroke;
		filter: drop-shadow(0 0 0.6px #efe4d0);
	}

	.ball {
		position: absolute;
		width: 1.15rem;
		height: 1.15rem;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #e8c89a, #b07a3a 62%, #6a4a28);
		transform: translate(-50%, -50%);
		z-index: 2;
		box-shadow: 0 0.2rem 0.4rem #0006;
	}

	.tick {
		position: absolute;
		font-size: 1.45rem;
		font-weight: 500;
		line-height: 1;
		color: var(--accent);
		text-shadow: 0 0.08rem 0.35rem #000c;
		pointer-events: none;
		z-index: 2;
		transform: translate(0, -50%);
	}

	.gate {
		position: absolute;
		left: 16.2%;
		top: 6.4%;
		width: 8px;
		height: 3.2%;
		min-width: 0;
		min-height: 0;
		padding: 1.1rem;
		margin: -1.1rem;
		color: transparent;
		background: var(--accent);
		background-clip: content-box;
		border-radius: 1px;
		z-index: 3;
	}

	.clock {
		grid-column: 2;
		grid-row: 1 / 3;
		position: relative;
		z-index: 3;
		width: 100%;
		aspect-ratio: 3 / 5;
		max-height: min(62vh, 30rem);
		justify-self: end;
		align-self: start;
		overflow: visible;
		--tilt: -12deg;
		--arm: 36%;
		--pivot-x: 48.6%;
		--pivot-y: 22%;
	}

	.vat {
		position: absolute;
		left: 36%;
		top: 0;
		width: 64%;
		z-index: 1;
		overflow: visible;
	}

	.vat-plate,
	.post,
	.hang,
	.hang img {
		width: 100%;
		height: auto;
		display: block;
		pointer-events: none;
		user-select: none;
	}

	.vat-plate {
		filter: drop-shadow(0 1rem 1.6rem #0005);
	}

	.spout {
		position: absolute;
		left: 50%;
		top: 46%;
		width: 22%;
		height: 10%;
		min-width: 44px;
		min-height: 44px;
		border-radius: 50%;
		border: 0;
		background: transparent;
		transform: translate(-50%, -20%);
		z-index: 4;
	}

	.stream {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 0.18rem;
		height: 42%;
		transform: translateX(-50%);
		background: #7d958c;
		border-radius: 99px;
		pointer-events: none;
		z-index: 2;
		opacity: 0.88;
	}

	.scale {
		position: absolute;
		left: 2%;
		top: 34%;
		width: 76%;
		z-index: 3;
		overflow: visible;
	}

	.post {
		filter: drop-shadow(0 0.8rem 1.2rem #0005);
	}

	.scale::after {
		content: '';
		position: absolute;
		left: var(--pivot-x);
		top: var(--pivot-y);
		width: 0.42rem;
		height: 0.42rem;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #e8c898, #8a6230);
		transform: translate(-50%, -50%);
		z-index: 4;
		pointer-events: none;
	}

	.rig {
		position: absolute;
		inset: 0;
		transform: rotate(var(--tilt));
		transform-origin: var(--pivot-x) var(--pivot-y);
		transition: transform 0.4s ease-out;
		z-index: 3;
	}

	.arm {
		position: absolute;
		left: calc(var(--pivot-x) - var(--arm));
		top: var(--pivot-y);
		width: calc(2 * var(--arm));
		height: 0.34rem;
		transform: translateY(-50%);
		border-radius: 2px;
		background: linear-gradient(#e0c080, #b88948 42%, #8a5a28 72%, #6a4018);
		box-shadow: 0 0.08rem 0.18rem #0005;
	}

	.hang {
		position: absolute;
		top: var(--pivot-y);
		transform: translate(-50%, -5%) rotate(calc(-1 * var(--tilt)));
		transform-origin: 50% 0;
	}

	.left {
		left: calc(var(--pivot-x) - var(--arm));
		width: 30%;
	}

	.right {
		left: calc(var(--pivot-x) + var(--arm));
		width: 26%;
	}

	.fill {
		position: absolute;
		left: 20%;
		top: 26%;
		width: 60%;
		height: 60%;
		border-radius: 18% 18% 30% 30%;
		background: linear-gradient(#7d958ccc, #6a8278ee) 0 100% / 100% calc(var(--w) * 86%) no-repeat;
		background-color: transparent;
		pointer-events: none;
		z-index: 0;
	}

	.right img {
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 0.4rem 0.6rem #0004);
	}

	.desk {
		grid-column: 1;
		grid-row: 3;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.45rem;
	}

	.hint {
		margin: 0;
		color: var(--accent);
		font-size: 0.9rem;
	}

	.go {
		border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
		padding: 0.55rem 1rem;
		color: var(--accent);
	}

	table {
		margin: 0;
		color: var(--text-dim);
		font-size: 0.9rem;
		border-spacing: 0.8rem 0.25rem;
	}

	@media (max-width: 42rem) {
		.shop {
			grid-template-columns: minmax(0, 1fr) minmax(7.2rem, 11rem);
		}

		.plate {
			width: min(100%, calc(min(58vh, 28rem) * 768 / 1365));
		}

		.tick {
			font-size: 1.2rem;
		}

		.clock {
			max-height: 42vh;
		}
	}

	.veil {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, #1f160d 55%, transparent);
		display: grid;
		place-items: center;
	}

	svg {
		width: min(100%, 22rem);
	}
</style>
