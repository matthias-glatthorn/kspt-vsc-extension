const workspaceConfiguration = {
    get: jest.fn()
};

const activeTextEditor = {
  document: {
    fileName: jest.fn()
  }
};
  
const window = {
  activeTextEditor
};
  
const workspace = {
    getConfiguration: jest.fn().mockReturnValue(workspaceConfiguration),
};
  
  
  const vscode = {
    window,
    workspace,
  };
  
  module.exports = vscode;