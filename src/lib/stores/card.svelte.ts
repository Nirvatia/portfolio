let current = $state(0);
let total = $state(0);

export const cards = {
	get current() {
		return current;
	},
	get total() {
		return total;
	},
	setTotal(n: number) {
		total = Math.max(0, n);
		if (current >= total) current = 0;
	},
	go(i: number) {
		if (total && i >= 0 && i < total) current = i;
	},
	next() {
		if (total) current = (current + 1) % total;
	},
	prev() {
		if (total) current = (current - 1 + total) % total;
	}
};
