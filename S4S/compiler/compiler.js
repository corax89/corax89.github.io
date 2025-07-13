const ico="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";
const replacementTextInput = document.getElementById('Name');
document.getElementById("icon").src = "data:image/jpeg;base64," + ico;

class NROEditorCore {
    // Constants
    static NRO_MAGIC = 0x304F524E; // "NRO0" in little-endian
    static ASET_MAGIC = 0x54455341; // "ASET" in little-endian

    // NRO Header Offsets
    static NRO_HEADER = {
        MAGIC: 0x10,
        SIZE: 0x18,
        TEXT_OFFSET: 0x20,
        TEXT_SIZE: 0x24,
        RO_OFFSET: 0x28,
        RO_SIZE: 0x2C,
        DATA_OFFSET: 0x30,
        DATA_SIZE: 0x34,
        BSS_SIZE: 0x38,
        MODULE_ID: 0x40,
        EMBEDDED_OFFSET: 0x68,
        EMBEDDED_SIZE: 0x6C
    };

    // Asset Header Offsets
    static ASSET_HEADER = {
        MAGIC: 0x0,
        VERSION: 0x4,
        ICON_OFFSET: 0x8,
        ICON_SIZE: 0x10,
        NACP_OFFSET: 0x18,
        NACP_SIZE: 0x20,
        ROMFS_OFFSET: 0x28,
        ROMFS_SIZE: 0x30
    };

    // NACP (Control Data) Offsets
    static NACP_OFFSETS = {
        NAME: 0x0,
        AUTHOR: 0x200,
        VERSION: 0x3060
    };

    constructor() {
        this.nroData = null;
        this.originalNroData = null;
        this.romFsStructure = {
            files: {},
            directories: {}
        };
        this.originalFileEntries = [];
        this.nacpData = null;
        this.currentIcon = null;
        this.appName = '';
        this.appAuthor = '';
        this.appVersion = '';
    }

    async loadNroFile(file, progressCallback) {
        try {
            const fileSize = file.size;
            const chunkSize = 1024 * 1024;
            let offset = 0;
            let chunks = [];

            while (offset < fileSize) {
                const chunk = await this.readFileChunk(file, offset, Math.min(chunkSize, fileSize - offset));
                chunks.push(chunk);
                offset += chunk.byteLength;
                if (progressCallback) progressCallback(Math.min(100, Math.round((offset / fileSize) * 100)));
            }

            this.nroData = new Uint8Array(fileSize);
            let position = 0;
            for (const chunk of chunks) {
                this.nroData.set(new Uint8Array(chunk), position);
                position += chunk.byteLength;
            }

            this.originalNroData = new Uint8Array(this.nroData);
            await this.parseNroFile();
            
            return {
                success: true,
                filename: file.name
            };
        } catch (error) {
            throw error;
        }
    }

    async parseNroFile() {
        if (!this.nroData || this.nroData.length < 0x80) {
            throw new Error("Invalid NRO file");
        }

        const dataView = new DataView(this.nroData.buffer);

        if (dataView.getUint32(NROEditorCore.NRO_HEADER.MAGIC, true) !== NROEditorCore.NRO_MAGIC) {
            throw new Error("Not a valid NRO file");
        }

        const nroSize = dataView.getUint32(NROEditorCore.NRO_HEADER.SIZE, true);

        if (this.nroData.length >= nroSize + 4) {
            const assetMagic = dataView.getUint32(nroSize, true);
            if (assetMagic === NROEditorCore.ASET_MAGIC) {
                await this.parseAssetSection(nroSize);
            }
        }

        const embeddedOffset = dataView.getUint32(NROEditorCore.NRO_HEADER.EMBEDDED_OFFSET, true);
        const embeddedSize = dataView.getUint32(NROEditorCore.NRO_HEADER.EMBEDDED_SIZE, true);

        if (embeddedOffset !== 0 && embeddedSize >= 0x4000) {
            this.nacpData = this.nroData.slice(embeddedOffset, embeddedOffset + 0x4000);
            const nacpInfo = this.parseNacpData();
            this.appName = nacpInfo.name;
            this.appAuthor = nacpInfo.author;
            this.appVersion = nacpInfo.version;
        }
    }

    async parseAssetSection(assetOffset) {
        const dataView = new DataView(this.nroData.buffer);

        const iconOffset = dataView.getUint32(assetOffset + NROEditorCore.ASSET_HEADER.ICON_OFFSET, true);
        const iconSize = dataView.getUint32(assetOffset + NROEditorCore.ASSET_HEADER.ICON_SIZE, true);

        if (iconSize > 0) {
            const iconData = this.nroData.slice(assetOffset + iconOffset, assetOffset + iconOffset + iconSize);
            this.currentIcon = new Blob([iconData], { type: 'image/jpeg' });
        }

        const nacpOffset = dataView.getUint32(assetOffset + NROEditorCore.ASSET_HEADER.NACP_OFFSET, true);
        const nacpSize = dataView.getUint32(assetOffset + NROEditorCore.ASSET_HEADER.NACP_SIZE, true);

        if (nacpSize > 0 && !this.nacpData) {
            this.nacpData = this.nroData.slice(assetOffset + nacpOffset, assetOffset + nacpOffset + nacpSize);
            const nacpInfo = this.parseNacpData();
            this.appName = nacpInfo.name;
            this.appAuthor = nacpInfo.author;
            this.appVersion = nacpInfo.version;
        }

        const romFsOffset = dataView.getUint32(assetOffset + NROEditorCore.ASSET_HEADER.ROMFS_OFFSET, true);
        const romFsSize = dataView.getUint32(assetOffset + NROEditorCore.ASSET_HEADER.ROMFS_SIZE, true);

        if (assetOffset + NROEditorCore.ASSET_HEADER.ROMFS_OFFSET + 4 > this.nroData.length) {
            return;
        }

        if (romFsSize > 0) {
            try {
                await this.parseRomFs(assetOffset + romFsOffset, romFsSize);
            } catch (e) {
                throw e;
            }
        }
    }

