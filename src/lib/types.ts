export type CardKind = 'text' | 'works' | 'contact';

export interface InterviewCard {
	no: string;
	label: string;
	question: string;
	answer: string;
	marginalia?: string;
	kind: CardKind;
}

export interface Profile {
	name: string;
	status: string;
	motto?: string;
	cards: InterviewCard[];
}

export interface Project {
	_id: string;
	title: string;
	year: string;
	description?: string;
	tags?: string[];
	codeUrl?: string;
	liveUrl?: string;
}

export interface ContactPayload {
	name: string;
	email: string;
	message: string;
}

export interface ContactResult {
	ok: boolean;
	error?: string;
}
