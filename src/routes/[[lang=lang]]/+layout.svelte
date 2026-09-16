<script lang="ts">
	import { page } from '$app/state';
	import { film, filmEnded, filmFailed, registerFilm } from '$lib/film.svelte';
	import { rooms, roomByPath, roomPath } from '$lib/rooms';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const segment = $derived(page.url.pathname.replace(/^\/zh\/?/, '/').replace(/^\//, ''));
	const room = $derived(roomByPath(segment.split('/')[0] ?? ''));
	const copy = $derived(data.copy);

	function otherLocaleHref(path: string) {
		return roomPath(copy.otherLang, path);
	}
</script>

<svelte:head>
	<title>{copy.rooms[room.id].title} · {copy.museum}</title>
</svelte:head>

<div class="museum" data-room={room.id} style:--room-bg={room.background}>
	<header class="chrome">
		<p class="brand serif">{copy.museum}</p>
		<nav class="progress" aria-label="Galleries">
			{#each rooms as step (step.id)}
				<a
					href={roomPath(data.locale, step.path)}
					class="mono"
					class:current={step.id === room.id}
					aria-current={step.id === room.id ? 'page' : undefined}
				>
					{step.gallery === 'exit' ? '↗' : step.gallery}
				</a>
			{/each}
		</nav>
		<a class="lang" href={otherLocaleHref(room.path)}>{copy.langName}</a>
	</header>

	<div class="grain" aria-hidden="true"></div>
	<div class="atmosphere" class:hush={room.id === 'vacuum'}></div>
	<div class="moon-plate" class:show={room.id === 'vacuum'} class:dim={room.id === 'vacuum' && !film.ended}></div>
	<video
		class="film"
		class:show={room.id === 'vacuum' && !film.ended}
		style:--film-ratio={film.ratio}
		use:registerFilm
		playsinline
		preload="auto"
		onended={filmEnded}
		onerror={filmFailed}
	>
		<source src="/video/apollo15-hammer-feather.mp4" type="video/mp4" />
	</video>
	<main class="stage" class:watch={room.id === 'vacuum'} class:at-tower={room.id === 'legend' || room.id === 'echo'}>
		{@render children()}
	</main>
</div>

<style>
	.museum {
		min-height: 100dvh;
		background: var(--room-bg);
		transition: background-color 0.8s ease;
		position: relative;
	}

	.chrome {
		position: fixed;
		inset: 0 0 auto;
		z-index: 2;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: var(--system-pad);
		pointer-events: none;
	}

	.chrome a,
	.chrome p {
		pointer-events: auto;
	}

	.brand {
		margin: 0;
		font-size: 1.15rem;
		letter-spacing: 0.04em;
	}

	.progress {
		display: flex;
		gap: 0.7rem;
		letter-spacing: 0.02em;
	}

	.progress a {
		color: var(--text-dim);
		opacity: 0.55;
		font-size: 0.75rem;
	}

	.progress a.current {
		color: var(--accent);
		opacity: 1;
		text-decoration: none;
	}

	.lang {
		justify-self: end;
		color: var(--text-dim);
		font-size: 0.85rem;
	}

	.grain {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		opacity: 0.045;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
	}

	.atmosphere {
		position: fixed;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 55%);
		z-index: 0;
	}

	.museum[data-room='cracks'] .atmosphere {
		background: radial-gradient(ellipse at 50% 48%, #d4a5742e, transparent 46%);
	}

	.museum[data-room='reasoning'] .atmosphere {
		background: radial-gradient(ellipse at 50% 40%, #d4a57414, transparent 62%);
	}

	.museum[data-room='echo'] .atmosphere,
	.museum[data-room='incline'] .atmosphere {
		background: radial-gradient(ellipse at 12% 18%, #d4a5742a, transparent 52%);
	}

	.museum[data-room='exit'] .atmosphere {
		background: radial-gradient(ellipse at 50% 80%, #d4a57412, transparent 55%);
	}

	.moon-plate {
		position: fixed;
		inset: 0;
		background: #050508 url('/images/moon-surface.webp') center / cover no-repeat;
		filter: brightness(0.55) saturate(0.35);
		opacity: 0;
		pointer-events: none;
		z-index: 0;
		transition: opacity 0.8s ease, filter 0.8s ease;
	}

	.moon-plate.show {
		opacity: 1;
	}

	.moon-plate.dim {
		filter: brightness(0.28) saturate(0.2);
	}

	.film {
		position: fixed;
		top: 50%;
		left: 50%;
		width: min(100vw, calc(100dvh * var(--film-ratio, 1.333)));
		height: min(100dvh, calc(100vw / var(--film-ratio, 1.333)));
		transform: translate(-50%, -50%);
		object-fit: fill;
		background: none;
		opacity: 0;
		pointer-events: none;
		z-index: 0;
	}

	.film.show {
		opacity: 1;
	}

	.atmosphere.hush {
		opacity: 0;
	}

	.stage.watch {
		text-shadow: 0 1px 16px #000, 0 0 24px #000;
	}

	.stage.at-tower :global(.tower) {
		position: fixed;
		left: 58%;
		bottom: 0;
		z-index: 0;
		width: min(92vw, calc(90dvh * 400 / 990));
		height: auto;
		aspect-ratio: 400 / 990;
		transform: translateX(-50%);
		container-type: size;
		pointer-events: none;
	}

	.stage.at-tower :global(.num),
	.stage.at-tower :global(h1),
	.stage.at-tower :global(.line),
	.stage.at-tower :global(.go),
	.stage.at-tower :global(ol) {
		position: relative;
		z-index: 2;
	}

	.stage.at-tower :global(.tower .hit),
	.stage.at-tower :global(.tower .watch),
	.stage.at-tower :global(.tower .retry) {
		pointer-events: auto;
	}

	.stage {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: stretch;
		padding: 5.5rem var(--system-pad) 2.25rem;
		max-width: none;
	}

	.stage :global(> .num),
	.stage :global(> h1),
	.stage :global(> .line),
	.stage :global(> a.go),
	.stage :global(> button.go),
	.stage :global(> ol) {
		position: relative;
		z-index: 2;
		max-width: 34rem;
		flex: 0 0 auto;
	}

	.stage :global(.walk),
	.stage :global(.lab),
	.stage :global(.shop),
	.stage :global(.moon) {
		flex: 1 1 auto;
		width: 100%;
		min-height: 18rem;
		max-width: none;
	}

	.stage :global(.fork),
	.stage :global(.hall),
	.stage :global(.join) {
		flex: 1 1 auto;
		width: min(100%, 58rem);
		min-height: 18rem;
		align-self: center;
	}
</style>
