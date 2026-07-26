// ================================================================
// 6502 constants (matching C assembler.h)
// ================================================================
var PROGRAM_ADDR = 0x0600;
var ASM_MAX_BYTES = 0x10000;

// ================================================================
// ASSEMBLER 6502 — чистый двухпроходный (C-compatible)
// ================================================================
var ASSEMBLER = (function() {
    var OPCODES = {
        'ADC': { imm: 0x69, zp: 0x65, zpx: 0x75, abs: 0x6D, abx: 0x7D, aby: 0x79, indx: 0x61, indy: 0x71 },
        'AND': { imm: 0x29, zp: 0x25, zpx: 0x35, abs: 0x2D, abx: 0x3D, aby: 0x39, indx: 0x21, indy: 0x31 },
        'ASL': { acc: 0x0A, zp: 0x06, zpx: 0x16, abs: 0x0E, abx: 0x1E },
        'BCC': { rel: 0x90 }, 'BCS': { rel: 0xB0 }, 'BEQ': { rel: 0xF0 },
        'BIT': { zp: 0x24, abs: 0x2C }, 'BMI': { rel: 0x30 }, 'BNE': { rel: 0xD0 },
        'BPL': { rel: 0x10 }, 'BRK': { imp: 0x00 }, 'BVC': { rel: 0x50 },
        'BVS': { rel: 0x70 }, 'CLC': { imp: 0x18 }, 'CLD': { imp: 0xD8 },
        'CLI': { imp: 0x58 }, 'CLV': { imp: 0xB8 },
        'CMP': { imm: 0xC9, zp: 0xC5, zpx: 0xD5, abs: 0xCD, abx: 0xDD, aby: 0xD9, indx: 0xC1, indy: 0xD1 },
        'CPX': { imm: 0xE0, zp: 0xE4, abs: 0xEC }, 'CPY': { imm: 0xC0, zp: 0xC4, abs: 0xCC },
        'DEC': { zp: 0xC6, zpx: 0xD6, abs: 0xCE, abx: 0xDE }, 'DEX': { imp: 0xCA }, 'DEY': { imp: 0x88 },
        'EOR': { imm: 0x49, zp: 0x45, zpx: 0x55, abs: 0x4D, abx: 0x5D, aby: 0x59, indx: 0x41, indy: 0x51 },
        'INC': { zp: 0xE6, zpx: 0xF6, abs: 0xEE, abx: 0xFE }, 'INX': { imp: 0xE8 }, 'INY': { imp: 0xC8 },
        'JMP': { abs: 0x4C, ind: 0x6C }, 'JSR': { abs: 0x20 },
        'LDA': { imm: 0xA9, zp: 0xA5, zpx: 0xB5, abs: 0xAD, abx: 0xBD, aby: 0xB9, indx: 0xA1, indy: 0xB1 },
        'LDX': { imm: 0xA2, zp: 0xA6, zpy: 0xB6, abs: 0xAE, aby: 0xBE },
        'LDY': { imm: 0xA0, zp: 0xA4, zpx: 0xB4, abs: 0xAC, abx: 0xBC },
        'LSR': { acc: 0x4A, zp: 0x46, zpx: 0x56, abs: 0x4E, abx: 0x5E },
        'NOP': { imp: 0xEA },
        'ORA': { imm: 0x09, zp: 0x05, zpx: 0x15, abs: 0x0D, abx: 0x1D, aby: 0x19, indx: 0x01, indy: 0x11 },
        'PHA': { imp: 0x48 }, 'PHP': { imp: 0x08 }, 'PLA': { imp: 0x68 }, 'PLP': { imp: 0x28 },
        'ROL': { acc: 0x2A, zp: 0x26, zpx: 0x36, abs: 0x2E, abx: 0x3E },
        'ROR': { acc: 0x6A, zp: 0x66, zpx: 0x76, abs: 0x6E, abx: 0x7E },
        'RTI': { imp: 0x40 }, 'RTS': { imp: 0x60 },
        'SBC': { imm: 0xE9, zp: 0xE5, zpx: 0xF5, abs: 0xED, abx: 0xFD, aby: 0xF9, indx: 0xE1, indy: 0xF1 },
        'SEC': { imp: 0x38 }, 'SED': { imp: 0xF8 }, 'SEI': { imp: 0x78 },
        'STA': { zp: 0x85, zpx: 0x95, abs: 0x8D, abx: 0x9D, aby: 0x99, indx: 0x81, indy: 0x91 },
        'STX': { zp: 0x86, zpy: 0x96, abs: 0x8E }, 'STY': { zp: 0x84, zpx: 0x94, abs: 0x8C },
        'TAX': { imp: 0xAA }, 'TAY': { imp: 0xA8 }, 'TSX': { imp: 0xBA },
        'TXA': { imp: 0x8A }, 'TXS': { imp: 0x9A }, 'TYA': { imp: 0x98 }
    };

    var OPCODE_REV = {};
    for (var n in OPCODES) { for (var m in OPCODES[n]) { OPCODE_REV[OPCODES[n][m]] = { name: n, mode: m }; } }

    // --- Symbol table ---
    var _labels = {};
    var _defines = {};

    function isHexChar(c) {
        return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }

    // Parse a numeric/identifier value.
    // Returns: number | undefined (forward ref) | NaN (syntax error)
    // Supports: $hex, %bin, 'c', decimal, symbol, symbol+N, symbol-N, symbol+symbol
    function parseValue(s) {
        s = s.trim();
        if (s === '') return NaN;
        if (s.charAt(0) === '$') {
            var hex = s.substring(1);
            if (hex === '') return NaN;
            var v = parseInt(hex, 16);
            return isNaN(v) ? NaN : v;
        }
        if (s.charAt(0) === '%') {
            var bin = s.substring(1);
            if (bin === '') return NaN;
            var v = parseInt(bin, 2);
            return isNaN(v) ? NaN : v;
        }
        if (s.charAt(0) === "'" && s.length >= 3 && s.charAt(2) === "'") {
            return s.charCodeAt(1);
        }
        if (s.charAt(0) >= '0' && s.charAt(0) <= '9') {
            var v = parseInt(s, 10);
            return isNaN(v) ? NaN : v;
        }
        // Symbol expression: name, name+N, name-N, name+name, etc.
        var symEnd = 0;
        while (symEnd < s.length) {
            var ch = s.charAt(symEnd);
            if (ch === '+' || ch === '-') break;
            symEnd++;
        }
        var symName = s.substring(0, symEnd).trim();
        var val = lookupSymbol(symName);
        if (val === undefined) return undefined; // forward ref
        var pos = symEnd;
        while (pos < s.length) {
            var ch = s.charAt(pos);
            if (ch === ' ' || ch === '\t') { pos++; continue; }
            if (ch !== '+' && ch !== '-') break;
            var op = ch;
            pos++;
            while (pos < s.length && (s.charAt(pos) === ' ' || s.charAt(pos) === '\t')) pos++;
            if (pos >= s.length) break;
            var termVal = undefined;
            var termOk = false;
            if (s.charAt(pos) === '$') {
                pos++;
                var hexStr = '';
                while (pos < s.length && isHexChar(s.charAt(pos))) { hexStr += s.charAt(pos); pos++; }
                termVal = parseInt(hexStr, 16);
                termOk = !isNaN(termVal);
            } else if (s.charAt(pos) >= '0' && s.charAt(pos) <= '9') {
                var numStr = '';
                while (pos < s.length && s.charAt(pos) >= '0' && s.charAt(pos) <= '9') { numStr += s.charAt(pos); pos++; }
                termVal = parseInt(numStr, 10);
                termOk = !isNaN(termVal);
            } else {
                var t2 = '';
                while (pos < s.length && s.charAt(pos) !== ' ' && s.charAt(pos) !== '\t' &&
                       s.charAt(pos) !== '+' && s.charAt(pos) !== '-') {
                    t2 += s.charAt(pos); pos++;
                }
                termVal = lookupSymbol(t2);
                termOk = (termVal !== undefined);
            }
            if (!termOk) return undefined;
            if (op === '+') val += termVal;
            else val -= termVal;
        }
        return val;
    }

    function lookupSymbol(name) {
        name = name.toUpperCase();
        if (_defines[name] !== undefined) {
            var dv = _defines[name];
            var num;
            if (dv.charAt(0) === '$') {
                num = parseInt(dv.substring(1), 16);
            } else if (dv.charAt(0) === '%') {
                num = parseInt(dv.substring(1), 2);
            } else {
                num = parseInt(dv, 10);
            }
            if (!isNaN(num)) return num;
        }
        if (_labels[name] !== undefined) return _labels[name];
        return undefined;
    }

    function parseLine(line) {
        var s = line;
        var ci = s.indexOf(';');
        if (ci >= 0) s = s.substring(0, ci);
        s = s.trim();
        if (!s) return null;
        var result = { label: null, instr: null, operand: '' };
        var lm = s.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)/);
        if (lm) {
            result.label = lm[1];
            s = lm[2].trim();
        }
        if (!s) return result;
        var im = s.match(/^(\S+)\s*(.*)/);
        if (im) {
            result.instr = im[1].toUpperCase();
            result.operand = im[2].replace(/\s+/g, ''); // strip ALL whitespace (like C)
        } else {
            result.instr = s.toUpperCase();
        }
        return result;
    }

    function detectMode(operand, instr, instrModes) {
        var s = operand;
        if (s === '') {
            if (instrModes['imp'] !== undefined) return 'imp';
            if (instrModes['acc'] !== undefined) return 'acc';
            return null;
        }
        // BRK always takes implied mode, operand is ignored (like C)
        if (instr === 'BRK' && instrModes['imp'] !== undefined) return 'imp';
        if (s === 'A' && instrModes['acc'] !== undefined) return 'acc';
        if (s.charAt(0) === '#') return instrModes['imm'] !== undefined ? 'imm' : null;
        if (/^\(.*,\s*X\s*\)$/.test(s)) return instrModes['indx'] !== undefined ? 'indx' : null;
        if (/^\(.*\)\s*,\s*Y$/.test(s)) return instrModes['indy'] !== undefined ? 'indy' : null;
        if (/^\(.*\)$/.test(s)) return instrModes['ind'] !== undefined ? 'ind' : null;
        // addr,X — prefer zpx over abx when value fits (like C)
        if (/,\s*X$/i.test(s)) {
            if (instrModes['zpx'] !== undefined && instrModes['abx'] !== undefined) {
                var v = parseValue(s.replace(/,\s*X$/i, ''));
                if (v === undefined) return 'abx';
                if (isNaN(v)) return 'abx';
                return (v <= 0xFF) ? 'zpx' : 'abx';
            }
            if (instrModes['zpx'] !== undefined) return 'zpx';
            if (instrModes['abx'] !== undefined) return 'abx';
            return null;
        }
        // addr,Y — prefer zpy over aby when value fits (like C)
        if (/,\s*Y$/i.test(s)) {
            if (instrModes['zpy'] !== undefined && instrModes['aby'] !== undefined) {
                var v = parseValue(s.replace(/,\s*Y$/i, ''));
                if (v === undefined) return 'aby';
                if (isNaN(v)) return 'aby';
                return (v <= 0xFF) ? 'zpy' : 'aby';
            }
            if (instrModes['zpy'] !== undefined) return 'zpy';
            if (instrModes['aby'] !== undefined) return 'aby';
            return null;
        }
        if (instrModes['rel'] !== undefined) return 'rel';
        if (instrModes['zp'] !== undefined && instrModes['abs'] !== undefined) {
            var v = parseValue(s);
            if (v === undefined) return 'abs';
            if (isNaN(v)) return 'abs';
            if (v > 0xFF) return 'abs';
            return 'zp';
        }
        if (instrModes['zp'] !== undefined) return 'zp';
        if (instrModes['abs'] !== undefined) return 'abs';
        return null;
    }

    function instrSize(mode) {
        if (mode === 'imp' || mode === 'acc') return 1;
        if (mode === 'imm' || mode === 'zp' || mode === 'zpx' || mode === 'zpy' || mode === 'indx' || mode === 'indy' || mode === 'rel') return 2;
        if (mode === 'abs' || mode === 'abx' || mode === 'aby' || mode === 'ind') return 3;
        return 2;
    }

    function assemble(source) {
        var rawLines = source.split('\n');

        // === PRE-PROCESSOR: collect defines ===
        var defines = {};
        var isDefine = [];
        for (var d = 0; d < rawLines.length; d++) {
            var dm = rawLines[d].trim().match(/^\.?define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)/i);
            if (dm) {
                defines[dm[1].toUpperCase()] = dm[2].trim();
                isDefine[d] = true;
            } else {
                isDefine[d] = false;
            }
        }

        var labels = {};
        var errors = [];
        var addrToLine = {};
        var pc = PROGRAM_ADDR;
        var loadAddr = PROGRAM_ADDR;
        _labels = labels;
        _defines = defines;

        // === PASS 1: collect labels, compute sizes ===
        for (var i = 0; i < rawLines.length; i++) {
            if (isDefine[i]) continue;
            var p = parseLine(rawLines[i]);
            if (!p) continue;

            if (p.label) {
                var lkey = p.label.toUpperCase();
                if (labels[lkey] !== undefined) {
                    errors.push({ line: i + 1, msg: 'duplicate label' });
                    continue;
                }
                labels[lkey] = pc;
            }
            if (!p.instr) continue;

            var up = p.instr;

            if (up === '.ORG' || up === 'ORG') {
                var v = parseValue(p.operand);
                if (isNaN(v)) { errors.push({ line: i + 1, msg: 'bad ORG value' }); continue; }
                if (i === 0 || pc === PROGRAM_ADDR) loadAddr = v;
                pc = v;
                continue;
            }
            if (up === '.BYTE' || up === '.DB' || up === 'DCB') {
                pc += p.operand.split(',').length;
                continue;
            }
            if (up === '.WORD' || up === '.DW') {
                pc += 2;
                continue;
            }

            var modes = OPCODES[up];
            if (!modes) { errors.push({ line: i + 1, msg: 'bad operand: ' + up + ' ' + p.operand }); continue; }
            var mode = detectMode(p.operand, up, modes);
            if (!mode) { errors.push({ line: i + 1, msg: 'bad operand: ' + up + ' ' + p.operand }); continue; }
            pc += instrSize(mode);
        }

        // === PASS 2: emit bytes ===
        pc = loadAddr;
        var output = [];
        var lineToBytes = {}; // source line index → [{ addr, val }]

        function recByte(addr, val) {
            output.push({ addr: addr, val: val });
            if (!lineToBytes[i2]) lineToBytes[i2] = [];
            lineToBytes[i2].push({ addr: addr, val: val });
        }

        for (var i2 = 0; i2 < rawLines.length; i2++) {
            if (isDefine[i2]) continue;
            var p2 = parseLine(rawLines[i2]);
            if (!p2) continue;
            if (!p2.instr) continue;

            var up2 = p2.instr;
            var op = p2.operand;

            if (up2 === '.ORG' || up2 === 'ORG') {
                var v2 = parseValue(op);
                if (isNaN(v2)) { errors.push({ line: i2 + 1, msg: 'bad ORG value' }); continue; }
                pc = v2;
                continue;
            }
            if (up2 === '.BYTE' || up2 === '.DB' || up2 === 'DCB') {
                var parts = op.split(',');
                for (var bi = 0; bi < parts.length; bi++) {
                    var bv = parseValue(parts[bi]);
                    if (isNaN(bv)) { errors.push({ line: i2 + 1, msg: 'bad DCB value' }); continue; }
                    if (pc - loadAddr >= ASM_MAX_BYTES) {
                        errors.push({ line: i2 + 1, msg: 'program too large' }); break;
                    }
                    recByte(pc, bv & 0xFF);
                    addrToLine[pc] = i2;
                    pc++;
                }
                continue;
            }
            if (up2 === '.WORD' || up2 === '.DW') {
                var wv = parseValue(op);
                if (isNaN(wv)) wv = 0;
                if (pc - loadAddr + 2 > ASM_MAX_BYTES) {
                    errors.push({ line: i2 + 1, msg: 'program too large' }); continue;
                }
                recByte(pc, wv & 0xFF);
                recByte(pc + 1, (wv >> 8) & 0xFF);
                addrToLine[pc] = i2;
                addrToLine[pc + 1] = i2;
                pc += 2;
                continue;
            }

            var modes2 = OPCODES[up2];
            if (!modes2) continue;

            var mode2 = detectMode(op, up2, modes2);
            if (!mode2) { errors.push({ line: i2 + 1, msg: 'cannot assemble: ' + up2 + ' ' + op }); continue; }

            // Branch instructions: check range (-128..127)
            if (mode2 === 'rel') {
                var target = parseValue(op);
                if (target === undefined || isNaN(target)) {
                    errors.push({ line: i2 + 1, msg: 'cannot assemble: ' + up2 + ' ' + op }); continue;
                }
                var offset = target - (pc + 2);
                if (offset < -128 || offset > 127) {
                    errors.push({ line: i2 + 1, msg: 'branch out of range' }); continue;
                }
            }

            var opcode = modes2[mode2];
            recByte(pc, opcode);
            addrToLine[pc] = i2;
            pc++;

            if (mode2 === 'imp' || mode2 === 'acc') continue;

            // Resolve operand value (strip # for immediate, strip ,X/,Y for indexed)
            var val;
            var rawOp = op.replace(/^#/, '');
            if (mode2 === 'imm' && rawOp.length > 1 && (rawOp.charAt(0) === '<' || rawOp.charAt(0) === '>')) {
                var innerVal = parseValue(rawOp.substring(1));
                val = (innerVal === undefined || isNaN(innerVal)) ? 0 : innerVal;
                if (rawOp.charAt(0) === '<') val = val & 0xFF;
                else val = (val >> 8) & 0xFF;
            } else {
                var valStr = rawOp.replace(/,\s*[XY]$/i, '');
                // Strip parentheses for (addr,X) and (addr),Y modes
                if (valStr.charAt(0) === '(' && valStr.charAt(valStr.length - 1) === ')') {
                    valStr = valStr.substring(1, valStr.length - 1);
                }
                val = parseValue(valStr);
                if (val === undefined || isNaN(val)) val = 0;
            }

            // zp/abs: choose best mode by value (like C)
            if ((mode2 === 'zp' || mode2 === 'abs') && modes2['zp'] !== undefined && modes2['abs'] !== undefined) {
                var bestMode = (val > 0xFF) ? 'abs' : 'zp';
                if (bestMode !== mode2) {
                    opcode = modes2[bestMode];
                    output[output.length - 1].val = opcode;
                    mode2 = bestMode;
                }
            }

            // Write operand bytes with program too large check
            var operandBytes = 0;
            if (mode2 === 'imm' || mode2 === 'zp' || mode2 === 'zpx' || mode2 === 'zpy' ||
                mode2 === 'indx' || mode2 === 'indy') {
                operandBytes = 1;
            } else if (mode2 === 'rel') {
                operandBytes = 1;
            } else if (mode2 === 'abs' || mode2 === 'abx' || mode2 === 'aby' || mode2 === 'ind') {
                operandBytes = 2;
            }
            if (pc - loadAddr + operandBytes > ASM_MAX_BYTES) {
                errors.push({ line: i2 + 1, msg: 'program too large' }); continue;
            }

            if (mode2 === 'imm' || mode2 === 'zp' || mode2 === 'zpx' || mode2 === 'zpy' ||
                mode2 === 'indx' || mode2 === 'indy') {
                recByte(pc, val & 0xFF);
                addrToLine[pc] = i2;
                pc++;
            } else if (mode2 === 'rel') {
                recByte(pc, offset & 0xFF);
                addrToLine[pc] = i2;
                pc++;
            } else if (mode2 === 'abs' || mode2 === 'abx' || mode2 === 'aby' || mode2 === 'ind') {
                recByte(pc, val & 0xFF);
                recByte(pc + 1, (val >> 8) & 0xFF);
                addrToLine[pc] = i2;
                addrToLine[pc + 1] = i2;
                pc += 2;
            }
        }

        // Build memory
        var mem = new Uint8Array(0x10000);
        for (var bi2 = 0; bi2 < output.length; bi2++) {
            mem[output[bi2].addr] = output[bi2].val;
        }
        return { memory: mem, errors: errors, labels: labels, addrToLine: addrToLine, lineToBytes: lineToBytes };
    }

    return { assemble: assemble, _opcodes: OPCODE_REV, PROGRAM_ADDR: PROGRAM_ADDR, _defines: function() { return _defines; } };
})();
