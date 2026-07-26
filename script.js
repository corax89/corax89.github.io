// ================================================================
// 6502 constants (matching C assembler.h)
// ================================================================
var PROGRAM_ADDR = 0x0600;

// ================================================================
// i18n — Internationalization
// ================================================================
var currentLang = 'ru';
var LANG_KEY = 'easy6502_lang';

var I18N = {
    ru: {
        // Toolbar
        assemble: 'Собрать',
        run: 'Запуск',
        pause: 'Пауза',
        reset: 'Сброс',
        step: 'Шаг',
        hexdump: 'Hexdump',
        disasm: 'Дизассемблер',
        clearBps: '\u274c Очистить точки',
        clearBpsTitle: 'Убрать все точки останова',
        speed: 'Скорость:',
        speedTitle: 'Тактов на кадр (30 кадров/с)',
        calc: 'Калькулятор',
        help: 'Справка',
        hide: 'Скрыть',
        resetLayout: '\u21b4 Сброс макета',
        resetLayoutTitle: 'Сбросить размеры панелей',
        langBtn: 'EN',
        // Defines
        defines: 'Определения',
        colName: 'Имя',
        colAddr: 'Адрес',
        colVal: 'Знач',
        colDec: 'Дес',
        colBin: 'Двоич',
        colColor: 'Цвет',
        // Messages
        msgWelcome: '\u2728 Добро пожаловать! Напишите код и нажмите Собрать.',
        msgAssembled: '\u2705 Собрано успешно.',
        msgStopped: '\u23f0 Остановлено после {0} \u0448\u0430\u0433\u043e\u0432',
        msgPause: '\u23f8 \u041f\u0430\u0443\u0437\u0430 \u043d\u0430 \u0448\u0430\u0433\u0435 {0} \u2014 PC={1}',
        msgBreakpoint: '\ud83d\udeab \u0422\u043e\u0447\u043a\u0430 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u0430 \u043d\u0430 \u0448\u0430\u0433\u0435 {0} \u2014 PC={1}',
        msgOpcode: '\u26a0\ufe0f \u041e\u043f\u043a\u043e\u0434 {0} [{1}] \u043f\u043e \u0430\u0434\u0440\u0435\u0441\u0443 {2}',
        msgBrk: '\ud83d\ude91 BRK \u043d\u0430 {0}',
        msgBrkShort: '\ud83d\ude91 BRK',
        msgPcRange: '\u26a0\ufe0f PC \u0432\u043d\u0435 \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430: {0} (\u043f\u043e\u0441\u043b\u0435 {1})',
        msgHalted: '\u23f9 \u041f\u0440\u043e\u0446\u0435\u0441\u0441\u043e\u0440 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d',
        msgHaltedBrk: '\u23f9 \u041f\u0440\u043e\u0446\u0435\u0441\u0441\u043e\u0440 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d (BRK). \u041d\u0430\u0436\u043c\u0438\u0442\u0435 Reset.',
        msgSteps: '\u23f1 \u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u043e {0} \u0448\u0430\u0433\u043e\u0432... PC={1}',
        msgReset: '\ud83d\udd04 \u0421\u0431\u0440\u043e\u0448\u0435\u043d\u043e',
        msgStep: '\u23ed ',
        msgAssembleFirst: '\u26a0\ufe0f \u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0441\u043e\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043e\u0434 (\u0421\u043e\u0431\u0440\u0430\u0442\u044c)',
        msgWrite: '\ud83d\udcdd \u0417\u0430\u043f\u0438\u0441\u044c {0} \u0438\u0437 {1} \u2192 {2}',
        msgRead: '\ud83d\udcd6 \u0427\u0442\u0435\u043d\u0438\u0435 {0} \u2192 {1}',
        msgAtLine: ' (\u0441\u0442\u0440\u043e\u043a\u0430 {0})',
        msgJsrAtLine: '\nJSR \u043d\u0430 \u0441\u0442\u0440\u043e\u043a\u0435 {0}',
        // Calculator
        calcTitle: 'Калькулятор',
        // Modals
        hexdumpTitle: 'Hexdump',
        disasmTitle: 'Дизассемблер',
        // Help panel
        helpTitle: '\ud83d\udcd6 \u0421\u043f\u0440\u0430\u0432\u043e\u0447\u043d\u0438\u043a 6502',
        helpRegsTitle: '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u044b \u0438 \u0444\u043b\u0430\u0433\u0438',
        helpRegA: '\u0410\u043a\u043a\u0443\u043c\u0443\u043b\u044f\u0442\u043e\u0440,',
        helpRegXY: '\u0438\u043d\u0434\u0435\u043a\u0441\u043d\u044b\u0435',
        helpRegSP: '\u0441\u0442\u0435\u043a,',
        helpRegPC: '\u0441\u0447\u0451\u0442\u0447\u0438\u043a',
        helpFlags: '\u0424\u043b\u0430\u0433\u0438:',
        helpMnemonics: '\u0412\u0441\u0435 \u043c\u043d\u0435\u043c\u043e\u043d\u0438\u043a\u0438',
        helpBpTitle: '\u0422\u043e\u0447\u043a\u0438 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u0430',
        helpBp1: '\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0430 \u043d\u043e\u043c\u0435\u0440 \u0441\u0442\u0440\u043e\u043a\u0438 \u0432 gutter \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c/\u0443\u0431\u0440\u0430\u0442\u044c \u0442\u043e\u0447\u043a\u0443',
        helpBp2: '\u041f\u0440\u0438 Run \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0441\u044f \u043f\u0435\u0440\u0435\u0434 \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435\u043c \u0441\u0442\u0440\u043e\u043a\u0438 \u0441 \u0442\u043e\u0447\u043a\u043e\u0439',
        helpBp3: '\u041a\u043d\u043e\u043f\u043a\u0430 \u274c Clear BPs \u0443\u0431\u0438\u0440\u0430\u0435\u0442 \u0432\u0441\u0435 \u0442\u043e\u0447\u043a\u0438',
        helpBasedOn: '\u041e\u0441\u043d\u043e\u0432\u0430\u043d\u043e \u043d\u0430',
        // DescribeOpcode
        opLdaImm: '\u0412 A \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0447\u0438\u0441\u043b\u043e {0} ({1})',
        opLdaMem: '\u0412 A \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438\u0437 \u044f\u0447\u0435\u0439\u043a\u0438 {0}',
        opLdaMemX: '\u0412 A \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438\u0437 \u044f\u0447\u0435\u0439\u043a\u0438 {0} ({1})',
        opLdxImm: '\u0412 X \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0447\u0438\u0441\u043b\u043e {0}',
        opLdxMem: '\u0412 X \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438\u0437 \u044f\u0447\u0435\u0439\u043a\u0438 {0}',
        opLdyImm: '\u0412 Y \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0447\u0438\u0441\u043b\u043e {0}',
        opLdyMem: '\u0412 Y \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0438\u0437 \u044f\u0447\u0435\u0439\u043a\u0438 {0}',
        opStaA: 'A ({0}) \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u044f\u0447\u0435\u0439\u043a\u0443 {1}',
        opSta: 'A \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u044f\u0447\u0435\u0439\u043a\u0443 {0} ({1})',
        opStxA: 'X ({0}) \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u044f\u0447\u0435\u0439\u043a\u0443 {1}',
        opStx: 'X \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u044f\u0447\u0435\u0439\u043a\u0443 {0}',
        opStyA: 'Y ({0}) \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u044f\u0447\u0435\u0439\u043a\u0443 {1}',
        opSty: 'Y \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u044f\u0447\u0435\u0439\u043a\u0443 {0}',
        opAdcImm: '\u041a A \u043f\u0440\u0438\u0431\u0430\u0432\u043b\u0435\u043d\u043e \u0447\u0438\u0441\u043b\u043e {0} (\u0441 \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u043e\u043c)',
        opAdcMem: '\u041a A \u043f\u0440\u0438\u0431\u0430\u0432\u043b\u0435\u043d\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 {0} \u0438\u0437 \u044f\u0447\u0435\u0439\u043a\u0438 {1}',
        opSbcImm: '\u0418\u0437 A \u0432\u044b\u0447\u0442\u0435\u043d\u043e \u0447\u0438\u0441\u043b\u043e {0} (\u0441 \u0437\u0430\u0451\u043c\u043e\u043c)',
        opAnd: 'A AND {0} ({1})',
        opOra: 'A OR {0} ({1})',
        opEor: 'A XOR {0} ({1})',
        opCmp: '\u0421\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0435 A \u0441 \u0447\u0438\u0441\u043b\u043e\u043c {0}',
        opCpx: '\u0421\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0435 X \u0441 \u0447\u0438\u0441\u043b\u043e\u043c {0}',
        opCpy: '\u0421\u0440\u0430\u0432\u043d\u0435\u043d\u0438\u0435 Y \u0441 \u0447\u0438\u0441\u043b\u043e\u043c {0}',
        opInc: '\u0418\u043d\u043a\u0440\u0435\u043c\u0435\u043d\u0442 \u044f\u0447\u0435\u0439\u043a\u0438 {0}',
        opDec: '\u0414\u0435\u043a\u0440\u0435\u043c\u0435\u043d\u0442 \u044f\u0447\u0435\u0439\u043a\u0438 {0}',
        opInx: 'X = X + 1 \u2192 {0}',
        opIny: 'Y = Y + 1 \u2192 {0}',
        opDex: 'X = X - 1 \u2192 {0}',
        opDey: 'Y = Y - 1 \u2192 {0}',
        opTax: 'A ({0}) \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d \u0432 X',
        opTay: 'A ({0}) \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d \u0432 Y',
        opTxa: 'X \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d \u0432 A',
        opTya: 'Y \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d \u0432 A',
        opTsx: 'SP \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d \u0432 X',
        opTxs: 'X \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d \u0432 SP',
        opPha: 'A ({0}) \u0437\u0430\u043f\u0438\u0441\u0430\u043d \u0432 \u0441\u0442\u0435\u043a',
        opPla: '\u0418\u0437 \u0441\u0442\u0435\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u043e \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u0435 \u0432 A',
        opPhp: '\u0424\u043b\u0430\u0433\u0438 \u0437\u0430\u043f\u0438\u0441\u0430\u043d\u044b \u0432 \u0441\u0442\u0435\u043a',
        opPlp: '\u0424\u043b\u0430\u0433\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b \u0438\u0437 \u0441\u0442\u0435\u043a\u0430',
        opJmp: '\u041f\u0440\u044b\u0436\u043e\u043a \u043d\u0430 \u0430\u0434\u0440\u0435\u0441 {0}',
        opJsr: '\u0412\u044b\u0437\u043e\u0432 \u043f\u043e\u0434\u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b \u043f\u043e \u0430\u0434\u0440\u0435\u0441\u0443 {0}',
        opRts: '\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u0438\u0437 \u043f\u043e\u0434\u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b',
        opRti: '\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u0438\u0437 \u043f\u0440\u0435\u0440\u044b\u0432\u0430\u043d\u0438\u044f',
        opBrk: '\u041f\u0440\u0435\u0440\u044b\u0432\u0430\u043d\u0438\u0435 (BRK)',
        opNop: '\u041d\u0435\u0442 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438',
        opClc: '\u0424\u043b\u0430\u0433 \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u0430 C \u0441\u0431\u0440\u043e\u0448\u0435\u043d',
        opSec: '\u0424\u043b\u0430\u0433 \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u0430 C \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d',
        opCld: '\u0424\u043b\u0430\u0433 \u0434\u0435\u0441\u044f\u0442\u0438\u0447\u043d\u043e\u0433\u043e \u0440\u0435\u0436\u0438\u043c\u0430 D \u0441\u0431\u0440\u043e\u0448\u0435\u043d',
        opSed: '\u0424\u043b\u0430\u0433 \u0434\u0435\u0441\u044f\u0442\u0438\u0447\u043d\u043e\u0433\u043e \u0440\u0435\u0436\u0438\u043c\u0430 D \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d',
        opCli: '\u0424\u043b\u0430\u0433 \u0437\u0430\u043f\u0440\u0435\u0442\u0430 \u043f\u0440\u0435\u0440\u044b\u0432\u0430\u043d\u0438\u0439 I \u0441\u0431\u0440\u043e\u0448\u0435\u043d',
        opSei: '\u0424\u043b\u0430\u0433 \u0437\u0430\u043f\u0440\u0435\u0442\u0430 \u043f\u0440\u0435\u0440\u044b\u0432\u0430\u043d\u0438\u0439 I \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d',
        opClv: '\u0424\u043b\u0430\u0433 \u043f\u0435\u0440\u0435\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u044f V \u0441\u0431\u0440\u043e\u0448\u0435\u043d',
        opAsl: '\u0421\u0434\u0432\u0438\u0433 {0} \u0432\u043b\u0435\u0432\u043e \u043d\u0430 1 \u0431\u0438\u0442',
        opLsr: '\u0421\u0434\u0432\u0438\u0433 {0} \u0432\u043f\u0440\u0430\u0432\u043e \u043d\u0430 1 \u0431\u0438\u0442',
        opRol: '\u0426\u0438\u043a\u043b\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0441\u0434\u0432\u0438\u0433 {0} \u0432\u043b\u0435\u0432\u043e',
        opRor: '\u0426\u0438\u043a\u043b\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0441\u0434\u0432\u0438\u0433 {0} \u0432\u043f\u0440\u0430\u0432\u043e',
        opBit: '\u0422\u0435\u0441\u0442 \u0431\u0438\u0442\u043e\u0432 A \u0438 \u0437\u043d\u0430\u0447\u0435\u043d\u0438\u044f',
        opBcc: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 C=0',
        opBcs: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 C=1',
        opBeq: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 Z=1 (\u0440\u0430\u0432\u043d\u043e)',
        opBne: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 Z=0 (\u043d\u0435 \u0440\u0430\u0432\u043d\u043e)',
        opBmi: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 N=1 (\u043e\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435)',
        opBpl: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 N=0 (\u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435)',
        opBvc: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 V=0',
        opBvs: '\u041f\u0435\u0440\u0435\u0445\u043e\u0434 \u0435\u0441\u043b\u0438 V=1',
        // Mnemonics
        m_ADC: '\u0441\u043b\u043e\u0436\u0435\u043d\u0438\u0435', m_AND: '\u0418', m_ASL: '\u0441\u0434\u0432\u0438\u0433 \u0432\u043b\u0435\u0432\u043e',
        m_BIT: '\u0442\u0435\u0441\u0442', m_CMP: '\u0441\u0440\u0430\u0432\u043d\u0438\u0442\u044c A', m_CPX: '\u0441\u0440\u0430\u0432\u043d\u0438\u0442\u044c X',
        m_CPY: '\u0441\u0440\u0430\u0432\u043d\u0438\u0442\u044c Y', m_DEC: '\u0434\u0435\u043a\u0440\u0435\u043c\u0435\u043d\u0442', m_EOR: 'XOR',
        m_INC: '\u0438\u043d\u043a\u0440\u0435\u043c\u0435\u043d\u0442', m_JMP: '\u043f\u0440\u044b\u0436\u043e\u043a', m_JSR: '\u043f\u043e\u0434\u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430',
        m_LDA: '\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c A', m_LDX: '\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c X', m_LDY: '\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c Y',
        m_LSR: '\u0441\u0434\u0432\u0438\u0433 \u0432\u043f\u0440\u0430\u0432\u043e', m_ORA: '\u0418\u041b\u0418', m_PHA: 'push A',
        m_PHP: 'push \u0444\u043b\u0430\u0433\u0438', m_PLA: 'pop A', m_PLP: 'pop \u0444\u043b\u0430\u0433\u0438',
        m_ROL: '\u0446\u0438\u043a\u043b\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0432\u043b\u0435\u0432\u043e', m_ROR: '\u0446\u0438\u043a\u043b\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u0432\u043f\u0440\u0430\u0432\u043e',
        m_RTI: '\u0432\u043e\u0437\u0432\u0440\u0430\u0442 \u0438\u0437 IRQ', m_RTS: '\u0432\u043e\u0437\u0432\u0440\u0430\u0442', m_SBC: '\u0432\u044b\u0447\u0438\u0442\u0430\u043d\u0438\u0435',
        m_STA: '\u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c A', m_STX: '\u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c X', m_STY: '\u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c Y',
        // Info canvas
        descAccumulator: '\u0410\u043a\u043a\u0443\u043c\u0443\u043b\u044f\u0442\u043e\u0440', descIndexX: '\u0418\u043d\u0434\u0435\u043a\u0441 X', descIndexY: '\u0418\u043d\u0434\u0435\u043a\u0441 Y',
        descStackPtr: '\u0423\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u044c \u0441\u0442\u0435\u043a\u0430', descProgCtr: '\u0421\u0447\u0451\u0442\u0447\u0438\u043a \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b',
        flagNegative: '\u041e\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435', flagOverflow: '\u041f\u0435\u0440\u0435\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435', flagBreak: '\u041f\u0440\u0435\u0440\u044b\u0432\u0430\u043d\u0438\u0435',
        flagDecimal: '\u0414\u0435\u0441\u044f\u0442\u0438\u0447\u043d\u044b\u0439', flagInterrupt: '\u0417\u0430\u043f\u0440\u0435\u0442 \u043f\u0440\u0435\u0440\u044b\u0432\u0430\u043d\u0438\u0439', flagZero: '\u041d\u043e\u043b\u044c', flagCarry: '\u041f\u0435\u0440\u0435\u043d\u043e\u0441',
        descNegBit7: 'Bit 7 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0430', descSignedOvf: '\u041f\u0435\u0440\u0435\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435 \u043f\u043e \u0437\u043d\u0430\u043a\u0443',
        descBrkInstr: '\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u044f BRK', descBcd: '\u0410\u0440\u0438\u0444\u043c\u0435\u0442\u0438\u043a\u0430 BCD', descIrqDis: '\u0417\u0430\u043f\u0440\u0435\u0442 IRQ',
        descResultZero: '\u0420\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 = 0', descCarryBorrow: '\u041f\u0435\u0440\u0435\u043d\u043e\u0441/\u0437\u0430\u0439\u043c',
    },
    en: {
        // Toolbar
        assemble: 'Assemble',
        run: 'Run',
        pause: 'Pause',
        reset: 'Reset',
        step: 'Step',
        hexdump: 'Hexdump',
        disasm: 'Disasm',
        clearBps: '\u274c Clear BPs',
        clearBpsTitle: 'Clear all breakpoints',
        speed: 'Speed:',
        speedTitle: 'Ticks per frame (30 fps)',
        calc: 'Calc',
        help: 'Help',
        hide: 'Hide',
        resetLayout: '\u21b4 Reset Layout',
        resetLayoutTitle: 'Reset panel sizes',
        langBtn: 'RU',
        // Defines
        defines: 'Defines',
        colName: 'Name',
        colAddr: 'Addr',
        colVal: 'Val',
        colDec: 'Dec',
        colBin: 'Bin',
        colColor: 'Color',
        // Messages
        msgWelcome: '\u2728 Welcome! Write code and press Assemble.',
        msgAssembled: '\u2705 Assembled successfully.',
        msgStopped: '\u23f0 Stopped after {0} steps',
        msgPause: '\u23f8 Paused at step {0} \u2014 PC={1}',
        msgBreakpoint: '\ud83d\udeab Breakpoint at step {0} \u2014 PC={1}',
        msgOpcode: '\u26a0\ufe0f Opcode {0} [{1}] at address {2}',
        msgBrk: '\ud83d\ude91 BRK at {0}',
        msgBrkShort: '\ud83d\ude91 BRK',
        msgPcRange: '\u26a0\ufe0f PC out of range: {0} (after {1})',
        msgHalted: '\u23f9 Processor halted',
        msgHaltedBrk: '\u23f9 Processor halted (BRK). Press Reset.',
        msgSteps: '\u23f1 Executed {0} steps... PC={1}',
        msgReset: '\ud83d\udd04 Reset',
        msgStep: '\u23ed ',
        msgAssembleFirst: '\u26a0\ufe0f Assemble code first',
        msgWrite: '\ud83d\udcdd Write {0} from {1} \u2192 {2}',
        msgRead: '\ud83d\udcd6 Read {0} \u2192 {1}',
        msgAtLine: ' (line {0})',
        msgJsrAtLine: '\nJSR at line {0}',
        // Calculator
        calcTitle: 'Calculator',
        // Modals
        hexdumpTitle: 'Hexdump',
        disasmTitle: 'Disassembly',
        // Help panel
        helpTitle: '\ud83d\udcd6 6502 Reference',
        helpRegsTitle: 'Registers and Flags',
        helpRegA: 'Accumulator,',
        helpRegXY: 'Index',
        helpRegSP: 'Stack,',
        helpRegPC: 'Counter',
        helpFlags: 'Flags:',
        helpMnemonics: 'All Mnemonics',
        helpBpTitle: 'Breakpoints',
        helpBp1: 'Click line number in gutter to set/remove breakpoint',
        helpBp2: 'On Run, program stops before executing a line with breakpoint',
        helpBp3: 'Button \u274c Clear BPs removes all breakpoints',
        helpBasedOn: 'Based on',
        // DescribeOpcode
        opLdaImm: 'Loaded {0} ({1}) into A',
        opLdaMem: 'Loaded value from cell {0} into A',
        opLdaMemX: 'Loaded value from cell {0} ({1}) into A',
        opLdxImm: 'Loaded {0} into X',
        opLdxMem: 'Loaded value from cell {0} into X',
        opLdyImm: 'Loaded {0} into Y',
        opLdyMem: 'Loaded value from cell {0} into Y',
        opStaA: 'A ({0}) written to cell {1}',
        opSta: 'A written to cell {0} ({1})',
        opStxA: 'X ({0}) written to cell {1}',
        opStx: 'X written to cell {0}',
        opStyA: 'Y ({0}) written to cell {1}',
        opSty: 'Y written to cell {0}',
        opAdcImm: 'Added {0} to A (with carry)',
        opAdcMem: 'Added {0} from cell {1} to A',
        opSbcImm: 'Subtracted {0} from A (with borrow)',
        opAnd: 'A AND {0} ({1})',
        opOra: 'A OR {0} ({1})',
        opEor: 'A XOR {0} ({1})',
        opCmp: 'Compared A with {0}',
        opCpx: 'Compared X with {0}',
        opCpy: 'Compared Y with {0}',
        opInc: 'Increment cell {0}',
        opDec: 'Decrement cell {0}',
        opInx: 'X = X + 1 \u2192 {0}',
        opIny: 'Y = Y + 1 \u2192 {0}',
        opDex: 'X = X - 1 \u2192 {0}',
        opDey: 'Y = Y - 1 \u2192 {0}',
        opTax: 'A ({0}) copied to X',
        opTay: 'A ({0}) copied to Y',
        opTxa: 'X copied to A',
        opTya: 'Y copied to A',
        opTsx: 'SP copied to X',
        opTxs: 'X copied to SP',
        opPha: 'A ({0}) pushed to stack',
        opPla: 'Pulled value from stack into A',
        opPhp: 'Flags pushed to stack',
        opPlp: 'Flags pulled from stack',
        opJmp: 'Jump to {0}',
        opJsr: 'Call subroutine at {0}',
        opRts: 'Return from subroutine',
        opRti: 'Return from interrupt',
        opBrk: 'Interrupt (BRK)',
        opNop: 'No operation',
        opClc: 'Carry flag C cleared',
        opSec: 'Carry flag C set',
        opCld: 'Decimal mode D cleared',
        opSed: 'Decimal mode D set',
        opCli: 'Interrupt disable I cleared',
        opSei: 'Interrupt disable I set',
        opClv: 'Overflow flag V cleared',
        opAsl: 'Shift {0} left 1 bit',
        opLsr: 'Shift {0} right 1 bit',
        opRol: 'Rotate {0} left',
        opRor: 'Rotate {0} right',
        opBit: 'Test bits of A and value',
        opBcc: 'Branch if C=0',
        opBcs: 'Branch if C=1',
        opBeq: 'Branch if Z=1 (equal)',
        opBne: 'Branch if Z=0 (not equal)',
        opBmi: 'Branch if N=1 (negative)',
        opBpl: 'Branch if N=0 (positive)',
        opBvc: 'Branch if V=0',
        opBvs: 'Branch if V=1',
        // Mnemonics
        m_ADC: 'add', m_AND: 'AND', m_ASL: 'shift left',
        m_BIT: 'test', m_CMP: 'compare A', m_CPX: 'compare X',
        m_CPY: 'compare Y', m_DEC: 'decrement', m_EOR: 'XOR',
        m_INC: 'increment', m_JMP: 'jump', m_JSR: 'subroutine',
        m_LDA: 'load A', m_LDX: 'load X', m_LDY: 'load Y',
        m_LSR: 'shift right', m_ORA: 'OR', m_PHA: 'push A',
        m_PHP: 'push flags', m_PLA: 'pop A', m_PLP: 'pop flags',
        m_ROL: 'rotate left', m_ROR: 'rotate right',
        m_RTI: 'return IRQ', m_RTS: 'return', m_SBC: 'subtract',
        m_STA: 'store A', m_STX: 'store X', m_STY: 'store Y',
        // Info canvas
        descAccumulator: 'Accumulator', descIndexX: 'Index X', descIndexY: 'Index Y',
        descStackPtr: 'Stack Pointer', descProgCtr: 'Program Counter',
        flagNegative: 'Negative', flagOverflow: 'Overflow', flagBreak: 'Break',
        flagDecimal: 'Decimal', flagInterrupt: 'Interrupt', flagZero: 'Zero', flagCarry: 'Carry',
        descNegBit7: 'Bit 7 of result', descSignedOvf: 'Signed overflow', descBrkInstr: 'BRK instruction',
        descBcd: 'BCD arithmetic', descIrqDis: 'IRQ disable', descResultZero: 'Result is zero',
        descCarryBorrow: 'Carry/borrow',
    }
};

