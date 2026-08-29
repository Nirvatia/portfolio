import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'profile',
	title: 'Профиль',
	type: 'document',
	fields: [
		defineField({ name: 'name', title: 'Имя', type: 'string', initialValue: 'Nirvatia' }),
		defineField({ name: 'status', title: 'Статус', type: 'string', initialValue: 'открыт к заказам' }),
		defineField({ name: 'motto', title: 'Девиз', type: 'string' }),
		defineField({ name: 'cards', title: 'Карточки', type: 'array', of: [{ type: 'interviewCard' }] })
	]
})