import * as vscode from 'vscode';
import * as fs from 'fs';
import { FileNameWithExtension, formatDate, getFileExtensionFromFullPath } from './helpers';

type FileContent = {
    'known': { [key: string]: number };
    'unknown': { [key: string]: number };
};


export default class KeyStrokeRecorder {

    private config = vscode.workspace.getConfiguration('kspt-vsc-extension');

    // Date
    private todaysDate = formatDate(new Date());
    
    // Directory and file
    //private saveDir = 'C:\\KSPT';
    private saveDir:string;
    private fullFilePath: string;
    private filePrefix = "kspt_";
    private fileSuffix = ".json";
    private fileName = this.filePrefix + this.todaysDate + this.fileSuffix;
    

    // State

    private knownExtensionsCount: { [key: string]: number };
    private unknownExtensionsCount: { [key: string]: number };

    
    constructor(private context: vscode.ExtensionContext) {
        const saveDir = this.config.get('saveDir') as string;
        this.saveDir = saveDir ? saveDir : 'C:\\KSPT';

        this.fullFilePath = this.saveDir + '\\' + this.fileName;
        

        this.ensureDir();
        this.ensureTodaysFile();

        const data = this.readTodaysFile();
        this.knownExtensionsCount = data['known'] ? data['known'] : {};
        this.unknownExtensionsCount = data['unknown'] ? data['unknown'] : {};

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
        
        if (extension) {
            this.ensureKnownExtension(extension);
            this.knownExtensionsCount[extension]++;
        } else {
            this.ensureUnknownExtension(name);
            this.unknownExtensionsCount[name]++;
        }
    }

    public saveStateToFile() {
        try {
            const data = this.readTodaysFile();
            fs.writeFileSync(this.fullFilePath, JSON.stringify({
                ...data,
                'known': this.knownExtensionsCount,
                'unknown': this.unknownExtensionsCount
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

    private ensureUnknownExtension(fileName: string) {
        if (!this.unknownExtensionsCount.hasOwnProperty(fileName)) {
            this.unknownExtensionsCount[fileName] = 0;
        }
    }

    private startAutoSave() {
        const minutes = 1;
        setInterval(() => {
            this.saveStateToFile();
        }, minutes * 60000);
    }
}