function t(key) {
    var lang = I18N[currentLang] || I18N.ru;
    return lang[key] !== undefined ? lang[key] : key;
}

function tf(key) {
    var args = Array.prototype.slice.call(arguments, 1);
    var s = t(key);
    for (var i = 0; i < args.length; i++) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'g'), args[i]);
    }
    return s;
}

function applyLanguage() {
    document.getElementById('htmlRoot').setAttribute('lang', currentLang);
    // Toolbar buttons
    var el;
    el = document.getElementById('assembleBtn'); if (el) el.textContent = t('assemble');
    el = document.getElementById('runBtn'); if (el) el.textContent = t('run');
    el = document.getElementById('resetBtn'); if (el) el.textContent = t('reset');
    el = document.getElementById('stepBtn'); if (el) el.textContent = t('step');
    el = document.getElementById('hexdumpBtn'); if (el) el.textContent = t('hexdump');
    el = document.getElementById('disasmBtn'); if (el) el.textContent = t('disasm');
    el = document.getElementById('clearBpBtn'); if (el) { el.innerHTML = t('clearBps'); el.title = t('clearBpsTitle'); }
    el = document.getElementById('speedLabel'); if (el) { el.textContent = t('speed'); el.title = t('speedTitle'); }
    el = document.getElementById('calcBtn'); if (el) el.textContent = t('calc');
    el = document.getElementById('resetLayoutBtn'); if (el) { el.innerHTML = t('resetLayout'); el.title = t('resetLayoutTitle'); }
    el = document.getElementById('toggleHelp'); if (el) {
        var hp = document.getElementById('helpPanel');
        el.textContent = (hp && !hp.classList.contains('hidden')) ? t('hide') : t('help');
    }
    el = document.getElementById('langBtn'); if (el) el.textContent = t('langBtn');
    // Defines
    el = document.querySelector('.defines-header'); if (el) el.textContent = t('defines');
    var cols = document.querySelectorAll('.defines-col-header span');
    if (cols.length >= 6) {
        cols[0].textContent = t('colName'); cols[1].textContent = t('colAddr');
        cols[2].textContent = t('colVal'); cols[3].textContent = t('colDec');
        cols[4].textContent = t('colBin'); cols[5].textContent = t('colColor');
    }
    // Defines empty state
    var dl = document.getElementById('definesList');
    if (dl) dl.setAttribute('data-empty-text', currentLang === 'ru' ? 'Нет определений' : 'No defines');
    _lastDefinesJson = '';
    updateDefinesPanel();
    // Calculator
    el = document.querySelector('#calcModal .modal-title'); if (el) el.textContent = t('calcTitle');
    // Modals
    el = document.querySelector('#hexdumpModal .modal-title'); if (el) el.textContent = t('hexdumpTitle');
    el = document.querySelector('#disasmModal .modal-title'); if (el) el.textContent = t('disasmTitle');
    // Help panel
    _updateHelpPanel();
    // Info canvas
    drawInfo();
}

