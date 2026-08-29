<script lang="ts">
	import type { Profile } from '$lib/types'

	let { name, status }: Pick<Profile, 'name' | 'status'> = $props()
</script>

<header
	class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1
		font-mono text-[clamp(10px,1.3vw,11px)] uppercase tracking-[0.14em] text-mut
		print:hidden"
>
	<h1 class="font-medium text-ink">{name}</h1>
	<p class="flex items-center">
		<span class="dot-pulse mr-2 size-[7px] rounded-full bg-mark" aria-hidden="true"></span>
		{status}
	</p>
</header>