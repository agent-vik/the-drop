<script lang="ts">
	import { roomPath, type Locale } from '$lib/rooms';
	import type { Copy } from '$lib/i18n';

	let { copy, locale }: { copy: Copy; locale: Locale } = $props();

	let side = $state<'pick' | 'legend' | 'method' | 'join'>('pick');
	let step = $state(0);

	const nodes = $derived(side === 'legend' ? copy.exitLegend : copy.exitMethod);

	let walked = $state<'legend' | 'method' | null>(null);

	function enter(which: 'legend' | 'method') {
		walked = which;
		side = which;
		step = 0;
	}

	function next() {
		if (step < nodes.length - 1) step += 1;
		else side = 'join';
	}
</script>

{#if side === 'pick'}
	<div class="fork">
		<button class="opening" onclick={() => enter('legend')}>
			<span class="mouth"></span>
			<span class="serif label">{copy.legendDoor}</span>
		</button>
		<button class="opening" onclick={() => enter('method')}>
			<span class="mouth"></span>
			<span class="serif label">{copy.methodDoor}</span>
		</button>
	</div>
{:else if side === 'join'}
	<div class="join">
		<a class="opening restart" href={roomPath(locale, '')}>
			<span class="mouth"></span>
			<span class="serif label">{copy.startAgain}</span>
		</a>
		<button class="quiet" onclick={() => enter(walked === 'legend' ? 'method' : 'legend')}
			>{copy.otherPath}</button
		>
	</div>
{:else}
	<div class="hall">
		{#if step > 0}
			<button class="peek back" onclick={() => (step -= 1)} aria-label="previous">
				<span class="year mono">{nodes[step - 1].year}</span>
			</button>
		{:else}
			<span class="peek spacer"></span>
		{/if}
		<div class="now">
			<div class="lamp"></div>
			<p class="year mono">{nodes[step].year}</p>
			<p class="serif fact">{nodes[step].line}</p>
		</div>
		<button class="peek ahead glow" onclick={next} aria-label="next">
			<span class="year mono">{step < nodes.length - 1 ? nodes[step + 1].year : '→'}</span>
		</button>
	</div>
{/if}

<style>
	.fork,
	.hall,
	.join {
		width: min(100%, 58rem);
		min-height: 0;
		align-self: center;
	}

	.fork {
		display: flex;
		gap: clamp(1.2rem, 5vw, 3.2rem);
		align-items: stretch;
	}

	.opening {
		flex: 1;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		min-height: min(56vh, 30rem);
		padding: 0 0 1.4rem;
		color: var(--accent);
		text-align: center;
		background: none;
	}

	.mouth {
		position: absolute;
		inset: 0 12% 18%;
		border-radius: 50% 50% 4px 4px / 18% 18% 4px 4px;
		background:
			radial-gradient(ellipse at 50% 78%, #d4a57422, transparent 42%),
			linear-gradient(180deg, #070604 0%, #120e0a 55%, #050403 100%);
		box-shadow:
			inset 0 0 4rem #000d,
			inset 0 -2.4rem 2.8rem #d4a57414,
			0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent);
	}

	.opening:hover .mouth,
	.opening:focus-visible .mouth {
		box-shadow:
			inset 0 0 4rem #000d,
			inset 0 -2.8rem 3.2rem #d4a57428,
			0 0 1.6rem #d4a57422;
	}

	.label {
		position: relative;
		z-index: 1;
		font-size: clamp(1.2rem, 2.4vw, 1.7rem);
		padding: 0 0.8rem;
	}

	.restart {
		width: min(100%, 22rem);
		min-height: min(48vh, 24rem);
		text-decoration: none;
	}

	.restart:hover {
		text-decoration: none;
	}

	.join {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.4rem;
	}

	.hall {
		display: flex;
		gap: clamp(0.8rem, 3vw, 2rem);
		align-items: stretch;
	}

	.now {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		min-height: min(42vh, 22rem);
		padding: 2.4rem 1rem;
	}

	.lamp {
		position: absolute;
		inset: 8% 10%;
		background: radial-gradient(ellipse at 50% 42%, #d4a57430, transparent 58%);
		pointer-events: none;
	}

	.year {
		position: relative;
		color: var(--accent);
		letter-spacing: 0.08em;
		margin: 0;
	}

	.fact {
		position: relative;
		margin: 0.7rem 0 0;
		font-size: clamp(1.25rem, 2.4vw, 1.7rem);
		max-width: 22rem;
	}

	.peek {
		flex: 0 0 auto;
		width: min(18vw, 7.5rem);
		align-self: stretch;
		min-height: 44px;
		opacity: 0.38;
		color: var(--text-dim);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 0 0.4rem 1.6rem;
		background:
			radial-gradient(ellipse at 50% 80%, #d4a57418, transparent 46%),
			linear-gradient(180deg, #080705, #110d09);
		box-shadow: inset 0 0 2.4rem #000c;
		clip-path: polygon(18% 0, 82% 0, 100% 100%, 0 100%);
	}

	.peek.spacer {
		opacity: 0;
		pointer-events: none;
	}

	.peek .year {
		font-size: 0.75rem;
		color: inherit;
	}

	.peek.back {
		justify-content: flex-start;
		padding-bottom: 1.6rem;
	}

	.peek.ahead.glow {
		animation: edge 2.6s ease-in-out infinite;
	}

	@keyframes edge {
		50% {
			opacity: 0.92;
			color: var(--accent);
			box-shadow:
				inset 0 0 2.4rem #000c,
				0 0 1.2rem #d4a5741f;
		}
	}

	.quiet {
		opacity: 0.4;
		font-size: 0.8rem;
		color: var(--text-dim);
	}

	@media (max-width: 42rem) {
		.fork {
			flex-direction: column;
			gap: 1rem;
		}

		.opening {
			min-height: min(34vh, 16rem);
		}

		.mouth {
			inset: 0 18% 22%;
		}

		.hall {
			flex-direction: column;
			align-items: center;
		}

		.peek {
			width: min(72%, 16rem);
			min-height: 3.4rem;
			clip-path: none;
			border-radius: 2px;
			align-items: center;
			padding: 0.6rem;
		}
	}
</style>