function _updateHelpPanel() {
    var hp = document.getElementById('helpPanel');
    if (!hp) return;
    var mn = function(k) { return '<span>' + k + ' \u2013 ' + t('m_' + k) + '</span>'; };
    var mArr = ['ADC','AND','ASL','BCC','BCS','BEQ','BIT','BMI','BNE','BPL','BRK','BVC','BVS','CLC','CLD','CLI','CLV','CMP','CPX','CPY','DEC','DEX','DEY','EOR','INC','INX','INY','JMP','JSR','LDA','LDX','LDY','LSR','NOP','ORA','PHA','PHP','PLA','PLP','ROL','ROR','RTI','RTS','SBC','SEC','SED','SEI','STA','STX','STY','TAX','TAY','TSX','TXA','TXS','TYA'];
    var mnHtml = '';
    for (var i = 0; i < mArr.length; i++) mnHtml += mn(mArr[i]);
    hp.innerHTML =
        '<h2>' + t('helpTitle') + '</h2>' +
        '<h3>' + t('helpRegsTitle') + '</h3>' +
        '<ul>' +
        '<li><code>A</code> \u2013 ' + t('helpRegA') + ' <code>X,Y</code> \u2013 ' + t('helpRegXY') + '</li>' +
        '<li><code>SP</code> \u2013 ' + t('helpRegSP') + ' <code>PC</code> \u2013 ' + t('helpRegPC') + '</li>' +
        '<li>' + t('helpFlags') + ' <code>N V B D I Z C</code></li>' +
        '</ul>' +
        '<h3>' + t('helpMnemonics') + '</h3>' +
        '<div class="instr-grid">' + mnHtml + '</div>' +
        '<h3>' + t('helpBpTitle') + '</h3>' +
        '<ul>' +
        '<li>' + t('helpBp1') + '</li>' +
        '<li>' + t('helpBp2') + '</li>' +
        '<li>' + t('helpBp3') + '</li>' +
        '</ul>' +
        '<p style="font-size:11px; color:var(--text-muted); margin-top:10px;">' + t('helpBasedOn') + ' <a href="https://skilldrick.github.io/easy6502/" target="_blank" style="color:var(--accent);">Easy6502</a>.</p>';
}

// ================================================================
// UI
// ================================================================
var cpu = new CPU();
var editor = null;
var isDebug = true;
var isRunning = false;
var pauseRequested = false;
var codeDirty = true;
var currentTheme = 'light';
var stepTimer = null;
var errorLine = null;
var currentPCLine = null;
var prevStepPC = PROGRAM_ADDR; // PC инструкции, которая выполняется
var addrToLineMap = null;
var lineToBytesMap = null;
var memBase = PROGRAM_ADDR; // базовый адрес таблицы памяти
var memBasePinned = false;  // закреплён ли начальный адрес
var breakpoints = {};       // line number (0-based) -> true

// Палитра экрана easy6502 (для рамок ячеек экрана)
var SCREEN_PALETTE = [
    [0,0,0],[255,255,255],[255,0,0],[0,255,255],[255,0,255],
    [0,255,0],[0,0,255],[255,255,0],[255,165,0],[139,69,19],
    [255,100,100],[100,100,100],[180,180,180],[100,255,100],
    [100,100,255],[200,200,200]
];

// Автопрокрутка таблицы памяти к адресу (только при записи данных)
var memGridCols = 16, memGridRows = 8;
function scrollToAddr(addr, isWrite) {
    if (!isWrite) return; // не скроллим при чтении (может быть immediate-операнд)
    if (memBasePinned) return; // адрес закреплён
    var memEnd = memBase + memGridCols * memGridRows;
    if (addr >= memBase && addr < memEnd) return; // уже видно
    memBase = addr - (addr % memGridCols);
    memBase = Math.max(0, Math.min(memBase, 0xFF00));
}

var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d');

// --- Keyboard input → $FF (easy6502 convention) ---
var keyOverlay = document.getElementById('keyOverlay');
var keyOverlayMobile = document.getElementById('keyOverlayMobile');

// Map e.code to English character (ignores keyboard layout)
function codeToChar(code) {
    if (/^Key([A-Z])$/.test(code)) return code.charAt(3).toLowerCase();
    if (/^Digit([0-9])$/.test(code)) return code.charAt(5);
    if (code === 'Space') return ' ';
    if (code === 'Enter') return '\n';
    if (code === 'Escape') return '\x1B';
    if (code === 'ArrowUp') return 'w';
    if (code === 'ArrowDown') return 's';
    if (code === 'ArrowLeft') return 'a';
    if (code === 'ArrowRight') return 'd';
    return '';
}

function showKeyOverlay(ch) {
    if (ch) {
        if (keyOverlay) { keyOverlay.textContent = ch; keyOverlay.classList.add('visible'); }
        if (keyOverlayMobile) { keyOverlayMobile.textContent = ch; keyOverlayMobile.classList.add('visible'); }
    }
}
function hideKeyOverlay() {
    if (keyOverlay) keyOverlay.classList.remove('visible');
    if (keyOverlayMobile) keyOverlayMobile.classList.remove('visible');
}

document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    var ch = codeToChar(e.code);
    if (cpu && !cpu.halted && ch) {
        cpu.memory[0xFF] = ch.charCodeAt(0);
        showKeyOverlay(ch);
    }
});
document.addEventListener('keyup', function(e) {
    if (cpu) cpu.memory[0xFF] = 0;
    hideKeyOverlay();
});

var infoCanvas = document.getElementById('infoCanvas');
var infoCtx = infoCanvas.getContext('2d');
var msgDiv = document.getElementById('messages');

var INFO_W = 1000,
    INFO_H = 280;
function initInfoCanvas() {
    var rect = infoCanvas.parentElement ? infoCanvas.parentElement.getBoundingClientRect() : null;
    var containerW = rect ? rect.width : window.innerWidth;
    if (containerW < 600) {
        INFO_W = Math.max(320, containerW - 20);
        INFO_H = Math.round(INFO_W * 0.38);
    } else {
        INFO_W = 1000;
        INFO_H = 280;
    }
    var dpr = window.devicePixelRatio || 1;
    infoCanvas.width = INFO_W * dpr;
    infoCanvas.height = INFO_H * dpr;
    infoCtx.setTransform(1, 0, 0, 1, 0, 0);
    infoCtx.scale(dpr, dpr);
}
initInfoCanvas();
window.addEventListener('resize', function() { initInfoCanvas(); drawInfo(); });

// --- Анимация ---
var anim = {
    active: false,
    fromX: 0,
    fromY: 0,
    toX: 0,
    toY: 0,
    value: 0,
    progress: 0,
    duration: 500,
    startTime: 0,
    regLabel: '',
    fromAddr: null,
    toAddr: null,
    flagAnim: null // { flag: 'C', set: true, progress: 0, phase: 0 }
};
var animQueue = []; // очередь анимаций
var _lastStepTime = 0;
var _fastStep = false;

// Хранилище позиций элементов на infoCanvas (заполняется в drawInfo)
var posCache = { regs: {}, memCells: {}, flags: {} };

function startAnimation(fromX, fromY, toX, toY, value, regLabel, flagName, flagSet) {
    if (anim.active) {
        // Если анимация уже идёт — ставим в очередь
        animQueue.push({ fromX: fromX, fromY: fromY, toX: toX, toY: toY, value: value, regLabel: regLabel, flagName: flagName, flagSet: flagSet });
        return;
    }
    anim.active = true;
    anim.fromX = fromX;
    anim.fromY = fromY;
    anim.toX = toX;
    anim.toY = toY;
    anim.value = value;
    anim.progress = 0;
    anim.startTime = performance.now();
    anim.regLabel = regLabel || '';
    anim.duration = _fastStep ? 80 : 500;
    requestAnimationFrame(animateFrame);
}

function animateFrame(timestamp) {
    if (!anim.active && !anim.flagAnim) return;
    if (anim.active) {
        var elapsed = timestamp - anim.startTime;
        anim.progress = Math.min(elapsed / anim.duration, 1);
        var p = anim.progress < 0.5 ? 2 * anim.progress * anim.progress : 1 - Math.pow(-2 * anim.progress + 2, 2) / 2;
        var currentX = anim.fromX + (anim.toX - anim.fromX) * p;
        var currentY = anim.fromY + (anim.toY - anim.fromY) * p;
        drawInfo(currentX, currentY);
        if (anim.progress < 1) {
            requestAnimationFrame(animateFrame);
            return;
        } else {
            anim.active = false;
            // Запускаем следующую анимацию из очереди
            if (animQueue.length > 0) {
                var next = animQueue.shift();
                anim.active = true;
                anim.fromX = next.fromX;
                anim.fromY = next.fromY;
                anim.toX = next.toX;
                anim.toY = next.toY;
                anim.value = next.value;
                anim.progress = 0;
                anim.startTime = performance.now();
                anim.regLabel = next.regLabel || '';
                // Пульс флага при приземлении
                if (next.flagName) {
                    anim.flagAnim = { flag: next.flagName, set: next.flagSet, progress: 0, phase: 0 };
                }
                requestAnimationFrame(animateFrame);
                return;
            }
        }
    }
    if (anim.flagAnim) {
        anim.flagAnim.progress += 0.025;
        anim.flagAnim.phase += 0.08;
        if (anim.flagAnim.progress >= 1) {
            anim.flagAnim = null;
        }
        drawInfo();
        if (anim.flagAnim) {
            requestAnimationFrame(animateFrame);
            return;
        }
    }
    drawInfo();
}

// --- Отрисовка infoCanvas ---
var _themeCache = {};
var _themeCacheKey = '';
function getThemeColor(name) {
    var key = currentTheme;
    if (_themeCacheKey !== key) {
        _themeCache = {};
        _themeCacheKey = key;
    }
    if (!_themeCache[name]) {
        _themeCache[name] = getComputedStyle(document.body).getPropertyValue(name).trim();
    }
    return _themeCache[name];
}

