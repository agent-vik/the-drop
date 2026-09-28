<script lang="ts">
	import ExitCorridors from '$lib/components/ExitCorridors.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const text = $derived(data.copy.rooms.exit);
</script>

<div class="exit-room">
	<!-- Curatorial Header for Exit -->
	<header class="corridor-head">
		<div class="tag-row">
			<span class="num mono">↗</span>
			<span class="sep">·</span>
			<span class="title-tag">{text.title}</span>
			<span class="sep">·</span>
			<span class="meta mono">{data.locale === 'zh' ? '终局抉择' : 'Epilogue'}</span>
		</div>
		<p class="summary serif">
			{data.locale === 'zh'
				? '历史在此分岔为两条走廊：一条是传说的漫长繁衍，一条是科学方法的艰难诞生。'
				: 'History branches into two corridors: how the myth survived, and how the method was born.'}
		</p>
	</header>

	<!-- Diverging Corridors Component -->
	<div class="corridors-viewport">
		<ExitCorridors copy={data.copy} locale={data.locale} />
	</div>
</div>

<style>
	.exit-room {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
		padding: 4.8rem var(--system-pad, 2rem) 1.5rem;
		box-sizing: border-box;
	}

	.corridor-head {
		z-index: 10;
		max-width: min(85vw, 44rem);
		align-self: center;
		text-align: center;
		animation: head-fade 0.8s ease-out;
		margin-bottom: 0.8rem;
		flex: 0 0 auto;
	}

	@keyframes head-fade {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.tag-row {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.78rem;
		letter-spacing: 0.08em;
		color: var(--accent);
		opacity: 0.9;
	}

	.sep {
		opacity: 0.4;
	}

	.meta {
		opacity: 0.7;
	}

	.summary {
		margin: 0.35rem 0 0;
		font-size: clamp(0.95rem, 1.8vw, 1.15rem);
		color: var(--text-dim);
		line-height: 1.4;
	}

	.corridors-viewport {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@media (max-width: 640px) {
		.exit-room {
			padding-top: 3.8rem;
		}
	}
</style>
