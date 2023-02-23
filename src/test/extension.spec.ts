/* eslint-disable @typescript-eslint/naming-convention */

import { formatDate } from "../lib/helpers";
import KeyStrokeRecorder from "../lib/keystroke-recorder";
import * as fs from 'fs';

const vscode = require("../../__mocks__/vscode");


jest.mock('fs', () => {
	return {
		existsSync: jest.fn(),
		readFileSync: jest.fn().mockReturnValue('{"date":"2023-02-19","deviceName":"Fishtower","known":{},"unknown":{}}'),
		mkdirSync: jest.fn(),
		writeFileSync: jest.fn(),
	};
});

const pause = (ms:number) => new Promise(res => setTimeout(res, ms));

describe("KeyStrokeRecorder", function() {
	let recorder = new KeyStrokeRecorder();
	const defaultSaveDir = 'C:\\KSPT';

	afterEach(() => {
		recorder.stopAutoSave();
	});

	it("should have a default saveDir", () => {
		expect(recorder.saveDir).toBe(defaultSaveDir);
	});

	it("should use a config saveDir", () => {
		const configSaveDir = "anotherSaveDir";
		vscode.workspace.getConfiguration().get = jest.fn().mockReturnValueOnce(configSaveDir);
		recorder = new KeyStrokeRecorder();

		expect(recorder.saveDir).toBe(configSaveDir);
	});

	it("should generate todays date json file", () => {
		const todaysDate = formatDate(new Date());
		expect(recorder.fileName).toBe("kspt_" + todaysDate + ".json");
	});

	it("should create saveDir", async () => {
		recorder = new KeyStrokeRecorder();
        await pause(1000);
		expect(fs.existsSync).toHaveBeenCalled();
		expect(fs.mkdirSync).toHaveBeenCalledWith(defaultSaveDir);
	});

	it("should have empty count object by default", () => {
		expect(recorder.knownExtensionsCount).toStrictEqual({});
		expect(recorder.unknownExtensionsCount).toStrictEqual({});
		expect(recorder.excepionExtensionCount).toStrictEqual({});
	});

	it("should add to known extensions when typing in .txt", () => {
		vscode.window.activeTextEditor.document.fileName = "C:\\test\\KnownExtension.txt";
		recorder.onLogKey();
		recorder.onLogKey();
		recorder.onLogKey();
		expect(recorder.knownExtensionsCount).toStrictEqual({".txt": 3});
	});

	it("should add to known extensions when typing in .ts", () => {
		vscode.window.activeTextEditor.document.fileName = "C:\\test\\KnownExtension.ts";
		recorder.onLogKey();
		recorder.onLogKey();
		expect(recorder.knownExtensionsCount).toStrictEqual({".txt": 3, ".ts": 2});
	});

	it("should add to known extensions when typing in .service.ts", () => {
		vscode.window.activeTextEditor.document.fileName = "C:\\test\\KnownExtension.service.ts";
		recorder.onLogKey();
		recorder.onLogKey();
		expect(recorder.knownExtensionsCount).toStrictEqual({".txt": 3, ".ts": 2, ".service.ts": 2});
	});

	it("should add to unknown extensions", () => {
		vscode.window.activeTextEditor.document.fileName = "C:\\test\\KnownExtension";
		recorder.onLogKey();
		recorder.onLogKey();
		recorder.onLogKey();
		expect(recorder.unknownExtensionsCount).toStrictEqual({"KnownExtension": 3});
	});

	it("should add to exceptions", () => {
		vscode.window.activeTextEditor.document.fileName = "C:\\test\\KnownExtension.yaml";
		recorder.onLogKey();
		recorder.onLogKey();
		expect(recorder.excepionExtensionCount).toStrictEqual({"KnownExtension.yaml": 2});
	});

	it("should saveStateToFile", async () => {
		recorder.saveStateToFile();
		const calls = (fs.writeFileSync as any).mock.calls;
		const latestCall = calls[calls.length - 1];

		expect(JSON.parse(latestCall[1])).toEqual(
			expect.objectContaining({
				"known": {".txt": 3, ".ts": 2, ".service.ts": 2},
				"unknown": {"KnownExtension": 3},
				"exception": {"KnownExtension.yaml": 2}
			})
		);
	});

});
