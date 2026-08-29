<script lang="ts">
	import { cards } from '$lib/stores/card.svelte'
	import type { InterviewCard } from '$lib/types'

	let { items, onNav }: { items: InterviewCard[]; onNav: (index: number) => void } = $props()
</script>

<nav
	aria-label="Вопросы интервью"
	class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 border-t border-line
		pt-[clamp(9px,1.4vh,13px)] print:hidden"
>
	{#each items as item, i (item.no)}
		<button
			type="button"
			onclick={() => onNav(i)}
			aria-current={i === cards.current ? 'true' : undefined}
			class="cursor-pointer border-0 bg-transparent px-2 py-1.5 font-mono text-[11px] uppercase
				tracking-[0.1em] transition-colors"
			class:bg-ink={i === cards.current}
			class:text-paper={i === cards.current}
			class:text-mut={i !== cards.current}
			class:hover:text-ink={i !== cards.current}
		>
			{item.label}
		</button>
	{/each}

	<p class="ml-auto font-mono text-[11px] tracking-[0.1em] text-mut">
		<span class="sr-only">Вопрос {cards.current + 1} из {cards.total}:</span>
		<span aria-hidden="true">
			<span class="text-mark">{String(cards.current + 1).padStart(2, '0')}</span>
			/ {String(cards.total).padStart(2, '0')}
		</span>
	</p>
</nav>