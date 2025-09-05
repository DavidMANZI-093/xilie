export function formatJSON(json: any) {
	return `\n${JSON.stringify(json, undefined, 2)
		.split("\n")
		.map((line) => "    " + line)
		.join("\n")}\n`;
}
