import assert from "node:assert/strict";

import * as vscode from "vscode";

export async function run(): Promise<void> {
  const extension = vscode.extensions.getExtension("Builder.agent-native");
  assert.ok(extension, "Agent Native extension should be discoverable");
  await extension.activate();

  const target =
    "https://mail.jami.studio/_agent-native/open?view=inbox&agentSidebar=closed";
  const openResult = await vscode.commands.executeCommand<{
    url: string;
    title: string;
  }>("agentNative.openUrl", target);
  assert.equal(openResult?.url, target);
  assert.equal(openResult?.title, "Agent Native: mail.jami.studio");

  const lastOpened = await vscode.commands.executeCommand<string>(
    "agentNative._getLastOpenedUrl",
  );
  assert.equal(lastOpened, target);

  const uriTarget =
    "https://calendar.jami.studio/_agent-native/open?view=calendar";
  await vscode.commands.executeCommand(
    "agentNative._openUri",
    vscode.Uri.parse(
      `vscode://builder.agent-native/open?url=${encodeURIComponent(uriTarget)}`,
    ),
  );
  const uriLastOpened = await vscode.commands.executeCommand<string>(
    "agentNative._getLastOpenedUrl",
  );
  assert.equal(uriLastOpened, uriTarget);

  const connectCommand = await vscode.commands.executeCommand<string>(
    "agentNative.connectWorkspace",
    "https://dispatch.jami.studio",
    "project",
  );
  assert.match(connectCommand ?? "", /@agent-native\/core@latest connect/);
  assert.match(connectCommand ?? "", /--client github-copilot/);
  assert.match(connectCommand ?? "", /--scope project/);
}
