import * as path from 'path';

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type FileNameWithExtension = {
  extension: string | null;
  name: string;
};

export function getFileExtensionFromFullPath(fullPath: string): FileNameWithExtension {
  const fileName = path.parse(fullPath).base;
  const dotMatches = fileName.match(/\./g);
  const dotCount = dotMatches?.length;

  const extension = (()=>{
    if (dotCount && dotCount > 1) {
      const betweenDots = fileName.split('.');
      return betweenDots.slice(1).slice(dotCount * -1).join('.');
    } else {
      return path.parse(fullPath).ext.length > 0 ? path.parse(fullPath).ext : null;
    }
  })();
  
  return {
    extension, name: fileName
  };
}
