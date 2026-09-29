<script lang="ts">
	import type { Copy } from '$lib/i18n';

	let {
		copy,
		reasoningHref = '',
		index = $bindable(0),
		onOpened
	}: {
		copy: Copy;
		reasoningHref?: string;
		index?: number;
		onOpened?: () => void;
	} = $props();

	const kinds = ['folio', 'stack', 'annals', 'print', 'print thick'] as const;
	const plates: Record<(typeof kinds)[number], string> = {
		folio: '/images/archive-folio.webp',
		stack: '/images/archive-stack.webp',
		annals: '/images/archive-annals.webp',
		print: '/images/archive-print.webp',
		'print thick': '/images/archive-print-thick.webp'
	};

	// 7 Physical stations on the continuous archival desk:
	// Station 0: Prologue folio
	// Stations 1..5: The 5 archival documents
	// Station 6: Verdict folio
	const prologueMeta = { id: 0, x: 11, y: 44, rot: 0, cy: 0.44 };

	const booksMeta = [
		{ id: 1, kind: 'folio', x: 24, y: 42, rot: -2.2, year: '1654', place: 'Pisa', cy: 0.38 },
		{ id: 2, kind: 'stack', x: 37, y: 26, rot: 1.8, year: 'Opera', place: 'Firenze', cy: 0.38 },
		{ id: 3, kind: 'annals', x: 50, y: 64, rot: -1.2, year: '1590', place: 'Annales', cy: 0.38 },
		{ id: 4, kind: 'print', x: 63, y: 28, rot: 2.2, year: '1586', place: 'Delft', cy: 0.38 },
		{ id: 5, kind: 'print thick', x: 76, y: 54, rot: -1.8, year: '1651', place: 'Bologna', cy: 0.38 }
	] as const;

	const verdictMeta = { id: 6, x: 89, y: 42, rot: 0, cy: 0.44 };

	const allStations = [
		prologueMeta,
		...booksMeta,
		verdictMeta
	];

	let seen = $state<Set<number>>(new Set([0]));
	let released = $state(false);

	let containerW = $state(1200);
	let containerH = $state(600);

	// Wide virtual table canvas
	const canvasW = $derived(Math.max(containerW * 2.8, 2800));
	const canvasH = $derived(Math.max(containerH, 680));

	// Dragging state
	let isDragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragDeltaX = $state(0);
	let dragDeltaY = $state(0);

	// Active book item for bottom dock (only stations 1..5)
	const activeBook = $derived(index >= 1 && index <= 5 ? copy.archive[index - 1] : null);
	const ready = $derived(seen.has(1) && (seen.has(4) || seen.has(5)));

	$effect(() => {
		if (ready && !released) {
			released = true;
			onOpened?.();
		}
	});

	// Camera coordinates to center target station
	function getCameraFor(i: number, deltaX = 0, deltaY = 0) {
		const clamped = Math.max(0, Math.min(6, i));
		const target = allStations[clamped];
		const itemPxX = (target.x / 100) * canvasW;
		const itemPxY = (target.y / 100) * canvasH;
		const camX = containerW * 0.5 - itemPxX + deltaX;
		const camY = containerH * target.cy - itemPxY + deltaY;
		return { camX, camY };
	}

	const cam = $derived(getCameraFor(index, dragDeltaX, dragDeltaY));

	// Transition duration
	let prevIndex = 0;
	const transitionDuration = $derived.by(() => {
		if (isDragging) return 0;
		const span = Math.abs(index - prevIndex);
		if (span > 2) return 0.75;
		if (span > 1) return 0.62;
		return 0.52;
	});

	function go(next: number) {
		if (next < 0 || next > 6 || next === index) return;
		prevIndex = index;
		index = next;
		seen = new Set([...seen, next]);
	}

	// Pointer drag handling
	let hasMoved = false;

	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return;
		if ((e.target as HTMLElement).closest('.edge-nav, .dock, .folio-action-btn')) return;
		isDragging = true;
		hasMoved = false;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragDeltaX = 0;
		dragDeltaY = 0;
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		if (!hasMoved && Math.hypot(dx, dy) > 6) {
			hasMoved = true;
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		}
		if (hasMoved) {
			dragDeltaX = dx * 0.8;
			dragDeltaY = dy * 0.5;
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (!isDragging) return;
		isDragging = false;
		if (hasMoved) {
			const threshold = 40;
			if (dragDeltaX < -threshold) {
				if (index < 6) go(index + 1);
			} else if (dragDeltaX > threshold) {
				if (index > 0) go(index - 1);
			}
		}
		hasMoved = false;
		dragDeltaX = 0;
		dragDeltaY = 0;
	}

	function onPointerCancel() {
		isDragging = false;
		hasMoved = false;
		dragDeltaX = 0;
		dragDeltaY = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === ' ') {
			if (index < 6) {
				e.preventDefault();
				go(index + 1);
			}
		} else if (e.key === 'ArrowLeft') {
			if (index > 0) {
				e.preventDefault();
				go(index - 1);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="walk"
	bind:clientWidth={containerW}
	bind:clientHeight={containerH}
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={onPointerUp}
	onpointercancel={onPointerCancel}
	role="region"
	aria-label="Archive table"
>
	<!-- Continuous 2D Canvas panning under the camera -->
	<div
		class="canvas"
		class:dragging={isDragging}
		style:width="{canvasW}px"
		style:height="{canvasH}px"
		style:transform="translate3d({cam.camX}px, {cam.camY}px, 0)"
		style:transition-duration="{transitionDuration}s"
	>
		<!-- Continuous constellation thread linking all 7 stations on the table -->
		<svg class="table-links" width={canvasW} height={canvasH} aria-hidden="true">
			<!-- Link from Prologue (0) to Book 0 (1) -->
			<line
				x1="{(prologueMeta.x / 100) * canvasW}"
				y1="{(prologueMeta.y / 100) * canvasH}"
				x2="{(booksMeta[0].x / 100) * canvasW}"
				y2="{(booksMeta[0].y / 100) * canvasH}"
				stroke={seen.has(1) ? 'rgba(212, 165, 116, 0.32)' : 'rgba(212, 165, 116, 0.12)'}
				stroke-width="1.2"
				stroke-dasharray="4 4"
			/>
			<!-- Links between the 5 books -->
			{#each booksMeta.slice(0, -1) as book, i}
				{@const next = booksMeta[i + 1]}
				<line
					x1="{(book.x / 100) * canvasW}"
					y1="{(book.y / 100) * canvasH}"
					x2="{(next.x / 100) * canvasW}"
					y2="{(next.y / 100) * canvasH}"
					stroke={seen.has(i + 1) && seen.has(i + 2) ? 'rgba(212, 165, 116, 0.35)' : 'rgba(212, 165, 116, 0.08)'}
					stroke-width="1.2"
					stroke-dasharray={i === 2 ? '6 6' : '3 3'}
				/>
			{/each}
			<!-- Link from Book 4 (5) to Verdict Folio (6) -->
			<line
				x1="{(booksMeta[4].x / 100) * canvasW}"
				y1="{(booksMeta[4].y / 100) * canvasH}"
				x2="{(verdictMeta.x / 100) * canvasW}"
				y2="{(verdictMeta.y / 100) * canvasH}"
				stroke={ready ? 'rgba(212, 165, 116, 0.5)' : 'rgba(212, 165, 116, 0.1)'}
				stroke-width={ready ? '1.8' : '1'}
				stroke-dasharray={ready ? 'none' : '4 4'}
			/>
		</svg>

		<!-- Station 0: Opening Prologue Folio on the Desk -->
		<div
			class="item folio-station prologue-station"
			class:active={index === 0}
			style:left="{(prologueMeta.x / 100) * canvasW}px"
			style:top="{(prologueMeta.y / 100) * canvasH}px"
			style:--rot="{prologueMeta.rot}deg"
			role="button"
			tabindex="0"
			aria-label="02 · 裂缝 · 1586 - 1654"
			onclick={(e) => {
				e.stopPropagation();
				go(0);
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					go(0);
				}
			}}
		>
			<div class="desk-folio prologue-folio">
				<div class="folio-tag mono">
					<span class="tag-num">02</span>
					<span class="tag-sep">·</span>
					<span class="tag-room">{copy.rooms.cracks.title}</span>
					<span class="tag-sep">·</span>
					<span class="tag-range">1586 – 1654</span>
				</div>
				<h2 class="folio-heading serif">{copy.rooms.cracks.line}</h2>
				<p class="folio-desc serif">
					{copy.otherLang === 'en'
						? '比萨斜塔的传说流传了四百年。但在那个时代的档案里，却找不到任何同时代的目击记录。案台上散落着 5 份历史原件——从学生维维亚尼为伽利略撰写的回忆传记，到代尔夫特与博洛尼亚印行出版的真实落体实验。'
						: 'The legend of the leaning tower has endured for four centuries. Yet in the archives of that era, not a single eyewitness account exists. Scattered across this desk are 5 original records — from Viviani\'s late biography of Galileo to the printed drops of Delft and Bologna.'}
				</p>
				<button
					class="folio-action-btn mono"
					onclick={(e) => {
						e.stopPropagation();
						go(1);
					}}
				>
					<span>{copy.otherLang === 'en' ? '沿案台查阅 01 · 维维亚尼传记 ➔' : 'Inspect 01 · Viviani Biography ➔'}</span>
				</button>
			</div>

			<div class="item-tag mono">
				<span class="tag-year">PROLOGUE</span>
				<span class="tag-dot">·</span>
				<span class="tag-place">{copy.otherLang === 'en' ? '案卷展台' : 'Curator Desk'}</span>
			</div>
		</div>

		<!-- Stations 1..5: The 5 Historical Documents on the Desk -->
		{#each booksMeta as meta, i}
			{@const stationIdx = i + 1}
			{@const isCurrent = index === stationIdx}
			{@const isSeen = seen.has(stationIdx)}
			<div
				class="item book-item {meta.kind}"
				class:active={isCurrent}
				class:seen={isSeen}
				style:left="{(meta.x / 100) * canvasW}px"
				style:top="{(meta.y / 100) * canvasH}px"
				style:--rot="{meta.rot}deg"
				role="button"
				tabindex="0"
				aria-label={copy.archive[i]?.fact ?? ''}
				onclick={(e) => {
					e.stopPropagation();
					go(stationIdx);
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						go(stationIdx);
					}
				}}
			>
				<div class="lamp-pool" class:lit={isSeen} class:bright={isCurrent} aria-hidden="true"></div>

				<div class="plate-wrap">
					<img class="plate" src={plates[kinds[i]]} alt="" draggable="false" />
					{#if !isSeen}
						<span class="reticle" aria-hidden="true"></span>
					{/if}
				</div>

				<div class="item-tag mono">
					<span class="tag-year">{meta.year}</span>
					<span class="tag-dot">·</span>
					<span class="tag-place">{meta.place}</span>
				</div>
			</div>
		{/each}

		<!-- Station 6: The Historical Verdict Folio at the end of the desk -->
		<div
			class="item folio-station verdict-station"
			class:active={index === 6}
			class:ready
			style:left="{(verdictMeta.x / 100) * canvasW}px"
			style:top="{(verdictMeta.y / 100) * canvasH}px"
			style:--rot="{verdictMeta.rot}deg"
			role="button"
			tabindex="0"
			aria-label={copy.heChose}
			onclick={(e) => {
				e.stopPropagation();
				go(6);
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					go(6);
				}
			}}
		>
			<div class="desk-folio verdict-folio" class:unlocked={ready}>
				<div class="folio-seal" aria-hidden="true">
					<span class="seal-glyph">✦</span>
				</div>
				<div class="folio-tag mono">
					<span>{copy.otherLang === 'en' ? '历史判词 · 启示' : 'HISTORICAL VERDICT'}</span>
				</div>
				<div class="verdict-portrait-card">
					<div class="portrait-frame">
						<img
							class="folio-portrait"
							src="/images/galileo-portrait.webp"
							alt={copy.otherLang === 'en' ? '伽利略·伽利莱肖像 (苏斯特曼斯 1636)' : 'Portrait of Galileo Galilei (Justus Sustermans, 1636)'}
							width="86"
							height="100"
							loading="lazy"
						/>
					</div>
					<div class="verdict-headline">
						<h3 class="folio-heading serif">{copy.heChose}</h3>
						<span class="portrait-credit mono">{copy.otherLang === 'en' ? '伽利略 · 1636' : 'Galileo Galilei · 1636'}</span>
					</div>
				</div>
				<p class="folio-desc serif">
					{copy.otherLang === 'en'
						? '没有任何同时代人看到斜塔落体。当经验测量被生理反应与空气阻力遮蔽，他选择用纯粹的思想实验击碎亚里士多德。'
						: 'No contemporary eyewitness ever saw the Pisa drop. When physical experiment was obscured by human delay and air drag, he chose pure logic.'}
				</p>
				{#if ready}
					<a
						class="folio-action-btn gate-btn mono"
						href={reasoningHref}
						onclick={(e) => e.stopPropagation()}
					>
						<span>{copy.otherLang === 'en' ? '转向思辨 · 思想剧场 ➔' : 'Into Reasoning · The Dialectic Arena ➔'}</span>
					</a>
				{:else}
					<div class="folio-sealed-hint mono">
						<span>{copy.otherLang === 'en' ? '待翻阅 1654 传记与真实落体出版物' : 'Awaiting examination of archival records'}</span>
					</div>
				{/if}
			</div>

			<div class="item-tag mono">
				<span class="tag-year">VERDICT</span>
				<span class="tag-dot">·</span>
				<span class="tag-place">{ready ? (copy.otherLang === 'en' ? '思辨之门' : 'The Gate') : (copy.otherLang === 'en' ? '待考证' : 'Sealed')}</span>
			</div>
		</div>
	</div>

	<!-- Edge navigation hints (side peeking controls) -->
	{#if index > 0}
		<button
			class="edge-nav prev"
			onpointerdown={(e) => e.stopPropagation()}
			onclick={(e) => {
				e.stopPropagation();
				go(index - 1);
			}}
			aria-label="Previous station"
		>
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
				<path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
	{/if}

	{#if index < 6}
		<button
			class="edge-nav next"
			class:glow={index === 5 && ready}
			onpointerdown={(e) => e.stopPropagation()}
			onclick={(e) => {
				e.stopPropagation();
				go(index + 1);
			}}
			aria-label={index === 5 && ready ? 'View verdict' : 'Next station'}
		>
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
				<path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
	{/if}

	<!-- Reading dock: active document facts and details (only for documents 1..5) -->
	{#if activeBook}
		<div class="dock">
			<div class="dock-badge mono">
				<span class="badge-idx">0{index} / 05</span>
				<span class="badge-dot">·</span>
				<span class="badge-tag">{booksMeta[index - 1].year} · {booksMeta[index - 1].place}</span>
			</div>
			<p class="fact serif">{activeBook.fact}</p>
			<p class="detail">{activeBook.detail}</p>
		</div>
	{/if}
</div>

<style>
	.walk {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		height: 100%;
		overflow: hidden; /* Strict zero-scroll rule: no scrollbars */
		touch-action: none;
		user-select: none;
		cursor: grab;
	}

	.walk:active {
		cursor: grabbing;
	}

	.canvas {
		position: absolute;
		top: 0;
		left: 0;
		will-change: transform;
		transition-property: transform;
		transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		pointer-events: auto;
	}

	.canvas.dragging {
		transition-duration: 0s !important;
	}

	.table-links {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.item {
		position: absolute;
		transform: translate(-50%, -50%) rotate(var(--rot, 0deg));
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		z-index: 2;
		outline: none;
		transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.5s ease;
	}

	.item.book-item.active {
		z-index: 5;
		transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(1.05);
	}

	.item.book-item:hover:not(.active) {
		transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(1.02);
	}

	/* Folio stations (Prologue and Verdict) */
	.item.folio-station {
		z-index: 3;
	}

	.item.folio-station.active {
		z-index: 6;
		transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(1.02);
	}

	.item.folio-station:hover:not(.active) {
		transform: translate(-50%, -50%) rotate(var(--rot, 0deg)) scale(1.01);
	}

	/* Lamp Pools: A physical warm incandescent desk lamp spotlight resting on the archive table */
	.lamp-pool {
		position: absolute;
		top: 54%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: min(56vw, 42rem);
		height: min(36vw, 27rem);
		border-radius: 50%;
		pointer-events: none;
		opacity: 0;
		filter: blur(34px);
		transition: opacity 0.8s cubic-bezier(0.2, 0.8, 0.3, 1), transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1);
		z-index: 0;
	}

	/* Visited items resting in soft archival ambient light */
	.lamp-pool.lit {
		opacity: 0.32;
		background: radial-gradient(
			ellipse 65% 55% at 50% 50%,
			rgba(255, 215, 130, 0.42) 0%,
			rgba(212, 150, 60, 0.18) 45%,
			rgba(140, 70, 15, 0.05) 75%,
			transparent 100%
		);
		mix-blend-mode: screen;
		filter: blur(28px);
	}

	/* Brightest when currently active: luminous incandescent reading lamp beam hitting the table */
	.lamp-pool.bright {
		opacity: 1;
		transform: translate(-50%, -50%) scale(1.04);
		background: radial-gradient(
			ellipse 66% 56% at 50% 50%,
			rgba(255, 252, 240, 1) 0%,
			rgba(255, 230, 160, 0.92) 22%,
			rgba(242, 172, 70, 0.58) 46%,
			rgba(180, 100, 25, 0.24) 70%,
			rgba(90, 40, 10, 0.05) 88%,
			transparent 100%
		);
		mix-blend-mode: screen;
		filter: blur(34px);
	}

	/* Narrative Information Cards (Prologue & Verdict - non-skeuomorphic UI cards) */
	.desk-folio {
		position: relative;
		width: min(85vw, 24.5rem);
		padding: 2.2rem 2.2rem 1.9rem;
		border-radius: 12px;
		background: rgba(18, 14, 11, 0.88);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid rgba(212, 165, 116, 0.22);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
		text-align: left;
		transition: border-color 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease;
	}

	.folio-station.active .desk-folio {
		background: rgba(22, 17, 13, 0.94);
		border-color: rgba(212, 165, 116, 0.48);
		box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
	}

	.folio-tag {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.74rem;
		letter-spacing: 0.08em;
		color: var(--accent);
		opacity: 0.85;
		margin-bottom: 0.6rem;
	}

	.tag-sep {
		opacity: 0.4;
	}

	.folio-heading {
		margin: 0 0 0.8rem;
		font-size: clamp(1.25rem, 2.2vw, 1.55rem);
		color: var(--text);
		line-height: 1.35;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.folio-desc {
		margin: 0 0 1.4rem;
		font-size: clamp(0.85rem, 1.6vw, 0.92rem);
		color: var(--text-dim);
		line-height: 1.65;
	}

	.folio-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.55rem 1.1rem;
		border-radius: 999px;
		background: rgba(212, 165, 116, 0.12);
		border: 1px solid rgba(212, 165, 116, 0.35);
		color: var(--accent);
		font-size: 0.8rem;
		letter-spacing: 0.04em;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.25s ease;
	}

	.folio-action-btn:hover {
		background: rgba(212, 165, 116, 0.26);
		border-color: var(--accent);
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
	}

	/* Verdict Folio Specifics */
	.verdict-folio {
		opacity: 0.55;
	}

	.verdict-folio.unlocked {
		opacity: 0.95;
		border-color: rgba(212, 165, 116, 0.35);
	}

	.folio-station.active .verdict-folio.unlocked {
		opacity: 1;
		border-color: rgba(212, 165, 116, 0.55);
		box-shadow: 0 20px 48px rgba(0, 0, 0, 0.75);
	}

	.verdict-portrait-card {
		display: flex;
		align-items: center;
		gap: 1.1rem;
		margin: 0.6rem 0 0.9rem;
	}

	.portrait-frame {
		width: 82px;
		height: 96px;
		flex-shrink: 0;
		border-radius: 6px;
		overflow: hidden;
		border: 1px solid rgba(212, 165, 116, 0.38);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7), inset 0 0 10px rgba(0, 0, 0, 0.5);
		background: #110d0a;
	}

	.folio-portrait {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: contrast(1.04) sepia(0.06);
	}

	.verdict-headline {
		flex: 1;
		min-width: 0;
	}

	.verdict-headline .folio-heading {
		margin: 0 0 0.3rem;
	}

	.portrait-credit {
		display: inline-block;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		color: var(--accent);
		opacity: 0.75;
	}

	.folio-seal {
		position: absolute;
		top: 1.2rem;
		right: 1.2rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 1px solid rgba(212, 165, 116, 0.35);
		background: rgba(212, 165, 116, 0.08);
		display: grid;
		place-items: center;
		color: var(--accent);
		font-size: 0.85rem;
	}

	.seal-glyph {
		line-height: 1;
	}

	.folio-action-btn.gate-btn {
		background: var(--accent);
		color: #0b0a08;
		font-weight: 600;
		box-shadow: 0 4px 16px rgba(212, 165, 116, 0.35);
	}

	.folio-action-btn.gate-btn:hover {
		background: #f2cca4;
		box-shadow: 0 6px 20px rgba(212, 165, 116, 0.55);
	}

	.folio-sealed-hint {
		font-size: 0.75rem;
		color: rgba(212, 165, 116, 0.45);
		font-style: italic;
		border-top: 1px dashed rgba(212, 165, 116, 0.15);
		padding-top: 0.6rem;
	}

	/* Book Plates */
	.plate-wrap {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.plate {
		display: block;
		object-fit: contain;
		pointer-events: none;
		user-select: none;
		filter: drop-shadow(0 1.2rem 2.2rem #000a);
		transition: opacity 0.5s ease, filter 0.5s ease;
	}

	/* Sizing per document kind */
	.item.folio .plate {
		width: min(22vw, 15.5rem);
		height: min(30vw, 21rem);
	}

	.item.stack .plate {
		width: min(22vw, 15.5rem);
		height: min(30vw, 21rem);
	}

	.item.annals .plate {
		width: min(29vw, 20.5rem);
		height: min(22vw, 15.5rem);
	}

	.item.print .plate {
		width: min(22vw, 15.5rem);
		height: min(30vw, 21rem);
	}

	.item.print.thick .plate {
		width: min(20vw, 14.5rem);
		height: min(28vw, 19.5rem);
	}

	/* Active item: illuminated directly under the reading lamp */
	/* Active item: grounded on the desk directly under the reading lamp */
	.item.book-item.active .plate-wrap {
		position: relative;
		z-index: 2;
	}

	.item.book-item.active .plate {
		opacity: 1;
		/* Keep authentic antique tones, no artificial bleaching/overexposure */
		filter: brightness(1.02) contrast(1.02)
			drop-shadow(0 14px 3px rgba(0, 0, 0, 0.95));
	}

	/* Inactive items: resting quietly in archival ambient shadow */
	.item:not(.active):not(:hover) .plate {
		opacity: 0.36;
		filter: brightness(0.65) contrast(0.96)
			drop-shadow(0 10px 2px rgba(0, 0, 0, 0.88));
	}

	.item:not(.active):hover .plate {
		opacity: 0.7;
		filter: brightness(0.88)
			drop-shadow(0 12px 3px rgba(0, 0, 0, 0.92));
	}

	/* Game-style subtle focus reticle for unvisited items */
	.reticle {
		position: absolute;
		inset: -8px;
		border-radius: 6px;
		border: 1px dashed color-mix(in srgb, var(--accent) 70%, transparent);
		pointer-events: none;
		animation: reticle-pulse 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes reticle-pulse {
		0%,
		100% {
			transform: scale(0.96);
			opacity: 0.3;
		}
		50% {
			transform: scale(1.08);
			opacity: 0.85;
		}
	}

	.item:hover .reticle {
		transform: scale(1.02);
		border: 1.5px solid var(--accent);
		box-shadow: 0 0 10px var(--accent);
		opacity: 1;
		animation: none;
	}

	/* Catalog tag */
	.item-tag {
		position: relative;
		z-index: 1;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: color-mix(in srgb, var(--text-dim) 80%, var(--accent));
		opacity: 0.65;
		transition: opacity 0.4s ease, color 0.4s ease;
		white-space: nowrap;
		pointer-events: none;
	}

	.item.seen .item-tag,
	.item.folio-station .item-tag {
		opacity: 0.9;
		color: var(--accent);
	}

	.item.active .item-tag {
		opacity: 1;
		color: var(--accent);
	}

	.tag-dot {
		margin: 0 0.25rem;
		opacity: 0.5;
	}

	/* Edge navigation buttons */
	.edge-nav {
		position: absolute;
		top: 40%;
		transform: translateY(-50%);
		z-index: 30;
		width: 3.2rem;
		height: 3.2rem;
		border-radius: 50%;
		border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
		background: rgba(18, 14, 10, 0.82);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		color: var(--accent);
		display: grid;
		place-items: center;
		cursor: pointer;
		opacity: 0.85;
		transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
		pointer-events: auto;
		touch-action: manipulation;
	}

	.edge-nav svg {
		pointer-events: none;
	}

	.edge-nav:hover {
		opacity: 1;
		transform: translateY(-50%) scale(1.12);
		background: rgba(28, 22, 16, 0.95);
		border-color: var(--accent);
		box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 40%, transparent);
	}

	.edge-nav.prev {
		left: 1.2rem;
	}

	.edge-nav.next {
		right: 1.2rem;
	}

	.edge-nav.glow {
		animation: edge-pulse 2.6s ease-in-out infinite;
	}

	@keyframes edge-pulse {
		0%,
		100% {
			border-color: color-mix(in srgb, var(--accent) 30%, transparent);
			box-shadow: 0 0 0 0 transparent;
		}
		50% {
			border-color: var(--accent);
			box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 45%, transparent);
		}
	}

	/* Reading dock at the bottom */
	.dock {
		position: absolute;
		left: 50%;
		bottom: 1rem;
		transform: translateX(-50%);
		z-index: 10;
		width: min(92vw, 36rem);
		padding: 1.1rem 1.6rem 1.2rem;
		border-radius: 12px;
		background: rgba(18, 14, 10, 0.88);
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		box-shadow: 0 14px 40px rgba(0, 0, 0, 0.65);
		animation: dock-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: auto;
	}

	@keyframes dock-appear {
		from {
			opacity: 0;
			transform: translate(-50%, 12px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	.dock-badge {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		color: var(--accent);
		opacity: 0.9;
		margin-bottom: 0.45rem;
	}

	.badge-idx {
		font-weight: 600;
	}

	.badge-dot {
		opacity: 0.4;
	}

	.fact {
		margin: 0 0 0.45rem;
		font-size: clamp(1.05rem, 2vw, 1.22rem);
		color: var(--text);
		line-height: 1.4;
		font-weight: 500;
	}

	.detail {
		margin: 0;
		font-size: clamp(0.85rem, 1.6vw, 0.95rem);
		color: var(--text-dim);
		line-height: 1.5;
		text-shadow: 0 2px 8px #000c;
	}

	@media (max-width: 640px) {
		.edge-nav {
			width: 2.4rem;
			height: 2.4rem;
		}
		.edge-nav.prev {
			left: 0.5rem;
		}
		.edge-nav.next {
			right: 0.5rem;
		}
		.dock {
			bottom: 0.5rem;
		}
		.desk-folio {
			padding: 1.6rem 1.4rem;
		}
		.portrait-frame {
			width: 68px;
			height: 80px;
		}
		.verdict-portrait-card {
			gap: 0.8rem;
		}
	}
</style>
