import { window, LogOutputChannel } from "vscode";

let instance: LogOutputChannel | undefined = undefined;

export function logger(): LogOutputChannel {
  if (!instance) {
    instance = window.createOutputChannel("CodePal", { log: true });
  }
  return instance;
}