    parseNacpData() {
        if (!this.nacpData || this.nacpData.length < 0x4000) return {};

        const nameData = this.nacpData.slice(NROEditorCore.NACP_OFFSETS.NAME, NROEditorCore.NACP_OFFSETS.NAME + 0x200);
        const name = this.decodeUtf8NullTerminated(nameData);

        const authorData = this.nacpData.slice(NROEditorCore.NACP_OFFSETS.AUTHOR, NROEditorCore.NACP_OFFSETS.AUTHOR + 0x100);
        const author = this.decodeUtf8NullTerminated(authorData);

        const versionData = this.nacpData.slice(NROEditorCore.NACP_OFFSETS.VERSION, NROEditorCore.NACP_OFFSETS.VERSION + 0x10);
        const version = this.decodeUtf8NullTerminated(versionData);

        return { name, author, version };
    }

    readUint64(view, offset, littleEndian = true) {
        const low = view.getUint32(offset, littleEndian);
        const high = view.getUint32(offset + 4, littleEndian);
        return (high * 0x100000000) + low;
    }

    async parseRomFs(romFsOffset, romFsSize) {
        try {
            const romFsBuffer = this.nroData.buffer.slice(romFsOffset, romFsOffset + romFsSize);
            const parser = new SafeRomFSParser(romFsBuffer);
            const result = parser.parse();

            if (!result.valid) {
                throw new Error("Failed to parse RomFS");
            }

            this.romFsStructure = {
                files: {},
                directories: {}
            };
            this.originalFileEntries = [];
            this.originalFileTable = null;
            this.originalFileHashTableSize = 0;
            this.originalDirHashTableSize = 0;
            this.originalFileTableSize = 0;

            const view = new DataView(romFsBuffer);
            
            const dirHashTableOffset = this.readUint64(view, 0x08, true);
            const dirHashTableSize = this.readUint64(view, 0x10, true);
            const dirTableOffset = this.readUint64(view, 0x18, true);
            const dirTableSize = this.readUint64(view, 0x20, true);
            const fileHashTableOffset = this.readUint64(view, 0x28, true);
            const fileHashTableSize = this.readUint64(view, 0x30, true);
            const fileTableOffset = this.readUint64(view, 0x38, true);
            const fileTableSize = this.readUint64(view, 0x40, true);
            const fileDataOffset = this.readUint64(view, 0x48, true);

            this.originalFileHashTableSize = Number(fileHashTableSize);
            this.originalDirHashTableSize = Number(dirHashTableSize);
            this.originalFileTableSize = Number(fileTableSize);
            
            const fileTableStart = Number(dirHashTableOffset);
            const totalFileTableSize = Number(dirHashTableSize + fileHashTableSize + dirTableSize + fileTableSize);
            this.originalFileTable = new Uint8Array(romFsBuffer.slice(fileTableStart, fileTableStart + totalFileTableSize));

            result.files.forEach((file, index) => {
                const pathParts = file.name.split('/').filter(p => p !== '');
                let currentLevel = this.romFsStructure;

                for (let i = 0; i < pathParts.length - 1; i++) {
                    const part = pathParts[i];
                    if (!currentLevel.directories[part]) {
                        currentLevel.directories[part] = {
                            files: {},
                            directories: {}
                        };
                    }
                    currentLevel = currentLevel.directories[part];
                }

                const fileName = pathParts[pathParts.length - 1];
                currentLevel.files[fileName] = {
                    name: file.name,
                    size: file.size,
                    data: file.data,
                    entrySize: 0x20 + this.alignUp(new TextEncoder().encode(file.name).length, 4),
                    original: true
                };

                this.originalFileEntries.push({
                    name: file.name,
                    entryIndex: index,
                    entrySize: file.entrySize,
                    originalOffset: file.offset - romFsOffset
                });
            });

            return true;
        } catch (e) {
            throw e;
        }
    }

    async addFileToRomFs(file, filePath = null) {
        const path = filePath || file.webkitRelativePath || file.name;
        const normalizedPath = path.replace(/\\/g, '/');
        const pathParts = normalizedPath.split('/');

        const data = await this.readFileAsUint8Array(file);

        let currentLevel = this.romFsStructure;

        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            if (!currentLevel.directories[part]) {
                currentLevel.directories[part] = {
                    files: {},
                    directories: {}
                };
            }
            currentLevel = currentLevel.directories[part];
        }

