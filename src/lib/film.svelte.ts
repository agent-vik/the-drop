export const film = $state({
	node: null as HTMLVideoElement | null,
	unlocked: false,
	ended: false,
	failed: false,
	ratio: 4 / 3
});

export function registerFilm(node: HTMLVideoElement) {
	film.node = node;
	const readRatio = () => {
		if (node.videoWidth && node.videoHeight) {
			film.ratio = node.videoWidth / node.videoHeight;
		}
	};
	node.addEventListener('loadedmetadata', readRatio);
	readRatio();
	return {
		destroy() {
			node.removeEventListener('loadedmetadata', readRatio);
			if (film.node === node) film.node = null;
		}
	};
}

export function unlockAndPlay() {
	film.unlocked = true;
	film.ended = false;
	const node = film.node;
	if (!node) return;
	node.muted = false;
	node.currentTime = 0;
	void node.play().catch(() => {
		node.muted = true;
		void node.play();
	});
}

export function enterVacuum() {
	const node = film.node;
	if (!node) {
		film.failed = true;
		return;
	}
	node.muted = !film.unlocked;
	if (node.paused) {
		void node.play().catch(() => {
			film.failed = true;
		});
	}
}

export function leaveVacuum() {
	const node = film.node;
	if (!node || film.ended) return;
	node.pause();
}

export function filmEnded() {
	film.ended = true;
	if (film.node) film.node.muted = true;
}

export function filmFailed() {
	film.failed = true;
	film.ended = true;
}
