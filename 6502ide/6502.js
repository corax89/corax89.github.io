var START_ADRESS = 0x600;

CPU6502 = function() {

	this.PC = 0; // Program counter

	this.A = 0; this.X = 0; this.Y = 0; this.S = 0; // Registers
	this.N = 0; this.Z = 1; this.C = 0; this.V = 0; // ALU flags
	this.I = 0; this.D = 0; // Other flags

	this.irq = 0; this.nmi = 0; // IRQ lines

	this.tmp = 0; this.addr = 0; // Temporary registers
	this.opcode = 0; // Current opcode
	this.cycles = 0; // Cycles counter
}

CPU6502.constructor = CPU6502;

////////////////////////////////////////////////////////////////////////////////
// CPU control
////////////////////////////////////////////////////////////////////////////////

CPU6502.prototype.reset = function() {

	this.A = 0; this.X = 0; this.Y = 0; this.S = 0;
	this.N = 0; this.Z = 1; this.C = 0; this.V = 0;
	this.I = 0; this.D = 0;

	//this.PC = (this.read(0xFFFD) << 8) | this.read(0xFFFC);
	this.PC = START_ADRESS;
}

CPU6502.prototype.step = function() {
	this.opcode = this.read( this.PC++ );
	CPU6502op[ this.opcode ]( this );
}

CPU6502.prototype.log = function() {
	var msg = "PC=" + this.PC.toString(16);
	msg += " cyc=" + this.cycles;
	msg += "<br>[" + this.opcode.toString(16) + "] ";
	msg += ( this.C ? "C" : "-");
	msg += ( this.N ? "N" : "-");
	msg += ( this.Z ? "Z" : "-");
	msg += ( this.V ? "V" : "-");
	msg += ( this.D ? "D" : "-");
	msg += ( this.I ? "I" : "-");
	msg += "<br>A=" + this.A.toString(16);
	msg += " X=" + this.X.toString(16);
	msg += " Y=" + this.Y.toString(16);
	msg += " S=" + this.S.toString(16);
	msg += "<br><br>";
	if(this.S < 5){
		printError(10);
	}
	return msg;
}

////////////////////////////////////////////////////////////////////////////////
// Subroutines - addressing modes & flags
////////////////////////////////////////////////////////////////////////////////

CPU6502.prototype.izx = function() {
	var a = (this.read(this.PC++) + this.X) & 0xFF;
	this.addr = (this.read(a+1) << 8) | this.read(a);
	this.cycles += 6;
}

CPU6502.prototype.izy = function() {
	var a = this.read(this.PC++);
	var paddr = (this.read((a+1) & 0xFF) << 8) | this.read(a);
	this.addr = (paddr + this.Y);
	if ( (paddr & 0x100) != (this.addr & 0x100) ) {
		this.cycles += 6;
	} else {
		this.cycles += 5;
	}
}

CPU6502.prototype.ind = function() {
	var a = this.read(this.PC);
	a |= this.read( (this.PC & 0xFF00) | ((this.PC + 1) & 0xFF) ) << 8;
	this.addr = this.read(a);
	this.addr |= (this.read(a+1) << 8);
	this.cycles += 5;
}

CPU6502.prototype.zp = function() {
	this.addr = this.read(this.PC++);
	this.cycles += 3;
}

CPU6502.prototype.zpx = function() {
	this.addr = (this.read(this.PC++) + this.X) & 0xFF;
	this.cycles += 4;
}

CPU6502.prototype.zpy = function() {
	this.addr = (this.read(this.PC++) + this.Y) & 0xFF;
	this.cycles += 4;
}

CPU6502.prototype.imp = function() {
	this.cycles += 2;
}

CPU6502.prototype.imm = function() {
	this.addr = this.PC++;
	this.cycles += 2;
}

CPU6502.prototype.abs = function() {
	this.addr = this.read(this.PC++);
	this.addr |= (this.read(this.PC++) << 8);
	this.cycles += 4;
}

CPU6502.prototype.abx = function() {
	var paddr = this.read(this.PC++);
	paddr |= (this.read(this.PC++) << 8);
	this.addr = (paddr + this.X);
	if ( (paddr & 0x100) != (this.addr & 0x100) ) {
		this.cycles += 5;
	} else {
		this.cycles += 4;
	}
}

CPU6502.prototype.aby = function() {
	var paddr = this.read(this.PC++);
	paddr |= (this.read(this.PC++) << 8);
	this.addr = (paddr + this.Y);
	if ( (paddr & 0x100) != (this.addr & 0x100) ) {
		this.cycles += 5;
	} else {
		this.cycles += 4;
	}
}

CPU6502.prototype.rel = function() {
	this.addr = this.read(this.PC++);
	if (this.addr & 0x80) {
		this.addr -= 0x100;
	}
	this.addr += this.PC;
	this.cycles += 2;
}

////////////////////////////////////////////////////////////////////////////////

CPU6502.prototype.rmw = function() {
	this.write(this.addr, this.tmp & 0xFF);
	this.cycles += 2;
}

////////////////////////////////////////////////////////////////////////////////

CPU6502.prototype.fnz = function(v) {
	this.Z = ((v & 0xFF) == 0) ? 1 : 0;
	this.N = ((v & 0x80) != 0) ? 1 : 0;
}

// Borrow
CPU6502.prototype.fnzb = function(v) {
	this.Z = ((v & 0xFF) == 0) ? 1 : 0;
	this.N = ((v & 0x80) != 0) ? 1 : 0;
	this.C = ((v & 0x100) != 0) ? 0 : 1;
}

// Carry
CPU6502.prototype.fnzc = function(v) {
	this.Z = ((v & 0xFF) == 0) ? 1 : 0;
	this.N = ((v & 0x80) != 0) ? 1 : 0;
	this.C = ((v & 0x100) != 0) ? 1 : 0;
}

CPU6502.prototype.branch = function(v) {
	if (v) {
		if ( (this.addr & 0x100) != (this.PC & 0x100) ) {
			this.cycles += 2;
		} else {
			this.cycles += 1;
		}
		this.PC = this.addr;
	}
}

