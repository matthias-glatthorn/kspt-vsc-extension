import * as vscode from 'vscode';
import KeyStrokeRecorder from './lib/keystroke-recorder';

let disposable: vscode.Disposable;
let recorder: KeyStrokeRecorder;

export function activate(context: vscode.ExtensionContext) {

	recorder = new KeyStrokeRecorder();
	vscode.window.showInformationMessage("KSPT activate");

  	vscode.commands.registerCommand('extension.logKey', (args) => {
		recorder.onLogKey();
  	});

	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
		if (event.contentChanges.length > 0) {
			vscode.commands.executeCommand('extension.logKey');
		}
	}));

	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(event => {
		recorder.saveStateToFile();
	}));

	context.subscriptions.push(disposable);
}


export function deactivate() {
	disposable.dispose();
	recorder.saveStateToFile();
}
