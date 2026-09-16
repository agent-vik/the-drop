<script lang="ts">
	import type { Copy } from '$lib/i18n';

	let { copy, onOpened }: { copy: Copy; onOpened?: () => void } = $props();

	const kinds = ['folio', 'stack', 'annals', 'print', 'print thick'] as const;
	const plates: Record<(typeof kinds)[number], string> = {
		folio: '/images/archive-folio.webp',
		stack: '/images/archive-stack.webp',
		annals: '/images/archive-annals.webp',
		print: '/images/archive-print.webp',
		'print thick': '/images/archive-print-thick.webp'
	};
	let index = $state(0);
	let crossing = $state(false);
	let seen = $state<Set<number>>(new Set([0]));
	let released = $state(false);

	const last = $derived(index === copy.archive.length - 1);
	const item = $derived(copy.archive[index]);
	const ready = $derived(seen.has(0) && (seen.has(3) || seen.has(4)));

	$effect(() => {
		if (ready && !released) {
			released = true;
			onOpened?.();
		}
	});

	function go(next: number) {
		if (crossing) return;
		const dark = (index === 2 && next === 3) || (index === 3 && next === 2);
		if (dark) {
			crossing = true;
			window.setTimeout(() => {
				index = next;
				seen = new Set([...seen, next]);
				crossing = false;
			}, 1100);
			return;
		}
		index = next;
		seen = new Set([...seen, next]);
	}
</script>

<div class="walk" class:dark={crossing}>
	{#if !crossing}
		{#if index > 0}
			<button class="peek prev" onclick={() => go(index - 1)} aria-label="previous">
				<div class="obj {kinds[index - 1]}">
					<img src={plates[kinds[index - 1]]} alt="" />
				</div>
			</button>
		{/if}

		<div class="current">
			<div class="lamp"></div>
			<div class="obj {kinds[index]}">
				<img src={plates[kinds[index]]} alt="" />
			</div>
			<p class="fact serif">{item.fact}</p>
			<p class="detail">{item.detail}</p>
		</div>

		{#if !last}
			<button class="peek next glow" onclick={() => go(index + 1)} aria-label="next">
				<div class="obj {kinds[index + 1]}">
					<img src={plates[kinds[index + 1]]} alt="" />
				</div>
			</button>
		{/if}
	{/if}
</div>

<style>
	.walk {
		display: grid;
		grid-template-columns: minmax(5.5rem, 14vw) minmax(0, 1fr) minmax(5.5rem, 14vw);
		align-items: center;
		min-height: 0;
		width: 100%;
		transition: background-color 0.8s ease;
	}

	.walk.dark {
		background: #070502;
		justify-content: center;
	}

	.current {
		position: relative;
		grid-column: 2;
		min-width: 0;
		text-align: center;
		padding: 1.5rem 1rem 0.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.lamp {
		position: absolute;
		inset: -8% -12%;
		background: radial-gradient(circle at 50% 38%, #d4a57440, transparent 58%);
		pointer-events: none;
	}

	.obj {
		width: min(28vw, 16rem);
		height: min(38vw, 22rem);
		margin: 0 auto;
		background: none;
		border: 0;
		padding: 0;
		filter: drop-shadow(0 1.1rem 1.8rem #0008);
	}

	.obj img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
	}

	.annals {
		width: min(38vw, 24rem);
		height: min(28vw, 16rem);
	}

	.thick {
		width: min(24vw, 15rem);
		height: min(36vw, 22rem);
	}

	.peek {
		opacity: 0.38;
		border: 0;
		background: none;
		padding: 0;
		min-width: 44px;
		min-height: 44px;
		cursor: pointer;
	}

	.peek.prev {
		grid-column: 1;
		justify-self: start;
	}

	.peek.next {
		grid-column: 3;
		justify-self: end;
	}

	.peek .obj {
		width: min(14vw, 8.5rem);
		height: min(20vw, 12rem);
		filter: drop-shadow(0 0.5rem 1rem #0006);
	}

	.peek.next.glow .obj {
		animation: edge 2.6s ease-in-out infinite;
	}

	@keyframes edge {
		50% {
			filter: brightness(1.35) drop-shadow(0 0.5rem 1rem #0006);
			opacity: 1;
		}
	}

	.fact {
		position: relative;
		margin: 1.4rem 0 0;
		font-size: clamp(1.15rem, 2vw, 1.45rem);
		line-height: 1.4;
		max-width: 28rem;
	}

	.detail {
		position: relative;
		margin: 0.6rem 0 0;
		font-size: 0.95rem;
		color: var(--text-dim);
		line-height: 1.5;
		max-width: 32rem;
	}
</style>
