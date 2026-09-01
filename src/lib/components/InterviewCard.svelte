<script lang="ts">
	import type { InterviewCard as CardData, Project } from '$lib/types';
	import ContactForm from './ContactForm.svelte';
	import WorkList from './WorkList.svelte';

	let { card, projects = [] }: { card: CardData; projects?: Project[] } = $props();

	const questionId = $derived(`card-question-${card.no}`);

	/** Сначала полное экранирование, потом *звёздочки* → красное курсивное. */
	function emphasize(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\*(.+?)\*/g, '<em class="italic text-mark">$1</em>');
	}
</script>

<section
	aria-labelledby={questionId}
	class="grid grid-cols-[minmax(0,1fr)_clamp(150px,19vw,205px)] items-start
		gap-x-[clamp(24px,4vw,40px)] max-md:grid-cols-1"
>
	<div class="min-w-0">
		<div
			aria-hidden="true"
			class="mb-[clamp(8px,1.4vh,14px)] font-mono text-[11px] tracking-[0.2em] text-mut"
		>
			{card.no}
		</div>

		<h2
			id={questionId}
			class="hang ml-[-2ch] mb-[clamp(10px,1.8vh,18px)] font-mono font-normal
				text-[clamp(12px,1.5vw,13px)] tracking-[0.04em] text-mut"
		>
			— {card.question}
		</h2>

		{#if card.answer}
			<p
				class="dropcap font-serif text-[clamp(21px,min(4.6vw,6vh),38px)] leading-[1.3] tracking-[-0.01em] wrap-anywhere"
			>
				{@html emphasize(card.answer)}
			</p>
		{/if}

		{#if card.kind === 'works'}
			<WorkList {projects} />
		{:else if card.kind === 'contact'}
			<ContactForm />
		{/if}
	</div>

	{#if card.marginalia}
		<aside
			aria-label="Примечания"
			class="mt-6 flex flex-col font-mono text-[11px] leading-[1.8] text-mut
			md:mt-[clamp(34px,5vh,48px)] md:text-right"
		>
			{#each card.marginalia.split('\n') as line}
				<span>{line}</span>
			{/each}
		</aside>
	{/if}
</section>