function drawInfo(flyX, flyY) {
    var ctx = infoCtx;
    var w = INFO_W, h = INFO_H;
    ctx.clearRect(0, 0, w, h);

    // Scale factor for narrow screens
    var s = Math.min(1, w / 1000);
    _MEM_CELL_PX = Math.round(28 * s);
    MEM_LEFT = Math.round(500 * s);
    MEM_TOP = Math.round(25 * s);
    CELL_SIZE = Math.round(24 * s);
    CELL_GAP = Math.round(4 * s);

    // Читаем текущие цвета из CSS-переменных
    var cPanel = getThemeColor('--bg-panel');
    var cBorder = getThemeColor('--border');
    var cText = getThemeColor('--text');
    var cLabel = getThemeColor('--text-label');
    var cMemCell = getThemeColor('--mem-cell');
    var cMemText = getThemeColor('--mem-text');
    var cMemHiBg = getThemeColor('--mem-highlight-bg');
    var cMemHiText = getThemeColor('--mem-highlight-text');
    var cFlagOn = getThemeColor('--flag-on');
    var cFlagOff = getThemeColor('--flag-off');
    var cFlagTextOn = getThemeColor('--flag-text-on');
    var cFlagTextOff = getThemeColor('--flag-text-off');
    var cBg = getThemeColor('--bg');
    var cAccent = getThemeColor('--accent');

    // ---- Регистры ----
    var regs = [
        { label: 'A', value: cpu.A, x: 40 * s, y: 25 * s, desc: t('descAccumulator') },
        { label: 'X', value: cpu.X, x: 40 * s, y: 60 * s, desc: t('descIndexX') },
        { label: 'Y', value: cpu.Y, x: 40 * s, y: 95 * s, desc: t('descIndexY') },
        { label: 'SP', value: cpu.SP, x: 40 * s, y: 130 * s, desc: t('descStackPtr') },
        { label: 'PC', value: cpu.PC, x: 40 * s, y: 165 * s, hex4: true, desc: t('descProgCtr') }
    ];
    ctx.font = 'bold ' + Math.round(16 * s) + 'px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    posCache.regs = {};
    regs.forEach(function(r) {
        var val = r.value;
        var hexStr = (r.hex4 ? '$' + val.toString(16).toUpperCase().padStart(4, '0') : '$' + val.toString(16).toUpperCase().padStart(2, '0'));
        var decStr = '(' + val + ')';
        ctx.fillStyle = cPanel;
        ctx.fillRect(r.x - 10 * s, r.y - 14 * s, 145 * s, 28 * s);
        ctx.strokeStyle = cBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x - 10 * s, r.y - 14 * s, 145 * s, 28 * s);
        ctx.fillStyle = cLabel;
        ctx.fillText(r.label + ':', r.x, r.y);
        ctx.fillStyle = cText;
        ctx.fillText(hexStr, r.x + 35 * s, r.y);
        ctx.fillStyle = cLabel;
        ctx.font = 'bold ' + Math.round(11 * s) + 'px Courier New';
        ctx.fillText(decStr, r.x + 95 * s, r.y);
        ctx.font = 'bold ' + Math.round(10 * s) + 'px Courier New';
        ctx.fillStyle = cLabel;
        ctx.fillText(r.desc, r.x + 155 * s, r.y);
        ctx.font = 'bold ' + Math.round(16 * s) + 'px Courier New';
        posCache.regs[r.label] = { x: r.x + 65 * s, y: r.y };
    });

    // ---- P-регистр (двоичный код + буквы флагов) ----
    ctx.font = 'bold ' + Math.round(14 * s) + 'px Courier New';
    ctx.fillStyle = cAccent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('P:', 40 * s, 195 * s);
    var flagLetters = ['N', 'V', '1', 'B', 'D', 'I', 'Z', 'C'];
    var flagsBin = (cpu.getFlag('N') ? '1' : '0') +
                   (cpu.getFlag('V') ? '1' : '0') +
                   '1' +
                   (cpu.getFlag('B') ? '1' : '0') +
                   (cpu.getFlag('D') ? '1' : '0') +
                   (cpu.getFlag('I') ? '1' : '0') +
                   (cpu.getFlag('Z') ? '1' : '0') +
                   (cpu.getFlag('C') ? '1' : '0');
    var binStartX = 65 * s;
    var charW = 11 * s;
    for (var bi = 0; bi < flagsBin.length; bi++) {
        var bx = binStartX + bi * charW;
        var bitSet = flagsBin[bi] === '1';
        ctx.fillStyle = bitSet ? cFlagOn : cText;
        ctx.font = 'bold ' + Math.round(16 * s) + 'px Courier New';
        ctx.fillText(flagsBin[bi], bx, 195 * s);
        ctx.fillStyle = cLabel;
        ctx.font = 'bold ' + Math.round(9 * s) + 'px Courier New';
        ctx.fillText(flagLetters[bi], bx + 2, 210 * s);
    }
    var pOutX = binStartX + flagsBin.length * charW + 6 * s, pOutY = 200 * s;

    // ---- Веер от P к флагам (тонкие нити, кривые Безье) ----
    var flagX = 300 * s, flagStartY = 25 * s, flagSpacing = 35 * s;
    // On narrow screens, stretch flags to fill canvas height
    if (w < 500) {
        flagSpacing = Math.max(20, (h - 40 * s) / 7);
        flagStartY = 20 * s;
        flagX = Math.round(w * 0.5);
    }
    var flagBoxLeft = flagX - 2;
    var flagIds = ['N', 'V', 'B', 'D', 'I', 'Z', 'C'];
    for (var fi2 = 0; fi2 < flagIds.length; fi2++) {
        var fSet = cpu.getFlag(flagIds[fi2]);
        var fy = flagStartY + fi2 * flagSpacing;
        var grad = ctx.createLinearGradient(pOutX, pOutY, flagBoxLeft, fy);
        grad.addColorStop(0, cAccent + '40');
        grad.addColorStop(0.5, cAccent + '20');
        grad.addColorStop(1, fSet ? cFlagOn + '99' : cFlagOff + '25');
        ctx.beginPath();
        ctx.moveTo(pOutX, pOutY);
        ctx.bezierCurveTo(
            pOutX + 50, pOutY,
            flagBoxLeft + 15, fy - 5,
            flagBoxLeft, fy - 4
        );
        ctx.bezierCurveTo(
            flagBoxLeft + 15, fy + 5,
            pOutX + 50, pOutY,
            pOutX, pOutY
        );
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // ---- Флаги (столбиком) ----
    var flags = [
        { id: 'N', name: t('flagNegative'), desc: t('descNegBit7') },
        { id: 'V', name: t('flagOverflow'), desc: t('descSignedOvf') },
        { id: 'B', name: t('flagBreak'), desc: t('descBrkInstr') },
        { id: 'D', name: t('flagDecimal'), desc: t('descBcd') },
        { id: 'I', name: t('flagInterrupt'), desc: t('descIrqDis') },
        { id: 'Z', name: t('flagZero'), desc: t('descResultZero') },
        { id: 'C', name: t('flagCarry'), desc: t('descCarryBorrow') }
    ];
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    posCache.flags = {};
    for (var fi = 0; fi < flags.length; fi++) {
        var f = flags[fi];
        var set = cpu.getFlag(f.id);
        var x = flagX;
        var y = flagStartY + fi * flagSpacing;
        ctx.fillStyle = set ? cFlagOn : cFlagOff;
        ctx.fillRect(x, y - 13 * s, 26 * s, 26 * s);
        ctx.fillStyle = set ? cFlagTextOn : cFlagTextOff;
        ctx.font = 'bold ' + Math.round(16 * s) + 'px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(f.id, x + 13 * s, y);
        ctx.textAlign = 'left';
        ctx.font = 'bold ' + Math.round(13 * s) + 'px Courier New';
        ctx.fillStyle = set ? cFlagOn : cText;
        ctx.fillText(f.name, x + 34 * s, y);
        ctx.font = Math.round(11 * s) + 'px Courier New';
        ctx.fillStyle = cLabel;
        ctx.fillText(f.desc, x + 34 * s, y + 14 * s);
        posCache.flags[f.id] = { x: x + 13 * s, y: y };
    }

    // ---- Память $0600-$067F (skip on narrow screens) ----
    if (w >= 500) {
    var memLeft = 500 * s, memTop = 25 * s, cellSize = 24 * s, gap = 4 * s;
    var memRows = 8, memCols = 16;
    var memWidth = memCols * (cellSize + gap) - gap;
    var memHeight = memRows * (cellSize + gap) - gap;
    ctx.fillStyle = cBg;
    ctx.fillRect(memLeft, memTop, memWidth, memHeight);

    var highlightAddr = null;
    if (anim.active && anim.toAddr !== null) highlightAddr = anim.toAddr;
    else if (cpu.lastOp && cpu.lastAddr !== null) highlightAddr = cpu.lastAddr;

    // Clip to grid area for scroll animation
    ctx.save();
    ctx.beginPath();
    ctx.rect(memLeft - 1, memTop - 1, memWidth + 2, memHeight + 2);
    ctx.clip();

    posCache.memCells = {};
    // During scroll animation, draw an extra row at the target position
    var extraRowAddr = _memScrollAnim ? _memScrollTarget : null;
    for (var row = -1; row <= memRows; row++) {
        for (var col = 0; col < memCols; col++) {
            var addr = memBase + row * memCols + col;
            // During animation, if this is the bottom row and we're scrolling down,
            // replace with the target row address
            if (_memScrollAnim && extraRowAddr !== null && row === memRows && _memScrollOffset < 0) {
                addr = extraRowAddr + col;
            }
            if (addr < 0 || addr > 0xFFFF) continue;
            var val = cpu.memory[addr];
            var x = memLeft + col * (cellSize + gap);
            var y = memTop + row * (cellSize + gap) + _memScrollOffset;
            if (y + cellSize < memTop - 2 || y > memTop + memHeight + 2) continue;
            var isHighlight = (addr === highlightAddr);
            ctx.fillStyle = isHighlight ? cMemHiBg : cMemCell;
            ctx.fillRect(x, y, cellSize, cellSize);
            if (addr >= 0x0200 && addr <= 0x05FF) {
                var pixVal = cpu.memory[addr] & 0x0F;
                var pixCol = SCREEN_PALETTE[pixVal] || [0, 0, 0];
                ctx.strokeStyle = 'rgb(' + pixCol[0] + ',' + pixCol[1] + ',' + pixCol[2] + ')';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
            }
            ctx.fillStyle = isHighlight ? cMemHiText : cMemText;
            ctx.font = 'bold 16px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val.toString(16).padStart(2, '0').toUpperCase(), x + cellSize / 2, y + cellSize / 2);
            if (y >= memTop && y < memTop + memHeight) {
                posCache.memCells[addr] = { x: x + cellSize / 2, y: y + cellSize / 2 };
            }
        }
    }
    ctx.restore();
    ctx.fillStyle = cLabel;
    ctx.font = 'bold ' + Math.round(13 * s) + 'px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('$' + memBase.toString(16).toUpperCase().padStart(4, '0') + '\u2013$' + (memBase + memRows * memCols - 1).toString(16).toUpperCase().padStart(4, '0'), memLeft, memTop - 18 * s);
    } // end if (w >= 500)

    // ---- Анимация флага (пульсирующее кольцо) ----
    if (anim.flagAnim) {
        var fa = anim.flagAnim;
        var fp = posCache.flags[fa.flag];
        if (fp) {
            var flagPulse = Math.sin(fa.phase * Math.PI * 2) * 0.5 + 0.5;
            var radius = 20 + flagPulse * 8;
            ctx.beginPath();
            ctx.arc(fp.x, fp.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = fa.set ? cFlagOn : cAccent;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1 - fa.progress;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    // ---- Летящее число с подложкой ----
    if (anim.active && flyX !== undefined && flyY !== undefined) {
        var strVal = '$' + anim.value.toString(16).toUpperCase().padStart(2, '0');
        ctx.font = 'bold ' + Math.round(28 * s) + 'px Courier New';
        var tw = ctx.measureText(strVal).width;
        var bgW = tw + 20 * s, bgH = 36 * s;
        ctx.fillStyle = cPanel;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 12 * s;
        ctx.shadowOffsetY = 4 * s;
        roundRect(ctx, flyX - bgW / 2, flyY - bgH / 2, bgW, bgH, 8 * s);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = cAccent;
        ctx.lineWidth = 2;
        roundRect(ctx, flyX - bgW / 2, flyY - bgH / 2, bgW, bgH, 8 * s);
        ctx.stroke();
        ctx.fillStyle = cAccent;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(strVal, flyX, flyY);
        if (anim.regLabel) {
            ctx.font = 'bold ' + Math.round(13 * s) + 'px Courier New';
            ctx.fillStyle = cLabel;
            ctx.fillText(anim.regLabel, flyX, flyY - bgH / 2 - 10 * s);
        }
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// --- Tooltip для ячеек памяти ---
var infoTooltip = document.getElementById('infoTooltip');
var MEM_GRID_COLS = 16, MEM_GRID_ROWS = 8;
var MEM_LEFT = 500, MEM_TOP = 25, CELL_SIZE = 24, CELL_GAP = 4;
// Updated dynamically in drawInfo based on scale

function _getMemCellAt(canvasX, canvasY) {
    var col = Math.floor((canvasX - MEM_LEFT) / (CELL_SIZE + CELL_GAP));
    var row = Math.floor((canvasY - MEM_TOP) / (CELL_SIZE + CELL_GAP));
    if (col < 0 || col >= MEM_GRID_COLS || row < 0 || row >= MEM_GRID_ROWS) return null;
    var localX = (canvasX - MEM_LEFT) - col * (CELL_SIZE + CELL_GAP);
    var localY = (canvasY - MEM_TOP) - row * (CELL_SIZE + CELL_GAP);
    if (localX < 0 || localX > CELL_SIZE || localY < 0 || localY > CELL_SIZE) return null;
    var addr = memBase + row * MEM_GRID_COLS + col;
    return addr;
}

function _isAddrInRangeTitle(canvasX, canvasY) {
    // Проверяем, попал ли клик в заголовок диапазона (text над ячейками)
    var rangeTextY = MEM_TOP - 18;
    return canvasX >= MEM_LEFT && canvasX <= MEM_LEFT + 300 && canvasY >= rangeTextY - 2 && canvasY <= rangeTextY + 16;
}

function _lookupOpcode(byteVal) {
    var info = ASSEMBLER._opcodes[byteVal];
    if (!info) return null;
    return info.name + ' (' + info.mode + ')';
}

infoCanvas.addEventListener('mousemove', function(e) {
    var rect = infoCanvas.getBoundingClientRect();
    var scaleX = infoCanvas.width / rect.width;
    var scaleY = infoCanvas.height / rect.height;
    var cx = (e.clientX - rect.left) * scaleX;
    var cy = (e.clientY - rect.top) * scaleY;
    var addr = _getMemCellAt(cx, cy);
    if (addr === null) {
        infoTooltip.style.display = 'none';
        // Проверяем, наведены ли на заголовок диапазона
        if (_isAddrInRangeTitle(cx, cy)) {
            infoCanvas.style.cursor = 'pointer';
        } else {
            infoCanvas.style.cursor = 'default';
        }
        return;
    }
    var val = cpu.memory[addr];
    var hex = '$' + val.toString(16).toUpperCase().padStart(2, '0');
    var dec = val.toString();
    var bin = val.toString(2).padStart(8, '0');
    var opcode = _lookupOpcode(val);
    var lines = [
        '<span class="tt-addr">$' + addr.toString(16).toUpperCase().padStart(4, '0') + '</span>',
        '<span class="tt-hex">' + hex + '</span>  <span class="tt-dec">(' + dec + ')</span>  <span class="tt-bin">' + bin + '</span>'
    ];
    if (opcode) lines.push('<span class="tt-opcode">' + opcode + '</span>');
    infoTooltip.innerHTML = lines.join('<br>');
    infoTooltip.style.display = 'block';
    var tx = e.clientX + 15;
    var ty = e.clientY - 10;
    infoTooltip.style.left = tx + 'px';
    infoTooltip.style.top = ty + 'px';
    infoCanvas.style.cursor = 'default';
});

infoCanvas.addEventListener('mouseleave', function() {
    infoTooltip.style.display = 'none';
});

// --- Колесико мыши — скролл ячеек памяти с анимацией ---
var _memScrollOffset = 0;
var _memScrollTarget = null;
var _memScrollAnim = null;
var _MEM_CELL_PX = 28; // updated dynamically in drawInfo

infoCanvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    var target = memBase + (e.deltaY > 0 ? 16 : -16);
    target = Math.max(0, Math.min(target, 0xFF00));
    if (target === memBase) return;
    // Cancel previous animation and reset state immediately
    if (_memScrollAnim) {
        cancelAnimationFrame(_memScrollAnim);
        _memScrollAnim = null;
        _memScrollOffset = 0;
        drawInfo();
    }
    var from = memBase;
    var startTime = performance.now();
    var duration = 150;
    function frame(now) {
        var t = Math.min((now - startTime) / duration, 1);
        t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        // Only move cells by pixel offset — memBase stays at 'from' until the end
        _memScrollOffset = (target > from) ? -t * _MEM_CELL_PX : t * _MEM_CELL_PX;
        drawInfo();
        if (t < 1) {
            _memScrollAnim = requestAnimationFrame(frame);
        } else {
            // Animation done — snap to final position
            memBase = target;
            _memScrollOffset = 0;
            _memScrollAnim = null;
            drawInfo();
        }
    }
    _memScrollAnim = requestAnimationFrame(frame);
}, { passive: false });

// --- Свайп пальцем по таблице памяти (мобильные) ---
var _touchStartY = 0;
var _touchMoved = false;
infoCanvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        _touchStartY = e.touches[0].clientY;
        _touchMoved = false;
    }
}, { passive: true });
infoCanvas.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    var dy = e.touches[0].clientY - _touchStartY;
    if (Math.abs(dy) > 10) _touchMoved = true;
    // Check if touch is over the memory grid area
    var rect = infoCanvas.getBoundingClientRect();
    var scaleX = infoCanvas.width / rect.width;
    var scaleY = infoCanvas.height / rect.height;
    var cx = (e.touches[0].clientX - rect.left) * scaleX;
    var cy = (e.touches[0].clientY - rect.top) * scaleY;
    if (cx >= 500 && cy >= 25 && cy <= 25 + 8 * 28) {
        e.preventDefault();
    }
}, { passive: false });
infoCanvas.addEventListener('touchend', function(e) {
    if (!_touchMoved) return;
    var dy = e.changedTouches[0].clientY - _touchStartY;
    if (Math.abs(dy) > 30) {
        var rows = Math.round(dy / 30);
        var target = memBase - rows * 16;
        target = Math.max(0, Math.min(target, 0xFF00));
        if (target !== memBase) {
            memBase = target;
            drawInfo();
        }
    }
}, { passive: true });