////////////////////////////////////////////////////////////////////////////////
// Subroutines - instructions
////////////////////////////////////////////////////////////////////////////////
CPU6502.prototype.adc = function() {
	var v = this.read(this.addr);
	var c = this.C;
	var r = this.A + v + c;
	if (this.D) {
		var al = (this.A & 0x0F) + (v & 0x0F) + c;
		if (al > 9) al += 6;
		var ah = (this.A >> 4) + (v >> 4) + ((al > 15) ? 1 : 0);
		this.Z = ((r & 0xFF) == 0) ? 1 : 0;
		this.N = ((ah & 8) != 0) ? 1 : 0;
		this.V = ((~(this.A ^ v) & (this.A ^ (ah << 4)) & 0x80) != 0) ? 1 : 0;
		if (ah > 9) ah += 6;
		this.C = (ah > 15) ? 1 : 0;
		this.A = ((ah << 4) | (al & 15)) & 0xFF;
	} else {
		this.Z = ((r & 0xFF) == 0) ? 1 : 0;
		this.N = ((r & 0x80) != 0) ? 1 : 0;
		this.V = ((~(this.A ^ v) & (this.A ^ r) & 0x80) != 0) ? 1 : 0;
		this.C = ((r & 0x100) != 0) ? 1 : 0;
		this.A = r & 0xFF;
	}
}

CPU6502.prototype.and = function() {
	this.A &= this.read(this.addr);
	this.fnz(this.A);
}

CPU6502.prototype.asl = function() {
	this.tmp = this.read(this.addr) << 1;
	this.fnzc(this.tmp);
	this.tmp &= 0xFF;
}
CPU6502.prototype.asla = function() {
	this.tmp = this.A << 1;
	this.fnzc(this.tmp);
	this.A = this.tmp & 0xFF;
}

CPU6502.prototype.bit = function() {
	this.tmp = this.read(this.addr);
	this.N = ((this.tmp & 0x80) != 0) ? 1 : 0;
	this.V = ((this.tmp & 0x40) != 0) ? 1 : 0;
	this.Z = ((this.tmp & this.A) == 0) ? 1 : 0;
}

CPU6502.prototype.brk = function() {
	this.PC++;
	this.write(this.S + 0x100, this.PC >> 8);
	this.S = (this.S - 1) & 0xFF;
	this.write(this.S + 0x100, this.PC & 0xFF);
	this.S = (this.S - 1) & 0xFF;
	var v = this.N << 7;
	v |= this.V << 6;
	v |= 3 << 4;
	v |= this.D << 3;
	v |= this.I << 2;
	v |= this.Z << 1;
	v |= this.C;
	this.write(this.S + 0x100, v);
	this.S = (this.S - 1) & 0xFF;
	this.I = 1;
	this.D = 0;
	this.PC = (this.read(0xFFFF) << 8) | this.read(0xFFFE);
	this.cycles += 5;
}

CPU6502.prototype.bcc = function() { this.branch( this.C == 0 ); }
CPU6502.prototype.bcs = function() { this.branch( this.C == 1 ); }
CPU6502.prototype.beq = function() { this.branch( this.Z == 1 ); }
CPU6502.prototype.bne = function() { this.branch( this.Z == 0 ); }
CPU6502.prototype.bmi = function() { this.branch( this.N == 1 ); }
CPU6502.prototype.bpl = function() { this.branch( this.N == 0 ); }
CPU6502.prototype.bvc = function() { this.branch( this.V == 0 ); }
CPU6502.prototype.bvs = function() { this.branch( this.V == 1 ); }


CPU6502.prototype.clc = function() { this.C = 0; }
CPU6502.prototype.cld = function() { this.D = 0; }
CPU6502.prototype.cli = function() { this.I = 0; }
CPU6502.prototype.clv = function() { this.V = 0; }

CPU6502.prototype.cmp = function() {
	this.fnzb( this.A - this.read(this.addr) );
}

CPU6502.prototype.cpx = function() {
	this.fnzb( this.X - this.read(this.addr) );
}

CPU6502.prototype.cpy = function() {
	this.fnzb( this.Y - this.read(this.addr) );
}

CPU6502.prototype.dec = function() {
	this.tmp = (this.read(this.addr) - 1) & 0xFF;
	this.fnz(this.tmp);
}

CPU6502.prototype.dex = function() {
	this.X = (this.X - 1) & 0xFF;
	this.fnz(this.X);
}

CPU6502.prototype.dey = function() {
	this.Y = (this.Y - 1) & 0xFF;
	this.fnz(this.Y);
}

CPU6502.prototype.eor = function() {
	this.A ^= this.read(this.addr);
	this.fnz(this.A);
}

CPU6502.prototype.inc = function() {
	this.tmp = (this.read(this.addr) + 1) & 0xFF;
	this.fnz(this.tmp);
}

CPU6502.prototype.inx = function() {
	this.X = (this.X + 1) & 0xFF;
	this.fnz(this.X);
}

CPU6502.prototype.iny = function() {
	this.Y = (this.Y + 1) & 0xFF;
	this.fnz(this.Y);
}

CPU6502.prototype.jmp = function() {
	this.PC = this.addr;
	this.cycles--;
}

CPU6502.prototype.jsr = function() {
	this.write(this.S + 0x100, (this.PC - 1) >> 8);
	this.S = (this.S - 1) & 0xFF;
	this.write(this.S + 0x100, (this.PC - 1) & 0xFF);
	this.S = (this.S - 1) & 0xFF;
	this.PC = this.addr;
	this.cycles += 2;
}

CPU6502.prototype.lda = function() {
	this.A = this.read(this.addr);
	this.fnz(this.A);
}

CPU6502.prototype.ldx = function() {
	this.X = this.read(this.addr);
	this.fnz(this.X);
}

CPU6502.prototype.ldy = function() {
	this.Y = this.read(this.addr);
	this.fnz(this.Y);
}

