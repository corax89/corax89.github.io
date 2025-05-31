// Список скриптов для загрузки (ваш список)
const scripts = [
	{ name: 'LZ-String', path: 'compiler/lz-string.min.js' },
	{ name: 'File Data', path: 'compiler/fileData.js'},
    { name: 'Blockly Core', path: 'blockly/blockly_compressed.js' },
    { name: 'Blockly Blocks', path: 'blockly/blocks_compressed.js' },
    { name: 'Blockly JavaScript', path: 'blockly/javascript_compressed.js' },
    { name: 'Blockly Russian', path: 'blockly/ru.js' },
    { name: 'Blockly English', path: 'blockly/en.js' },
    { name: 'Multiline Field', path: 'blockly/field_multiline.js' },
    { name: 'Color Field', path: 'blockly/field_color.js' },
    { name: 'Music Field', path: 'blockly/field_music.js' },
    { name: 'MP3 Field', path: 'blockly/field_mp3.js' },
    { name: 'PNG Field', path: 'blockly/field_png.js' },
	{ name: 'Level editor Field', path: 'blockly/field_leveleditor.js' },
    { name: 'Minimap', path: 'blockly/minimap.js' },
    { name: 'Scroll', path: 'blockly/scroll.js' },
    { name: 'Copy/Paste', path: 'blockly/copypast.js' },
    { name: 'Custom Blocks', path: 'blocks.js' },
    { name: 'Engine', path: 'engine.js' },
    { name: 'Compiler', path: 'compiler/compiler.js' },
    { name: 'Main Script', path: 'script.js' }
];

// Получаем элементы DOM
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusText = document.getElementById('statusText');
const libraryInfo = document.getElementById('libraryInfo');
const loaderContainer = document.querySelector('.loader-container');

// Загружаем скрипты последовательно
async function loadScripts() {
    const total = scripts.length;
    
    // Сначала загружаем preload скрипты (если есть)
    for (const script of scripts.filter(s => s.preload)) {
        try {
            await loadScript(script);
        } catch (error) {
            console.error(`Load error (preload): ${script.name}`, error);
        }
    }
    
    // Затем загружаем основные скрипты
    for (let i = 0; i < total; i++) {
        const script = scripts[i];
        
        // Пропускаем preload скрипты (они уже загружены)
        if (script.preload) {
            updateProgress(i + 1, total);
            continue;
        }
        
        try {
            updateStatus(`${script.name}`, i, total);
            await loadScript(script);
            updateProgress(i + 1, total);
        } catch (error) {
            console.error(`Error ${script.name}:`, error);
            updateStatus(`Error: ${script.name}`, i, total);
            // Продолжаем загрузку других скриптов
        }
    }
    
    completeLoading();
}

// Функция для загрузки одного скрипта
function loadScript(script) {
    return new Promise((resolve, reject) => {
        const element = document.createElement('script');
        element.src = script.path;
        element.onload = resolve;
        element.onerror = () => reject(new Error(`Не удалось загрузить: ${script.path}`));
        
        // Добавляем preload атрибут если нужно
        if (script.preload) {
            element.rel = 'preload';
            element.as = 'script';
        }
        
        document.head.appendChild(element);
    });
}

// Обновление статуса
function updateStatus(message, loaded, total) {
    statusText.textContent = message;
    libraryInfo.textContent = `(${loaded}/${total} files)`;
}

// Обновление прогресса
function updateProgress(loaded, total) {
    const percent = Math.round((loaded / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
}

// Завершение загрузки
function completeLoading() {
    progressBar.style.width = '100%';
    progressText.textContent = '100%';
    statusText.textContent = 'Done!';
    libraryInfo.textContent = `(${scripts.length}/${scripts.length} файлов)`;
    
    setTimeout(() => {
        loaderContainer.style.opacity = '0';
        setTimeout(() => {
            loaderContainer.style.display = 'none';
        }, 500);
    }, 1000);
}

// Запускаем загрузку
document.addEventListener('DOMContentLoaded', loadScripts);