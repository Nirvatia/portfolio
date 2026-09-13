<script lang="ts">
	import { page } from '$app/state';

	const note = $derived(page.status >= 500 ? 'сбой' : 'вне карты');
</script>

<svelte:head>
	<title>{page.status} — {note}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="grid min-h-dvh place-items-center px-6">
	<div class="flex flex-col items-center text-center">
		<h1 class="sr-only">Ошибка {page.status}</h1>

		<!-- глубиномер показывает отметку, которой нет на карте -->
		<p
			aria-hidden="true"
			class="font-mono tabular-nums leading-none text-mark
				[text-shadow:0_0_40px_rgba(111,207,214,0.3)]"
		>
			<span class="text-[clamp(64px,15vw,132px)] tracking-[-0.03em]">−{page.status}</span><span
				class="ml-2 text-[clamp(18px,3.5vw,30px)]"
			>м</span>
		</p>

		<div class="mt-8 flex flex-col items-center gap-5">
			<p class="font-mono text-[11px] uppercase tracking-[0.2em] text-mut">{note}</p>
			<a
				href="/"
				class="group inline-flex items-center gap-2 font-mono text-[11px] uppercase
					tracking-[0.16em] text-mark transition-colors hover:text-ink"
			>
				<span
					aria-hidden="true"
					class="transition-transform duration-200 group-hover:-translate-y-0.5"
				>
					↑
				</span>
				на поверхность
			</a>
		</div>
	</div>
</div>