CPU6502.prototype.ora = function() {
	this.A |= this.read(this.addr);
	this.fnz(this.A);
}

CPU6502.prototype.rol = function() {
	this.tmp = (this.read(this.addr) << 1) | this.C;
	this.fnzc(this.tmp);
	this.tmp &= 0xFF;
}
CPU6502.prototype.rola = function() {
	this.tmp = (this.A << 1) | this.C;
	this.fnzc(this.tmp);
	this.A = this.tmp & 0xFF;
}

CPU6502.prototype.ror = function() {
	this.tmp = this.read(this.addr);
	this.tmp = ((this.tmp & 1) << 8) | (this.C << 7) | (this.tmp >> 1);
	this.fnzc(this.tmp);
	this.tmp &= 0xFF;
}
CPU6502.prototype.rora = function() {
	this.tmp = ((this.A & 1) << 8) | (this.C << 7) | (this.A >> 1);
	this.fnzc(this.tmp);
	this.A = this.tmp & 0xFF;
}


CPU6502.prototype.lsr = function() {
	this.tmp = this.read(this.addr);
	this.tmp = ((this.tmp & 1) << 8) | (this.tmp >> 1);
	this.fnzc(this.tmp);
	this.tmp &= 0xFF;
}
CPU6502.prototype.lsra = function() {
	this.tmp = ((this.A & 1) << 8) | (this.A >> 1);
	this.fnzc(this.tmp);
	this.A = this.tmp & 0xFF;
}


CPU6502.prototype.nop = function() { }

CPU6502.prototype.pha = function() {
	this.write(this.S + 0x100, this.A);
	this.S = (this.S - 1) & 0xFF;
	this.cycles++;
}

CPU6502.prototype.php = function() {
	var v = this.N << 7;
	v |= this.V << 6;
	v |= 3 << 4;
	v |= this.D << 3;
	v |= this.I << 2;
	v |= this.Z << 1;
	v |= this.C;
	this.write(this.S + 0x100, v);
	this.S = (this.S - 1) & 0xFF;
	this.cycles++;
}

CPU6502.prototype.pla = function() {
	this.S = (this.S + 1) & 0xFF;
	this.A = this.read(this.S + 0x100);
	this.fnz(this.A);
	this.cycles += 2;
}

CPU6502.prototype.plp = function() {
	this.S = (this.S + 1) & 0xFF;
	this.tmp = this.read(this.S + 0x100);
	this.N = ((this.tmp & 0x80) != 0) ? 1 : 0;
	this.V = ((this.tmp & 0x40) != 0) ? 1 : 0;
	this.D = ((this.tmp & 0x08) != 0) ? 1 : 0;
	this.I = ((this.tmp & 0x04) != 0) ? 1 : 0;
	this.Z = ((this.tmp & 0x02) != 0) ? 1 : 0;
	this.C = ((this.tmp & 0x01) != 0) ? 1 : 0;
	this.cycles += 2;
}

CPU6502.prototype.rti = function() {
	this.S = (this.S + 1) & 0xFF;
	this.tmp = this.read(this.S + 0x100);
	this.N = ((this.tmp & 0x80) != 0) ? 1 : 0;
	this.V = ((this.tmp & 0x40) != 0) ? 1 : 0;
	this.D = ((this.tmp & 0x08) != 0) ? 1 : 0;
	this.I = ((this.tmp & 0x04) != 0) ? 1 : 0;
	this.Z = ((this.tmp & 0x02) != 0) ? 1 : 0;
	this.C = ((this.tmp & 0x01) != 0) ? 1 : 0;
	this.S = (this.S + 1) & 0xFF;
	this.PC = this.read(this.S + 0x100);
	this.S = (this.S + 1) & 0xFF;
	this.PC |= this.read(this.S + 0x100) << 8;
	this.cycles += 4;
}

CPU6502.prototype.rts = function() {
	this.S = (this.S + 1) & 0xFF;
	this.PC = this.read(this.S + 0x100);
	this.S = (this.S + 1) & 0xFF;
	this.PC |= this.read(this.S + 0x100) << 8;
	this.PC++;
	this.cycles += 4;
}

CPU6502.prototype.sbc = function() {
	var v = this.read(this.addr);
	var c = 1 - this.C;
	var r = this.A - v - c;
	if (this.D) {
		var al = (this.A & 0x0F) - (v & 0x0F) - c;
		if (al < 0) al -= 6;
		var ah = (this.A >> 4) - (v >> 4) - ((al < 0) ? 1 : 0);
		this.Z = ((r & 0xFF) == 0) ? 1 : 0;
		this.N = ((r & 0x80) != 0) ? 1 : 0;
		this.V = (((this.A ^ v) & (this.A ^ r) & 0x80) != 0) ? 1 : 0;
		this.C = ((r & 0x100) != 0) ? 0 : 1;
		if (ah < 0) ah -= 6;
		this.A = ((ah << 4) | (al & 15)) & 0xFF;
	} else {
		this.Z = ((r & 0xFF) == 0) ? 1 : 0;
		this.N = ((r & 0x80) != 0) ? 1 : 0;
		this.V = (((this.A ^ v) & (this.A ^ r) & 0x80) != 0) ? 1 : 0;
		this.C = ((r & 0x100) != 0) ? 0 : 1;
		this.A = r & 0xFF;
	}
}


CPU6502.prototype.sec = function() { this.C = 1; }
CPU6502.prototype.sed = function() { this.D = 1; }
CPU6502.prototype.sei = function() { this.I = 1; }


CPU6502.prototype.slo = function() {
	this.tmp = this.read(this.addr) << 1;
	this.tmp |= this.A;
	this.fnzc(this.tmp);
	this.A = this.tmp & 0xFF;
}

CPU6502.prototype.sta = function() {
	this.write(this.addr, this.A);
}

CPU6502.prototype.stx = function() {
	this.write(this.addr, this.X);
}

CPU6502.prototype.sty = function() {
	this.write(this.addr, this.Y);
}

CPU6502.prototype.tax = function() {
	this.X = this.A;
	this.fnz(this.X);
}

