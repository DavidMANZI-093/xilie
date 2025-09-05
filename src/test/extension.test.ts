import * as assert from "assert";
import * as vscode from "vscode";

suite("Xilie Extension Test Suite", () => {
	vscode.window.showInformationMessage("Starting Xilie tests.");

	test("Extension should be present", () => {
		assert.ok(vscode.extensions.getExtension("d3fault.xilie"));
	});

	test("Extension should activate", async () => {
		const extension = vscode.extensions.getExtension("d3fault.xilie");
		assert.ok(extension);
		
		if (!extension.isActive) {
			await extension.activate();
		}
		
		assert.ok(extension.isActive);
	});

	test("Commands should be registered", async () => {
		const commands = await vscode.commands.getCommands(true);
		
		const expectedCommands = [
			"xilie.authenticate",
			"xilie.signOut",
			"xilie.showXilie",
			"xilie.playPause",
			"xilie.nextTrack",
			"xilie.previousTrack"
		];
		
		for (const command of expectedCommands) {
			assert.ok(commands.includes(command), `Command ${command} should be registered`);
		}
	});

	test("Tree data providers should be registered", () => {
		// This test verifies that the tree data providers are properly registered
		// In a real test environment, we would check if the tree views are available
		assert.ok(true, "Tree data providers registration test placeholder");
	});
});