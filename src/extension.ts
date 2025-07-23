import * as vscode from 'vscode';
import KeyStrokeRecorder from './lib/keystroke-recorder';

let disposable: vscode.Disposable;
let recorder: KeyStrokeRecorder;

export function activate(context: vscode.ExtensionContext) {

	recorder = new KeyStrokeRecorder();
	vscode.window.showInformationMessage("KSPT activate");

  disposable = vscode.commands.registerCommand('extension.logKey', (args) => {
		recorder.onLogKey();
  	});

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(async event => {
		if (
      event.document.fileName !== 'exthost' && // exclude logging
      event.contentChanges.length > 0
    ) {
      const change = event.contentChanges[0];

      // Handle deletion
      if (change.text === '' && change.rangeLength > 0) {
        return vscode.window.showInformationMessage("KSPT delete");
      }

      const changedText = change.text.replace(/(\r\n|\n|\r)/g, "");
      if (changedText.length === 1) {
        return vscode.commands.executeCommand('extension.logKey');
      }

      if (changedText.length > 1) {
        const clipboardText = await vscode.env.clipboard.readText();
        if (changedText !== clipboardText.replace(/(\r\n|\n|\r)/g, "")) {
          return vscode.window.showInformationMessage("KSPT large change"); // Code was added by AI
        }
      }
    }}
	));

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(event => {
		recorder.saveStateToFile();
	}));

	context.subscriptions.push(disposable);
}

export function deactivate() {
	disposable.dispose();
	recorder.saveStateToFile();
}