CPU6502.prototype.tay = function() {
	this.Y = this.A;
	this.fnz(this.Y);
}

CPU6502.prototype.tsx = function() {
	this.X = this.S;
	this.fnz(this.X);
}

CPU6502.prototype.txa = function() {
	this.A = this.X;
	this.fnz(this.A);
}

CPU6502.prototype.txs = function() {
	this.S = this.X;
}

CPU6502.prototype.tya = function() {
	this.A = this.Y;
	this.fnz(this.A);
}

CPU6502.prototype.kil = function() {

}

////////////////////////////////////////////////////////////////////////////////
// Opcode table
////////////////////////////////////////////////////////////////////////////////

var CPU6502op = new Array();

/*  BRK     */ CPU6502op[0x00] = function(m) { m.imp(); m.brk(); };
/*  ORA izx */ CPU6502op[0x01] = function(m) { m.izx(); m.ora(); };
/* *KIL     */ CPU6502op[0x02] = function(m) { m.imp(); m.kil(); };
/* *SLO izx */ CPU6502op[0x03] = function(m) { m.izx(); m.slo(); m.rmw(); };
/* *NOP zp  */ CPU6502op[0x04] = function(m) { m.zp(); m.nop(); };
/*  ORA zp  */ CPU6502op[0x05] = function(m) { m.zp(); m.ora(); };
/*  ASL zp  */ CPU6502op[0x06] = function(m) { m.zp(); m.asl(); m.rmw(); };
/* *SLO zp  */ CPU6502op[0x07] = function(m) { m.zp(); m.slo(); m.rmw(); };
/*  PHP     */ CPU6502op[0x08] = function(m) { m.imp(); m.php(); };
/*  ORA imm */ CPU6502op[0x09] = function(m) { m.imm(); m.ora(); };
/*  ASL     */ CPU6502op[0x0A] = function(m) { m.imp(); m.asla(); };
/* *ANC imm */ CPU6502op[0x0B] = function(m) { m.imm(); m.anc(); };
/* *NOP abs */ CPU6502op[0x0C] = function(m) { m.abs(); m.nop(); };
/*  ORA abs */ CPU6502op[0x0D] = function(m) { m.abs(); m.ora(); };
/*  ASL abs */ CPU6502op[0x0E] = function(m) { m.abs(); m.asl(); m.rmw(); };
/* *SLO abs */ CPU6502op[0x0F] = function(m) { m.abs(); m.slo(); m.rmw(); };

/*  BPL rel */ CPU6502op[0x10] = function(m) { m.rel(); m.bpl(); };
/*  ORA izy */ CPU6502op[0x11] = function(m) { m.izy(); m.ora(); };
/* *KIL     */ CPU6502op[0x12] = function(m) { m.imp(); m.kil(); };
/* *SLO izy */ CPU6502op[0x13] = function(m) { m.izy(); m.slo(); m.rmw(); };
/* *NOP zpx */ CPU6502op[0x14] = function(m) { m.zpx(); m.nop(); };
/*  ORA zpx */ CPU6502op[0x15] = function(m) { m.zpx(); m.ora(); };
/*  ASL zpx */ CPU6502op[0x16] = function(m) { m.zpx(); m.asl(); m.rmw(); };
/* *SLO zpx */ CPU6502op[0x17] = function(m) { m.zpx(); m.slo(); m.rmw(); };
/*  CLC     */ CPU6502op[0x18] = function(m) { m.imp(); m.clc(); };
/*  ORA aby */ CPU6502op[0x19] = function(m) { m.aby(); m.ora(); };
/* *NOP     */ CPU6502op[0x1A] = function(m) { m.imp(); m.nop(); };
/* *SLO aby */ CPU6502op[0x1B] = function(m) { m.aby(); m.slo(); m.rmw(); };
/* *NOP abx */ CPU6502op[0x1C] = function(m) { m.abx(); m.nop(); };
/*  ORA abx */ CPU6502op[0x1D] = function(m) { m.abx(); m.ora(); };
/*  ASL abx */ CPU6502op[0x1E] = function(m) { m.abx(); m.asl(); m.rmw(); };
/* *SLO abx */ CPU6502op[0x1F] = function(m) { m.abx(); m.slo(); m.rmw(); };

/*  JSR abs */ CPU6502op[0x20] = function(m) { m.abs(); m.jsr(); };
/*  AND izx */ CPU6502op[0x21] = function(m) { m.izx(); m.and(); };
/* *KIL     */ CPU6502op[0x22] = function(m) { m.imp(); m.kil(); };
/* *RLA izx */ CPU6502op[0x23] = function(m) { m.izx(); m.rla(); m.rmw(); };
/*  BIT zp  */ CPU6502op[0x24] = function(m) { m.zp(); m.bit(); };
/*  AND zp  */ CPU6502op[0x25] = function(m) { m.zp(); m.and(); };
/*  ROL zp  */ CPU6502op[0x26] = function(m) { m.zp(); m.rol(); m.rmw(); };
/* *RLA zp  */ CPU6502op[0x27] = function(m) { m.zp(); m.rla(); m.rmw(); };
/*  PLP     */ CPU6502op[0x28] = function(m) { m.imp(); m.plp(); };
/*  AND imm */ CPU6502op[0x29] = function(m) { m.imm(); m.and(); };
/*  ROL     */ CPU6502op[0x2A] = function(m) { m.imp(); m.rola(); };
/* *ANC imm */ CPU6502op[0x2B] = function(m) { m.imm(); m.anc(); };
/*  BIT abs */ CPU6502op[0x2C] = function(m) { m.abs(); m.bit(); };
/*  AND abs */ CPU6502op[0x2D] = function(m) { m.abs(); m.and(); };
/*  ROL abs */ CPU6502op[0x2E] = function(m) { m.abs(); m.rol(); m.rmw(); };
/* *RLA abs */ CPU6502op[0x2F] = function(m) { m.abs(); m.rla(); m.rmw(); };

