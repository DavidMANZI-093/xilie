// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { SpotifyAuth } from "./spotify/auth";

// Global instances (initialized in activate)
let spotifyAuth: SpotifyAuth;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "xilie" is now active!');

	const redirectUri = `vscode://d3fault.xilie/auth/callback`;

	// Initialize global instances
	spotifyAuth = new SpotifyAuth(context.secrets, redirectUri);

	// --- Register Commands ---
	// Command to initiate Spotify authentication
	context.subscriptions.push(
		vscode.commands.registerCommand("xilie.authenticate", async () => {
			try {
				vscode.window.showInformationMessage(
					"Initiating Spotify authentication...",
				);
				await spotifyAuth.authenticate(); // <--- Calls the authenticate method from auth.ts
				vscode.window.showInformationMessage(
					"Successfully authenticated with Spotify!",
				);
			} catch (error: any) {
				vscode.window.showErrorMessage(
					`Spotify authentication failed: ${error.message || error}`,
				);
				console.error("Spotify authentication error:", error);
			}
		}),
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// const disposable = vscode.commands.registerCommand("xilie.helloWorld", () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage("Hello World from xilie!");
	// });
}

// This method is called when your extension is deactivated
export function deactivate() {}
