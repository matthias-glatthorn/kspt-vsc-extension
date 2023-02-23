import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileNameWithExtension, formatDate, getFileExtensionFromFullPath } from './helpers';
import * as exceptions from "./exceptions.json";

type FileContent = {
    'known': { [key: string]: number };
    'unknown': { [key: string]: number };
    'exception': { [key: string]: number };
};


export default class KeyStrokeRecorder {

    private config = vscode.workspace.getConfiguration('kspt-vsc-extension');

    // Date
    private todaysDate = formatDate(new Date());
    private autoSaveTimeout?: NodeJS.Timer;

    // Directory and file
    //private saveDir = 'C:\\KSPT';
    public saveDir:string;
    private fullFilePath: string;
    private filePrefix = "kspt_";
    private fileSuffix = ".json";
    public fileName = this.filePrefix + this.todaysDate + this.fileSuffix;
    

    // State

    public knownExtensionsCount: { [key: string]: number };
    public unknownExtensionsCount: { [key: string]: number };
    public excepionExtensionCount: { [key: string]: number };

    
    constructor() {
        const saveDir = this.config.get('saveDir') as string;
        this.saveDir = saveDir ? saveDir : 'C:\\KSPT';

        this.fullFilePath = this.saveDir + '\\' + this.fileName;
        
        this.ensureDir();
        this.ensureTodaysFile();

        const data = this.readTodaysFile();
        this.knownExtensionsCount = data['known'] ? data['known'] : {};
        this.unknownExtensionsCount = data['unknown'] ? data['unknown'] : {};
        this.excepionExtensionCount = data['exception'] ? data['exception'] : {};

        this.startAutoSave();
    }

    public onLogKey() {
        const editor = vscode.window.activeTextEditor;
        if (!this.todaysDate) {
            throw Error("There is a problem with todays state.");
        }

        if (!editor) {
            throw Error("There is a problem with the editor.");
        }

        const fullFilePath = editor.document.fileName;
        const {extension, name}: FileNameWithExtension = getFileExtensionFromFullPath(fullFilePath);
        const isException = extension ? exceptions.includes(extension) : false;
        
        if (isException) {
            this.ensureExcepionExtensionCount(name);
            this.excepionExtensionCount[name]++;
            return;
        }
        if (extension) {
            this.ensureKnownExtension(extension);
            this.knownExtensionsCount[extension]++;
            return;
        }
        
        this.ensureUnknownExtension(name);
        this.unknownExtensionsCount[name]++;
    }

    public saveStateToFile() {
        try {
            const data = this.readTodaysFile();
            fs.writeFileSync(this.fullFilePath, JSON.stringify({
                ...data,
                'known': this.knownExtensionsCount,
                'unknown': this.unknownExtensionsCount,
                'exception': this.excepionExtensionCount
            }));
          } catch (err) {
            console.error(err);
          }
    }

    private ensureTodaysFile() {
        if(!fs.existsSync(this.fullFilePath)) {
            const deviceName = this.config.get('deviceName') as string;
            const data = {'date': this.todaysDate, 'deviceName': deviceName ? deviceName : "null", 'known': {}, 'unknown': {}};
            fs.writeFileSync(this.fullFilePath, JSON.stringify(data), {encoding:'utf8', flag:'a+'});

            console.log(`KSPT: Todays file ${this.fileName} is created successfully.`);
        }
    }

    private readTodaysFile() {
        const dataString = fs.readFileSync(this.fullFilePath, {encoding:'utf8', flag:'r'});
        return JSON.parse(dataString) as FileContent;
    }

    private ensureDir() {
        if(!fs.existsSync(this.saveDir)) {
            fs.mkdirSync(this.saveDir);
        }
    }

    private ensureKnownExtension(fileExtension: string) {
        if (!this.knownExtensionsCount.hasOwnProperty(fileExtension)) {
            this.knownExtensionsCount[fileExtension] = 0;
        }
    }

    private ensureExcepionExtensionCount(fileName: string) {
        if (!this.excepionExtensionCount.hasOwnProperty(fileName)) {
            this.excepionExtensionCount[fileName] = 0;
        }
    }

    private ensureUnknownExtension(fileName: string) {
        if (!this.unknownExtensionsCount.hasOwnProperty(fileName)) {
            this.unknownExtensionsCount[fileName] = 0;
        }
    }

    private startAutoSave() {
        const minutes = 1;
        this.autoSaveTimeout = setInterval(() => {
            this.saveStateToFile();
        }, minutes * 60000);
    }

    /**
     * Used in tests 
     */

    public stopAutoSave() {
        clearInterval(this.autoSaveTimeout);
    }

}