        const fileName = pathParts[pathParts.length - 1];
        currentLevel.files[fileName] = {
            name: normalizedPath,
            size: data.length,
            data: data,
            original: false
        };
    }

    removeFileFromStructure(fullPath) {
        const parts = fullPath.split('/');
        let current = this.romFsStructure;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!current.directories[parts[i]]) {
                return false;
            }
            current = current.directories[parts[i]];
        }

        const fileName = parts[parts.length - 1];
        if (current.files[fileName]) {
            delete current.files[fileName];
            this.cleanupEmptyDirectories();
            return true;
        }
        return false;
    }

    cleanupEmptyDirectories() {
        const clean = (structure) => {
            Object.keys(structure.directories).forEach(dirName => {
                if (clean(structure.directories[dirName])) {
                    delete structure.directories[dirName];
                }
            });
            return Object.keys(structure.files).length === 0 && 
                 Object.keys(structure.directories).length === 0;
        };

        clean(this.romFsStructure);
    }

    clearFiles() {
        const totalFiles = this.countFiles(this.romFsStructure);
        if (totalFiles === 0) return false;

        this.romFsStructure = {
            files: {},
            directories: {}
        };
        return true;
    }

    countFiles(structure) {
        let count = Object.keys(structure.files).length;
        Object.values(structure.directories).forEach(dir => {
            count += this.countFiles(dir);
        });
        return count;
    }

    countOriginalFiles(structure) {
        let count = 0;
        Object.values(structure.files).forEach(file => {
            if (file.original) count++;
        });
        Object.values(structure.directories).forEach(dir => {
            count += this.countOriginalFiles(dir);
        });
        return count;
    }

    async loadIconFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    size: file.size
                });
            };
            img.onerror = () => reject(new Error("Invalid image file"));
            img.src = URL.createObjectURL(file);
        });
    }

    async saveModifiedNro(outputName, progressCallback) {
        if (!this.nroData) {
            throw new Error("No NRO data loaded");
        }

        try {
            if (progressCallback) progressCallback(0, "Building modified NRO...");

            let modifiedNro = new Uint8Array(this.originalNroData);

            if (this.nacpData) {
                this.updateNacpData();
                if (progressCallback) progressCallback(20, "Updated NACP data...");
            }

            const assetSection = await this.buildAssetSection();
            if (progressCallback) progressCallback(60, "Built asset section...");

            modifiedNro = this.rebuildNro(modifiedNro, assetSection);
            if (progressCallback) progressCallback(80, "Rebuilt NRO structure...");

            if (progressCallback) progressCallback(100, "Done!");
            return {
                data: modifiedNro,
                filename: outputName || 'modified.nro'
            };
        } catch (error) {
            throw error;
        }
    }

    updateNacpData() {
        if (!this.nacpData) return;

        const ENTRY_SIZE = 0x300;
        const NAME_SIZE = 0x200;
        const AUTHOR_SIZE = 0x100;
        const VERSION_OFFSET = 0x3060;
        const ENTRIES_TO_UPDATE = 12;

        const writeLocalizedEntry = (index) => {
            const entryStart = index * ENTRY_SIZE;
            
            if (this.appName) {
                const nameData = new TextEncoder().encode(this.appName);
                const writeLength = Math.min(nameData.length, NAME_SIZE);
                
                this.nacpData.fill(0, entryStart, entryStart + NAME_SIZE);
                this.nacpData.set(nameData.slice(0, writeLength), entryStart);
                if (writeLength < NAME_SIZE) {
                    this.nacpData[entryStart + writeLength] = 0;
                }
            }

            if (this.appAuthor) {
                const authorOffset = entryStart + NAME_SIZE;
                const authorData = new TextEncoder().encode(this.appAuthor);
                const writeLength = Math.min(authorData.length, AUTHOR_SIZE);
                
                this.nacpData.fill(0, authorOffset, authorOffset + AUTHOR_SIZE);
                this.nacpData.set(authorData.slice(0, writeLength), authorOffset);
                if (writeLength < AUTHOR_SIZE) {
                    this.nacpData[authorOffset + writeLength] = 0;
                }
            }
        };

        for (let i = 0; i < ENTRIES_TO_UPDATE; i++) {
            writeLocalizedEntry(i);
        }

        if (this.appVersion) {
            const versionData = new TextEncoder().encode(this.appVersion);
            const writeLength = Math.min(versionData.length, 0x10);
            
            this.nacpData.fill(0, VERSION_OFFSET, VERSION_OFFSET + 0x10);
            this.nacpData.set(versionData.slice(0, writeLength), VERSION_OFFSET);
            if (writeLength < 0x10) {
                this.nacpData[VERSION_OFFSET + writeLength] = 0;
            }
        }
    }

    collectRomFsEntries() {
        const allFiles = [];
        const allDirectories = [];
        
        function collectEntries(structure, parentPath = '') {
            Object.keys(structure.directories).forEach(dirName => {
                const fullPath = parentPath ? `${parentPath}/${dirName}` : dirName;
                allDirectories.push({
                    name: dirName,
                    fullPath: fullPath,
                    structure: structure.directories[dirName]
                });
                collectEntries(structure.directories[dirName], fullPath);
            });
            
            Object.keys(structure.files).forEach(fileName => {
                const file = structure.files[fileName];
                const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;
                allFiles.push({
                    name: fileName,
                    fullPath: fullPath,
                    size: file.size,
                    data: file.data,
                    parentPath: parentPath
                });
            });
        }
        
        collectEntries(this.romFsStructure);
        return { allFiles, allDirectories };
    }

    async buildRomFs() {
        try {
            const { allFiles } = this.collectRomFsEntries();
            const dataOffset = 0x200;
            
            let currentDataOffset = dataOffset;
            const fileOffsets = [];
            
            for (const file of allFiles) {
                fileOffsets.push(currentDataOffset);
                currentDataOffset += this.alignUp(file.size, 0x10);
            }
            
            const requiredSize = currentDataOffset + this.originalFileTable.length;
            const romFsData = new Uint8Array(requiredSize);
            romFsData.fill(0);
            const view = new DataView(romFsData.buffer);

            this.setUint64(view, 0x00, 0x50, true);
            this.setUint64(view, 0x08, currentDataOffset, true);
            this.setUint64(view, 0x10, this.originalDirHashTableSize, true);
            this.setUint64(view, 0x18, currentDataOffset + this.originalDirHashTableSize, true);
            this.setUint64(view, 0x20, 0x18, true);
            this.setUint64(view, 0x28, currentDataOffset + 0x18 + this.originalDirHashTableSize, true);
            this.setUint64(view, 0x30, this.originalFileHashTableSize, true);
            this.setUint64(view, 0x38, currentDataOffset + this.originalFileHashTableSize + this.originalDirHashTableSize + 0x18, true);
            this.setUint64(view, 0x40, this.originalFileTableSize, true);
            this.setUint64(view, 0x48, dataOffset, true);

            allFiles.forEach((file, index) => {
                const offset = fileOffsets[index];
                romFsData.set(file.data, offset);
                
                const alignedSize = this.alignUp(file.data.length, 0x10);
                for (let i = file.data.length; i < alignedSize; i++) {
                    romFsData[offset + i] = 0;
                }
            });

            const fileTableOffset = currentDataOffset;
            romFsData.set(this.originalFileTable, fileTableOffset);

            const fileTableStart = fileTableOffset + this.originalFileHashTableSize + this.originalDirHashTableSize;
            const fileTableView = new DataView(romFsData.buffer);
            
            for (let i = allFiles.length - 1; i >= 0; i--) {
                const file = allFiles[i];
                const originalEntry = this.originalFileEntries.find(e => e.name === file.name);
                
                if (originalEntry) {
                    const nameLength = new TextEncoder().encode(originalEntry.name).length;
                    const entrySize = 0x20 + this.alignUp(nameLength, 4);
                    
                    const entriesRemaining = allFiles.length - i;
                    const entryOffset = fileTableView.byteLength - (entriesRemaining * entrySize);
                    
                    if (entryOffset >= fileTableStart && entryOffset + 0x18 <= romFsData.length) {
                        this.setUint64(fileTableView, entryOffset + 0x08, fileOffsets[i] - dataOffset, true);
                        this.setUint64(fileTableView, entryOffset + 0x10, file.data.length, true);
                    }
                }
            }

            return romFsData;
        } catch (e) {
            throw new Error(`Failed to build RomFS: ${e.message}`);
        }
    }

    async buildAssetSection() {
        const assetHeader = new Uint8Array(0x38);
        const headerView = new DataView(assetHeader.buffer);

        headerView.setUint32(NROEditorCore.ASSET_HEADER.MAGIC, NROEditorCore.ASET_MAGIC, true);
        headerView.setUint32(NROEditorCore.ASSET_HEADER.VERSION, 0, true);

        let currentOffset = 0x38;

        let iconData = new Uint8Array(0);
        if (this.currentIcon) {
            if (this.currentIcon instanceof Blob) {
                iconData = new Uint8Array(await this.currentIcon.arrayBuffer());
            } else {
                iconData = await this.readFileAsUint8Array(this.currentIcon);
            }
        }
        
        headerView.setUint32(NROEditorCore.ASSET_HEADER.ICON_OFFSET, currentOffset, true);
        headerView.setUint32(NROEditorCore.ASSET_HEADER.ICON_SIZE, iconData.length, true);
        currentOffset += iconData.length;

        const nacpSize = this.nacpData ? this.nacpData.length : 0;
        headerView.setUint32(NROEditorCore.ASSET_HEADER.NACP_OFFSET, nacpSize ? currentOffset : 0, true);
        headerView.setUint32(NROEditorCore.ASSET_HEADER.NACP_SIZE, nacpSize, true);
        currentOffset += nacpSize;

        const romFsData = await this.buildRomFs();
        headerView.setUint32(NROEditorCore.ASSET_HEADER.ROMFS_OFFSET, romFsData.length ? currentOffset : 0, true);
        headerView.setUint32(NROEditorCore.ASSET_HEADER.ROMFS_SIZE, romFsData.length, true);

        const sections = [assetHeader];
        if (iconData.length) sections.push(iconData);
        if (nacpSize) sections.push(this.nacpData);
        if (romFsData.length) sections.push(romFsData);

        return this.concatenateUint8Arrays(sections);
    }

    rebuildNro(originalNro, assetSection) {
        const dataView = new DataView(originalNro.buffer);
        const originalSize = dataView.getUint32(NROEditorCore.NRO_HEADER.SIZE, true);

        if (originalNro.length > originalSize) {
            originalNro = originalNro.slice(0, originalSize);
        }

        const newSize = originalSize + assetSection.length;
        dataView.setUint32(NROEditorCore.NRO_HEADER.SIZE, newSize, true);

        return this.concatenateUint8Arrays([originalNro, assetSection]);
    }

    readFileChunk(file, offset, length) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file.slice(offset, offset + length));
        });
    }

    readFileAsUint8Array(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    decodeUtf8NullTerminated(buffer) {
        const decoder = new TextDecoder('utf-8');
        let nullIndex = buffer.length;

        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i] === 0) {
                nullIndex = i;
                break;
            }
        }

        return decoder.decode(buffer.slice(0, nullIndex));
    }

    concatenateUint8Arrays(arrays) {
        let totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
        let result = new Uint8Array(totalLength);
        let offset = 0;

        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }

        return result;
    }

    romfs_get_hash_table_count(num_entries) {
        if (num_entries < 3) return 3;
        if (num_entries < 19) return num_entries | 1;

        let count = num_entries;
        while (count % 2 === 0 || count % 3 === 0 || 
             count % 5 === 0 || count % 7 === 0 ||
             count % 11 === 0 || count % 13 === 0 || 
             count % 17 === 0) {
            count++;
        }
        return count;
    }

    calc_path_hash(parent, path, start = 0, len = path.length) {
        let hash = parent ^ 123456789;
        for (let i = 0; i < len; i++) {
            hash = (hash >>> 5) | (hash << 27);
            hash ^= path.charCodeAt(start + i);
        }
        return hash >>> 0;
    }

    alignUp(value, alignment) {
        if (value % alignment === 0) {
            return value;
        }
        return value + (alignment - (value % alignment));
    }

    setUint64(view, offset, value, littleEndian) {
        const low = value & 0xFFFFFFFF;
        const high = Math.floor(value / 0x100000000);

        if (littleEndian) {
            view.setUint32(offset, low, littleEndian);
            view.setUint32(offset + 4, high, littleEndian);
        } else {
            view.setUint32(offset, high, littleEndian);
            view.setUint32(offset + 4, low, littleEndian);
        }
    }
}