/*  BMI rel */ CPU6502op[0x30] = function(m) { m.rel(); m.bmi(); };
/*  AND izy */ CPU6502op[0x31] = function(m) { m.izy(); m.and(); };
/* *KIL     */ CPU6502op[0x32] = function(m) { m.imp(); m.kil(); };
/* *RLA izy */ CPU6502op[0x33] = function(m) { m.izy(); m.rla(); m.rmw(); };
/* *NOP zpx */ CPU6502op[0x34] = function(m) { m.zpx(); m.nop(); };
/*  AND zpx */ CPU6502op[0x35] = function(m) { m.zpx(); m.and(); };
/*  ROL zpx */ CPU6502op[0x36] = function(m) { m.zpx(); m.rol(); m.rmw(); };
/* *RLA zpx */ CPU6502op[0x37] = function(m) { m.zpx(); m.rla(); m.rmw(); };
/*  SEC     */ CPU6502op[0x38] = function(m) { m.imp(); m.sec(); };
/*  AND aby */ CPU6502op[0x39] = function(m) { m.aby(); m.and(); };
/* *NOP     */ CPU6502op[0x3A] = function(m) { m.imp(); m.nop(); };
/* *RLA aby */ CPU6502op[0x3B] = function(m) { m.aby(); m.rla(); m.rmw(); };
/* *NOP abx */ CPU6502op[0x3C] = function(m) { m.abx(); m.nop(); };
/*  AND abx */ CPU6502op[0x3D] = function(m) { m.abx(); m.and(); };
/*  ROL abx */ CPU6502op[0x3E] = function(m) { m.abx(); m.rol(); m.rmw(); };
/* *RLA abx */ CPU6502op[0x3F] = function(m) { m.abx(); m.rla(); m.rmw(); };

/*  RTI     */ CPU6502op[0x40] = function(m) { m.imp(); m.rti(); };
/*  EOR izx */ CPU6502op[0x41] = function(m) { m.izx(); m.eor(); };
/* *KIL     */ CPU6502op[0x42] = function(m) { m.imp(); m.kil(); };
/* *SRE izx */ CPU6502op[0x43] = function(m) { m.izx(); m.sre(); m.rmw(); };
/* *NOP zp  */ CPU6502op[0x44] = function(m) { m.zp(); m.nop(); };
/*  EOR zp  */ CPU6502op[0x45] = function(m) { m.zp(); m.eor(); };
/*  LSR zp  */ CPU6502op[0x46] = function(m) { m.zp(); m.lsr(); m.rmw(); };
/* *SRE zp  */ CPU6502op[0x47] = function(m) { m.zp(); m.sre(); m.rmw(); };
/*  PHA     */ CPU6502op[0x48] = function(m) { m.imp(); m.pha(); };
/*  EOR imm */ CPU6502op[0x49] = function(m) { m.imm(); m.eor(); };
/*  LSR     */ CPU6502op[0x4A] = function(m) { m.imp(); m.lsra(); };
/* *ALR imm */ CPU6502op[0x4B] = function(m) { m.imm(); m.alr(); };
/*  JMP abs */ CPU6502op[0x4C] = function(m) { m.abs(); m.jmp(); };
/*  EOR abs */ CPU6502op[0x4D] = function(m) { m.abs(); m.eor(); };
/*  LSR abs */ CPU6502op[0x4E] = function(m) { m.abs(); m.lsr(); m.rmw(); };
/* *SRE abs */ CPU6502op[0x4F] = function(m) { m.abs(); m.sre(); m.rmw(); };

/*  BVC rel */ CPU6502op[0x50] = function(m) { m.rel(); m.bvc(); };
/*  EOR izy */ CPU6502op[0x51] = function(m) { m.izy(); m.eor(); };
/* *KIL     */ CPU6502op[0x52] = function(m) { m.imp(); m.kil(); };
/* *SRE izy */ CPU6502op[0x53] = function(m) { m.izy(); m.sre(); m.rmw(); };
/* *NOP zpx */ CPU6502op[0x54] = function(m) { m.zpx(); m.nop(); };
/*  EOR zpx */ CPU6502op[0x55] = function(m) { m.zpx(); m.eor(); };
/*  LSR zpx */ CPU6502op[0x56] = function(m) { m.zpx(); m.lsr(); m.rmw(); };
/* *SRE zpx */ CPU6502op[0x57] = function(m) { m.zpx(); m.sre(); m.rmw(); };
/*  CLI     */ CPU6502op[0x58] = function(m) { m.imp(); m.cli(); };
/*  EOR aby */ CPU6502op[0x59] = function(m) { m.aby(); m.eor(); };
/* *NOP     */ CPU6502op[0x5A] = function(m) { m.imp(); m.nop(); };
/* *SRE aby */ CPU6502op[0x5B] = function(m) { m.aby(); m.sre(); m.rmw(); };
/* *NOP abx */ CPU6502op[0x5C] = function(m) { m.abx(); m.nop(); };
/*  EOR abx */ CPU6502op[0x5D] = function(m) { m.abx(); m.eor(); };
/*  LSR abx */ CPU6502op[0x5E] = function(m) { m.abx(); m.lsr(); m.rmw(); };
/* *SRE abx */ CPU6502op[0x5F] = function(m) { m.abx(); m.sre(); m.rmw(); };