// --- Клик по диапазону адресов ---
var _addrInput = null;
var _pinBtn = null;

function _removeAddrInput() {
    if (_addrInput) { _addrInput.remove(); _addrInput = null; }
    if (_pinBtn) { _pinBtn.remove(); _pinBtn = null; }
}

function _showAddrInput() {
    _removeAddrInput();
    var rect = infoCanvas.getBoundingClientRect();
    var scaleX = rect.width / infoCanvas.width;
    var scaleY = rect.height / infoCanvas.height;
    // Позиция текста диапазона
    var inputX = MEM_LEFT * scaleX + rect.left;
    var inputY = (MEM_TOP - 22) * scaleY + rect.top;
    _addrInput = document.createElement('input');
    _addrInput.type = 'text';
    _addrInput.className = 'info-addr-input';
    _addrInput.value = '$' + memBase.toString(16).toUpperCase().padStart(4, '0');
    _addrInput.style.left = inputX + 'px';
    _addrInput.style.top = inputY + 'px';
    document.body.appendChild(_addrInput);
    _addrInput.focus();
    _addrInput.select();
    _addrInput.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') {
            var raw = _addrInput.value.trim();
            var newAddr;
            if (raw.charAt(0) === '$') newAddr = parseInt(raw.substring(1), 16);
            else if (raw.charAt(0) === '%') newAddr = parseInt(raw.substring(1), 2);
            else newAddr = parseInt(raw, 10);
            if (!isNaN(newAddr)) {
                memBase = Math.max(0, Math.min(newAddr & 0xFF00, 0xFF00));
                refreshUI();
            }
            _removeAddrInput();
        }
        if (ev.key === 'Escape') _removeAddrInput();
    });
    _addrInput.addEventListener('blur', function() {
        setTimeout(_removeAddrInput, 100);
    });
    // Кнопка pin
    _pinBtn = document.createElement('button');
    _pinBtn.className = 'info-pin-btn' + (memBasePinned ? ' pinned' : '');
    _pinBtn.textContent = memBasePinned ? 'Unpin' : 'Pin';
    _pinBtn.title = memBasePinned ? 'Unpin address' : 'Pin address';
    _pinBtn.style.left = (inputX + 88) + 'px';
    _pinBtn.style.top = inputY + 'px';
    _pinBtn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        memBasePinned = !memBasePinned;
        _pinBtn.className = 'info-pin-btn' + (memBasePinned ? ' pinned' : '');
        _pinBtn.textContent = memBasePinned ? 'Unpin' : 'Pin';
        _pinBtn.title = memBasePinned ? 'Unpin address' : 'Pin address';
    });
    document.body.appendChild(_pinBtn);
}

infoCanvas.addEventListener('click', function(e) {
    var rect = infoCanvas.getBoundingClientRect();
    var scaleX = infoCanvas.width / rect.width;
    var scaleY = infoCanvas.height / rect.height;
    var cx = (e.clientX - rect.left) * scaleX;
    var cy = (e.clientY - rect.top) * scaleY;
    if (_isAddrInRangeTitle(cx, cy)) {
        _showAddrInput();
    }
});

// --- Подсветка строки по PC ---
function highlightPCLine() {
    if (!editor || !addrToLineMap) return;
    if (currentPCLine !== null) {
        editor.removeLineClass(currentPCLine, 'background', 'pc-line');
        currentPCLine = null;
    }
    var line = addrToLineMap[prevStepPC];
    if (line !== undefined) {
        currentPCLine = line;
        editor.addLineClass(line, 'background', 'pc-line');
        requestAnimationFrame(function() {
            editor.scrollIntoView({ line: line, ch: 0 }, 80);
        });
    }
}

function clearPCLine() {
    if (currentPCLine !== null && editor) {
        editor.removeLineClass(currentPCLine, 'background', 'pc-line');
        currentPCLine = null;
    }
}

// --- Панель define ---
var definesPanelEl = null;
var _lastDefinesJson = '';
var _definePalette = [
    [0,0,0],[255,255,255],[255,0,0],[0,255,255],
    [255,0,255],[0,255,0],[0,0,255],[255,255,0],
    [255,165,0],[139,69,19],[255,100,100],[100,100,100],
    [180,180,180],[100,255,100],[100,100,255],[200,200,200]
];
function _defineColorStyle(val) {
    var c = _definePalette[val & 0x0F] || [0,0,0];
    return 'background:rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
}
function _defineColorTitle(addr, val) {
    return '$' + (addr & 0xFFFF).toString(16).toUpperCase().padStart(4, '0') + ' → color ' + (val & 0x0F);
}

function updateDefinesPanel() {
    var list = document.getElementById('definesList');
    if (!list) return;
    var defines = ASSEMBLER._defines();
    var keys = Object.keys(defines).sort();
    var json = JSON.stringify(keys.map(function(k) { return [k, defines[k]]; }));
    if (json === _lastDefinesJson) {
        for (var i = 0; i < list.children.length; i++) {
            var el = list.children[i];
            var addr = parseInt(el.dataset.addr, 10);
            if (isNaN(addr)) continue;
            var memVal = cpu.memory[addr & 0xFFFF];
            var valEl = el.querySelector('.d-val');
            if (valEl && !valEl.classList.contains('d-editing')) {
                var newVal = '$' + memVal.toString(16).toUpperCase().padStart(2, '0');
                if (valEl.textContent !== newVal) {
                    valEl.textContent = newVal;
                    valEl.classList.add('d-val-changed');
                    (function(v) {
                        setTimeout(function() { v.classList.remove('d-val-changed'); }, 300);
                    })(valEl);
                }
            }
            var decEl = el.querySelector('.d-dec');
            if (decEl) decEl.textContent = memVal;
            var binEl = el.querySelector('.d-bin');
            if (binEl && !binEl.classList.contains('d-editing')) {
                binEl.textContent = memVal.toString(2).padStart(8, '0');
            }
            var colorEl = el.querySelector('.d-color');
            if (colorEl) {
                colorEl.style.cssText = _defineColorStyle(memVal);
                colorEl.title = _defineColorTitle(addr, memVal);
            }
        }
        return;
    }
    _lastDefinesJson = json;
    list.innerHTML = '';
    for (var i = 0; i < keys.length; i++) {
        var name = keys[i];
        var dv = defines[name];
        var addr;
        if (dv.charAt(0) === '$') addr = parseInt(dv.substring(1), 16);
        else if (dv.charAt(0) === '%') addr = parseInt(dv.substring(1), 2);
        else addr = parseInt(dv, 10);
        if (isNaN(addr)) continue;
        var memVal = cpu.memory[addr & 0xFFFF];
        var div = document.createElement('div');
        div.className = 'define-item';
        div.dataset.addr = addr;
        div.dataset.defineName = name;
        div.innerHTML =
            '<span class="d-name">' + name + '</span>' +
            '<span class="d-addr">$' + (addr & 0xFFFF).toString(16).toUpperCase().padStart(4, '0') + '</span>' +
            '<span class="d-val" title="Double-click to edit">$' + memVal.toString(16).toUpperCase().padStart(2, '0') + '</span>' +
            '<span class="d-dec">' + memVal + '</span>' +
            '<span class="d-bin" title="Double-click to edit">' + memVal.toString(2).padStart(8, '0') + '</span>' +
            '<span class="d-color" style="' + _defineColorStyle(memVal) + '" title="' + _defineColorTitle(addr, memVal) + '"></span>';
        list.appendChild(div);
    }
}

function _validateDefineInput(raw, targetEl) {
    var isBinField = targetEl.classList.contains('d-bin');
    var isDecField = targetEl.classList.contains('d-dec');
    var isValField = targetEl.classList.contains('d-val');
    if (raw === '') return false;
    if (raw.charAt(0) === '$') return /^[0-9A-Fa-f]+$/.test(raw.substring(1));
    if (raw.charAt(0) === '%') return /^[01]+$/.test(raw.substring(1));
    if (isBinField) return /^[01]+$/.test(raw);
    if (isDecField) return /^[0-9]+$/.test(raw);
    if (isValField) return /^[0-9A-Fa-f]+$/.test(raw);
    return true;
}

function _commitDefineEdit(targetEl, input) {
    var item = targetEl.closest('.define-item');
    var addr = parseInt(item.dataset.addr, 10);
    var raw = input.value.trim();
    var isBinField = targetEl.classList.contains('d-bin');
    var newVal;
    if (raw.charAt(0) === '$') newVal = parseInt(raw.substring(1), 16);
    else if (raw.charAt(0) === '%') newVal = parseInt(raw.substring(1), 2);
    else if (isBinField && /^[01]+$/.test(raw)) newVal = parseInt(raw, 2);
    else newVal = parseInt(raw, 10);
    // Валидация
    if (isNaN(newVal) || !_validateDefineInput(raw, targetEl)) {
        input.style.border = '2px solid var(--error)';
        input.style.background = 'var(--error-bg)';
        setTimeout(function() {
            targetEl.classList.remove('d-editing');
            targetEl.textContent = targetEl.dataset.origVal || '';
        }, 400);
        return;
    }
    newVal = newVal & 0xFF;
    cpu.memory[addr & 0xFFFF] = newVal;
    // Снять d-editing с ЦЕЛЕВОГО элемента
    targetEl.classList.remove('d-editing');
    // Обновить hex и dec
    var valEl = item.querySelector('.d-val');
    var decEl = item.querySelector('.d-dec');
    if (valEl) {
        valEl.classList.remove('d-editing');
        valEl.textContent = '$' + newVal.toString(16).toUpperCase().padStart(2, '0');
        valEl.classList.add('d-val-changed');
        setTimeout(function() { valEl.classList.remove('d-val-changed'); }, 300);
    }
    if (decEl) {
        decEl.classList.remove('d-editing');
        decEl.textContent = newVal;
        decEl.classList.add('d-val-changed');
        setTimeout(function() { decEl.classList.remove('d-val-changed'); }, 300);
    }
    var colorEl = item.querySelector('.d-color');
    if (colorEl) {
        colorEl.style.cssText = _defineColorStyle(newVal);
        colorEl.title = _defineColorTitle(addr, newVal);
    }
    var binEl = item.querySelector('.d-bin');
    if (binEl) {
        binEl.classList.remove('d-editing');
        binEl.textContent = newVal.toString(2).padStart(8, '0');
        binEl.classList.add('d-val-changed');
        setTimeout(function() { binEl.classList.remove('d-val-changed'); }, 300);
    }
    drawScreen();
}

document.addEventListener('dblclick', function(e) {
    var valEl = e.target.closest('.d-val');
    var decEl = e.target.closest('.d-dec');
    var binEl = e.target.closest('.d-bin');
    var targetEl = valEl || decEl || binEl;
    if (!targetEl) return;
    var item = targetEl.closest('.define-item');
    if (!item) return;
    targetEl.classList.add('d-editing');
    var input = document.createElement('input');
    input.type = 'text';
    input.className = binEl ? 'd-bin-input' : 'd-val-input';
    // Сохранить оригинальное значение для Escape
    targetEl.dataset.origVal = targetEl.textContent;
    // Показать текущее значение в том же формате
    if (binEl) {
        input.value = binEl.textContent;
    } else if (decEl && !valEl) {
        input.value = decEl.textContent;
    } else {
        input.value = targetEl.textContent;
    }
    targetEl.textContent = '';
    targetEl.appendChild(input);
    input.focus();
    input.select();
    input.addEventListener('keydown', function(ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); _commitDefineEdit(targetEl, input); }
        if (ev.key === 'Escape') {
            targetEl.classList.remove('d-editing');
            if (targetEl.classList.contains('d-bin')) {
                targetEl.textContent = targetEl.dataset.origVal || '';
            } else {
                targetEl.textContent = input.value;
            }
        }
    });
    input.addEventListener('blur', function() { _commitDefineEdit(targetEl, input); });
    input.addEventListener('input', function() {
        var v = input.value.trim();
        if (v !== '' && !_validateDefineInput(v, targetEl)) {
            input.style.border = '2px solid var(--error)';
            input.style.background = 'var(--error-bg)';
        } else {
            input.style.border = '1px solid var(--accent)';
            input.style.background = '';
        }
    });
});

// --- Отрисовка экрана ---
function drawScreen() {
    var SCREEN_W = 32, SCREEN_H = 32;
    var wrap = document.getElementById('canvasWrap');
    var wW = wrap ? wrap.clientWidth : 320;
    var wH = wrap ? wrap.clientHeight : 320;
    var SCALE = Math.floor(Math.min(wW, wH) / SCREEN_W) || 1;
    canvas.width = SCREEN_W * SCALE;
    canvas.height = SCREEN_H * SCALE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var palette = [
        [0, 0, 0], [255, 255, 255], [255, 0, 0], [0, 255, 255],
        [255, 0, 255], [0, 255, 0], [0, 0, 255], [255, 255, 0],
        [255, 165, 0], [139, 69, 19], [255, 100, 100], [100, 100, 100],
        [180, 180, 180], [100, 255, 100], [100, 100, 255], [200, 200, 200]
    ];
    // Draw to desktop canvas
    for (var y = 0; y < SCREEN_H; y++) {
        for (var x = 0; x < SCREEN_W; x++) {
            var addr = 0x0200 + y * SCREEN_W + x;
            var val = cpu.memory[addr] & 0x0F;
            var col = palette[val] || [0, 0, 0];
            ctx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
            ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
        }
    }
    // Draw to mobile screen canvas
    var mCanvas = document.getElementById('screenMobile');
    if (mCanvas) {
        var mWrap = document.getElementById('mobileScreen');
        var mCtx = mCanvas.getContext('2d');
        var mW = mWrap ? mWrap.clientWidth : 80;
        var mS = Math.floor(mW / SCREEN_W) || 1;
        mCanvas.width = SCREEN_W * mS;
        mCanvas.height = SCREEN_H * mS;
        for (var y = 0; y < SCREEN_H; y++) {
            for (var x = 0; x < SCREEN_W; x++) {
                var addr = 0x0200 + y * SCREEN_W + x;
                var val = cpu.memory[addr] & 0x0F;
                var col = palette[val] || [0, 0, 0];
                mCtx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
                mCtx.fillRect(x * mS, y * mS, mS, mS);
            }
        }
    }
}

