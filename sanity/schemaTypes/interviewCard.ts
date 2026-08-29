import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'interviewCard',
	title: 'Карточка интервью',
	type: 'object',
	fields: [
		defineField({ name: 'no', title: 'Номер', type: 'string', description: '01, 02…' }),
		defineField({ name: 'label', title: 'Метка', type: 'string', description: 'Короткое имя для оглавления' }),
		defineField({ name: 'question', title: 'Вопрос', type: 'string' }),
		defineField({
			name: 'answer',
			title: 'Ответ',
			type: 'text',
			rows: 4,
			description: '*звёздочками* — красное выделение'
		}),
		defineField({ name: 'marginalia', title: 'Маргиналии', type: 'text', rows: 2 }),
		defineField({
			name: 'kind',
			title: 'Тип',
			type: 'string',
			initialValue: 'text',
			options: {
				list: [
					{ title: 'Текст', value: 'text' },
					{ title: 'Работы', value: 'works' },
					{ title: 'Форма', value: 'contact' }
				]
			}
		})
	],
	preview: { select: { title: 'question', subtitle: 'no' } }
})