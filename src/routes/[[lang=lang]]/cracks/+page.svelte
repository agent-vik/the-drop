<script lang="ts">
	import ArchiveWalk from '$lib/components/ArchiveWalk.svelte';
	import { roomPath } from '$lib/rooms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let open = $state(false);
	let activeIdx = $state(0);
</script>

<div class="cracks-room">
	<!-- Continuous 2D Archival Desk with Prologue, 5 Documents, and Verdict Artifact all on the canvas -->
	<div class="desk-viewport">
		<ArchiveWalk
			copy={data.copy}
			reasoningHref={roomPath(data.locale, 'reasoning')}
			bind:index={activeIdx}
			onOpened={() => (open = true)}
		/>
	</div>
</div>

<style>
	.cracks-room {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
	}

	.desk-viewport {
		position: absolute;
		inset: 0;
		z-index: 1;
	}
</style>