// --- Обновление всего ---
function refreshUI() {
    drawScreen();
    drawInfo();
    highlightPCLine();
    updateDefinesPanel();
    if (cpu.lastOp && cpu.lastAddr !== null) {
        var msg = '';
        if (cpu.lastOp === 'write') {
            msg = tf('msgWrite', '$' + cpu.lastValue.toString(16).padStart(2, '0'),
                cpu.lastReg, '$' + cpu.lastAddr.toString(16).padStart(4, '0'));
        } else if (cpu.lastOp === 'read') {
            msg = tf('msgRead', '$' + cpu.lastValue.toString(16).padStart(2, '0'), cpu.lastReg);
        }
        document.getElementById('memStatus') && (document.getElementById('memStatus').textContent = msg);
    }
}

// --- Сообщения ---
function setMessage(text, isError) {
    msgDiv.textContent = text;
    msgDiv.classList.toggle('error', !!isError);
    if (isError && errorLine !== null) {
        editor.addLineClass(errorLine - 1, 'background', 'error-line');
    } else {
        editor.removeLineClass('error-line', 'background');
    }
}

// --- Поиск строки-источника для адреса ---
function findSourceLine(addr) {
    // Пробуем найти строку для данного адреса
    if (addrToLineMap && addrToLineMap[addr] !== undefined) return addrToLineMap[addr];
    // Ищем ближайшую предыдущую строку
    if (!addrToLineMap) return null;
    var best = null;
    for (var a in addrToLineMap) {
        var num = parseInt(a);
        if (num <= addr && (best === null || num > best)) best = num;
    }
    return best !== null ? addrToLineMap[best] : null;
}

function getErrorContext(addr) {
    var line = findSourceLine(addr);
    if (line === null) return '';
    var lineText = '';
    if (editor) lineText = editor.getLine(line) || '';
    var ctx = tf('msgAtLine', line + 1);
    if (lineText.trim()) ctx += ': ' + lineText.trim();
    ctx += ')';
    if (addrToLineMap) {
        var bestJSR = null;
        for (var a in addrToLineMap) {
            var num = parseInt(a);
            if (num < addr) {
                var op = cpu.memory[num];
                if (op === 0x20) {
                    if (bestJSR === null || num > bestJSR) bestJSR = num;
                }
            }
        }
        if (bestJSR !== null) {
            var jsrLine = addrToLineMap[bestJSR];
            if (jsrLine !== undefined && editor) {
                var jsrText = editor.getLine(jsrLine) || '';
                ctx += tf('msgJsrAtLine', jsrLine + 1);
                if (jsrText.trim()) ctx += ': ' + jsrText.trim();
            }
        }
    }
    return ctx;
}

// --- Ассемблирование ---
function assembleCode() {
    var code = editor.getValue();
    var result = ASSEMBLER.assemble(code);
    if (result.errors && result.errors.length > 0) {
        var errTexts = [];
        for (var ei = 0; ei < result.errors.length; ei++) {
            var e = result.errors[ei];
            errTexts.push('line ' + e.line + ': ' + e.msg);
        }
        setMessage(errTexts.join('; '), true);
        errorLine = result.errors[0].line;
        editor.addLineClass(errorLine - 1, 'background', 'error-line');
        return false;
    }
    errorLine = null;
    editor.removeLineClass('error-line', 'background');
    addrToLineMap = result.addrToLine;
    lineToBytesMap = result.lineToBytes;
    _lastDefinesJson = '';
    redrawBreakpoints();
    cpu.load(result.memory);
    cpu.PC = PROGRAM_ADDR;
    cpu.halted = false;
    prevStepPC = PROGRAM_ADDR;
    refreshUI();
    console.log('[assemble] PC=$' + PROGRAM_ADDR.toString(16).padStart(4, '0') + ', addrToLine:', JSON.stringify(addrToLineMap));
    console.log('[assemble] memory $' + PROGRAM_ADDR.toString(16).padStart(4, '0') + '-$' + (PROGRAM_ADDR + 0x0F).toString(16).padStart(4, '0') + ':', Array.from(result.memory.slice(PROGRAM_ADDR, PROGRAM_ADDR + 0x10)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join(' '));
    codeDirty = false;
    setMessage(tf('msgAssembled'), false);
    runBtn.disabled = false;
    resetBtn.disabled = false;
    stepBtn.disabled = false;
    hexdumpBtn.disabled = false;
    disasmBtn.disabled = false;
    return true;
}

// --- Запуск ---
function runCode() {
    if (isRunning) return;
    isRunning = true;
    runBtn.textContent = 'Pause';
    runBtn.disabled = false;
    var maxSteps = 10000000;
    var steps = 0;

    function doFrame() {
        if (!isRunning) return;
        var ticks = getSpeedTicks();
        for (var t = 0; t < ticks; t++) {
            if (!isRunning) return;
            if (steps > maxSteps) {
                setMessage(tf('msgStopped', steps), false);
                stopRun();
                return;
            }
            if (pauseRequested) {
                pauseRequested = false;
                setMessage(tf('msgPause', steps, '$' + cpu.PC.toString(16).padStart(4, '0')), false);
                stopRun();
                stepBtn.disabled = false;
                return;
            }
            if (hasBreakpointAtPC(cpu.PC)) {
                var bpCtx = getErrorContext(cpu.PC);
                setMessage(tf('msgBreakpoint', steps, '$' + cpu.PC.toString(16).padStart(4, '0')) + bpCtx, false);
                prevStepPC = cpu.PC;
                refreshUI();
                stopRun();
                return;
            }
            var prevPC = cpu.PC;
            var opcode = cpu.memory[prevPC];
            prevStepPC = cpu.PC;
            var ok = cpu.step();
            steps++;

            if (!ok) {
                var opInfo = ASSEMBLER._opcodes[opcode];
                var opName = opInfo ? opInfo.name + ' (' + opInfo.mode + ')' : '???';
                var ctx = getErrorContext(prevPC);
                setMessage(tf('msgOpcode', '$' + opcode.toString(16).padStart(2, '0'), opName, '$' + prevPC.toString(16).padStart(4, '0')) + ctx, true);
                prevStepPC = prevPC;
                refreshUI();
                stopRun();
                return;
            }
            if (opcode === 0x00) {
                var brkCtx = getErrorContext(prevPC);
                setMessage(tf('msgBrk', '$' + prevPC.toString(16).padStart(4, '0')) + brkCtx, false);
                refreshUI();
                stopRun();
                return;
            }
            if (cpu.PC < PROGRAM_ADDR || cpu.PC >= 0x10000) {
                var rangeCtx = getErrorContext(prevPC);
                setMessage(tf('msgPcRange', '$' + cpu.PC.toString(16).padStart(4, '0'), describeOpcode(prevPC)) + rangeCtx, true);
                refreshUI();
                stopRun();
                return;
            }
            if (cpu.halted) {
                setMessage(tf('msgHalted'), false);
                refreshUI();
                stopRun();
                return;
            }
        }
        // One UI update per frame
        refreshUI();
        if (cpu.lastOp && cpu.lastAddr !== null) {
            scrollToAddr(cpu.lastAddr, cpu.lastOp === 'write');
        }
        if (steps % 10000 === 0) {
            setMessage(tf('msgSteps', steps, '$' + cpu.PC.toString(16).padStart(4, '0')), false);
        }
        stepTimer = setTimeout(doFrame, FRAME_MS);
    }
    doFrame();
}

function stopRun() {
    isRunning = false;
    if (stepTimer) { clearTimeout(stepTimer); stepTimer = null; }
    runBtn.textContent = 'Run';
    runBtn.disabled = false;
    stepBtn.disabled = !isDebug;
    refreshUI();
}

function resetCPU() {
    stopRun();
    clearPCLine();
    cpu.reset();
    refreshUI();
    setMessage(tf('msgReset'), false);
    runBtn.disabled = true;
    stepBtn.disabled = true;
}

function stepCPU() {
    if (isRunning) return;
    if (cpu.halted) {
        setMessage(tf('msgHaltedBrk'), false);
        return;
    }
    var prevPC = cpu.PC;
    var opcode = cpu.memory[prevPC];
    console.log('[step] PC=$' + prevPC.toString(16).padStart(4, '0') +
        ' opcode=$' + opcode.toString(16).padStart(2, '0') +
        ' A=$' + cpu.A.toString(16).padStart(2, '0') +
        ' X=$' + cpu.X.toString(16).padStart(2, '0') +
        ' Y=$' + cpu.Y.toString(16).padStart(2, '0') +
        ' SP=$' + cpu.SP.toString(16).padStart(2, '0'));
    prevStepPC = cpu.PC;
    var ok = cpu.step();
    refreshUI();
    // При быстром нажатии step — ускоряем анимации
    var now = performance.now();
    _fastStep = (now - _lastStepTime) < 200;
    _lastStepTime = now;
    if (_fastStep) {
        animQueue.length = 0;
        anim.active = false;
        anim.flagAnim = null;
    }
    // Скроллим таблицу к адресу ДО построения posCache
    if (cpu.lastOp && cpu.lastAddr !== null) {
        scrollToAddr(cpu.lastAddr, cpu.lastOp === 'write');
        refreshUI(); // перерисовываем с новым memBase
    }
    if (cpu.lastOp && cpu.lastAddr !== null) {
        var regLabel = cpu.lastReg || '';
        var regPos = posCache.regs[regLabel];
        var memPos = posCache.memCells[cpu.lastAddr];
        if (regPos && memPos) {
            var fromX, fromY, toX, toY;
            if (cpu.lastOp === 'write') {
                fromX = regPos.x; fromY = regPos.y;
                toX = memPos.x; toY = memPos.y;
            } else {
                fromX = memPos.x; fromY = memPos.y;
                toX = regPos.x; toY = regPos.y;
            }
            anim.toAddr = cpu.lastAddr;
            anim.fromAddr = cpu.lastAddr;
            startAnimation(fromX, fromY, toX, toY, cpu.lastValue, regLabel);
        }
    }
    // Анимация переноса между регистрами -- только если не было memory-операции
    if (!cpu.lastOp && cpu.lastTransfer) {
        var t = cpu.lastTransfer;
        var fromPos = posCache.regs[t.from];
        var toPos = posCache.regs[t.to];
        if (fromPos && toPos) {
            startAnimation(fromPos.x, fromPos.y, toPos.x, toPos.y, t.value, t.from + '\u2192' + t.to);
        }
    }
    // Анимация флага
    if (cpu.lastFlagOp) {
        anim.flagAnim = { flag: cpu.lastFlagOp.flag, set: cpu.lastFlagOp.set, progress: 0, phase: 0 };
        if (!anim.active) requestAnimationFrame(animateFrame);
    }
    // Анимация изменений флагов (ADC, SBC, LDA, CMP и т.д.)
    if (cpu.lastFlagChanges.length > 0) {
        var srcReg = cpu.lastReg || 'A';
        var srcPos = posCache.regs[srcReg] || posCache.regs['A'];
        if (srcPos) {
            for (var fc = 0; fc < cpu.lastFlagChanges.length; fc++) {
                var ch = cpu.lastFlagChanges[fc];
                var flagPos = posCache.flags[ch.flag];
                if (flagPos) {
                    startAnimation(srcPos.x, srcPos.y, flagPos.x, flagPos.y, ch.set ? 1 : 0, ch.flag, ch.flag, ch.set);
                }
            }
        }
    }
    if (!ok) {
        var opInfo2 = ASSEMBLER._opcodes[opcode];
        var opName2 = opInfo2 ? opInfo2.name + ' (' + opInfo2.mode + ')' : '???';
        var ctx2 = getErrorContext(prevPC);
        setMessage(tf('msgOpcode', '$' + opcode.toString(16).padStart(2, '0'), opName2, '$' + prevPC.toString(16).padStart(4, '0')) + ctx2, true);
        return;
    }
    if (opcode === 0x00) {
        var brkCtx2 = getErrorContext(prevPC);
        console.log('[step] BRK at $' + prevPC.toString(16).padStart(4, '0') + ', PC now=$' + cpu.PC.toString(16).padStart(4, '0'));
        setMessage(tf('msgBrkShort') + brkCtx2, false);
        return;
    }
    if (cpu.PC < PROGRAM_ADDR || cpu.PC >= 0x10000) {
        console.log('[step] PC out of range: $' + cpu.PC.toString(16).padStart(4, '0'));
        var rangeCtx2 = getErrorContext(prevPC);
        setMessage(tf('msgPcRange', '$' + cpu.PC.toString(16).padStart(4, '0'), describeOpcode(prevPC)) + rangeCtx2, true);
        return;
    }
    var description = describeOpcode(prevPC);
    setMessage(tf('msgStep') + description, false);
}

// --- Описание опкодов на русском ---
function describeOpcode(pc) {
    var opcode = cpu.memory[pc];
    var opInfo = null;
    for (var base in ASSEMBLER._opcodes) {
        if (parseInt(base) === opcode) { opInfo = ASSEMBLER._opcodes[base]; break; }
    }
    if (!opInfo) return 'Unknown opcode $' + opcode.toString(16).padStart(2, '0');
    var name = opInfo.name;
    var mode = opInfo.mode;
    var operand, addr, val;
    var hex2 = function(v) { return '$' + v.toString(16).toUpperCase().padStart(2, '0'); };
    var hex4 = function(v) { return '$' + v.toString(16).toUpperCase().padStart(4, '0'); };
    switch (name) {
        case 'LDA':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opLdaImm', operand, hex2(operand)); }
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; return tf('opLdaMem', hex2(addr)); }
            if (mode === 'abs') { addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opLdaMem', hex4(addr)); }
            if (mode === 'zpx') { addr = (cpu.memory[pc + 1] + cpu.X) & 0xFF; return tf('opLdaMemX', hex2(addr), 'ZP+X'); }
            if (mode === 'abx') { addr = (cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8)) + cpu.X; return tf('opLdaMemX', hex4(addr), 'ABS+X'); }
            if (mode === 'aby') { addr = (cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8)) + cpu.Y; return tf('opLdaMemX', hex4(addr), 'ABS+Y'); }
            break;
        case 'LDX':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opLdxImm', operand); }
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; return tf('opLdxMem', hex2(addr)); }
            if (mode === 'abs') { addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opLdxMem', hex4(addr)); }
            break;
        case 'LDY':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opLdyImm', operand); }
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; return tf('opLdyMem', hex2(addr)); }
            if (mode === 'abs') { addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opLdyMem', hex4(addr)); }
            break;
        case 'STA':
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; return tf('opStaA', hex2(cpu.A), hex2(addr)); }
            if (mode === 'abs') { addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opStaA', hex2(cpu.A), hex4(addr)); }
            if (mode === 'zpx') { addr = (cpu.memory[pc + 1] + cpu.X) & 0xFF; return tf('opSta', hex2(addr), 'ZP+X'); }
            break;
        case 'STX':
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; return tf('opStxA', hex2(cpu.X), hex2(addr)); }
            if (mode === 'abs') { addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opStx', hex4(addr)); }
            break;
        case 'STY':
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; return tf('opStyA', hex2(cpu.Y), hex2(addr)); }
            if (mode === 'abs') { addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opSty', hex4(addr)); }
            break;
        case 'ADC':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opAdcImm', operand); }
            if (mode === 'zp') { addr = cpu.memory[pc + 1]; val = cpu.memory[addr]; return tf('opAdcMem', hex2(val), hex2(addr)); }
            break;
        case 'SBC':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opSbcImm', operand); }
            break;
        case 'AND':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opAnd', operand, hex2(operand)); }
            break;
        case 'ORA':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opOra', operand, hex2(operand)); }
            break;
        case 'EOR':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opEor', operand, hex2(operand)); }
            break;
        case 'CMP':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opCmp', operand); }
            break;
        case 'CPX':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opCpx', operand); }
            break;
        case 'CPY':
            if (mode === 'imm') { operand = cpu.memory[pc + 1]; return tf('opCpy', operand); }
            break;
        case 'INC': addr = cpu.memory[pc + 1]; return tf('opInc', hex2(addr));
        case 'DEC': addr = cpu.memory[pc + 1]; return tf('opDec', hex2(addr));
        case 'INX': return tf('opInx', (cpu.X - 1) & 0xFF);
        case 'INY': return tf('opIny', (cpu.Y - 1) & 0xFF);
        case 'DEX': return tf('opDex', (cpu.X + 1) & 0xFF);
        case 'DEY': return tf('opDey', (cpu.Y + 1) & 0xFF);
        case 'TAX': return tf('opTax', hex2(cpu.A));
        case 'TAY': return tf('opTay', hex2(cpu.Y));
        case 'TXA': return tf('opTxa');
        case 'TYA': return tf('opTya');
        case 'TSX': return tf('opTsx');
        case 'TXS': return tf('opTxs');
        case 'PHA': return tf('opPha', hex2(cpu.A));
        case 'PLA': return tf('opPla');
        case 'PHP': return tf('opPhp');
        case 'PLP': return tf('opPlp');
        case 'JMP': addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opJmp', hex4(addr));
        case 'JSR': addr = cpu.memory[pc + 1] | (cpu.memory[pc + 2] << 8); return tf('opJsr', hex4(addr));
        case 'RTS': return tf('opRts');
        case 'RTI': return tf('opRti');
        case 'BRK': return tf('opBrk');
        case 'NOP': return tf('opNop');
        case 'CLC': return tf('opClc');
        case 'SEC': return tf('opSec');
        case 'CLD': return tf('opCld');
        case 'SED': return tf('opSed');
        case 'CLI': return tf('opCli');
        case 'SEI': return tf('opSei');
        case 'CLV': return tf('opClv');
        case 'ASL': return mode === 'acc' ? tf('opAsl', 'A') : tf('opAsl', 'value');
        case 'LSR': return mode === 'acc' ? tf('opLsr', 'A') : tf('opLsr', 'value');
        case 'ROL': return mode === 'acc' ? tf('opRol', 'A') : tf('opRol', 'value');
        case 'ROR': return mode === 'acc' ? tf('opRor', 'A') : tf('opRor', 'value');
        case 'BIT': return tf('opBit');
        case 'BCC': return tf('opBcc');
        case 'BCS': return tf('opBcs');
        case 'BEQ': return tf('opBeq');
        case 'BNE': return tf('opBne');
        case 'BMI': return tf('opBmi');
        case 'BPL': return tf('opBpl');
        case 'BVC': return tf('opBvc');
        case 'BVS': return tf('opBvs');
    }
    return name + ' ' + mode;
}