/*  RTS     */ CPU6502op[0x60] = function(m) { m.imp(); m.rts(); };
/*  ADC izx */ CPU6502op[0x61] = function(m) { m.izx(); m.adc(); };
/* *KIL     */ CPU6502op[0x62] = function(m) { m.imp(); m.kil(); };
/* *RRA izx */ CPU6502op[0x63] = function(m) { m.izx(); m.rra(); m.rmw(); };
/* *NOP zp  */ CPU6502op[0x64] = function(m) { m.zp(); m.nop(); };
/*  ADC zp  */ CPU6502op[0x65] = function(m) { m.zp(); m.adc(); };
/*  ROR zp  */ CPU6502op[0x66] = function(m) { m.zp(); m.ror(); m.rmw(); };
/* *RRA zp  */ CPU6502op[0x67] = function(m) { m.zp(); m.rra(); m.rmw(); };
/*  PLA     */ CPU6502op[0x68] = function(m) { m.imp(); m.pla(); };
/*  ADC imm */ CPU6502op[0x69] = function(m) { m.imm(); m.adc(); };
/*  ROR     */ CPU6502op[0x6A] = function(m) { m.imp(); m.rora(); };
/* *ARR imm */ CPU6502op[0x6B] = function(m) { m.imm(); m.arr(); };
/*  JMP ind */ CPU6502op[0x6C] = function(m) { m.ind(); m.jmp(); };
/*  ADC abs */ CPU6502op[0x6D] = function(m) { m.abs(); m.adc(); };
/*  ROR abs */ CPU6502op[0x6E] = function(m) { m.abs(); m.ror(); m.rmw(); };
/* *RRA abs */ CPU6502op[0x6F] = function(m) { m.abs(); m.rra(); m.rmw(); };

/*  BVS rel */ CPU6502op[0x70] = function(m) { m.rel(); m.bvs(); };
/*  ADC izy */ CPU6502op[0x71] = function(m) { m.izy(); m.adc(); };
/* *KIL     */ CPU6502op[0x72] = function(m) { m.imp(); m.kil(); };
/* *RRA izy */ CPU6502op[0x73] = function(m) { m.izy(); m.rra(); m.rmw(); };
/* *NOP zpx */ CPU6502op[0x74] = function(m) { m.zpx(); m.nop(); };
/*  ADC zpx */ CPU6502op[0x75] = function(m) { m.zpx(); m.adc(); };
/*  ROR zpx */ CPU6502op[0x76] = function(m) { m.zpx(); m.ror(); m.rmw(); };
/* *RRA zpx */ CPU6502op[0x77] = function(m) { m.zpx(); m.rra(); m.rmw(); };
/*  SEI     */ CPU6502op[0x78] = function(m) { m.imp(); m.sei(); };
/*  ADC aby */ CPU6502op[0x79] = function(m) { m.aby(); m.adc(); };
/* *NOP     */ CPU6502op[0x7A] = function(m) { m.imp(); m.nop(); };
/* *RRA aby */ CPU6502op[0x7B] = function(m) { m.aby(); m.rra(); m.rmw(); };
/* *NOP abx */ CPU6502op[0x7C] = function(m) { m.abx(); m.nop(); };
/*  ADC abx */ CPU6502op[0x7D] = function(m) { m.abx(); m.adc(); };
/*  ROR abx */ CPU6502op[0x7E] = function(m) { m.abx(); m.ror(); m.rmw(); };
/* *RRA abx */ CPU6502op[0x7F] = function(m) { m.abx(); m.rra(); m.rmw(); };

/* *NOP imm */ CPU6502op[0x80] = function(m) { m.imm(); m.nop(); };
/*  STA izx */ CPU6502op[0x81] = function(m) { m.izx(); m.sta(); };
/* *NOP imm */ CPU6502op[0x82] = function(m) { m.imm(); m.nop(); };
/* *SAX izx */ CPU6502op[0x83] = function(m) { m.izx(); m.sax(); };
/*  STY zp  */ CPU6502op[0x84] = function(m) { m.zp(); m.sty(); };
/*  STA zp  */ CPU6502op[0x85] = function(m) { m.zp(); m.sta(); };
/*  STX zp  */ CPU6502op[0x86] = function(m) { m.zp(); m.stx(); };
/* *SAX zp  */ CPU6502op[0x87] = function(m) { m.zp(); m.sax(); };
/*  DEY     */ CPU6502op[0x88] = function(m) { m.imp(); m.dey(); };
/* *NOP imm */ CPU6502op[0x89] = function(m) { m.imm(); m.nop(); };
/*  TXA     */ CPU6502op[0x8A] = function(m) { m.imp(); m.txa(); };
/* *XAA imm */ CPU6502op[0x8B] = function(m) { m.imm(); m.xaa(); };
/*  STY abs */ CPU6502op[0x8C] = function(m) { m.abs(); m.sty(); };
/*  STA abs */ CPU6502op[0x8D] = function(m) { m.abs(); m.sta(); };
/*  STX abs */ CPU6502op[0x8E] = function(m) { m.abs(); m.stx(); };
/* *SAX abs */ CPU6502op[0x8F] = function(m) { m.abs(); m.sax(); };

/*  BCC rel */ CPU6502op[0x90] = function(m) { m.rel(); m.bcc(); };
/*  STA izy */ CPU6502op[0x91] = function(m) { m.izy(); m.sta(); };
/* *KIL     */ CPU6502op[0x92] = function(m) { m.imp(); m.kil(); };
/* *AHX izy */ CPU6502op[0x93] = function(m) { m.izy(); m.ahx(); };
/*  STY zpx */ CPU6502op[0x94] = function(m) { m.zpx(); m.sty(); };
/*  STA zpx */ CPU6502op[0x95] = function(m) { m.zpx(); m.sta(); };
/*  STX zpy */ CPU6502op[0x96] = function(m) { m.zpy(); m.stx(); };
/* *SAX zpy */ CPU6502op[0x97] = function(m) { m.zpy(); m.sax(); };
/*  TYA     */ CPU6502op[0x98] = function(m) { m.imp(); m.tya(); };
/*  STA aby */ CPU6502op[0x99] = function(m) { m.aby(); m.sta(); };
/*  TXS     */ CPU6502op[0x9A] = function(m) { m.imp(); m.txs(); };
/* *TAS aby */ CPU6502op[0x9B] = function(m) { m.aby(); m.tas(); };
/* *SHY abx */ CPU6502op[0x9C] = function(m) { m.abx(); m.shy(); };
/*  STA abx */ CPU6502op[0x9D] = function(m) { m.abx(); m.sta(); };
/* *SHX aby */ CPU6502op[0x9E] = function(m) { m.aby(); m.shx(); };
/* *AHX aby */ CPU6502op[0x9F] = function(m) { m.aby(); m.ahx(); };