class SafeRomFSParser {
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(buffer);
        this.files = [];
        this.directories = new Map();
    }

    checkBounds(offset, requiredSize) {
        if (offset + requiredSize > this.buffer.byteLength) {
            throw new Error(`Read operation would exceed buffer bounds`);
        }
    }

    parse() {
        try {
            this.checkBounds(0, 0x50);

            const headerSize = this.readU64(0x00);
            const dirHashTableOffset = this.readU64(0x08);
            const dirHashTableSize = this.readU64(0x10);
            const dirTableOffset = this.readU64(0x18);
            const dirTableSize = this.readU64(0x20);
            const fileHashTableOffset = this.readU64(0x28);
            const fileHashTableSize = this.readU64(0x30);
            const fileTableOffset = this.readU64(0x38);
            const fileTableSize = this.readU64(0x40);
            const fileDataOffset = this.readU64(0x48);

            this.validateOffsets({
                headerSize, dirHashTableOffset, dirHashTableSize,
                dirTableOffset, dirTableSize, fileHashTableOffset,
                fileHashTableSize, fileTableOffset, fileTableSize, fileDataOffset
            });

            this.parseDirectoryTable(Number(dirTableOffset), Number(dirTableSize));
            this.parseFileTable(Number(fileTableOffset), Number(fileTableSize), Number(fileDataOffset));

            return {
                files: this.files,
                valid: true
            };
        } catch (e) {
            return {
                files: [],
                valid: false,
                error: e.message
            };
        }
    }

    parseDirectoryTable(offset, size) {
        if (size === 0) return;

        const EMPTY_OFFSET = 0xFFFFFFFF;
        let currentOffset = offset;
        const endOffset = offset + size;
        let entryCount = 0;

        while (currentOffset < endOffset) {
            this.checkBounds(currentOffset, 0x18);
            entryCount++;

            const parentOffset = this.readU32(currentOffset);
            const siblingOffset = this.readU32(currentOffset + 0x04);
            const childOffset = this.readU32(currentOffset + 0x08);
            const fileOffset = this.readU32(currentOffset + 0x0C);
            const hash = this.readU32(currentOffset + 0x10);
            const nameSize = this.readU32(currentOffset + 0x14);

            let dirName = '';
            if (nameSize > 0 && nameSize < 512) {
                this.checkBounds(currentOffset + 0x18, nameSize);
                const nameBytes = new Uint8Array(this.buffer, currentOffset + 0x18, nameSize);

                let actualNameSize = nameSize;
                for (let i = 0; i < nameSize; i++) {
                    if (nameBytes[i] === 0) {
                        actualNameSize = i;
                        break;
                    }
                }

                dirName = new TextDecoder('utf-8').decode(nameBytes.slice(0, actualNameSize));
            }

            const relativeOffset = currentOffset - offset;
            this.directories.set(relativeOffset, {
                name: dirName,
                parentOffset: parentOffset === EMPTY_OFFSET ? EMPTY_OFFSET : parentOffset,
                siblingOffset: siblingOffset === EMPTY_OFFSET ? EMPTY_OFFSET : siblingOffset,
                childOffset: childOffset === EMPTY_OFFSET ? EMPTY_OFFSET : childOffset,
                fileOffset: fileOffset === EMPTY_OFFSET ? EMPTY_OFFSET : fileOffset,
                fullPath: ''
            });

            const nextOffset = currentOffset + 0x18 + ((nameSize + 3) & ~3);
            if (nextOffset <= currentOffset) break;
            currentOffset = nextOffset;
        }

        this.buildDirectoryPaths(offset);
    }

    validateOffsets(offsets) {
        const end = this.buffer.byteLength;
        if (offsets.dirTableOffset + offsets.dirTableSize > end ||
            offsets.fileTableOffset + offsets.fileTableSize > end ||
            offsets.fileDataOffset > end) {
            throw new Error("Invalid RomFS structure: offsets exceed buffer bounds");
        }
    }

    buildDirectoryPaths(baseOffset) {
        const buildPath = (dirOffset, parentPath = '') => {
            const dir = this.directories.get(dirOffset);
            if (!dir) return '';

            const fullPath = parentPath ? `${parentPath}/${dir.name}` : dir.name;
            dir.fullPath = fullPath;

            if (dir.childOffset !== 0xFFFFFFFF) {
                buildPath(dir.childOffset, fullPath);
            }

            if (dir.siblingOffset !== 0xFFFFFFFF) {
                buildPath(dir.siblingOffset, parentPath);
            }

            return fullPath;
        };

        buildPath(0, '');
    }

    parseFileTable(offset, size, dataOffset) {
        const EMPTY_OFFSET = 0xFFFFFFFF;
        let currentOffset = offset;
        const endOffset = offset + size;
        let entryCount = 0;

        while (currentOffset < endOffset) {
            try {
                this.checkBounds(currentOffset, 0x20);
                entryCount++;

                const parentDirOffset = this.readU32(currentOffset);
                const siblingOffset = this.readU32(currentOffset + 0x04);
                const fileDataOffsetInPartition = this.readU64(currentOffset + 0x08);
                const fileSize = this.readU64(currentOffset + 0x10);
                const hash = this.readU32(currentOffset + 0x18);
                const nameSize = this.readU32(currentOffset + 0x1C);

                if (nameSize === 0 || nameSize > 512) break;

                this.checkBounds(currentOffset + 0x20, nameSize);
                const nameBytes = new Uint8Array(this.buffer, currentOffset + 0x20, nameSize);

                let actualNameSize = nameSize;
                for (let i = 0; i < nameSize; i++) {
                    if (nameBytes[i] === 0) {
                        actualNameSize = i;
                        break;
                    }
                }

                const fileName = new TextDecoder('utf-8').decode(nameBytes.slice(0, actualNameSize));

                let fullPath = fileName;
                const parentDir = this.directories.get(parentDirOffset === EMPTY_OFFSET ? 8 : parentDirOffset);
                if (parentDir && parentDir.fullPath) {
                    fullPath = parentDir.fullPath === '' ? fileName : `${parentDir.fullPath}/${fileName}`;
                }

                const actualFileOffset = dataOffset + Number(fileDataOffsetInPartition);

                if (actualFileOffset >= 0 && actualFileOffset + Number(fileSize) <= this.buffer.byteLength) {
                    const fileData = new Uint8Array(this.buffer.slice(actualFileOffset, actualFileOffset + Number(fileSize)));
                    this.files.push({
                        name: fullPath,
                        offset: actualFileOffset,
                        size: Number(fileSize),
                        data: fileData,
                        parentPath: parentDir ? parentDir.fullPath : ''
                    });
                }

                currentOffset += 0x20 + ((nameSize + 3) & ~3);
            } catch (e) {
                break;
            }
        }
    }

    readU32(offset) {
        this.checkBounds(offset, 4);
        return this.view.getUint32(offset, true);
    }

    readU64(offset) {
        this.checkBounds(offset, 8);
        const low = this.view.getUint32(offset, true);
        const high = this.view.getUint32(offset + 4, true);
        return low + (high * 0x100000000);
    }
}

