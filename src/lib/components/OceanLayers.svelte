<!-- $lib/components/OceanLayers.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';

	/** Нормализованная глубина 0..1 (0 — поверхность, 1 — дно). */
	let { depth = 0 }: { depth: number } = $props();

	let causticsEl: HTMLCanvasElement | undefined = $state();
	let snowEl: HTMLCanvasElement | undefined = $state();

	/* прозрачность каустики: видна у поверхности, гаснет с глубиной */
	let causticsOpacity = $derived(Math.max(0, Math.min(0.9, 1 - depth * 1.5)));

	/* --- изменяемое состояние (читается из rAF-цикла) --- */
	const depthRef = { value: 0, prev: 0 };
	let gl: WebGLRenderingContext | null = null;
	let prog: WebGLProgram | null = null;
	let uRes: WebGLUniformLocation | null = null;
	let uTime: WebGLUniformLocation | null = null;
	let causticsOK = false;
	let causticsCleared = false;
	let sctx: CanvasRenderingContext2D | null = null;
	let sw = 0;
	let sh = 0;
	let snow: SnowP[] = [];
	let bubbles: BubbleP[] = [];
	const jelly = { x: 0, y: 0, baseR: 0, pulse: 0 };
	let flow = 0;
	let raf = 0;
	let last = 0;
	let reduceMotion = false;

	interface SnowP {
		x: number;
		y: number;
		r: number;
		vy: number;
		drift: number;
		a: number;
		layer: number;
		ph: number;
	}
	interface BubbleP {
		x: number;
		y: number;
		r: number;
		vy: number;
		ph: number;
		a: number;
	}

	/* --- каустика (WebGL) --- */
	const VERT = `attribute vec2 a_pos; varying vec2 v_uv;
void main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0.0,1.0); }`;
	const FRAG = `precision highp float;
varying vec2 v_uv; uniform vec2 u_res; uniform float u_time;
void main(){
	vec2 uv=v_uv; uv.x*=u_res.x/max(u_res.y,1.0); uv*=0.7;
	float time=u_time*0.18;
	vec2 p=mod(uv*6.28318,6.28318)-250.0; vec2 i=p; float c=1.0; const float inten=0.005;
	for(int nn=0;nn<5;nn++){
		float t=time*(1.0-(3.5/float(nn+1)));
		i=p+vec2(cos(t-i.x)+sin(t+i.y), sin(t-i.y)+cos(t+i.x));
		c+=1.0/length(vec2(p.x/(sin(i.x+t)/inten), p.y/(cos(i.y+t)/inten)));
	}
	c/=5.0; c=1.17-pow(c,1.4); c=clamp(pow(abs(c),8.0),0.0,1.0);
	float fade=smoothstep(0.0,0.65,v_uv.y);
	gl_FragColor=vec4(vec3(0.45,0.82,0.86)*c, c*fade*0.6);
}`;

	function initCaustics() {
		const canvas = causticsEl;
		if (!canvas) return;
		try {
			gl = (canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false }) ||
				canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
			if (!gl) throw new Error('no webgl');
			const vs = gl.createShader(gl.VERTEX_SHADER)!;
			gl.shaderSource(vs, VERT);
			gl.compileShader(vs);
			const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
			gl.shaderSource(fs, FRAG);
			gl.compileShader(fs);
			if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error('frag');
			prog = gl.createProgram()!;
			gl.attachShader(prog, vs);
			gl.attachShader(prog, fs);
			gl.linkProgram(prog);
			if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
			gl.useProgram(prog);
			const buf = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
			const loc = gl.getAttribLocation(prog, 'a_pos');
			gl.enableVertexAttribArray(loc);
			gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
			uRes = gl.getUniformLocation(prog, 'u_res');
			uTime = gl.getUniformLocation(prog, 'u_time');
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.clearColor(0, 0, 0, 0);
			causticsOK = true;
		} catch {
			causticsOK = false;
			if (canvas) canvas.style.display = 'none';
		}
	}

	function resizeCaustics() {
		if (!causticsOK || !causticsEl || !gl) return;
		const cw = causticsEl.clientWidth,
			ch = causticsEl.clientHeight;
		const scale = Math.min(0.5, 600 / Math.max(1, cw));
		const w = Math.max(2, Math.round(cw * scale)),
			h = Math.max(2, Math.round(ch * scale));
		if (causticsEl.width !== w || causticsEl.height !== h) {
			causticsEl.width = w;
			causticsEl.height = h;
		}
	}

	function drawCaustics(t: number) {
		if (!causticsOK || !gl || !causticsEl) return;
		if (depthRef.value > 0.85) {
			if (!causticsCleared) {
				gl.viewport(0, 0, causticsEl.width, causticsEl.height);
				gl.clear(gl.COLOR_BUFFER_BIT);
				causticsCleared = true;
			}
			return;
		}
		causticsCleared = false;
		gl.viewport(0, 0, causticsEl.width, causticsEl.height);
		gl.uniform2f(uRes, causticsEl.width, causticsEl.height);
		gl.uniform1f(uTime, reduceMotion ? 0 : t);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	/* --- снег, пузыри, медуза (2D) --- */
	function newSnow(randY: boolean): SnowP {
		const layer = Math.random();
		return {
			x: Math.random() * sw,
			y: randY ? Math.random() * sh : -8,
			r: 0.4 + layer * 1.2,
			vy: 0.04 + layer * 0.15,
			drift: (Math.random() - 0.5) * 0.1,
			a: 0.1 + layer * 0.28,
			layer,
			ph: Math.random() * 6.28
		};
	}

	function initSnow() {
		const count = sw < 768 ? 20 : 46;
		snow = [];
		for (let i = 0; i < count; i++) snow.push(newSnow(true));
	}

	function initJelly() {
		const mobile = sw < 768;
		const span = Math.min(sw, sh);
		jelly.baseR = mobile
			? Math.max(18, Math.min(46, span * 0.07))
			: Math.max(28, Math.min(84, span * 0.1));
		jelly.x = sw * (mobile ? 0.7 : 0.75);
		jelly.y = sh * 0.56;
	}

	function resizeSnow() {
		const canvas = snowEl;
		if (!canvas) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		sw = window.innerWidth;
		sh = window.innerHeight;
		canvas.width = Math.round(sw * dpr);
		canvas.height = Math.round(sh * dpr);
		canvas.style.width = sw + 'px';
		canvas.style.height = sh + 'px';
		sctx = canvas.getContext('2d');
		if (sctx) sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		initSnow();
		initJelly();
	}

	function spawnBubbles(count: number) {
		if (reduceMotion || !sw) return;
		for (let i = 0; i < count; i++) {
			bubbles.push({
				x: Math.random() * sw,
				y: sh + Math.random() * 40,
				r: 1.4 + Math.random() * 3,
				vy: -(0.6 + Math.random() * 1.1),
				ph: Math.random() * 6.28,
				a: 0.2 + Math.random() * 0.28
			});
		}
		if (bubbles.length > 24) bubbles.splice(0, bubbles.length - 24);
	}

	const smoothstep = (a: number, b: number, x: number) => {
		const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
		return t * t * (3 - 2 * t);
	};

	function bellPath(cx: number, cy: number, R: number, skirt: number, t: number) {
		const c = sctx!;
		c.beginPath();
		c.moveTo(cx - R, cy);
		c.arc(cx, cy, R, Math.PI, 2 * Math.PI);
		const steps = 40;
		for (let s = steps; s >= 0; s--) {
			const u = s / steps,
				x = cx - R + 2 * R * u,
				bulge = Math.sin(u * Math.PI);
			const wave = Math.sin(u * Math.PI * 5 + t * 2) * R * 0.05 * bulge;
			c.lineTo(x, cy + bulge * skirt + wave);
		}
		c.closePath();
	}

	function drawJelly(dt: number, alpha: number) {
		if (alpha <= 0.01 || !sctx) return;
		const c = sctx;
		jelly.pulse += reduceMotion ? 0 : dt * 0.0016;
		const t = jelly.pulse;
		const contract = 0.5 + 0.5 * Math.sin(t);
		const R = jelly.baseR * (1 - 0.12 * contract);
		const cx = jelly.x + Math.sin(t * 0.37) * R * 0.4;
		const cy = jelly.y + Math.cos(t * 0.29) * R * 0.5 - contract * R * 0.25;
		const skirt = R * 0.36;

		c.save();
		c.globalCompositeOperation = 'lighter';

		/* мягкий многослойный ореол */
		const halo = c.createRadialGradient(cx, cy, 0, cx, cy, R * 4.8);
		halo.addColorStop(0, `rgba(120,225,240,${0.22 * alpha})`);
		halo.addColorStop(0.25, `rgba(90,180,215,${0.12 * alpha})`);
		halo.addColorStop(0.55, `rgba(60,130,180,${0.05 * alpha})`);
		halo.addColorStop(1, 'rgba(30,70,120,0)');
		c.fillStyle = halo;
		c.beginPath();
		c.arc(cx, cy, R * 4.8, 0, 6.283);
		c.fill();

		const halo2 = c.createRadialGradient(cx, cy, R * 1.5, cx, cy, R * 7);
		halo2.addColorStop(0, `rgba(80,160,200,${0.07 * alpha})`);
		halo2.addColorStop(1, 'rgba(40,90,140,0)');
		c.fillStyle = halo2;
		c.beginPath();
		c.arc(cx, cy, R * 7, 0, 6.283);
		c.fill();

		/* щупальца со свечением */
		c.lineCap = 'round';
		c.shadowColor = `rgba(120,230,245,${0.5 * alpha})`;
		c.shadowBlur = R * 0.35;
		const tent = 11;
		for (let i = 0; i < tent; i++) {
			const u = (i + 0.5) / tent,
				sx = cx - R + 2 * R * u,
				bulge = Math.sin(u * Math.PI);
			const sy = cy + bulge * skirt * 0.9,
				len = R * (1.4 + 2.1 * bulge),
				ph = i * 0.6 + t * 1.3;
			c.beginPath();
			c.moveTo(sx, sy);
			const segs = 16;
			for (let s = 1; s <= segs; s++) {
				const f = s / segs;
				c.lineTo(
					sx + Math.sin(ph + f * 4.2) * R * 0.26 * f + Math.sin(ph * 0.5 + f * 2) * R * 0.07 * f,
					sy + len * f
				);
			}
			const g = c.createLinearGradient(sx, sy, sx, sy + len);
			g.addColorStop(0, `rgba(150,240,245,${0.4 * alpha})`);
			g.addColorStop(0.5, `rgba(110,200,230,${0.16 * alpha})`);
			g.addColorStop(1, 'rgba(90,170,210,0)');
			c.strokeStyle = g;
			c.lineWidth = Math.max(0.5, R * 0.026 * (0.5 + 0.5 * bulge));
			c.stroke();
		}
		c.shadowBlur = 0;

		/* ротовые лопасти */
		for (let i = 0; i < 4; i++) {
			const u = 0.36 + 0.09 * i,
				sx = cx - R + 2 * R * u,
				sy = cy + skirt * 0.5;
			const len = R * 1.15,
				ph = i * 1.1 + t * 1.1;
			c.beginPath();
			c.moveTo(sx, sy);
			for (let s = 1; s <= 10; s++) {
				const f = s / 10;
				c.lineTo(sx + Math.sin(ph + f * 3) * R * 0.16 * f, sy + len * f);
			}
			const g = c.createLinearGradient(sx, sy, sx, sy + len);
			g.addColorStop(0, `rgba(165,242,250,${0.26 * alpha})`);
			g.addColorStop(1, 'rgba(120,190,220,0)');
			c.strokeStyle = g;
			c.lineWidth = Math.max(1, R * 0.07);
			c.stroke();
		}

		/* колокол со свечением */
		c.shadowColor = `rgba(140,235,250,${0.55 * alpha})`;
		c.shadowBlur = R * 0.5;
		bellPath(cx, cy, R, skirt, t);
		const bg = c.createRadialGradient(cx, cy - R * 0.35, R * 0.1, cx, cy + R * 0.1, R * 1.25);
		bg.addColorStop(0, `rgba(175,246,250,${0.28 * alpha})`);
		bg.addColorStop(0.45, `rgba(100,200,225,${0.15 * alpha})`);
		bg.addColorStop(1, `rgba(50,120,170,${0.04 * alpha})`);
		c.fillStyle = bg;
		c.fill();

		/* светящийся ободок */
		c.strokeStyle = `rgba(150,240,250,${0.5 * alpha})`;
		c.lineWidth = Math.max(0.8, R * 0.03);
		c.shadowBlur = R * 0.6;
		bellPath(cx, cy, R, skirt, t);
		c.stroke();
		c.shadowBlur = 0;

		/* фоточки по краю */
		for (let i = 0; i <= 12; i++) {
			const u = i / 12,
				x = cx - R + 2 * R * u,
				bulge = Math.sin(u * Math.PI),
				y = cy + bulge * skirt;
			const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i * 0.8));
			c.globalAlpha = alpha * tw;
			c.fillStyle = 'rgba(195,255,255,0.95)';
			c.beginPath();
			c.arc(x, y, Math.max(0.7, R * 0.03), 0, 6.283);
			c.fill();
		}
		c.globalAlpha = 1;
		c.restore();
	}

	function drawSnow(dt: number) {
		if (!sctx) return;
		const c = sctx;
		const k = dt / 16.67;
		flow *= Math.pow(0.93, k);
		const dim = 1 - depthRef.value * 0.72;
		c.globalCompositeOperation = 'source-over';
		c.fillStyle = '#cfe6ea';
		for (const p of snow) {
			p.ph += 0.008 * k;
			p.x += (p.drift + Math.sin(p.ph) * 0.1) * k;
			p.y += (p.vy + flow * (0.3 + p.layer * 0.7)) * k;
			if (p.y > sh + 10) {
				p.y = -10;
				p.x = Math.random() * sw;
			} else if (p.y < -10) {
				p.y = sh + 10;
				p.x = Math.random() * sw;
			}
			if (p.x > sw + 10) p.x = -10;
			else if (p.x < -10) p.x = sw + 10;
			c.globalAlpha = p.a * dim;
			c.beginPath();
			c.arc(p.x, p.y, p.r, 0, 6.283);
			c.fill();
		}
		c.lineWidth = 0.9;
		c.strokeStyle = 'rgba(180,225,230,0.55)';
		for (let i = bubbles.length - 1; i >= 0; i--) {
			const b = bubbles[i];
			b.ph += 0.06 * k;
			b.x += Math.sin(b.ph) * 0.5 * k;
			b.y += b.vy * k;
			if (b.y < -12) {
				bubbles.splice(i, 1);
				continue;
			}
			c.globalAlpha = b.a * dim;
			c.beginPath();
			c.arc(b.x, b.y, b.r, 0, 6.283);
			c.stroke();
		}
		c.globalAlpha = 1;
	}

	function drawScene(dt: number) {
		if (!sctx) return;
		sctx.clearRect(0, 0, sw, sh);
		drawJelly(dt, smoothstep(0.35, 0.75, depthRef.value));
		drawSnow(dt);
	}

	/* --- цикл --- */
	function frame(ts: number) {
		const dt = Math.min(50, last ? ts - last : 16);
		last = ts;
		drawScene(dt);
		drawCaustics(ts / 1000);
		raf = requestAnimationFrame(frame);
	}
	function startLoop() {
		if (!raf && !reduceMotion) {
			last = 0;
			raf = requestAnimationFrame(frame);
		}
	}
	function stopLoop() {
		if (raf) {
			cancelAnimationFrame(raf);
			raf = 0;
		}
	}

	/* синхронизация глубины + пузыри при смене секции */
	$effect(() => {
		const d = depth; // реактивное чтение пропа
		depthRef.prev = depthRef.value;
		depthRef.value = d;
		if (depthRef.value !== depthRef.prev && !reduceMotion && sw > 0) {
			spawnBubbles(4);
			flow = depthRef.value > depthRef.prev ? -9 : 9;
		}
	});

	onMount(() => {
		reduceMotion =
			typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		initCaustics();
		resizeCaustics();
		resizeSnow();
		if (reduceMotion) {
			drawScene(0);
			drawCaustics(0);
		} else startLoop();

		const onResize = () => {
			resizeCaustics();
			resizeSnow();
			if (reduceMotion) {
				drawScene(0);
				drawCaustics(0);
			}
		};
		const onVis = () => {
			if (document.hidden) stopLoop();
			else startLoop();
		};
		window.addEventListener('resize', onResize);
		document.addEventListener('visibilitychange', onVis);

		return () => {
			stopLoop();
			window.removeEventListener('resize', onResize);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<canvas
	bind:this={causticsEl}
	aria-hidden="true"
	class="pointer-events-none fixed left-0 top-0 z-1 h-[46vh] w-full mix-blend-screen"
	style:opacity={causticsOpacity}
></canvas>

<canvas
	bind:this={snowEl}
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 z-2 size-full mix-blend-screen"
></canvas>