/*  LDY imm */ CPU6502op[0xA0] = function(m) { m.imm(); m.ldy(); };
/*  LDA izx */ CPU6502op[0xA1] = function(m) { m.izx(); m.lda(); };
/*  LDX imm */ CPU6502op[0xA2] = function(m) { m.imm(); m.ldx(); };
/* *LAX izx */ CPU6502op[0xA3] = function(m) { m.izx(); m.lax(); };
/*  LDY zp  */ CPU6502op[0xA4] = function(m) { m.zp(); m.ldy(); };
/*  LDA zp  */ CPU6502op[0xA5] = function(m) { m.zp(); m.lda(); };
/*  LDX zp  */ CPU6502op[0xA6] = function(m) { m.zp(); m.ldx(); };
/* *LAX zp  */ CPU6502op[0xA7] = function(m) { m.zp(); m.lax(); };
/*  TAY     */ CPU6502op[0xA8] = function(m) { m.imp(); m.tay(); };
/*  LDA imm */ CPU6502op[0xA9] = function(m) { m.imm(); m.lda(); };
/*  TAX     */ CPU6502op[0xAA] = function(m) { m.imp(); m.tax(); };
/* *LAX imm */ CPU6502op[0xAB] = function(m) { m.imm(); m.lax(); };
/*  LDY abs */ CPU6502op[0xAC] = function(m) { m.abs(); m.ldy(); };
/*  LDA abs */ CPU6502op[0xAD] = function(m) { m.abs(); m.lda(); };
/*  LDX abs */ CPU6502op[0xAE] = function(m) { m.abs(); m.ldx(); };
/* *LAX abs */ CPU6502op[0xAF] = function(m) { m.abs(); m.lax(); };

/*  BCS rel */ CPU6502op[0xB0] = function(m) { m.rel(); m.bcs(); };
/*  LDA izy */ CPU6502op[0xB1] = function(m) { m.izy(); m.lda(); };
/* *KIL     */ CPU6502op[0xB2] = function(m) { m.imp(); m.kil(); };
/* *LAX izy */ CPU6502op[0xB3] = function(m) { m.izy(); m.lax(); };
/*  LDY zpx */ CPU6502op[0xB4] = function(m) { m.zpx(); m.ldy(); };
/*  LDA zpx */ CPU6502op[0xB5] = function(m) { m.zpx(); m.lda(); };
/*  LDX zpy */ CPU6502op[0xB6] = function(m) { m.zpy(); m.ldx(); };
/* *LAX zpy */ CPU6502op[0xB7] = function(m) { m.zpy(); m.lax(); };
/*  CLV     */ CPU6502op[0xB8] = function(m) { m.imp(); m.clv(); };
/*  LDA aby */ CPU6502op[0xB9] = function(m) { m.aby(); m.lda(); };
/*  TSX     */ CPU6502op[0xBA] = function(m) { m.imp(); m.tsx(); };
/* *LAS aby */ CPU6502op[0xBB] = function(m) { m.aby(); m.las(); };
/*  LDY abx */ CPU6502op[0xBC] = function(m) { m.abx(); m.ldy(); };
/*  LDA abx */ CPU6502op[0xBD] = function(m) { m.abx(); m.lda(); };
/*  LDX aby */ CPU6502op[0xBE] = function(m) { m.aby(); m.ldx(); };
/* *LAX aby */ CPU6502op[0xBF] = function(m) { m.aby(); m.lax(); };

/*  CPY imm */ CPU6502op[0xC0] = function(m) { m.imm(); m.cpy(); };
/*  CMP izx */ CPU6502op[0xC1] = function(m) { m.izx(); m.cmp(); };
/* *NOP imm */ CPU6502op[0xC2] = function(m) { m.imm(); m.nop(); };
/* *DCP izx */ CPU6502op[0xC3] = function(m) { m.izx(); m.dcp(); m.rmw(); };
/*  CPY zp  */ CPU6502op[0xC4] = function(m) { m.zp(); m.cpy(); };
/*  CMP zp  */ CPU6502op[0xC5] = function(m) { m.zp(); m.cmp(); };
/*  DEC zp  */ CPU6502op[0xC6] = function(m) { m.zp(); m.dec(); m.rmw(); };
/* *DCP zp  */ CPU6502op[0xC7] = function(m) { m.zp(); m.dcp(); m.rmw(); };
/*  INY     */ CPU6502op[0xC8] = function(m) { m.imp(); m.iny(); };
/*  CMP imm */ CPU6502op[0xC9] = function(m) { m.imm(); m.cmp(); };
/*  DEX     */ CPU6502op[0xCA] = function(m) { m.imp(); m.dex(); };
/* *AXS imm */ CPU6502op[0xCB] = function(m) { m.imm(); m.axs(); };
/*  CPY abs */ CPU6502op[0xCC] = function(m) { m.abs(); m.cpy(); };
/*  CMP abs */ CPU6502op[0xCD] = function(m) { m.abs(); m.cmp(); };
/*  DEC abs */ CPU6502op[0xCE] = function(m) { m.abs(); m.dec(); m.rmw(); };
/* *DCP abs */ CPU6502op[0xCF] = function(m) { m.abs(); m.dcp(); m.rmw(); };