async function modifyNroFile(fileData_bytes, options = {}) {
    const editor = new NROEditorCore();
    
    try {
        const blob = new Blob([fileData_bytes], { type: 'application/octet-stream' });
        const file = new File([blob], "input.nro", {
            type: 'application/octet-stream',
            lastModified: Date.now()
        });
        
        await editor.loadNroFile(file);
        
        if (options.appName) editor.appName = options.appName;
        if (options.appAuthor) editor.appAuthor = options.appAuthor;
        if (options.appVersion) editor.appVersion = options.appVersion;
        
        if (options.icon) {
            try {
                if (options.icon instanceof Blob || options.icon instanceof File) {
                    editor.currentIcon = options.icon;
                } 
                else if (typeof options.icon === 'string') {
                    const response = await fetch(options.icon);
                    const iconBlob = await response.blob();
                    editor.currentIcon = iconBlob;
                }
                else if (options.icon instanceof Uint8Array) {
                    const iconBlob = new Blob([options.icon], { type: 'image/jpeg' });
                    editor.currentIcon = iconBlob;
                }
            } catch (e) {
                throw new Error("Invalid icon format");
            }
        }
        
        if (options.romfsFiles) {
            for (const [path, data] of Object.entries(options.romfsFiles)) {
                const fileBlob = new Blob([data], { type: 'application/octet-stream' });
                const file = new File([fileBlob], path.split('/').pop(), {
                    type: 'application/octet-stream',
                    lastModified: Date.now()
                });
                
                Object.defineProperty(file, 'webkitRelativePath', {
                    value: path,
                    writable: false
                });
                
                await editor.addFileToRomFs(file);
            }
        }
        
        const result = await editor.saveModifiedNro("modified.nro");
        return result.data;
        
    } catch (error) {
        throw error;
    }
}

