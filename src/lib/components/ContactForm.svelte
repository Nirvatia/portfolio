<script lang="ts">
	import type { ContactPayload } from '$lib/types';

	type FormState = 'idle' | 'sending' | 'sent' | 'error';
	type FieldErrors = { name: string; email: string; message: string };

	let formState: FormState = $state('idle');
	let sentName = $state('');
	let sentEmail = $state('');
	let errors: FieldErrors = $state({ name: '', email: '', message: '' });

	let nameEl: HTMLInputElement | undefined = $state();
	let emailEl: HTMLInputElement | undefined = $state();
	let messageEl: HTMLTextAreaElement | undefined = $state();

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	/* поле: прозрачный фон, волосок снизу; при фокусе волосок гаснет — его заменяет нить */
	const field =
		'peer w-full border-b border-line bg-transparent py-2 font-serif text-base ' +
		'normal-case tracking-normal text-ink caret-mark outline-none transition-colors duration-300 ' +
		'focus:border-transparent focus-visible:outline-none';

	/* светящаяся нить под полем: видна при фокусе, при ошибке — постоянно */
	const wire = (invalid: boolean) =>
		'pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-mark to-transparent ' +
		'shadow-[0_6px_18px_-6px_rgba(111,207,214,0.55)] transition-opacity duration-300 ' +
		(invalid ? 'opacity-100' : 'opacity-0 peer-focus:opacity-100');

	const labelCls = 'grid gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mut';
	const errCls = (show: boolean) =>
		'min-h-[1.5em] font-mono text-[11px] leading-normal tracking-[0.06em] normal-case text-mark ' +
		'transition-opacity duration-200 ' +
		(show ? 'opacity-100' : 'opacity-0');

	const validateName = (v: string) => (!v ? 'представься — хотя бы одним словом' : '');
	const validateEmail = (v: string) =>
		!v ? 'куда отвечать?' : EMAIL_RE.test(v) ? '' : 'это не похоже на почту';
	const validateMessage = (v: string) => (!v ? 'напиши хоть пару строк' : '');

	function liveCheck(k: keyof FieldErrors, value: string) {
		if (!errors[k]) return;
		errors[k] =
			k === 'name'
				? validateName(value)
				: k === 'email'
					? validateEmail(value)
					: validateMessage(value);
	}

	async function handleSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		if (formState === 'sending') return;
		const fd = new FormData(e.currentTarget);
		const payload = {
			name: String(fd.get('name') ?? '').trim(),
			email: String(fd.get('email') ?? '').trim(),
			message: String(fd.get('message') ?? '').trim(),
			website: String(fd.get('website') ?? '')
		} satisfies ContactPayload & { website: string };

		errors.name = validateName(payload.name);
		errors.email = validateEmail(payload.email);
		errors.message = validateMessage(payload.message);

		if (errors.name || errors.email || errors.message) {
			(errors.name ? nameEl : errors.email ? emailEl : messageEl)?.focus();
			return;
		}

		formState = 'sending';
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const out = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean };
			if (res.ok && out.ok) {
				sentName = payload.name;
				sentEmail = payload.email;
				formState = 'sent';
			} else {
				formState = 'error';
			}
		} catch {
			formState = 'error';
		}
	}
</script>

{#if formState === 'sent'}
	<div class="card-in">
		<p class="hang mb-4 mt-[clamp(18px,3vh,28px)] ml-[-2ch] font-mono text-[13px] text-mut">
			— И что дальше?
		</p>
		<p
			role="status"
			class="dropcap wrap-anywhere font-serif text-[clamp(21px,min(4.6vw,6vh),38px)] leading-[1.3] tracking-[-0.01em]"
		>
			Спасибо, {sentName}. Сигнал передан. Отвечу на {sentEmail}.
		</p>
	</div>
{:else}
	<form
		novalidate
		class="relative mt-[clamp(14px,2.4vh,26px)] grid max-w-115 gap-[clamp(14px,2vh,20px)]"
		aria-busy={formState === 'sending'}
		onsubmit={handleSubmit}
	>
		<div class="absolute left-[-9999px]" aria-hidden="true">
			<label>
				не заполняйте это поле
				<input type="text" name="website" tabindex="-1" autocomplete="off" />
			</label>
		</div>

		<label class={labelCls}>
			имя
			<span class="relative block">
				<input
					bind:this={nameEl}
					id="f-name"
					name="name"
					maxlength="200"
					autocomplete="name"
					class="{field} {errors.name ? 'border-transparent' : ''}"
					aria-invalid={errors.name ? true : undefined}
					aria-describedby={errors.name ? 'err-name' : undefined}
					oninput={(e) => liveCheck('name', e.currentTarget.value)}
				/>
				<span aria-hidden="true" class={wire(!!errors.name)}></span>
			</span>
			<p id="err-name" role="alert" class={errCls(!!errors.name)}>{errors.name}</p>
		</label>

		<label class={labelCls}>
			почта
			<span class="relative block">
				<input
					bind:this={emailEl}
					id="f-email"
					type="email"
					name="email"
					maxlength="320"
					autocomplete="email"
					class="{field} {errors.email ? 'border-transparent' : ''}"
					aria-invalid={errors.email ? true : undefined}
					aria-describedby={errors.email ? 'err-email' : undefined}
					oninput={(e) => liveCheck('email', e.currentTarget.value)}
				/>
				<span aria-hidden="true" class={wire(!!errors.email)}></span>
			</span>
			<p id="err-email" role="alert" class={errCls(!!errors.email)}>{errors.email}</p>
		</label>

		<label class={labelCls}>
			о чём речь
			<span class="relative block">
				<textarea
					bind:this={messageEl}
					name="message"
					maxlength="4000"
					class="{field} min-h-[clamp(56px,10vh,80px)] resize-y leading-normal {errors.message
						? 'border-transparent'
						: ''}"
					aria-invalid={errors.message ? true : undefined}
					aria-describedby={errors.message ? 'err-message' : undefined}
					oninput={(e) => liveCheck('message', e.currentTarget.value)}></textarea>
				<span aria-hidden="true" class={wire(!!errors.message)}></span>
			</span>
			<p id="err-message" role="alert" class={errCls(!!errors.message)}>{errors.message}</p>
		</label>

		<button
			type="submit"
			disabled={formState === 'sending'}
			class="inline-flex cursor-pointer items-center gap-2.5 justify-self-start
		border border-mark/10 px-5 py-2.5
		bg-[linear-gradient(180deg,rgba(111,207,214,0.08),rgba(111,207,214,0.02))]
		font-mono text-xs uppercase tracking-[0.18em] text-mark
		transition-all duration-200
		hover:border-mark/15
		hover:bg-[linear-gradient(180deg,rgba(111,207,214,0.16),rgba(111,207,214,0.04))]
		active:translate-y-px
		disabled:cursor-default disabled:opacity-45"
		>
			<span
				aria-hidden="true"
				class="dot-pulse size-1.5 flex-none rounded-full bg-mark
			shadow-[0_0_8px_rgba(111,207,214,0.85)]"
			></span>
			{formState === 'sending' ? 'Передаю…' : 'Передать сигнал'}
		</button>

		<p
			role="alert"
			aria-hidden={formState === 'error' ? undefined : 'true'}
			class="min-h-[1.5em] text-sm leading-normal text-mut transition-opacity duration-200
				{formState === 'error' ? 'opacity-100' : 'opacity-0'}"
		>
			Не ушло. Попробуй ещё раз.
		</p>
	</form>
{/if}
