export const PROFILE_QUERY = /* groq */ `
*[_type == "profile"][0]{
	name,
	status,
	motto,
	cards[]{ no, label, question, answer, marginalia, kind }
}`;

export const PROJECTS_QUERY = /* groq */ `
*[_type == "project"] | order(order asc){
	_id, title, year, description, tags, codeUrl, liveUrl
}`;
