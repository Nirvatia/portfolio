<script lang="ts">
	import { cards } from '$lib/stores/card.svelte';
	import type { InterviewCard } from '$lib/types';

	let { items, onNav }: { items: InterviewCard[]; onNav: (index: number) => void } = $props();
</script>

<nav aria-label="Оглавление интервью" class="pt-[clamp(6px,1vh,10px)]">
	<div
		class="grid gap-1.5 md:flex md:flex-wrap md:items-baseline md:gap-x-2 md:gap-y-1.5"
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
				class="relative cursor-pointer rounded-[3px] px-2 py-3.5 text-center font-mono text-[13px] uppercase tracking-[0.14em] transition-colors duration-200 md:px-3.5 md:py-2 md:text-[12px] {active
					? 'text-mark [text-shadow:0_0_14px_rgba(111,207,214,0.5)]'
					: 'text-mut hover:text-ink'}"
			>
				<span class="md:hidden">{item.no || fallbackNo}</span>
				<span class="hidden md:inline">{item.label || item.no || fallbackNo}</span>
				{#if active}
					<span
						aria-hidden="true"
						class="pointer-events-none absolute inset-x-2 bottom-1.5 h-px bg-linear-to-r from-transparent via-mark/80 to-transparent"
					></span>
				{/if}
			</button>
		{/each}
		<p class="hidden font-mono text-[12px] tracking-[0.14em] text-mut md:ml-auto md:block">
			<span class="sr-only">Сейчас открыт вопрос {cards.current + 1} из {items.length}.</span>
			<span aria-hidden="true">
				<span class="text-mark">{String(cards.current + 1).padStart(2, '0')}</span>
				/ {String(items.length).padStart(2, '0')}
			</span>
		</p>
	</div>
</nav>
