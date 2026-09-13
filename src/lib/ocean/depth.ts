// $lib/ocean/depth.ts

export interface DepthInfo {
	/** глубина в метрах, отрицательная */
	depth: number;
	/** название зоны */
	zone: string;
}

/** Представительные уровни погружения (соответствуют 6 карточкам). */
const LEVELS: DepthInfo[] = [
	{ depth: -12, zone: 'шлюз' },
	{ depth: -180, zone: 'граница света' },
	{ depth: -650, zone: 'сумерки' },
	{ depth: -1900, zone: 'жилой отсек' },
	{ depth: -4200, zone: 'бездна' },
	{ depth: -10916, zone: 'дно' }
];

/**
 * Глубина и зона для карточки по её индексу.
 * Для 6 карточек — ровно таблица; иначе — линейная интерполяция между уровнями.
 */
export function depthFor(index: number, total: number): DepthInfo {
	const n = LEVELS.length;
	if (total <= 1) return { ...LEVELS[0] };
	if (total === n) return { ...LEVELS[Math.min(index, n - 1)] };

	const t = index / (total - 1); // 0..1
	const pos = t * (n - 1);
	const lo = Math.floor(pos);
	const hi = Math.min(lo + 1, n - 1);
	const frac = pos - lo;
	const depth = Math.round(LEVELS[lo].depth + (LEVELS[hi].depth - LEVELS[lo].depth) * frac);
	const zone = frac < 0.5 ? LEVELS[lo].zone : LEVELS[hi].zone;
	return { depth, zone };
}

/** Нормализованная глубина 0..1 (0 — поверхность, 1 — дно). */
export function depthFactor(index: number, total: number): number {
	return total <= 1 ? 0 : index / (total - 1);
}

/** Форматирует глубину: −10 916 м (тонкие пробелы в тысячах). */
export function formatDepth(d: number): string {
	const abs = Math.abs(Math.round(d));
	const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
	return (d < 0 ? '\u2212' : '') + grouped + '\u00A0м';
}