/*  BNE rel */ CPU6502op[0xD0] = function(m) { m.rel(); m.bne(); };
/*  CMP izy */ CPU6502op[0xD1] = function(m) { m.izy(); m.cmp(); };
/* *KIL     */ CPU6502op[0xD2] = function(m) { m.imp(); m.kil(); };
/* *DCP izy */ CPU6502op[0xD3] = function(m) { m.izy(); m.dcp(); m.rmw(); };
/* *NOP zpx */ CPU6502op[0xD4] = function(m) { m.zpx(); m.nop(); };
/*  CMP zpx */ CPU6502op[0xD5] = function(m) { m.zpx(); m.cmp(); };
/*  DEC zpx */ CPU6502op[0xD6] = function(m) { m.zpx(); m.dec(); m.rmw(); };
/* *DCP zpx */ CPU6502op[0xD7] = function(m) { m.zpx(); m.dcp(); m.rmw(); };
/*  CLD     */ CPU6502op[0xD8] = function(m) { m.imp(); m.cld(); };
/*  CMP aby */ CPU6502op[0xD9] = function(m) { m.aby(); m.cmp(); };
/* *NOP     */ CPU6502op[0xDA] = function(m) { m.imp(); m.nop(); };
/* *DCP aby */ CPU6502op[0xDB] = function(m) { m.aby(); m.dcp(); m.rmw(); };
/* *NOP abx */ CPU6502op[0xDC] = function(m) { m.abx(); m.nop(); };
/*  CMP abx */ CPU6502op[0xDD] = function(m) { m.abx(); m.cmp(); };
/*  DEC abx */ CPU6502op[0xDE] = function(m) { m.abx(); m.dec(); m.rmw(); };
/* *DCP abx */ CPU6502op[0xDF] = function(m) { m.abx(); m.dcp(); m.rmw(); };

/*  CPX imm */ CPU6502op[0xE0] = function(m) { m.imm(); m.cpx(); };
/*  SBC izx */ CPU6502op[0xE1] = function(m) { m.izx(); m.sbc(); };
/* *NOP imm */ CPU6502op[0xE2] = function(m) { m.imm(); m.nop(); };
/* *ISC izx */ CPU6502op[0xE3] = function(m) { m.izx(); m.isc(); m.rmw(); };
/*  CPX zp  */ CPU6502op[0xE4] = function(m) { m.zp(); m.cpx(); };
/*  SBC zp  */ CPU6502op[0xE5] = function(m) { m.zp(); m.sbc(); };
/*  INC zp  */ CPU6502op[0xE6] = function(m) { m.zp(); m.inc(); m.rmw(); };
/* *ISC zp  */ CPU6502op[0xE7] = function(m) { m.zp(); m.isc(); m.rmw(); };
/*  INX     */ CPU6502op[0xE8] = function(m) { m.imp(); m.inx(); };
/*  SBC imm */ CPU6502op[0xE9] = function(m) { m.imm(); m.sbc(); };
/*  NOP     */ CPU6502op[0xEA] = function(m) { m.imp(); m.nop(); };
/* *SBC imm */ CPU6502op[0xEB] = function(m) { m.imm(); m.sbc(); };
/*  CPX abs */ CPU6502op[0xEC] = function(m) { m.abs(); m.cpx(); };
/*  SBC abs */ CPU6502op[0xED] = function(m) { m.abs(); m.sbc(); };
/*  INC abs */ CPU6502op[0xEE] = function(m) { m.abs(); m.inc(); m.rmw(); };
/* *ISC abs */ CPU6502op[0xEF] = function(m) { m.abs(); m.isc(); m.rmw(); };

/*  BEQ rel */ CPU6502op[0xF0] = function(m) { m.rel(); m.beq(); };
/*  SBC izy */ CPU6502op[0xF1] = function(m) { m.izy(); m.sbc(); };
/* *KIL     */ CPU6502op[0xF2] = function(m) { m.imp(); m.kil(); };
/* *ISC izy */ CPU6502op[0xF3] = function(m) { m.izy(); m.isc(); m.rmw(); };
/* *NOP zpx */ CPU6502op[0xF4] = function(m) { m.zpx(); m.nop(); };
/*  SBC zpx */ CPU6502op[0xF5] = function(m) { m.zpx(); m.sbc(); };
/*  INC zpx */ CPU6502op[0xF6] = function(m) { m.zpx(); m.inc(); m.rmw(); };
/* *ISC zpx */ CPU6502op[0xF7] = function(m) { m.zpx(); m.isc(); m.rmw(); };
/*  SED     */ CPU6502op[0xF8] = function(m) { m.imp(); m.sed(); };
/*  SBC aby */ CPU6502op[0xF9] = function(m) { m.aby(); m.sbc(); };
/* *NOP     */ CPU6502op[0xFA] = function(m) { m.imp(); m.nop(); };
/* *ISC aby */ CPU6502op[0xFB] = function(m) { m.aby(); m.isc(); m.rmw(); };
/* *NOP abx */ CPU6502op[0xFC] = function(m) { m.abx(); m.nop(); };
/*  SBC abx */ CPU6502op[0xFD] = function(m) { m.abx(); m.sbc(); };
/*  INC abx */ CPU6502op[0xFE] = function(m) { m.abx(); m.inc(); m.rmw(); };
/* *ISC abx */ CPU6502op[0xFF] = function(m) { m.abx(); m.isc(); m.rmw(); };

////////////////////////////////////////////////////////////////////////////////
// CPU instantiation
////////////////////////////////////////////////////////////////////////////////

var cpu = new CPU6502();
var timerId;
var cpuSpeed = 400;

function random(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}

cpu.read = function(addr) {
	if(addr == 0xFFF9){
		if(consoleBuffer.length > 0){
			RAM[0xFFF9] = consoleBuffer.charCodeAt(0);
			consoleBuffer = consoleBuffer.substring(1);
		}
		else
			RAM[0xFFF9] = 0;
	}
	return RAM[addr & 0xFFFF];
}

cpu.write = function(addr, value) {
	RAM[addr & 0xFFFF] = value;
	RAM[0xFE] = random(0,255);
	if ((addr >= 0x200) && (addr <= 0x5ff)) {
        display.updateHighPixel(addr);
      }
    else if ((addr >= 0x9000) && (addr <= 0xE000)) {
        display.updatePixel(addr);
	}
	else if(addr == 0xfff8){
		outputToConsole(value);
	}
}

function run(){
	for(var i=0;i<cpuSpeed;i++)
		cpu.step();
	debug();
	clearTimeout(timerId);
	if(RAM[0xFC] > 0)
		RAM[0xFC]--;
	RAM[0xFF] = globalKey;
	timerId = setTimeout(function() { run() }, 16);
}

function stop(){
	clearTimeout(timerId);
	debug();
}