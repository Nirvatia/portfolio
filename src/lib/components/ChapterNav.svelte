<script lang="ts">
	import { cards } from '$lib/stores/card.svelte';
	import type { InterviewCard } from '$lib/types';

	let { items, onNav }: { items: InterviewCard[]; onNav: (index: number) => void } = $props();
</script>

<nav aria-label="Оглавление интервью" class="border-t border-line pt-[clamp(9px,1.4vh,13px)]">
	<div
		class="grid gap-1 border border-line p-1
			md:flex md:flex-wrap md:items-baseline md:gap-x-2.5 md:gap-y-1.5 md:border-0 md:p-0"
		style="grid-template-columns: repeat({items.length}, minmax(0, 1fr))"
	>
		{#each items as item, i (`${i}:${item.no ?? ''}`)}
			{@const active = i === cards.current}
			{@const fallbackNo = String(i + 1).padStart(2, '0')}
			{@const labelText = item.label || item.question || `Раздел ${item.no || fallbackNo}`}
			<button
				type="button"
				onclick={() => onNav(i)}
				aria-current={active ? 'step' : undefined}
				aria-label={labelText}
				class="cursor-pointer border-0 py-2.5 text-center font-mono text-[11px] uppercase tracking-widest transition-colors
			md:px-2 md:py-1.5 {active ? 'bg-ink text-paper' : 'bg-transparent text-mut hover:text-ink'}"
			>
				<span class="md:hidden">{item.no || fallbackNo}</span>
				<span class="hidden md:inline">
					{item.label || item.no || fallbackNo}
				</span>
			</button>
		{/each}
		<p class="hidden font-mono text-[11px] tracking-widest text-mut md:ml-auto md:block">
			<span class="sr-only">Сейчас открыт вопрос {cards.current + 1} из {items.length}.</span>
			<span aria-hidden="true">
				<span class="text-mark">{String(cards.current + 1).padStart(2, '0')}</span>
				/ {String(items.length).padStart(2, '0')}
			</span>
		</p>
	</div>
</nav>
