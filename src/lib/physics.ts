/** Map elapsed time to 0–1 progress along a drop of duration `duration`. */
export function fallProgress(elapsed: number, duration: number): number {
	const t = Math.min(Math.max(elapsed, 0), duration);
	return (t / duration) ** 2;
}

/**
 * On-screen free fall (galleries 1 and 4a share this).
 * Real 50 m is ~3.2 s (factsheet appendix D); the painted shaft reads as ~10 m,
 * so the duration follows Earth g at that height — otherwise the quadratic
 * crawl looks like low gravity.
 */
export const TOWER_FALL_SECONDS = 1.45;

/** Fake Aristotle durations: same felt g as the tower, heavier lands first. */
export const ARISTOTLE_FALL = [
	[0.9, 1.45],
	[0.9, 1.15, 1.45],
	[0.72, 0.9, 1.45]
] as const;

export const INCLINE = {
	quarter: 2.45,
	half: 3.46,
	full: 4.9,
	/** Seconds of projectile flight after the beam tip, into the dish. */
	flight: 0.5,
	/** Pause in the dish before reset. */
	rest: 2
} as const;
