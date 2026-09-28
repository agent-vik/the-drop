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
	let samples = $state<{ mark: Mark; t: number }[]>([]);

	let lastNow = 0;
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
		cancelAnimationFrame(frame);
		rolling = true;
		waterStopped = false;
		message = '';
		t = 0;
		p = 0;
		water = 0;
		lastNow = performance.now();
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
		const now = performance.now();
		const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
		lastNow = now;
		t = Math.min(t + dt, duration + flight + rest);
		p = along(t);

		if (t <= duration) {
			placeOnBeam(p);
			if (!waterStopped) water = Math.min(1, t / duration);
		} else {
			placeInFlight(t - duration);
			if (t >= duration + flight && !waterStopped) {
				waterStopped = true;
				if (mode === 'measure') message = copy.invalid;
			}
		}

		if (t >= duration + flight + rest) {
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
		samples = [...samples, { mark: hit, t }];
		message = '';
	}

	function beginOfficial() {
		mode = 'measure';
		hint = true;
		setTimeout(() => (hint = false), 6000);
	}

	const complete = $derived(means.quarter.n >= 1 && means.half.n >= 1 && means.full.n >= 1);
	const tilt = $derived(-12 * (1 - water));
	const dist: Record<Mark, number> = { quarter: 0.25, half: 0.5, full: 1 };
	const plot = { x0: 22, y0: 10, w: 126, h: 68, tmax: 5.6, dmax: 1.12 };

	function tx(time: number) {
		return plot.x0 + (time / plot.tmax) * plot.w;
	}
	function dy(d: number) {
		return plot.y0 + plot.h - (d / plot.dmax) * plot.h;
	}

	const curvePath = $derived.by(() => {
		const pts: string[] = [];
		for (let i = 0; i <= 40; i++) {
			const time = 0.35 + (INCLINE.full - 0.35) * (i / 40);
			const d = (time / INCLINE.full) ** 2;
			pts.push(`${i === 0 ? 'M' : 'L'} ${tx(time).toFixed(2)} ${dy(d).toFixed(2)}`);
		}
		return pts.join(' ');
	});

	const streamGeom = $derived.by(() => {
		const box = 3 / 5;
		const vatW = 64;
		const vatH = vatW * (640 / 320) * box;
		const spoutX = 36 + 0.494 * vatW;
		const spoutY = 0.515 * vatH;
		const scaleW = 76;
		const scaleH = scaleW * (400 / 358) * box;
		const px = 2 + 0.486 * scaleW;
		const py = 34 + 0.22 * scaleH;
		const arm = 0.36 * scaleW;
		const rad = (tilt * Math.PI) / 180;
		const hookY = py + arm * Math.sin(rad) * box;
		const jarW = 0.26 * scaleW;
		const jarH = jarW * (280 / 112) * box;
		const jarTop = hookY - 0.05 * jarH;
		const surfaceY = jarTop + (0.957 - water * 0.671) * jarH;
		return {
			left: spoutX,
			top: spoutY,
			height: Math.max(3, surfaceY - spoutY)
		};
	});

	$effect(() => {
		if (mode === 'reveal') onReady?.();
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === ' ' || e.key === 'Enter') {
			if (!rolling && mode !== 'reveal') {
				e.preventDefault();
				startRun();
			} else if (rolling && !waterStopped) {
				e.preventDefault();
				stopWater();
			}
		}
	}

	function mean(mark: Mark) {
		const cell = means[mark];
		if (!cell.n) return '—';
		return `${(cell.sum / cell.n).toFixed(2)} ×${cell.n}`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

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
			<button
				class="ball"
				style:left="{ballX}%"
				style:top="{ballY}%"
				onpointerdown={startRun}
				onclick={startRun}
				disabled={rolling || mode === 'reveal'}
				aria-label={copy.release}
			>
				{#if !rolling && mode !== 'reveal'}
					<span class="reticle" aria-hidden="true"></span>
				{/if}
			</button>
			{#each grooveMarks as m}
				<span class="tick" style:left="{m.left}%" style:top="{m.top}%">{m.label}</span>
			{/each}
			<button
				class="gate"
				class:ready={!rolling && mode !== 'reveal'}
				onpointerdown={startRun}
				onclick={startRun}
				disabled={rolling || mode === 'reveal'}
				aria-label={copy.release}
			>
				{#if !rolling && mode !== 'reveal'}
					<span class="gate-ripple" aria-hidden="true"></span>
				{/if}
			</button>
		</div>
	</div>
	<div
		class="clock"
		class:active={rolling && !waterStopped}
		style:--w={water}
		style:--tilt="{tilt}deg"
		role="region"
		aria-label="water clock"
		onpointerdown={() => {
			if (rolling && !waterStopped) stopWater();
		}}
	>
		<div class="vat">
			<img class="vat-plate" src="/images/water-vat.webp" alt="" />
			<button
				class="spout"
				class:active={rolling && !waterStopped}
				onpointerdown={stopWater}
				onclick={stopWater}
				disabled={!rolling || waterStopped}
				aria-label="stop water"
			>
				{#if rolling && !waterStopped}
					<span class="spout-ring ring-1" aria-hidden="true"></span>
					<span class="spout-ring ring-2" aria-hidden="true"></span>
					<span class="spout-core" aria-hidden="true"></span>
				{/if}
			</button>
		</div>
		{#if rolling && !waterStopped}
			<span
				class="stream"
				style:left="{streamGeom.left}%"
				style:top="{streamGeom.top}%"
				style:height="{streamGeom.height}%"
				aria-hidden="true"
			></span>
		{/if}
		<div class="scale">
			<img class="post" src="/images/balance-post.webp" alt="" />
			<div class="rig">
				<span class="arm" aria-hidden="true"></span>
				<img class="hang left" src="/images/balance-weights.webp" alt="" />
				<div class="hang right">
					<svg class="fill-svg" viewBox="0 0 112 280" aria-hidden="true">
						<defs>
							<clipPath id="jar-inner-chamber">
								<path
									d="M 8.5 96
									   L 8.5 258
									   C 8.5 264, 25 268, 56 268
									   C 87 268, 103.5 264, 103.5 258
									   L 103.5 96
									   C 103.5 86, 92 74, 70 72
									   L 42 72
									   C 20 74, 8.5 86, 8.5 96 Z"
								/>
							</clipPath>
							<linearGradient id="jar-water-grad" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stop-color="#8da89e" stop-opacity="0.9" />
								<stop offset="100%" stop-color="#5f776d" stop-opacity="0.95" />
							</linearGradient>
						</defs>
						{#if water > 0}
							<g clip-path="url(#jar-inner-chamber)">
								<rect
									class="water-body"
									x="0"
									y="{268 - water * 188}"
									width="112"
									height="{water * 188 + 10}"
									fill="url(#jar-water-grad)"
								/>
								<line
									class="water-meniscus"
									x1="6"
									x2="106"
									y1="{268 - water * 188}"
									y2="{268 - water * 188}"
									stroke="#c2ded5"
									stroke-width="1.2"
									stroke-opacity="0.85"
								/>
							</g>
						{/if}
					</svg>
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
			<button class="act" onclick={beginOfficial}>{copy.startMeasure}</button>
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
				<button class="act" onclick={() => (mode = 'reveal')}>{copy.drawCurve}</button>
			{/if}
		{/if}
	</div>
	{#if mode === 'reveal'}
		<div class="veil">
			<svg viewBox="0 0 160 100" aria-hidden="true">
				<text class="axis" x={plot.x0} y="96">t</text>
				<text class="axis" x="6" y={plot.y0 + 4}>d</text>
				{#each samples as s, i (i)}
					{@const meanT = means[s.mark].sum / means[s.mark].n}
					<circle
						class="pale"
						cx={tx(s.t)}
						cy={dy(dist[s.mark])}
						r="1.7"
						style:--drift="{(s.t - meanT) * 18}px"
						style:animation-delay="{0.08 * i}s"
					/>
				{/each}
				{#each (['quarter', 'half', 'full'] as const) as mark}
					{#if means[mark].n}
						<circle class="bright" cx={tx(means[mark].sum / means[mark].n)} cy={dy(dist[mark])} r="2.6" />
					{/if}
				{/each}
				<path class="curve" d={curvePath} />
				<text class="law" x="28" y="18">d ∝ t²</text>
			</svg>
			<p class="law-line serif">{copy.curveLaw}</p>
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
		grid-template-rows: minmax(0, 1fr) auto;
		gap: 0.55rem 0.8rem;
		align-items: stretch;
		overflow: hidden;
	}

	.beam {
		position: relative;
		grid-column: 1 / -1;
		grid-row: 1;
		width: 100%;
		min-height: 0;
		display: grid;
		place-items: center;
	}

	.plate {
		position: relative;
		height: 100%;
		width: auto;
		max-width: 100%;
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
		border: 0;
		padding: 0;
		background: radial-gradient(circle at 35% 30%, #e8c89a, #b07a3a 62%, #6a4a28);
		transform: translate(-50%, -50%);
		z-index: 2;
		box-shadow: 0 0.2rem 0.4rem #0006;
		cursor: pointer;
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

	.ball:hover .reticle {
		transform: scale(1.02);
		border: 1.5px solid var(--accent);
		box-shadow: 0 0 10px var(--accent);
		opacity: 1;
		animation: none;
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
		border: 0;
		z-index: 3;
		cursor: pointer;
	}

	.gate.ready:hover {
		filter: brightness(1.3);
	}

	.gate-ripple {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 18px;
		height: 32px;
		transform: translate(-50%, -50%);
		border-radius: 3px;
		border: 1px solid var(--accent);
		opacity: 0;
		pointer-events: none;
		animation: gate-pulse 2.2s cubic-bezier(0.2, 0.8, 0.3, 1) infinite;
	}

	@keyframes gate-pulse {
		0% {
			transform: translate(-50%, -50%) scale(0.85);
			opacity: 0.85;
		}
		65% {
			transform: translate(-50%, -50%) scale(1.35);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.35);
			opacity: 0;
		}
	}

	.clock {
		grid-column: 2;
		grid-row: 1;
		position: relative;
		z-index: 3;
		width: 100%;
		height: auto;
		max-height: 100%;
		aspect-ratio: 3 / 5;
		justify-self: end;
		align-self: start;
		overflow: visible;
		--tilt: -12deg;
		--arm: 36%;
		--pivot-x: 48.6%;
		--pivot-y: 22%;
	}

	.clock.active {
		cursor: pointer;
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
		left: 49.4%;
		top: 53%;
		width: 28%;
		height: 14%;
		min-width: 58px;
		min-height: 58px;
		border-radius: 50%;
		border: 0;
		background: transparent;
		transform: translate(-50%, -50%);
		z-index: 20;
		cursor: default;
		display: grid;
		place-items: center;
		pointer-events: auto;
	}

	.spout.active {
		cursor: pointer;
	}

	.spout-core {
		position: absolute;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #fff 0%, var(--accent) 55%, #8a5a28 100%);
		box-shadow: 0 0 12px var(--accent), 0 0 20px color-mix(in srgb, var(--accent) 75%, transparent);
		animation: core-pulse 1.2s ease-in-out infinite alternate;
		pointer-events: none;
		z-index: 2;
	}

	.spout-ring {
		position: absolute;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 1.5px solid var(--accent);
		pointer-events: none;
		opacity: 0;
		animation: spout-ripple 1.6s cubic-bezier(0.1, 0.7, 0.2, 1) infinite;
	}

	.ring-2 {
		animation-delay: 0.8s;
	}

	@keyframes core-pulse {
		0% {
			transform: scale(0.9);
			filter: brightness(0.95);
		}
		100% {
			transform: scale(1.22);
			filter: brightness(1.3);
		}
	}

	@keyframes spout-ripple {
		0% {
			transform: scale(0.65);
			opacity: 0.95;
		}
		75% {
			transform: scale(2.2);
			opacity: 0;
		}
		100% {
			transform: scale(2.2);
			opacity: 0;
		}
	}

	.spout.active:hover .spout-core {
		transform: scale(1.35);
		filter: brightness(1.4);
		box-shadow: 0 0 16px #fff, 0 0 24px var(--accent);
	}

	.stream {
		position: absolute;
		width: 0.16rem;
		transform: translateX(-50%);
		background: #7d958c;
		border-radius: 99px;
		pointer-events: none;
		z-index: 2;
		opacity: 0.9;
	}

	.scale {
		position: absolute;
		left: 2%;
		top: 34%;
		width: 76%;
		z-index: 3;
		overflow: visible;
		pointer-events: none;
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
		pointer-events: none;
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

	.fill-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
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
		grid-row: 2;
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

	.act {
		border: 0;
		padding: 0.15rem 0;
		color: var(--accent);
		font-size: 0.95rem;
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

		.tick {
			font-size: 1.2rem;
		}

		.clock {
			max-height: 100%;
		}
	}

	.veil {
		position: absolute;
		inset: 0;
		z-index: 8;
		background: color-mix(in srgb, #1f160d 62%, transparent);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 1rem;
	}

	.veil svg {
		width: min(100%, 34rem);
		height: auto;
		overflow: visible;
	}

	.pale {
		fill: color-mix(in srgb, var(--accent) 55%, transparent);
		animation: gather 1.35s ease-out both;
	}

	.bright {
		fill: var(--accent);
		opacity: 0;
		animation: rise 0.7s 1.25s ease both;
	}

	.curve {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.15;
		stroke-linecap: round;
		stroke-dasharray: 280;
		stroke-dashoffset: 280;
		animation: draw 1.7s 2.5s ease forwards;
	}

	.law {
		fill: var(--accent);
		font-size: 7px;
		opacity: 0;
		animation: rise 0.8s 2.1s ease both;
	}

	.axis {
		fill: color-mix(in srgb, var(--accent) 55%, transparent);
		font-size: 5px;
	}

	.law-line {
		margin: 0;
		color: var(--accent);
		font-size: clamp(1.05rem, 2vw, 1.35rem);
		opacity: 0;
		animation: rise 0.8s 2.15s ease both;
	}

	@keyframes gather {
		from {
			opacity: 0;
			transform: translateX(var(--drift, 0px));
		}
		to {
			opacity: 0.75;
			transform: none;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