function hexdump() {
    var start = PROGRAM_ADDR;
    var end = start;
    for (var i = start; i < 0x10000; i++) {
        if (cpu.memory[i] !== 0) end = i;
    }
    end = Math.ceil((end + 1) / 16) * 16;
    if (end <= start) end = start + 16;
    var len = end - start;

    var lines = [];
    for (var i = 0; i < len; i += 16) {
        var addr = start + i;
        var hex = '';
        var ascii = '';
        for (var j = 0; j < 16; j++) {
            var b = cpu.memory[addr + j];
            hex += b.toString(16).padStart(2, '0') + ' ';
            ascii += (b >= 0x20 && b < 0x7f) ? String.fromCharCode(b) : '.';
        }
        lines.push('$' + addr.toString(16).padStart(4, '0') + ': ' + hex + ' ' + ascii);
    }
    var dumpText = lines.join('\n');
    if (navigator.clipboard) {
        navigator.clipboard.writeText(dumpText);
    }
    document.getElementById('hexdumpBody').textContent = dumpText;
    openModal('hexdumpModal');
}

function disassemble() {
    if (!lineToBytesMap || !editor) {
        setMessage(tf('msgAssembleFirst'), true);
        return;
    }
    var text = getComputedStyle(document.body).getPropertyValue('--text').trim() || '#333';
    var border = getComputedStyle(document.body).getPropertyValue('--border').trim() || '#ddd';
    var accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0066cc';
    var muted = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#888';
    var lines = editor.getValue().split('\n');
    var html = '<table>';
    html += '<tr><th>Line</th><th>Address</th><th>Bytes</th><th>Source</th></tr>';
    var lineIndices = Object.keys(lineToBytesMap).map(Number).sort(function(a, b) { return a - b; });
    for (var li = 0; li < lineIndices.length; li++) {
        var lineIdx = lineIndices[li];
        var bytes = lineToBytesMap[lineIdx];
        if (!bytes || bytes.length === 0) continue;
        var startAddr = bytes[0].addr;
        var hexBytes = bytes.map(function(b) { return '$' + b.val.toString(16).toUpperCase().padStart(2, '0'); }).join(' ');
        var srcLine = (lines[lineIdx] || '').trim();
        html += '<tr>';
        html += '<td style="color:' + muted + '">' + (lineIdx + 1) + '</td>';
        html += '<td style="color:' + text + '">$' + startAddr.toString(16).toUpperCase().padStart(4, '0') + '</td>';
        html += '<td style="color:' + accent + ';font-weight:bold">' + hexBytes + '</td>';
        html += '<td style="color:' + text + '">' + srcLine.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</td>';
        html += '</tr>';
    }
    html += '</table>';
    document.getElementById('disasmBody').innerHTML = html;
    openModal('disasmModal');
}

// --- DOM-элементы ---
var assembleBtn = document.getElementById('assembleBtn');
var runBtn = document.getElementById('runBtn');
var resetBtn = document.getElementById('resetBtn');
var stepBtn = document.getElementById('stepBtn');
var hexdumpBtn = document.getElementById('hexdumpBtn');
var disasmBtn = document.getElementById('disasmBtn');
var toggleHelpBtn = document.getElementById('toggleHelp');
var toggleThemeBtn = document.getElementById('toggleTheme');
var helpPanel = document.getElementById('helpPanel');
var speedSlider = document.getElementById('speedSlider');
var speedValue = document.getElementById('speedValue');
var resetLayoutBtn = document.getElementById('resetLayoutBtn');

// --- Speed control (ticks per frame at 30 fps) ---
var FRAME_MS = 33; // ~30 fps
var SPEED_STEPS = [1, 2, 5, 10, 25, 50, 100, 250]; // ticks per frame per slider position
function getSpeedTicks() { return SPEED_STEPS[parseInt(speedSlider.value)] || 10; }
function updateSpeedLabel() { speedValue.textContent = getSpeedTicks() + ' ticks'; }
speedSlider.addEventListener('input', updateSpeedLabel);
updateSpeedLabel();

// --- Modal ---
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
});
// Close modal on Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(function(m) { m.classList.add('hidden'); });
    }
});

// --- Редактор ---
var textarea = document.getElementById('codeArea');
editor = MiniEditor.create(textarea, {
    lineNumbers: true,
    gutters: ['breakpoints-gutter', 'CodeMirror-linenumbers'],
    tabSize: 4
});

// --- Breakpoint toggle via gutter click ---
var cmWrapper = editor.getWrapperElement();
cmWrapper.addEventListener('mousedown', function(e) {
    var gutterContainer = editor.getGutterElement();
    if (!gutterContainer) return;
    var gutterRect = gutterContainer.getBoundingClientRect();
    if (e.clientX >= gutterRect.left && e.clientX <= gutterRect.left + 20) {
        var wrapperRect = cmWrapper.getBoundingClientRect();
        var localY = e.clientY - wrapperRect.top + editor.getScrollInfo().top;
        var line = Math.floor(localY / editor.defaultTextHeight());
        if (line >= 0 && line < editor.lineCount()) {
            toggleBreakpoint(line);
            e.preventDefault();
        }
    }
});

function toggleBreakpoint(line) {
    if (breakpoints[line]) {
        delete breakpoints[line];
        editor.removeLineClass(line, 'wrap', 'line-breakpoint');
        editor.setGutterMarker(line, 'breakpoints-gutter', null);
    } else {
        breakpoints[line] = true;
        editor.addLineClass(line, 'wrap', 'line-breakpoint');
        var marker = document.createElement('div');
        marker.className = 'cm-breakpoint';
        editor.setGutterMarker(line, 'breakpoints-gutter', marker);
    }
}

function clearAllBreakpoints() {
    for (var line in breakpoints) {
        editor.removeLineClass(parseInt(line), 'wrap', 'line-breakpoint');
        editor.setGutterMarker(parseInt(line), 'breakpoints-gutter', null);
    }
    breakpoints = {};
}

function redrawBreakpoints() {
    if (!editor) return;
    editor.clearGutter('breakpoints-gutter');
    for (var line in breakpoints) {
        var ln = parseInt(line);
        editor.addLineClass(ln, 'wrap', 'line-breakpoint');
        var marker = document.createElement('div');
        marker.className = 'cm-breakpoint';
        editor.setGutterMarker(ln, 'breakpoints-gutter', marker);
    }
}

function hasBreakpointAtPC(pc) {
    if (!addrToLineMap) return false;
    var line = addrToLineMap[pc];
    return line !== undefined && breakpoints[line];
}

// --- Define tooltip on hover ---
var defineTooltip = null;
var defineTooltipLine = -1;

function createDefineTooltip() {
    if (defineTooltip) return defineTooltip;
    defineTooltip = document.createElement('div');
    defineTooltip.className = 'define-tooltip';
    defineTooltip.style.display = 'none';
    document.body.appendChild(defineTooltip);
    return defineTooltip;
}

