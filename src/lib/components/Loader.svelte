<script lang="ts">
	import { onMount } from 'svelte';
	import { LOADER_LINES, loader } from '$lib/stores/loader.svelte';

	const TARGET_DEPTH = -12; // м
	const DURATION = 2500; // мс — совпадает с loader.play()

	let visible = $state(true);
	let progress = $state(0);
	let depthDisplay = $state('000\u2009м');
	let pressureDisplay = $state('1.0\u2009атм');

	$effect(() => {
		if (loader.finished) {
			const t = setTimeout(() => (visible = false), 650);
			return () => clearTimeout(t);
		}
	});

	function fmtDepth(d: number): string {
		const abs = Math.abs(Math.round(d));
		return (d < 0 ? '\u2212' : '') + String(abs).padStart(3, '0') + '\u2009м';
	}

	onMount(() => {
		const reduceMotion =
			typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (reduceMotion) {
			progress = 1;
			depthDisplay = fmtDepth(TARGET_DEPTH);
			pressureDisplay = '2.2\u2009атм';
			return;
		}

		let raf = 0;
		const start = performance.now();
		function tick(now: number) {
			const p = Math.min(1, (now - start) / DURATION);
			progress = p;
			depthDisplay = fmtDepth(TARGET_DEPTH * p);
			pressureDisplay = (1 + 1.2 * p).toFixed(1) + '\u2009атм';
			if (p < 1) raf = requestAnimationFrame(tick);
		}
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if visible}
	<div
		aria-hidden="true"
		class="fixed inset-0 z-50 flex items-center justify-center bg-paper transition-opacity duration-500
			{loader.finished ? 'pointer-events-none opacity-0' : ''}"
	>
		<!-- свет поверхности гаснет по мере погружения -->
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-12%,rgba(111,207,214,0.16),transparent_66%)]"
			style:opacity={1 - progress}
		></div>

		<div class="relative w-[min(340px,86vw)]">
			<div class="flex items-center gap-7">
				<!-- глубиномер -->
				<div class="relative h-40 w-px flex-none bg-line" aria-hidden="true">
					<span class="absolute -left-1.25 top-0 h-px w-3.5 bg-line"></span>
					<span class="absolute -left-1.25 bottom-0 h-px w-3.5 bg-line"></span>
					<span
						class="absolute left-0 top-0 w-px bg-linear-to-b from-mark/70 to-mark/20"
						style:height="{progress * 100}%"
					></span>
					<span
						class="absolute left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mark/15 blur-lg"
						style:top="{progress * 100}%"
					></span>
					<span
						class="absolute left-1/2 size-1.75 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mark shadow-[0_0_14px_rgba(111,207,214,0.9)]"
						style:top="{progress * 100}%"
					></span>
				</div>

				<!-- показания -->
				<div class="flex flex-col gap-2 font-mono">
					<p class="flex items-center gap-2.5 text-[10px] uppercase tracking-[0.24em] text-mut">
						<span class="dot-pulse size-1.5 flex-none rounded-full bg-mark"></span>
						батискаф бездна-6»
					</p>
					<p
						class="text-[34px] leading-none tracking-[0.02em] text-mark tabular-nums [text-shadow:0_0_20px_rgba(111,207,214,0.45)]"
					>
						{depthDisplay}
					</p>
					<p class="text-xs tracking-[0.14em] text-mut tabular-nums">{pressureDisplay}</p>
				</div>
			</div>

			<!-- журнал погружения -->
			<div class="mt-8 flex min-h-28 flex-col gap-1.5 font-mono text-xs leading-normal text-mut">
				{#each LOADER_LINES.slice(0, loader.shown) as line (line)}
					<span class="ln-in"><span class="mr-2 text-mark/60">·</span>{line}</span>
				{/each}
			</div>
		</div>
	</div>
{/if}
