<script lang="ts">
	import { cards } from '$lib/stores/card.svelte';
	import type { InterviewCard } from '$lib/types';

	let { items, onNav }: { items: InterviewCard[]; onNav: (index: number) => void } = $props();
</script>

<nav
	aria-label="Оглавление интервью"
	class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 border-t border-line pt-[clamp(9px,1.4vh,13px)]"
>
	{#each items as item, i (item.no)}
		{@const active = i === cards.current}
		<button
			type="button"
			onclick={() => onNav(i)}
			aria-current={active ? 'true' : undefined}
			class="cursor-pointer border-0 px-2 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors {active
				? 'bg-ink text-paper'
				: 'bg-transparent text-mut hover:text-ink'}"
		>
			{item.label}
		</button>
	{/each}
	<p class="ml-auto font-mono text-[11px] tracking-widest text-mut">
		<span class="sr-only">Сейчас открыт вопрос {cards.current + 1} из {items.length}.</span>
		<span aria-hidden="true">
			<span class="text-mark">{String(cards.current + 1).padStart(2, '0')}</span>
			/ {String(items.length).padStart(2, '0')}
		</span>
	</p>
</nav>
