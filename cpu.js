// ================================================================
// CPU
// ================================================================
var CPU = (function() {
    function CPU() { this.reset(); }
    CPU.prototype.reset = function() {
        this.A = 0;
        this.X = 0;
        this.Y = 0;
        this.SP = 0xFF;
        this.PC = PROGRAM_ADDR;
        this.flags = { N: false, V: false, B: false, D: false, I: false, Z: false, C: false };
        this.memory = new Uint8Array(0x10000);
        this.cycles = 0;
        this.running = false;
        this.stepMode = false;
        this.halted = false;
        this.lastOp = null;
        this.lastAddr = null;
        this.lastValue = null;
        this.lastReg = null;
        this.lastTransfer = null;
        this.lastFlagOp = null;
    };
    CPU.prototype.load = function(mem) { for (var i = 0; i < mem.length; i++) this.memory[i] = mem[i]; };
    CPU.prototype.getFlag = function(f) { return this.flags[f] ? 1 : 0; };
    CPU.prototype.setFlag = function(f, v) { this.flags[f] = !!v; };
    CPU.prototype.updateZN = function(val) {
        this.setFlag('Z', val === 0);
        this.setFlag('N', (val & 0x80) !== 0);
    };
    CPU.prototype.push = function(val) { this.memory[0x0100 + this.SP] = val;
        this.SP = (this.SP - 1) & 0xFF; };
    CPU.prototype.pull = function() { this.SP = (this.SP + 1) & 0xFF; return this.memory[0x0100 + this.SP]; };
    CPU.prototype._recordWrite = function(addr, val, reg) { this.lastOp = 'write';
        this.lastAddr = addr;
        this.lastValue = val;
        this.lastReg = reg || null; };
    CPU.prototype._recordRead = function(addr, val, reg) { this.lastOp = 'read';
        this.lastAddr = addr;
        this.lastValue = val;
        this.lastReg = reg || null; };
    CPU.prototype._recordTransfer = function(from, to, val) {
        this.lastTransfer = { from: from, to: to, value: val };
    };
    CPU.prototype._recordFlagOp = function(flag, set) {
        this.lastFlagOp = { flag: flag, set: set };
    };

    CPU.prototype.step = function() {
        this.lastOp = null;
        this.lastAddr = null;
        this.lastValue = null;
        this.lastReg = null;
        this.lastTransfer = null;
        this.lastFlagOp = null;
        this.lastFlagChanges = [];
        if (this.halted || this.PC >= 0x10000) {
            console.log('[cpu] halted=' + this.halted + ' PC=$' + this.PC.toString(16).padStart(4, '0') + ' — skip');
            return false;
        }
        // Запоминаем флаги ДО шага
        var prevFlags = {
            N: this.flags.N, V: this.flags.V, B: this.flags.B,
            D: this.flags.D, I: this.flags.I, Z: this.flags.Z, C: this.flags.C
        };
        var opcode = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var executed = true;
        switch (opcode) {
            case 0x00:
                this.push((this.PC >> 8) & 0xFF);
                this.push(this.PC & 0xFF);
                this.setFlag('B', true);
                this.PC = this.memory[0xFFFE] | (this.memory[0xFFFF] << 8);
                this.halted = true;
                break;
            case 0x01:
                this.ora_indx();
                break;
            case 0x05:
                this.ora_zp();
                break;
            case 0x06:
                this.asl_zp();
                break;
            case 0x08:
                this.push(this.getFlag('N') << 7 | this.getFlag('V') << 6 | 1 << 5 | this.getFlag('B') << 4 | this
                    .getFlag('D') << 3 | this.getFlag('I') << 2 | this.getFlag('Z') << 1 | this.getFlag('C'));
                break;
            case 0x09:
                this.ora_imm();
                break;
            case 0x0A:
                this.asl_acc();
                break;
            case 0x0D:
                this.ora_abs();
                break;
            case 0x0E:
                this.asl_abs();
                break;
            case 0x16:
                this.asl_zpx();
                break;
            case 0x1E:
                this.asl_abx();
                break;
            case 0x10:
                this.bpl();
                break;
            case 0x18:
                this.setFlag('C', false);
                this._recordFlagOp('C', false);
                break;
            case 0x20:
                // JSR pushes (PC+1) as return address: on real 6502, after
                // fetching opcode and low byte of operand, PC = N+2, and
                // that's what gets pushed. RTS pulls it and adds 1 → N+3.
                var retAddr = (this.PC + 1) & 0xFFFF;
                this.push((retAddr >> 8) & 0xFF);
                this.push(retAddr & 0xFF);
                this.PC = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
                break;
            case 0x24:
                this.bit_zp();
                break;
            case 0x25:
                this.and_zp();
                break;
            case 0x29:
                this.and_imm();
                break;
            case 0x2A:
                this.rol_acc();
                break;
            case 0x26:
                this.rol_zp();
                break;
            case 0x36:
                this.rol_zpx();
                break;
            case 0x2E:
                this.rol_abs();
                break;
            case 0x3E:
                this.rol_abx();
                break;
            case 0x2C:
                this.bit_abs();
                break;
            case 0x2D:
                this.and_abs();
                break;
            case 0x30:
                this.bmi();
                break;
            case 0x38:
                this.setFlag('C', true);
                this._recordFlagOp('C', true);
                break;
            case 0x40:
                var f = this.pull();
                this.setFlag('N', (f & 0x80) !== 0);
                this.setFlag('V', (f & 0x40) !== 0);
                this.setFlag('B', (f & 0x10) !== 0);
                this.setFlag('D', (f & 0x08) !== 0);
                this.setFlag('I', (f & 0x04) !== 0);
                this.setFlag('Z', (f & 0x02) !== 0);
                this.setFlag('C', (f & 0x01) !== 0);
                this.PC = this.pull() | (this.pull() << 8);
                break;
            case 0x45:
                this.eor_zp();
                break;
            case 0x48:
                this.push(this.A);
                break;
            case 0x49:
                this.eor_imm();
                break;
            case 0x4A:
                this.lsr_acc();
                break;
            case 0x46:
                this.lsr_zp();
                break;
            case 0x56:
                this.lsr_zpx();
                break;
            case 0x4E:
                this.lsr_abs();
                break;
            case 0x5E:
                this.lsr_abx();
                break;
            case 0x4C:
                this.PC = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
                break;
            case 0x4D:
                this.eor_abs();
                break;
            case 0x50:
                this.bvc();
                break;
            case 0x58:
                this.setFlag('I', false);
                this._recordFlagOp('I', false);
                break;
            case 0x60:
                this.PC = this.pull() | (this.pull() << 8);
                this.PC = (this.PC + 1) & 0xFFFF;
                break;
            case 0x65:
                this.adc_zp();
                break;
            case 0x68:
                this.A = this.pull();
                this.updateZN(this.A);
                break;
            case 0x69:
                this.adc_imm();
                break;
            case 0x6A:
                this.ror_acc();
                break;
            case 0x66:
                this.ror_zp();
                break;
            case 0x76:
                this.ror_zpx();
                break;
            case 0x6E:
                this.ror_abs();
                break;
            case 0x7E:
                this.ror_abx();
                break;
            case 0x6C:
                var a = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
                this.PC = this.memory[a] | (this.memory[a + 1] << 8);
                break;
            case 0x6D:
                this.adc_abs();
                break;
            case 0x70:
                this.bvs();
                break;
            case 0x78:
                this.setFlag('I', true);
                this._recordFlagOp('I', true);
                break;
            case 0x85:
                this.sta_zp();
                break;
            case 0x84:
                this.sty_zp();
                break;
            case 0x86:
                this.stx_zp();
                break;
            case 0x88:
                this.dey();
                break;
            case 0x8A:
                this.txa();
                break;
            case 0x8D:
                this.sta_abs();
                break;
            case 0x8C:
                this.sty_abs();
                break;
            case 0x8E:
                this.stx_abs();
                break;
            case 0x90:
                this.bcc();
                break;
            case 0x94:
                this.sty_zpx();
                break;
            case 0x95:
                this.sta_zpx();
                break;
            case 0x9D:
                this.sta_abx();
                break;
            case 0x99:
                this.sta_aby();
                break;
            case 0x81:
                this.sta_indx();
                break;
            case 0x91:
                this.sta_indy();
                break;
            case 0x96:
                this.stx_zpy();
                break;
            case 0x98:
                this.tya();
                break;
            case 0x9A:
                this.txs();
                break;
            case 0xA0:
                this.ldy_imm();
                break;
            case 0xA2:
                this.ldx_imm();
                break;
            case 0xA5:
                this.lda_zp();
                break;
            case 0xA6:
                this.ldx_zp();
                break;
            case 0xA8:
                this.tay();
                break;
            case 0xA9:
                this.lda_imm();
                break;
            case 0xAA:
                this.tax();
                break;
            case 0xAD:
                this.lda_abs();
                break;
            case 0xAE:
                this.ldx_abs();
                break;
            case 0xB0:
                this.bcs();
                break;
            case 0xB5:
                this.lda_zpx();
                break;
            case 0xB8:
                this.setFlag('V', false);
                this._recordFlagOp('V', false);
                break;
            case 0xBA:
                this.tsx();
                break;
            case 0xC0:
                this.cpy_imm();
                break;
            case 0xC5:
                this.cmp_zp();
                break;
            case 0xC8:
                this.iny();
                break;
            case 0xC9:
                this.cmp_imm();
                break;
            case 0xCA:
                this.dex();
                break;
            case 0xCD:
                this.cmp_abs();
                break;
            case 0xD0:
                this.bne();
                break;
            case 0xD8:
                this.setFlag('D', false);
                this._recordFlagOp('D', false);
                break;
            case 0xE0:
                this.cpx_imm();
                break;
            case 0xE6:
                this.inc_zp();
                break;
            case 0xE8:
                this.inx();
                break;
            case 0xE9:
                this.sbc_imm();
                break;
            case 0xEA:
                break;
            case 0xF0:
                this.beq();
                break;
            case 0xF8:
                this.setFlag('D', true);
                this._recordFlagOp('D', true);
                break;
            // ADC (missing variants)
            case 0x75: this.adc_zpx(); break;
            case 0x7D: this.adc_abx(); break;
            case 0x79: this.adc_aby(); break;
            case 0x61: this.adc_indx(); break;
            case 0x71: this.adc_indy(); break;
            // AND (missing variants)
            case 0x35: this.and_zpx(); break;
            case 0x3D: this.and_abx(); break;
            case 0x39: this.and_aby(); break;
            case 0x21: this.and_indx(); break;
            case 0x31: this.and_indy(); break;
            // CMP (missing variants)
            case 0xD5: this.cmp_zpx(); break;
            case 0xDD: this.cmp_abx(); break;
            case 0xD9: this.cmp_aby(); break;
            case 0xC1: this.cmp_indx(); break;
            case 0xD1: this.cmp_indy(); break;
            // CPX
            case 0xE4: this.cpx_zp(); break;
            case 0xEC: this.cpx_abs(); break;
            // CPY
            case 0xC4: this.cpy_zp(); break;
            case 0xCC: this.cpy_abs(); break;
            // DEC (missing variants)
            case 0xC6: this.dec_zp(); break;
            case 0xD6: this.dec_zpx(); break;
            case 0xCE: this.dec_abs(); break;
            case 0xDE: this.dec_abx(); break;
            // EOR (missing variants)
            case 0x55: this.eor_zpx(); break;
            case 0x5D: this.eor_abx(); break;
            case 0x59: this.eor_aby(); break;
            case 0x41: this.eor_indx(); break;
            case 0x51: this.eor_indy(); break;
            // INC (missing variants)
            case 0xF6: this.inc_zpx(); break;
            case 0xEE: this.inc_abs(); break;
            case 0xFE: this.inc_abx(); break;
            // LDA (missing variants)
            case 0xBD: this.lda_abx(); break;
            case 0xB9: this.lda_aby(); break;
            case 0xA1: this.lda_indx(); break;
            case 0xB1: this.lda_indy(); break;
            // LDX (missing variants)
            case 0xB6: this.ldx_zpy(); break;
            case 0xBE: this.ldx_aby(); break;
            // LDY (missing variants)
            case 0xA4: this.ldy_zp(); break;
            case 0xB4: this.ldy_zpx(); break;
            case 0xAC: this.ldy_abs(); break;
            case 0xBC: this.ldy_abx(); break;
            // ORA (missing variants)
            case 0x15: this.ora_zpx(); break;
            case 0x1D: this.ora_abx(); break;
            case 0x19: this.ora_aby(); break;
            case 0x11: this.ora_indy(); break;
            // PLP
            case 0x28: this.plp_imp(); break;
            // SBC (missing variants)
            case 0xE5: this.sbc_zp(); break;
            case 0xF5: this.sbc_zpx(); break;
            case 0xED: this.sbc_abs(); break;
            case 0xFD: this.sbc_abx(); break;
            case 0xF9: this.sbc_aby(); break;
            case 0xE1: this.sbc_indx(); break;
            case 0xF1: this.sbc_indy(); break;
            default:
                executed = false;
        }
        this.memory[0xFE] = Math.floor(Math.random() * 256);
        // Сравниваем флаги до и после — записываем изменения
        var flagNames = ['N', 'V', 'B', 'D', 'I', 'Z', 'C'];
        for (var fi = 0; fi < flagNames.length; fi++) {
            var fn = flagNames[fi];
            if (prevFlags[fn] !== this.flags[fn]) {
                this.lastFlagChanges.push({ flag: fn, set: this.flags[fn] });
            }
        }
        return executed;
    };

    // --- Инструкции ---
    CPU.prototype.sta_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.memory[addr] = this.A;
        this._recordWrite(addr, this.A, 'A'); };
    CPU.prototype.sta_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        this.memory[addr] = this.A;
        this._recordWrite(addr, this.A, 'A'); };
    CPU.prototype.sta_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        this.memory[addr] = this.A;
        this._recordWrite(addr, this.A, 'A'); };
    CPU.prototype.sta_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF;
        this.memory[addr & 0xFFFF] = this.A;
        this._recordWrite(addr & 0xFFFF, this.A, 'A'); };
    CPU.prototype.sta_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF;
        this.memory[addr & 0xFFFF] = this.A;
        this._recordWrite(addr & 0xFFFF, this.A, 'A'); };
    CPU.prototype.sta_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8);
        this.memory[addr] = this.A;
        this._recordWrite(addr, this.A, 'A'); };
    CPU.prototype.sta_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y;
        this.memory[addr & 0xFFFF] = this.A;
        this._recordWrite(addr & 0xFFFF, this.A, 'A'); };
    CPU.prototype.stx_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.memory[addr] = this.X;
        this._recordWrite(addr, this.X, 'X'); };
    CPU.prototype.stx_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        this.memory[addr] = this.X;
        this._recordWrite(addr, this.X, 'X'); };
    CPU.prototype.stx_zpy = function() { var addr = (this.memory[this.PC] + this.Y) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        this.memory[addr] = this.X;
        this._recordWrite(addr, this.X, 'X'); };
    CPU.prototype.sty_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.memory[addr] = this.Y;
        this._recordWrite(addr, this.Y, 'Y'); };
    CPU.prototype.sty_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        this.memory[addr] = this.Y;
        this._recordWrite(addr, this.Y, 'Y'); };
    CPU.prototype.sty_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        this.memory[addr] = this.Y;
        this._recordWrite(addr, this.Y, 'Y'); };
    CPU.prototype.lda_imm = function() { var val = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.A = val;
        this.updateZN(this.A);
        this._recordRead(this.PC - 1, val, 'A'); };
    CPU.prototype.lda_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var val = this.memory[addr];
        this.A = val;
        this.updateZN(this.A);
        this._recordRead(addr, val, 'A'); };
    CPU.prototype.lda_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var val = this.memory[addr];
        this.A = val;
        this.updateZN(this.A);
        this._recordRead(addr, val, 'A'); };
    CPU.prototype.lda_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var val = this.memory[addr];
        this.A = val;
        this.updateZN(this.A);
        this._recordRead(addr, val, 'A'); };
    CPU.prototype.ldx_imm = function() { var val = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.X = val;
        this.updateZN(this.X);
        this._recordRead(this.PC - 1, val, 'X'); };
    CPU.prototype.ldx_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var val = this.memory[addr];
        this.X = val;
        this.updateZN(this.X);
        this._recordRead(addr, val, 'X'); };
    CPU.prototype.ldx_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var val = this.memory[addr];
        this.X = val;
        this.updateZN(this.X);
        this._recordRead(addr, val, 'X'); };
    CPU.prototype.ldy_imm = function() { var val = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.Y = val;
        this.updateZN(this.Y);
        this._recordRead(this.PC - 1, val, 'Y'); };
    CPU.prototype.ldy_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var val = this.memory[addr];
        this.Y = val;
        this.updateZN(this.Y);
        this._recordRead(addr, val, 'Y'); };
    CPU.prototype.ldy_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var val = this.memory[addr];
        this.Y = val;
        this.updateZN(this.Y);
        this._recordRead(addr, val, 'Y'); };
    CPU.prototype.adc_imm = function() { var v = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.adc_do(v); };
    CPU.prototype.adc_zp = function() { var v = this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.adc_do(v); };
    CPU.prototype.adc_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        this.adc_do(this.memory[addr]); };
    CPU.prototype.adc_do = function(v) { var c = this.getFlag('C');
        var s = this.A + v + c;
        this.setFlag('C', s > 0xFF);
        this.setFlag('V', (~(this.A ^ v) & (this.A ^ s) & 0x80) !== 0);
        if (this.flags.D) {
            // BCD correction: fix low nibble
            if (((this.A & 0x0F) + (v & 0x0F) + c) > 9) s += 6;
            // BCD correction: fix high nibble
            if (s > 0x9F) s += 0x60;
        }
        this.A = s & 0xFF;
        this.updateZN(this.A); };
    CPU.prototype.sbc_imm = function() { var v = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.sbc_do(v); };
    CPU.prototype.sbc_do = function(v) { var c = this.getFlag('C');
        var d = this.A - v - (1 - c);
        this.setFlag('C', d >= 0);
        this.setFlag('V', ((this.A ^ v) & 0x80) !== 0 && ((this.A ^ d) & 0x80) !== 0);
        if (this.flags.D) {
            // BCD correction for SBC
            if (((this.A & 0x0F) - (v & 0x0F) - (1 - c)) < 0) d -= 6;
            if (d < 0) d -= 0x60;
        }
        this.A = d & 0xFF;
        this.updateZN(this.A); };
    CPU.prototype.and_imm = function() { this.A &= this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.and_zp = function() { this.A &= this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.and_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.A &= this.memory[addr];
        this.PC = (this.PC + 2) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.ora_imm = function() { this.A |= this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.ora_zp = function() { this.A |= this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.ora_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.A |= this.memory[addr];
        this.PC = (this.PC + 2) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.ora_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8);
        this.A |= this.memory[addr];
        this.updateZN(this.A); };
    CPU.prototype.eor_imm = function() { this.A ^= this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.eor_zp = function() { this.A ^= this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.eor_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.A ^= this.memory[addr];
        this.PC = (this.PC + 2) & 0xFFFF;
        this.updateZN(this.A); };
    CPU.prototype.cmp_imm = function() { this.cmp_do(this.memory[this.PC]);
        this.PC = (this.PC + 1) & 0xFFFF; };
    CPU.prototype.cmp_zp = function() { this.cmp_do(this.memory[this.memory[this.PC]]);
        this.PC = (this.PC + 1) & 0xFFFF; };
    CPU.prototype.cmp_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.cmp_do(this.memory[addr]);
        this.PC = (this.PC + 2) & 0xFFFF; };
    CPU.prototype.cmp_do = function(v) { var d = this.A - v;
        this.setFlag('C', d >= 0);
        this.updateZN(d & 0xFF); };
    CPU.prototype.cpx_imm = function() { var d = this.X - this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.setFlag('C', d >= 0);
        this.updateZN(d & 0xFF); };
    CPU.prototype.cpy_imm = function() { var d = this.Y - this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.setFlag('C', d >= 0);
        this.updateZN(d & 0xFF); };
    CPU.prototype.asl_acc = function() { this.setFlag('C', (this.A & 0x80) !== 0);
        this.A = (this.A << 1) & 0xFF;
        this.updateZN(this.A); };
    CPU.prototype.asl_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('C', (v & 0x80) !== 0);
        v = (v << 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.asl_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('C', (v & 0x80) !== 0);
        v = (v << 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.asl_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('C', (v & 0x80) !== 0);
        v = (v << 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.asl_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr & 0xFFFF];
        this.setFlag('C', (v & 0x80) !== 0);
        v = (v << 1) & 0xFF;
        this.memory[addr & 0xFFFF] = v;
        this.updateZN(v); };
    CPU.prototype.lsr_acc = function() { this.setFlag('C', this.A & 0x01);
        this.A = (this.A >> 1) & 0xFF;
        this.updateZN(this.A); };
    CPU.prototype.lsr_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('C', v & 0x01);
        v = (v >> 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.lsr_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('C', v & 0x01);
        v = (v >> 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.lsr_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('C', v & 0x01);
        v = (v >> 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.lsr_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr & 0xFFFF];
        this.setFlag('C', v & 0x01);
        v = (v >> 1) & 0xFF;
        this.memory[addr & 0xFFFF] = v;
        this.updateZN(v); };
    CPU.prototype.rol_acc = function() { var c = this.getFlag('C');
        this.setFlag('C', (this.A & 0x80) !== 0);
        this.A = ((this.A << 1) & 0xFF) | c;
        this.updateZN(this.A); };
    CPU.prototype.rol_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        var c = this.getFlag('C');
        this.setFlag('C', (v & 0x80) !== 0);
        v = ((v << 1) & 0xFF) | c;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.rol_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        var c = this.getFlag('C');
        this.setFlag('C', (v & 0x80) !== 0);
        v = ((v << 1) & 0xFF) | c;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.rol_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr];
        var c = this.getFlag('C');
        this.setFlag('C', (v & 0x80) !== 0);
        v = ((v << 1) & 0xFF) | c;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.rol_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr & 0xFFFF];
        var c = this.getFlag('C');
        this.setFlag('C', (v & 0x80) !== 0);
        v = ((v << 1) & 0xFF) | c;
        this.memory[addr & 0xFFFF] = v;
        this.updateZN(v); };
    CPU.prototype.ror_acc = function() { var c = this.getFlag('C');
        this.setFlag('C', this.A & 0x01);
        this.A = (this.A >> 1) | (c << 7);
        this.updateZN(this.A); };
    CPU.prototype.ror_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        var c = this.getFlag('C');
        this.setFlag('C', v & 0x01);
        v = (v >> 1) | (c << 7);
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.ror_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = this.memory[addr];
        var c = this.getFlag('C');
        this.setFlag('C', v & 0x01);
        v = (v >> 1) | (c << 7);
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.ror_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr];
        var c = this.getFlag('C');
        this.setFlag('C', v & 0x01);
        v = (v >> 1) | (c << 7);
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.ror_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr & 0xFFFF];
        var c = this.getFlag('C');
        this.setFlag('C', v & 0x01);
        v = (v >> 1) | (c << 7);
        this.memory[addr & 0xFFFF] = v;
        this.updateZN(v); };
    CPU.prototype.bit_zp = function() { var v = this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF;
        this.setFlag('Z', (this.A & v) === 0);
        this.setFlag('V', (v & 0x40) !== 0);
        this.setFlag('N', (v & 0x80) !== 0); };
    CPU.prototype.bit_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF;
        var v = this.memory[addr];
        this.setFlag('Z', (this.A & v) === 0);
        this.setFlag('V', (v & 0x40) !== 0);
        this.setFlag('N', (v & 0x80) !== 0); };
    CPU.prototype.inc_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var v = (this.memory[addr] + 1) & 0xFF;
        this.memory[addr] = v;
        this.updateZN(v); };
    CPU.prototype.dex = function() { this.X = (this.X - 1) & 0xFF;
        this.updateZN(this.X); };
    CPU.prototype.dey = function() { this.Y = (this.Y - 1) & 0xFF;
        this.updateZN(this.Y); };
    CPU.prototype.inx = function() { this.X = (this.X + 1) & 0xFF;
        this.updateZN(this.X); };
    CPU.prototype.iny = function() { this.Y = (this.Y + 1) & 0xFF;
        this.updateZN(this.Y); };
    CPU.prototype.tax = function() { this.X = this.A;
        this.updateZN(this.X);
        this._recordTransfer('A', 'X', this.A); };
    CPU.prototype.tay = function() { this.Y = this.A;
        this.updateZN(this.Y);
        this._recordTransfer('A', 'Y', this.A); };
    CPU.prototype.txa = function() { this.A = this.X;
        this.updateZN(this.A);
        this._recordTransfer('X', 'A', this.X); };
    CPU.prototype.tya = function() { this.A = this.Y;
        this.updateZN(this.A);
        this._recordTransfer('Y', 'A', this.Y); };
    CPU.prototype.tsx = function() { this.X = this.SP;
        this.updateZN(this.X);
        this._recordTransfer('SP', 'X', this.SP); };
    CPU.prototype.txs = function() { this.SP = this.X;
        this._recordTransfer('X', 'SP', this.X); };
    CPU.prototype.bcc = function() { if (!this.getFlag('C')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.bcs = function() { if (this.getFlag('C')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.beq = function() { if (this.getFlag('Z')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.bmi = function() { if (this.getFlag('N')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.bne = function() { if (!this.getFlag('Z')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.bpl = function() { if (!this.getFlag('N')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.bvc = function() { if (!this.getFlag('V')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };
    CPU.prototype.bvs = function() { if (this.getFlag('V')) { var o = this.memory[this.PC];
            this.PC = (this.PC + 1) & 0xFFFF;
            this.PC = (this.PC + (o >= 0x80 ? o - 0x100 : o)) & 0xFFFF; } else { this.PC = (this.PC + 1) & 0xFFFF; } };

    // --- Missing addressing mode variants ---

    // ADC
    CPU.prototype.adc_zpx = function() { var v = this.memory[(this.memory[this.PC] + this.X) & 0xFF];
        this.PC = (this.PC + 1) & 0xFFFF; this.adc_do(v); };
    CPU.prototype.adc_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; this.adc_do(this.memory[addr]); };
    CPU.prototype.adc_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; this.adc_do(this.memory[addr]); };
    CPU.prototype.adc_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8); this.adc_do(this.memory[addr]); };
    CPU.prototype.adc_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; this.adc_do(this.memory[addr]); };

    // AND
    CPU.prototype.and_zpx = function() { this.A &= this.memory[(this.memory[this.PC] + this.X) & 0xFF];
        this.PC = (this.PC + 1) & 0xFFFF; this.updateZN(this.A); };
    CPU.prototype.and_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; this.A &= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.and_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; this.A &= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.and_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8); this.A &= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.and_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; this.A &= this.memory[addr]; this.updateZN(this.A); };

    // CMP
    CPU.prototype.cmp_zpx = function() { this.cmp_do(this.memory[(this.memory[this.PC] + this.X) & 0xFF]);
        this.PC = (this.PC + 1) & 0xFFFF; };
    CPU.prototype.cmp_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; this.cmp_do(this.memory[addr]); };
    CPU.prototype.cmp_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; this.cmp_do(this.memory[addr]); };
    CPU.prototype.cmp_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8); this.cmp_do(this.memory[addr]); };
    CPU.prototype.cmp_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; this.cmp_do(this.memory[addr]); };

    // CPX
    CPU.prototype.cpx_zp = function() { var d = this.X - this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF; this.setFlag('C', d >= 0); this.updateZN(d & 0xFF); };
    CPU.prototype.cpx_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF; var d = this.X - this.memory[addr];
        this.setFlag('C', d >= 0); this.updateZN(d & 0xFF); };

    // CPY
    CPU.prototype.cpy_zp = function() { var d = this.Y - this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF; this.setFlag('C', d >= 0); this.updateZN(d & 0xFF); };
    CPU.prototype.cpy_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF; var d = this.Y - this.memory[addr];
        this.setFlag('C', d >= 0); this.updateZN(d & 0xFF); };

    // DEC
    CPU.prototype.dec_zp = function() { var addr = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF; var v = (this.memory[addr] - 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };
    CPU.prototype.dec_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF; var v = (this.memory[addr] - 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };
    CPU.prototype.dec_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF; var v = (this.memory[addr] - 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };
    CPU.prototype.dec_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; var v = (this.memory[addr] - 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };

    // EOR
    CPU.prototype.eor_zpx = function() { this.A ^= this.memory[(this.memory[this.PC] + this.X) & 0xFF];
        this.PC = (this.PC + 1) & 0xFFFF; this.updateZN(this.A); };
    CPU.prototype.eor_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; this.A ^= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.eor_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; this.A ^= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.eor_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8); this.A ^= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.eor_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; this.A ^= this.memory[addr]; this.updateZN(this.A); };

    // INC
    CPU.prototype.inc_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF; var v = (this.memory[addr] + 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };
    CPU.prototype.inc_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF; var v = (this.memory[addr] + 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };
    CPU.prototype.inc_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; var v = (this.memory[addr] + 1) & 0xFF;
        this.memory[addr] = v; this.updateZN(v); };

    // LDA
    CPU.prototype.lda_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; var val = this.memory[addr];
        this.A = val; this.updateZN(this.A); this._recordRead(addr, val, 'A'); };
    CPU.prototype.lda_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; var val = this.memory[addr];
        this.A = val; this.updateZN(this.A); this._recordRead(addr, val, 'A'); };
    CPU.prototype.lda_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8); var val = this.memory[addr];
        this.A = val; this.updateZN(this.A); this._recordRead(addr, val, 'A'); };
    CPU.prototype.lda_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; var val = this.memory[addr];
        this.A = val; this.updateZN(this.A); this._recordRead(addr, val, 'A'); };

    // LDX
    CPU.prototype.ldx_zpy = function() { var addr = (this.memory[this.PC] + this.Y) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF; var val = this.memory[addr];
        this.X = val; this.updateZN(this.X); this._recordRead(addr, val, 'X'); };
    CPU.prototype.ldx_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; var val = this.memory[addr];
        this.X = val; this.updateZN(this.X); this._recordRead(addr, val, 'X'); };

    // LDY
    CPU.prototype.ldy_zpx = function() { var addr = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF; var val = this.memory[addr];
        this.Y = val; this.updateZN(this.Y); this._recordRead(addr, val, 'Y'); };
    CPU.prototype.ldy_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF; var val = this.memory[addr];
        this.Y = val; this.updateZN(this.Y); this._recordRead(addr, val, 'Y'); };
    CPU.prototype.ldy_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; var val = this.memory[addr];
        this.Y = val; this.updateZN(this.Y); this._recordRead(addr, val, 'Y'); };

    // ORA
    CPU.prototype.ora_zpx = function() { this.A |= this.memory[(this.memory[this.PC] + this.X) & 0xFF];
        this.PC = (this.PC + 1) & 0xFFFF; this.updateZN(this.A); };
    CPU.prototype.ora_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; this.A |= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.ora_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; this.A |= this.memory[addr]; this.updateZN(this.A); };
    CPU.prototype.ora_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; this.A |= this.memory[addr]; this.updateZN(this.A); };

    // PLP
    CPU.prototype.plp_imp = function() { var f = this.pull();
        this.setFlag('N', (f & 0x80) !== 0); this.setFlag('V', (f & 0x40) !== 0);
        this.setFlag('B', (f & 0x10) !== 0); this.setFlag('D', (f & 0x08) !== 0);
        this.setFlag('I', (f & 0x04) !== 0); this.setFlag('Z', (f & 0x02) !== 0);
        this.setFlag('C', (f & 0x01) !== 0); };

    // SBC
    CPU.prototype.sbc_zp = function() { var v = this.memory[this.memory[this.PC]];
        this.PC = (this.PC + 1) & 0xFFFF; this.sbc_do(v); };
    CPU.prototype.sbc_zpx = function() { var v = this.memory[(this.memory[this.PC] + this.X) & 0xFF];
        this.PC = (this.PC + 1) & 0xFFFF; this.sbc_do(v); };
    CPU.prototype.sbc_abs = function() { var addr = this.memory[this.PC] | (this.memory[this.PC + 1] << 8);
        this.PC = (this.PC + 2) & 0xFFFF; this.sbc_do(this.memory[addr]); };
    CPU.prototype.sbc_abx = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.X;
        this.PC = (this.PC + 2) & 0xFFFF; this.sbc_do(this.memory[addr]); };
    CPU.prototype.sbc_aby = function() { var addr = (this.memory[this.PC] | (this.memory[this.PC + 1] << 8)) + this.Y;
        this.PC = (this.PC + 2) & 0xFFFF; this.sbc_do(this.memory[addr]); };
    CPU.prototype.sbc_indx = function() { var zp = (this.memory[this.PC] + this.X) & 0xFF;
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8); this.sbc_do(this.memory[addr]); };
    CPU.prototype.sbc_indy = function() { var zp = this.memory[this.PC];
        this.PC = (this.PC + 1) & 0xFFFF;
        var addr = (this.memory[zp] | (this.memory[(zp + 1) & 0xFF] << 8)) + this.Y; this.sbc_do(this.memory[addr]); };

    return CPU;
})();