function getWordAtCursor(cm, pos) {
    var token = cm.getTokenAt(pos);
    if (!token || !token.string) return null;
    // Return the word (identifier) under cursor
    var word = token.string.trim().toUpperCase();
    // Only consider tokens that look like identifiers (not numbers, not comments)
    if (token.type === 'comment' || token.type === 'number') return null;
    if (/^[0-9$%#'"]/.test(word)) return null;
    if (word.length < 1) return null;
    return word;
}

function showDefineTooltip(cm, e) {
    var pos = cm.coordsChar({ left: e.clientX, top: e.clientY }, 'local');
    var word = getWordAtCursor(cm, pos);
    if (!word) { hideDefineTooltip(); return; }

    var defines = ASSEMBLER._defines();
    var dv = defines[word];
    if (dv === undefined) { hideDefineTooltip(); return; }

    // Resolve the define value to an address
    var addr;
    if (dv.charAt(0) === '$') {
        addr = parseInt(dv.substring(1), 16);
    } else if (dv.charAt(0) === '%') {
        addr = parseInt(dv.substring(1), 2);
    } else {
        addr = parseInt(dv, 10);
    }
    if (isNaN(addr)) { hideDefineTooltip(); return; }

    var memVal = cpu.memory[addr & 0xFFFF];

    var tip = createDefineTooltip();
    tip.innerHTML =
        '<span class="dt-name">' + word + '</span>\n' +
        'Адрес: <span class="dt-addr">$' + (addr & 0xFFFF).toString(16).toUpperCase().padStart(4, '0') + '</span> (' + addr + ')\n' +
        'Значение: <span class="dt-val">$' + memVal.toString(16).toUpperCase().padStart(2, '0') + '</span> (' + memVal + ')';
    tip.style.display = 'block';

    // Position: right of cursor, below
    var x = e.clientX + 12;
    var y = e.clientY + 18;
    // Keep on screen
    var tipW = tip.offsetWidth || 200;
    var tipH = tip.offsetHeight || 50;
    if (x + tipW > window.innerWidth - 10) x = e.clientX - tipW - 12;
    if (y + tipH > window.innerHeight - 10) y = e.clientY - tipH - 12;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

function hideDefineTooltip() {
    if (defineTooltip) defineTooltip.style.display = 'none';
}

// Attach hover listener to editor
cmWrapper.addEventListener('mousemove', function(e) {
    showDefineTooltip(editor, e);
});
cmWrapper.addEventListener('mouseleave', hideDefineTooltip);

// --- Обработчики ---
assembleBtn.addEventListener('click', function() { closeMobileMenu(); if (isRunning) stopRun(); codeDirty = true; assembleCode(); });
runBtn.addEventListener('click', function() {
    closeMobileMenu();
    if (isRunning) { stopRun(); return; }
    if (codeDirty) { if (!assembleCode()) return; }
    runCode();
});
resetBtn.addEventListener('click', function() { closeMobileMenu(); resetCPU(); });
stepBtn.addEventListener('click', function() {
    closeMobileMenu();
    if (isRunning) {
        pauseRequested = true;
        return;
    }
    if (codeDirty) { if (!assembleCode()) return; }
    stepCPU();
});
hexdumpBtn.addEventListener('click', function() { closeMobileMenu(); hexdump(); });
disasmBtn.addEventListener('click', function() { closeMobileMenu(); disassemble(); });
clearBpBtn.addEventListener('click', function() { closeMobileMenu(); clearAllBreakpoints(); });

// --- Mobile run bar sync ---
function closeMobileMenu() {
    var tb = document.getElementById('toolbar');
    if (tb) tb.classList.remove('mobile-open');
}
var mAssembleBtn = document.getElementById('mAssembleBtn');
var mRunBtn = document.getElementById('mRunBtn');
var mStepBtn = document.getElementById('mStepBtn');
var mResetBtn = document.getElementById('mResetBtn');
if (mAssembleBtn) mAssembleBtn.addEventListener('click', function() { closeMobileMenu(); assembleBtn.click(); });
if (mRunBtn) mRunBtn.addEventListener('click', function() { closeMobileMenu(); runBtn.click(); });
if (mStepBtn) mStepBtn.addEventListener('click', function() { closeMobileMenu(); stepBtn.click(); });
if (mResetBtn) mResetBtn.addEventListener('click', function() { closeMobileMenu(); resetBtn.click(); });
// Sync disabled state
function syncMobileRunBar() {
    if (mRunBtn) mRunBtn.disabled = runBtn.disabled;
    if (mStepBtn) mStepBtn.disabled = stepBtn.disabled;
    if (mResetBtn) mResetBtn.disabled = resetBtn.disabled;
    if (mRunBtn) mRunBtn.textContent = runBtn.textContent;
}
var _origRunBtnClick = runBtn.onclick;
setInterval(syncMobileRunBar, 500);
// Close mobile menu on outside click
document.addEventListener('click', function(e) {
    var tb = document.getElementById('toolbar');
    var btn = document.getElementById('mobileMenuBtn');
    if (tb && tb.classList.contains('mobile-open') && !tb.contains(e.target) && btn && !btn.contains(e.target)) {
        tb.classList.remove('mobile-open');
    }
});
resetLayoutBtn.addEventListener('click', resetLayout);
toggleHelpBtn.addEventListener('click', function() {
    helpPanel.classList.toggle('hidden');
    toggleHelpBtn.textContent = helpPanel.classList.contains('hidden') ? '\ud83d\udcda ' + t('help') : '\ud83d\udcda ' + t('hide');
});
toggleThemeBtn.addEventListener('click', function() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark', currentTheme === 'dark');
    toggleThemeBtn.textContent = currentTheme === 'dark' ? '\u263e\ufe0f' : '\u2600\ufe0f';
    _themeCache = {};
    _themeCacheKey = '';
    if (editor) editor.refresh();
    drawInfo();
    drawScreen();
});

// --- Language toggle ---
var langBtn = document.getElementById('langBtn');
langBtn.addEventListener('click', function() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    try { localStorage.setItem(LANG_KEY, currentLang); } catch(e) {}
    applyLanguage();
    if (editor) editor.refresh();
    drawInfo();
    drawScreen();
});

// --- Layout persistence & resizable panels ---
var LAYOUT_KEY = 'easy6502_layout';
var CODE_KEY = 'easy6502_code';
var LAYOUT_DEFAULTS = { canvasWrapW: null, definesPanelW: 220, infoRowH: 280 };

function loadLayout() {
    try {
        var s = localStorage.getItem(LAYOUT_KEY);
        if (s) {
            var o = JSON.parse(s);
            if (o && typeof o === 'object') return o;
        }
    } catch(e) {}
    return {};
}
function saveLayout(obj) {
    try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(obj)); } catch(e) {}
}
function saveCode() {
    try { localStorage.setItem(CODE_KEY, editor.getValue()); } catch(e) {}
}
function loadCode() {
    try { return localStorage.getItem(CODE_KEY); } catch(e) { return null; }
}

function applyLayoutSizes(sizes) {
    var cw = document.getElementById('canvasWrap');
    var dp = document.getElementById('definesPanel');
    var ir = document.getElementById('infoRow');
    if (sizes.canvasWrapW != null) {
        cw.style.flexBasis = sizes.canvasWrapW + 'px';
        cw.style.width = sizes.canvasWrapW + 'px';
        cw.style.flexGrow = '0';
    } else {
        cw.style.flexBasis = '';
        cw.style.width = '';
        cw.style.flexGrow = '1';
    }
    if (sizes.definesPanelW != null) {
        dp.style.flexBasis = sizes.definesPanelW + 'px';
        dp.style.width = sizes.definesPanelW + 'px';
    }
    if (sizes.infoRowH != null) ir.style.height = sizes.infoRowH + 'px';
}

function getCurrentSizes() {
    var cw = document.getElementById('canvasWrap');
    var dp = document.getElementById('definesPanel');
    var ir = document.getElementById('infoRow');
    return {
        canvasWrapW: cw.offsetWidth,
        definesPanelW: dp.offsetWidth,
        infoRowH: ir.offsetHeight
    };
}

// --- Resize handle logic ---
function initResizeHandles() {
    var handles = document.querySelectorAll('.resize-handle');
    for (var i = 0; i < handles.length; i++) {
        (function(handle) {
            handle.addEventListener('mousedown', function(e) {
                e.preventDefault();
                var isHoriz = handle.classList.contains('h');
                var axis = isHoriz ? 'x' : 'y';
                var startPos = axis === 'x' ? e.clientX : e.clientY;
                var panel1, panel2, prop;
                var id = handle.id;
                if (id === 'h-editor-canvas') {
                    panel1 = document.getElementById('editorWrap');
                    panel2 = document.getElementById('canvasWrap');
                    prop = 'canvasWrapW';
                } else if (id === 'h-info-defines') {
                    panel1 = document.getElementById('infoCanvas');
                    panel2 = document.getElementById('definesPanel');
                    prop = 'definesPanelW';
                } else if (id === 'h-rows') {
                    panel1 = document.getElementById('editorRow');
                    panel2 = document.getElementById('infoRow');
                    prop = 'infoRowH';
                } else return;
                var startVal = axis === 'x' ? panel2.offsetWidth : panel2.offsetHeight;
                handle.classList.add('active');
                document.body.style.cursor = isHoriz ? 'col-resize' : 'row-resize';
                document.body.style.userSelect = 'none';

                function onMove(ev) {
                    var delta = (axis === 'x' ? ev.clientX : ev.clientY) - startPos;
                    if (prop === 'infoRowH') {
                        var newVal = startVal - delta;
                        newVal = Math.max(80, Math.min(newVal, window.innerHeight * 0.8));
                        panel2.style.height = newVal + 'px';
                    } else {
                        var newVal = startVal - delta;
                        if (prop === 'canvasWrapW') {
                            newVal = Math.max(150, Math.min(newVal, window.innerWidth * 0.7));
                        } else if (prop === 'definesPanelW') {
                            newVal = Math.max(120, Math.min(newVal, window.innerWidth * 0.5));
                        }
                        panel2.style.flexGrow = '0';
                        panel2.style.flexBasis = newVal + 'px';
                        panel2.style.width = newVal + 'px';
                    }
                }
                function onUp() {
                    handle.classList.remove('active');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    var sizes = getCurrentSizes();
                    saveLayout(sizes);
                    if (editor) {
                        var scrollInfo = editor.getScrollInfo();
                        editor.refresh();
                        // refresh() uses rAF internally + measureLineHeight resets scrollTop
                        // need double rAF to restore after refresh completes
                        requestAnimationFrame(function() {
                            requestAnimationFrame(function() {
                                editor.scrollTo(scrollInfo.left, scrollInfo.top);
                            });
                        });
                    }
                    drawInfo();
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        })(handles[i]);
    }
}

function resetLayout() {
    applyLayoutSizes(LAYOUT_DEFAULTS);
    saveLayout(LAYOUT_DEFAULTS);
    if (editor) {
        var scrollInfo = editor.getScrollInfo();
        editor.refresh();
        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                editor.scrollTo(scrollInfo.left, scrollInfo.top);
            });
        });
    }
    drawInfo();
}

// --- Инициализация ---
// Restore saved language
try {
    var savedLang = localStorage.getItem(LANG_KEY);
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
        currentLang = savedLang;
    }
} catch(e) {}
applyLanguage();
cpu.reset();
refreshUI();
updateDefinesPanel();
setMessage(tf('msgWelcome'), false);

// Restore saved code
var savedCode = loadCode();
if (savedCode !== null && editor) {
    editor.setValue(savedCode);
}

// Restore saved layout
var savedLayout = loadLayout();
applyLayoutSizes(savedLayout);
// Double rAF to ensure browser has finished layout before refreshing
requestAnimationFrame(function() {
    requestAnimationFrame(function() {
        if (editor) editor.refresh();
        drawInfo();
        drawScreen();
    });
});

// Init resize handles
initResizeHandles();

editor.on('change', function() {
    editor.removeLineClass('error-line', 'background');
    errorLine = null;
    msgDiv.classList.remove('error');
    codeDirty = true;
    saveCode();
});

window.addEventListener('resize', function() { drawInfo(); });
window.addEventListener('beforeunload', function() { saveCode(); });

// --- Calculator ---
(function() {
    var calcBtn = document.getElementById('calcBtn');
    var calcModal = document.getElementById('calcModal');
    var calcInput = document.getElementById('calcInput');
    var calcResult = document.getElementById('calcResult');
    var convHex = document.getElementById('convHex');
    var convDec = document.getElementById('convDec');
    var convBin = document.getElementById('convBin');
    var baseBtns = document.querySelectorAll('.calc-base');
    var numBtns = document.querySelectorAll('.calc-btn');

    var currentBase = 16;
    var expression = '';
    var lastResult = null;

    function isDigitForBase(ch, base) {
        if (base === 16) return /^[0-9A-Fa-f]$/.test(ch);
        if (base === 10) return /^[0-9]$/.test(ch);
        if (base === 2) return /^[01]$/.test(ch);
        return false;
    }

    function evalExpression(expr) {
        // Replace hex literals ($xx) with decimal for eval
        var sanitized = expr.replace(/\$[0-9A-Fa-f]+/g, function(m) {
            return parseInt(m.substring(1), 16);
        });
        // Only allow safe characters
        if (/[^0-9+\-*/().%\s]/.test(sanitized)) return NaN;
        try {
            return Function('"use strict"; return (' + sanitized + ')')();
        } catch(e) {
            return NaN;
        }
    }

    function updateConversions(val) {
        if (isNaN(val) || val === null || val === undefined) {
            convHex.textContent = '-';
            convDec.textContent = '-';
            convBin.textContent = '-';
            return;
        }
        var v = Math.floor(val) & 0xFFFF;
        convHex.textContent = '$' + v.toString(16).toUpperCase().padStart(4, '0');
        convDec.textContent = v;
        convBin.textContent = v.toString(2).padStart(16, '0');
    }

    function setBase(base) {
        currentBase = base;
        for (var i = 0; i < baseBtns.length; i++) {
            baseBtns[i].classList.toggle('active', parseInt(baseBtns[i].dataset.base) === base);
        }
        // Update button states for digits
        for (var i = 0; i < numBtns.length; i++) {
            var btn = numBtns[i];
            var val = btn.dataset.val;
            if (val.length === 1 && /^[0-9A-Fa-f]$/.test(val)) {
                btn.disabled = !isDigitForBase(val, currentBase);
            }
        }
        // Reformat display
        if (expression) {
            var val = evalExpression(expression);
            if (!isNaN(val)) {
                calcInput.value = formatForBase(val & 0xFFFF, currentBase);
            }
        }
    }

    function formatForBase(val, base) {
        if (base === 16) return '$' + val.toString(16).toUpperCase().padStart(4, '0');
        if (base === 2) return '%' + val.toString(2).padStart(8, '0');
        return val.toString();
    }

    function handleButton(val) {
        if (val === 'C') {
            expression = '';
            calcInput.value = '0';
            calcResult.textContent = '0';
            updateConversions(0);
            return;
        }
        if (val === '=') {
            if (!expression) return;
            var result = evalExpression(expression);
            if (isNaN(result)) {
                calcInput.value = 'Error';
                calcResult.textContent = 'Error';
                updateConversions(NaN);
                return;
            }
            result = result & 0xFFFF;
            lastResult = result;
            calcResult.textContent = formatForBase(result, currentBase);
            calcInput.value = formatForBase(result, currentBase);
            updateConversions(result);
            expression = result.toString(16).toUpperCase();
            return;
        }
        if (val === '(' || val === ')') {
            expression += val;
            calcInput.value = expression;
            return;
        }
        if ('+-*/'.indexOf(val) >= 0) {
            if (lastResult !== null && !expression) {
                expression = lastResult.toString(16).toUpperCase();
            }
            expression += val;
            calcInput.value = expression;
            lastResult = null;
            return;
        }
        // Digit
        if (currentBase === 16) {
            expression += val.toUpperCase();
        } else {
            expression += val;
        }
        calcInput.value = expression;
        // Live conversion
        var liveVal = evalExpression(expression);
        if (!isNaN(liveVal)) updateConversions(liveVal);
    }

    // Base buttons
    for (var i = 0; i < baseBtns.length; i++) {
        baseBtns[i].addEventListener('click', function() {
            setBase(parseInt(this.dataset.base));
        });
    }

    // Number/operator buttons
    for (var i = 0; i < numBtns.length; i++) {
        numBtns[i].addEventListener('click', function() {
            handleButton(this.dataset.val);
        });
    }

    // Keyboard support
    calcInput.addEventListener('keydown', function(e) {
        e.preventDefault();
        var key = e.key;
        if (key === 'Enter' || key === '=') { handleButton('='); return; }
        if (key === 'Escape' || key === 'c' || key === 'C') { handleButton('C'); return; }
        if (key === 'Backspace') {
            expression = expression.slice(0, -1);
            calcInput.value = expression || '0';
            return;
        }
        if ('+-*/'.indexOf(key) >= 0) { handleButton(key); return; }
        if (key === '(' || key === ')') { handleButton(key); return; }
        if (/^[0-9A-Fa-f]$/.test(key)) {
            if (isDigitForBase(key, currentBase)) handleButton(key);
        }
    });

    calcBtn.addEventListener('click', function() {
        openModal('calcModal');
        setBase(currentBase);
        calcInput.value = expression || '0';
        calcInput.focus();
    });

    // Init
    setBase(16);
})();
