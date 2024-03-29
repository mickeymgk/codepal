import { commands, window, workspace, ConfigurationTarget } from "vscode";
import { logger } from "./logger";

function showInformationWhenAutomaticTrigger() {
  window
    .showInformationMessage(
      "CodePal automatic code completion is enabled. Switch to manual trigger mode?",
      "Manual Mode",
      "Settings",
    )
    .then((selection) => {
      switch (selection) {
        case "Manual Mode":
          commands.executeCommand("codepal-vscode.toggleInlineCompletionTriggerMode", "manual");
          break;
        case "Settings":
          commands.executeCommand("codepal-vscode.openSettings");
          break;
      }
    });
}

function showInformationWhenManualTrigger() {
  window
    .showInformationMessage(
      "CodePal is standing by. Trigger code completion manually?",
      "Trigger",
      "Automatic Mode",
      "Settings",
    )
    .then((selection) => {
      switch (selection) {
        case "Trigger":
          commands.executeCommand("editor.action.inlineSuggest.trigger");
          break;
        case "Automatic Mode":
          commands.executeCommand("codepal-vscode.toggleInlineCompletionTriggerMode", "automatic");
          break;
        case "Settings":
          commands.executeCommand("codepal-vscode.openSettings");
          break;
      }
    });
}

function showInformationWhenManualTriggerLoading() {
  window.showInformationMessage("CodePal is generating code completions.", "Settings").then((selection) => {
    switch (selection) {
      case "Settings":
        commands.executeCommand("codepal-vscode.openSettings");
        break;
    }
  });
}

// TODO: finish this
function showInformationWhenInlineSuggestDisabled() {
  window
    .showWarningMessage(
      "CodePal's suggestion is not showing up because inline suggestion is disabled. Please enable it first.",
      "Enable",
      "Settings",
    )
    .then((selection) => {
      switch (selection) {
        case "Enable":
          logger().debug(`Set editor.inlineSuggest.enabled: true.`);
          workspace.getConfiguration("editor").update("inlineSuggest.enabled", true, ConfigurationTarget.Global, false);
          break;
        case "Settings":
          commands.executeCommand("workbench.action.openSettings", "@id:editor.inlineSuggest.enabled");
          break;
      }
    });
}

function showInformationWhenNotConfigured() {
  window
    .showInformationMessage("CodePal is not configured correctly, please configure it in the settings", "Settings")
    .then((selection) => {
      switch (selection) {
        case "Settings":
          commands.executeCommand("codepal-vscode.openSettings");
          break;
      }
    });
}

export const notifications = {
  showInformationWhenAutomaticTrigger,
  showInformationWhenManualTrigger,
  showInformationWhenManualTriggerLoading,
  showInformationWhenInlineSuggestDisabled,
  showInformationWhenNotConfigured,
};
