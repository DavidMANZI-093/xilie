import { SETTINGS } from "../config/settings";

export class Logger {
	private active: boolean = true;
	private prefixes: Record<string, string> = {
		info: "\x1b[36mXilie (info)\x1b[0m",
		error: "\x1b[31mXilie (error)\x1b[0m",
		warn: "\x1b[33mXilie (warn)\x1b[0m",
		debug: "\x1b[32mXilie (debug)\x1b[0m",
	};
	constructor(active: boolean = true) {
		this.active = active;
	}

	setActive(active: boolean) {
		this.active = active;
	}

	info(message: string) {
		if (!this.active) {
			return;
		}
		console.info(`${this.prefixes.info} ${message}`);
	}

	error(message: string) {
		if (!this.active) {
			return;
		}
		console.error(`${this.prefixes.error} ${message}`);
	}

	warn(message: string) {
		if (!this.active) {
			return;
		}
		console.warn(`${this.prefixes.warn} ${message}`);
	}

	debug(message: string) {
		if (!this.active) {
			return;
		}
		console.debug(`${this.prefixes.debug} ${message}`);
	}
}

export const logger = new Logger();