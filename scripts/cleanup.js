const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARCHIVE_DIR = path.join(__dirname, '..', 'archive');
const SRC_DIR = path.join(__dirname, '..', 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const UTILS_DIR = path.join(SRC_DIR, 'utils');
const STYLES_DIR = path.join(SRC_DIR, 'styles');

function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function getUnusedFiles() {
    try {
        const result = execSync('npx depcheck --json', { encoding: 'utf8' });
        return JSON.parse(result).dependencies;
    } catch (error) {
        console.error('Error running depcheck:', error);
        return [];
    }
}

function moveToArchive(filePath, category) {
    const fileName = path.basename(filePath);
    const archiveCategoryDir = path.join(ARCHIVE_DIR, category);
    ensureDirectoryExists(archiveCategoryDir);
    
    const targetPath = path.join(archiveCategoryDir, fileName);
    if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, targetPath);
        console.log(`Moved ${filePath} to ${targetPath}`);
    }
}

function cleanup() {
    ensureDirectoryExists(ARCHIVE_DIR);
    
    const unusedFiles = getUnusedFiles();
    
    unusedFiles.forEach(file => {
        const filePath = path.resolve(file);
        if (filePath.includes('src/components')) {
            moveToArchive(filePath, 'legacy_code/components');
        } else if (filePath.includes('src/utils')) {
            moveToArchive(filePath, 'legacy_code/utils');
        } else if (filePath.includes('src/styles')) {
            moveToArchive(filePath, 'legacy_code/styles');
        }
    });
    
    console.log('Cleanup completed successfully!');
}

cleanup(); 