function getJScode(insert_bin){
	rebuildProtoObjectArray();
	store_image_array = [];
	Blockly.JavaScript.lastError = false;
	var script = Blockly.JavaScript.workspaceToCode(workspace);
	if(insert_bin){
		return script;
	}
	else{
		var loadImage = '';
		for(var i = 0; i < store_image_array.length; i++){
			loadImage += `Draw.loadImage(${i},"${store_image_array[i].data}");\n`
		}
		return loadImage + script ;
	}
}

function base64ToByteArray(base64String) {
  // Decode the base64 string
  const binaryString = atob(base64String);

  // Create a Uint8Array to store the bytes
  const byteArray = new Uint8Array(binaryString.length);

  // Populate the byte array
  for (let i = 0; i < binaryString.length; i++) {
    byteArray[i] = binaryString.charCodeAt(i);
  }

  return byteArray;
}

function encodeWithNullTerminator(str) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str); // Кодируем строку в Uint8Array
    
    // Создаем новый Uint8Array с дополнительным байтом для нуля
    const result = new Uint8Array(encoded.length + 1);
    result.set(encoded); // Копируем закодированные данные
    result[encoded.length] = 0; // Добавляем нулевой байт в конец
    
    return result;
}

function buildSwitch(){
	const name = projectSettings.name
	var img = base64ToByteArray(projectSettings.icon.substring(projectSettings.icon.search(',') + 1));
	// Validate input
	if (!name) {
		showSwitchModal('error', Blockly.Msg['ENTER_NAME'], false, 'ok');
		throw new Error('Please enter replacement text');
	}
	
	// Исходный объект romfsFiles
	let rFiles = {
		'index.js': new TextEncoder().encode(getJScode(true))
	};

	// Добавляем звуковые файлы из Game.sound_array
	const createWavBinaryFile = () => {
	  // Получаем все WAV данные
	  const wavFiles = Game.sound_array.map(sound => {
		const base64Data = sound.data.split(',')[1];
		const binaryString = atob(base64Data);
		const binaryData = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
		  binaryData[i] = binaryString.charCodeAt(i);
		}
		return binaryData;
	  });
	  
	  // Рассчитываем размер заголовка: 4 байта для "wav!" + 4 байта для количества файлов + 4 байта указателя для каждого файла
	  const headerSize = 4 + 4 + (wavFiles.length * 4);
	  
	  // Рассчитываем смещения для каждого файла
	  let currentOffset = headerSize;
	  const offsets = wavFiles.map(data => {
		const offset = currentOffset;
		currentOffset += data.length;
		return offset;
	  });
	  
	  // Создаем итоговый бинарный файл
	  const totalSize = currentOffset;
	  const result = new Uint8Array(totalSize);
	  
	  // Записываем заголовок "wav!"
	  result[0] = 'w'.charCodeAt(0);
	  result[1] = 'a'.charCodeAt(0);
	  result[2] = 'v'.charCodeAt(0);
	  result[3] = '!'.charCodeAt(0);
	  
	  // Записываем количество файлов (32-битное целое)
	  const fileCount = wavFiles.length;
	  result[4] = fileCount & 0xFF;
	  result[5] = (fileCount >> 8) & 0xFF;
	  result[6] = (fileCount >> 16) & 0xFF;
	  result[7] = (fileCount >> 24) & 0xFF;
	  
	  // Записываем указатели на файлы
	  offsets.forEach((offset, index) => {
		const pointerPos = 8 + (index * 4);
		result[pointerPos] = offset & 0xFF;
		result[pointerPos + 1] = (offset >> 8) & 0xFF;
		result[pointerPos + 2] = (offset >> 16) & 0xFF;
		result[pointerPos + 3] = (offset >> 24) & 0xFF;
	  });
	  
	  // Записываем данные файлов
	  wavFiles.forEach((data, index) => {
		result.set(data, offsets[index]);
	  });
	  
	  return result;
	};
	// Создаем бинарный файл и добавляем его в rFiles
	const wavBinFile = createWavBinaryFile();
	rFiles['wav.bin'] = wavBinFile;
	
	// Добавляем png файлы из store_image_array
	const createPngBinaryFile = () => {
	  // Получаем все PNG данные
	  const pngFiles = store_image_array.map(image => {
		const base64Data = image.data.split(',')[1];
		const binaryString = atob(base64Data);
		const binaryData = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
		  binaryData[i] = binaryString.charCodeAt(i);
		}
		return binaryData;
	  });
	  
	  // Рассчитываем размер заголовка: 4 байта для "png!" + 4 байта для количества файлов + 4 байта указателя для каждого файла
	  const headerSize = 4 + 4 + (pngFiles.length * 4);
	  
	  // Рассчитываем смещения для каждого файла
	  let currentOffset = headerSize;
	  const offsets = pngFiles.map(data => {
		const offset = currentOffset;
		currentOffset += data.length;
		return offset;
	  });
	  
	  // Создаем итоговый бинарный файл
	  const totalSize = currentOffset;
	  const result = new Uint8Array(totalSize);
	  
	  // Записываем заголовок "png!"
	  result[0] = 'p'.charCodeAt(0);
	  result[1] = 'n'.charCodeAt(0);
	  result[2] = 'g'.charCodeAt(0);
	  result[3] = '!'.charCodeAt(0);
	  
	  // Записываем количество файлов (32-битное целое)
	  const fileCount = pngFiles.length;
	  result[4] = fileCount & 0xFF;
	  result[5] = (fileCount >> 8) & 0xFF;
	  result[6] = (fileCount >> 16) & 0xFF;
	  result[7] = (fileCount >> 24) & 0xFF;
	  
	  // Записываем указатели на файлы
	  offsets.forEach((offset, index) => {
		const pointerPos = 8 + (index * 4);
		result[pointerPos] = offset & 0xFF;
		result[pointerPos + 1] = (offset >> 8) & 0xFF;
		result[pointerPos + 2] = (offset >> 16) & 0xFF;
		result[pointerPos + 3] = (offset >> 24) & 0xFF;
	  });
	  
	  // Записываем данные файлов
	  pngFiles.forEach((data, index) => {
		result.set(data, offsets[index]);
	  });
	  
	  return result;
	};

	// Создаем бинарный файл и добавляем его в rFiles
	const pngBinFile = createPngBinaryFile();
	rFiles['png.bin'] = pngBinFile;
	
    // Модификация NRO
    modifyNroFile(fileData_bytes, {
		appName: name,
		appAuthor: projectSettings.author,
		appVersion: "1.0.0",
		icon: img,
		romfsFiles: rFiles
	}).then(modifiedNro => {
		// Этот код выполнится после завершения modifyNroFile
		const blob = new Blob([modifiedNro], {type: 'application/octet-stream'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name + '.nro';
		a.click();
		
		// Освобождаем память
		URL.revokeObjectURL(url);
	}).catch(error => {
		console.error("Error processing NRO file:", error);
	});
}

function compressJS(code) {
    // 1. Удаляем все комментарии
    let noComments = code
        .replace(/\/\/.*$/gm, '')              // Однострочные
        .replace(/\/\*[\s\S]*?\*\//g, '');     // Многострочные
    
    // 2. Удаляем лишние пробелы и переносы строк
    return noComments
        .replace(/\s+/g, ' ')                  // Все пробелы -> один пробел
        .replace(/\s*([=+\-*\/%&|^~!<>?:;,{}()[\]])\s*/g, '$1') // Удаляем пробелы вокруг операторов
        .trim();
}

function buildHTML() {
	reset_game();
	
	function serializeObject(obj) {
        const props = [];
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'function') {
                props.push(`${key}: ${value.toString()}`);
            } else {
				if(key != 'sound_array')
					props.push(`${key}: ${JSON.stringify(value)}`);
            }
        }
        return `{\n${props.map(p => `        ${p}`).join(',\n')}\n    }`;
    }

	var customScript = getJScode();
	var loadSound = 'Game.sound_array=[];\n';
	for(let i = 0; i < Game.sound_array.length; i++){
		loadSound += `Game.sound_array[${i}]={data:"${Game.sound_array[i].data}",hash:"${Game.sound_array[i].hash}"};\n`
	};
	customScript = loadSound + customScript;
	// Формируем содержимое HTML-документа
	// Получаем исходный код существующих объектов
    const drawCode = compressJS(serializeObject(Draw));
    const gameCode = compressJS(serializeObject(Game));
    const gameLoopCode = compressJS(game_loop.toString());

    const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${projectSettings.name}</title>
<style>@font-face {font-family: 'PressStart2P';src: url('data:font/woff2;base64,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') 
format('woff2');font-weight: normal;font-style: normal;font-display: block;}
</style>
</head><body style="margin:0;padding:0;overflow:hidden;background-color:#f0f0f0;display:flex;justify-content:center;align-items:center;height:100vh;">
<canvas width="1280" height="720" id="cnv" style="background-color:black;box-shadow:0 0 10px rgba(0,0,0,0.5);width:100vw;height:56.25vw;max-height:100vh;max-width:177.78vh;object-fit:contain;"></canvas>
<script>var global = window;var image_array = [];var game_helper_timers = [];var gravitation = 0;var gamepads = {};var inputState = {};var local = {};var draw_bounding_box = false;
const canvas = document.getElementById("cnv");const ctx = canvas.getContext("2d");const Draw = ${drawCode};const Game = ${gameCode};var debugShowExpandedObjectsBorder = false;
const globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();const MAX_CONCURRENT_MELODIES = 8;let activeMelodies = 0;const melodyQueue = [];
function checkTouchButtons(x,y,isPressed){if(!Game.enableTouchInput)return!1;for(const btnId in inputState.touchButtons){const btn=inputState.touchButtons[btnId];
if(x>=btn.x&&x<=btn.x+btn.width&&y>=btn.y&&y<=btn.y+btn.height){btn.isPressed=isPressed;inputState.keys[btn.keyCode]=isPressed;if(isPressed){inputState.pressKeys[btn.keyCode]=!0};return!0}}return!1}
${gameLoopCode}
Game.initSensorInput();Game.init();Game.enableTouchInput = false;Game.enableDrawing = ${projectSettings.enableVirtualGamepad};canvas.addEventListener('touchstart', () => {Game.enableTouchInput = true;});
${customScript}
game_loop();</script></body></html>`;

    // Создаем и скачиваем файл
    const blob = new Blob([htmlContent], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
	if(projectSettings.name.trim().length > 0)
		a.download = projectSettings.name.trim() + '.html';
	else
		a.download = 'game.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Пример использования:
// exportGamePage();
// Или с дополнительным скриптом:
// exportGamePage('console.log("Custom initialization");');