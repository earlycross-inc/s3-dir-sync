import path from 'path';
import fs from 'fs-extra';

/**
 * Recursive call the specified function.
 * @param dp target directory path
 * @param filefunc function to be recursively executed for a file
 * @param dirfunc function to be recursively executed for a directory
 */
export function walk(
  dp: string,
  filefunc: (name: string, path: string, src: string) => void,
  dirfunc: (name: string, path: string) => void,
  fileExclusionList: string[] = ['.d.ts', 'index.ts'],
  dirExcludionList: string[] = []
): void {
  const dirs: { name: string; path: string }[] = [];
  for (const fdname of fs.readdirSync(dp)) {
    const fdpath = path.join(dp, fdname);
    if (fs.statSync(fdpath).isDirectory() && !dirExcludionList.includes(fdname)) {
      dirs.push({ name: fdname, path: fdpath });
    } else if (fs.statSync(fdpath).isFile()) {
      if (fileExclusionList.every(e => !fdname.includes(e))) {
        const buf = fs.readFileSync(fdpath);
        filefunc(fdname, fdpath, buf.toString());
      }
    }
  }

  dirfunc(path.basename(dp), dp);

  for (const dir of dirs) {
    walk(dir.path, filefunc, dirfunc, fileExclusionList, dirExcludionList);
  }
}
