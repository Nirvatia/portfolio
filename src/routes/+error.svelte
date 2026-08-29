<script lang="ts">
	import { page } from '$app/state'
</script>

<div class="grid min-h-dvh place-items-center bg-paper px-6 text-ink">
	<div class="max-w-md">
		<p class="mb-4 font-mono text-[13px] text-mut">— Что случилось?</p>
		<h1 class="mb-6 font-serif text-4xl leading-tight">
			{page.status}. Такого вопроса в интервью не было.
		</h1>
		<a href="/" class="underline decoration-mark underline-offset-4">Начать заново</a>
	</div>
</div>