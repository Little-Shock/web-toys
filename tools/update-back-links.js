/**
 * 批量更新所有项目的返回链接修复脚本
 * 
 * 这个脚本会扫描所有项目的HTML文件，替换旧的返回链接修复脚本，
 * 并添加新的修复脚本。
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// 项目根目录
const rootDir = path.resolve(__dirname, '..');
const projectsDir = path.join(rootDir, 'projects');

// 递归获取所有HTML文件
async function getHtmlFiles(dir) {
    const files = await readdir(dir);
    const htmlFiles = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
            const subDirFiles = await getHtmlFiles(filePath);
            htmlFiles.push(...subDirFiles);
        } else if (file.endsWith('.html')) {
            htmlFiles.push(filePath);
        }
    }

    return htmlFiles;
}

// 更新HTML文件中的返回链接修复脚本
async function updateHtmlFile(filePath) {
    try {
        let content = await readFile(filePath, 'utf8');
        const relativePath = path.relative(path.dirname(filePath), rootDir);
        const scriptPath = path.join(relativePath, 'js/back-link-fix-new.js').replace(/\\/g, '/');

        // 检查是否已经包含新的修复脚本
        if (content.includes('back-link-fix-new.js')) {
            console.log(`[已更新] ${filePath}`);
            return;
        }

        // 替换旧的修复脚本引用
        const oldScriptPattern = /<script.*?back-link-fix\.js.*?><\/script>/;
        if (oldScriptPattern.test(content)) {
            content = content.replace(oldScriptPattern, `<script src="${scriptPath}"></script>`);
            console.log(`[替换] ${filePath}`);
        } else {
            // 如果没有旧的修复脚本，在</body>前添加新的修复脚本
            content = content.replace('</body>', `    <script src="${scriptPath}"></script>\n</body>`);
            console.log(`[添加] ${filePath}`);
        }

        // 移除可能存在的内联返回链接处理代码
        const inlineFixPattern = /\/\/ 修复返回按钮链接[\s\S]*?window\.location\.href.*?;[\s\S]*?\}\);/;
        if (inlineFixPattern.test(content)) {
            content = content.replace(inlineFixPattern, '// 返回按钮链接由back-link-fix-new.js处理\n            // 不再需要这里的代码');
            console.log(`[移除内联代码] ${filePath}`);
        }

        // 写入更新后的内容
        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        console.error(`[错误] 处理文件 ${filePath} 时出错:`, error);
    }
}

// 主函数
async function main() {
    try {
        console.log('开始更新项目返回链接...');
        
        // 获取所有HTML文件
        const htmlFiles = await getHtmlFiles(projectsDir);
        console.log(`找到 ${htmlFiles.length} 个HTML文件`);
        
        // 更新每个HTML文件
        for (const file of htmlFiles) {
            await updateHtmlFile(file);
        }
        
        console.log('更新完成!');
    } catch (error) {
        console.error('更新过程中出错:', error);
    }
}

// 执行主函数
main();
