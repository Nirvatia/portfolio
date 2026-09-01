<script lang="ts">
	import { LOADER_LINES, loader } from '$lib/stores/loader.svelte';

	let visible = $state(true);

	$effect(() => {
		if (loader.finished) {
			const t = setTimeout(() => (visible = false), 600);
			return () => clearTimeout(t);
		}
	});
</script>

{#if visible}
	<div
		aria-hidden="true"
		class="fixed inset-0 z-50 flex items-center justify-center bg-paper
			transition-opacity duration-500"
		class:opacity-0={loader.finished}
		class:pointer-events-none={loader.finished}
	>
		<div class="flex w-[min(340px,82vw)] flex-col gap-6">
			<div
				class="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-mut"
			>
				<span class="dot-pulse size-1.75 flex-none rounded-full bg-mark"></span>
				идёт запись
			</div>

			<div class="flex min-h-30 flex-col gap-1.75 font-mono text-xs leading-normal text-mut">
				{#each LOADER_LINES.slice(0, loader.shown) as line (line)}
					<span class="ln-in">{line}</span>
				{/each}
			</div>

			<div class="h-px w-full overflow-hidden bg-line">
				<span class="rule-run block h-full bg-ink"></span>
			</div>
		</div>
	</div>
{/if}
