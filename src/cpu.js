window.CPU = {

	// Registers
	a : 0,
	x : 0,
	y : 0,
	stkp : 0,   // Stack pointer
	status : 0, // Status register
	pc : 0, // Program Counter

	// Internal helper variabvles
	_addr_rel : 0x0000,
	_addr_abs : 0x0000,
	_fetched : 0x00,
	_cycles : 8,
	_opcode : 0,
	_bus : null,

	_flags : {
		C: (1 << 0),	// Carry Bit
		Z: (1 << 1),	// Zero
		I: (1 << 2),	// Disable Interrupts
		D: (1 << 3),	// Decimal Mode (unused in this implementation)
		B: (1 << 4),	// Break
		U: (1 << 5),	// Unused
		V: (1 << 6),	// Overflow
		N: (1 << 7),	// Negative

	},

	// Setup OP Code Mapping
	lookup : 
	[
		{ name :"BRK", op : this.op_BRK, addrmode : this.adr_IMM, cycles : 7 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"ASL", op : this.op_ASL, addrmode : this.adr_ZP0, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"PHP", op : this.op_PHP, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"ASL", op : this.op_ASL, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"ASL", op : this.op_ASL, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"BPL", op : this.op_BPL, addrmode : this.adr_REL, cycles : 2 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"ASL", op : this.op_ASL, addrmode : this.adr_ZPX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"CLC", op : this.op_CLC, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"ORA", op : this.op_ORA, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"ASL", op : this.op_ASL, addrmode : this.adr_ABX, cycles : 7 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"JSR", op : this.op_JSR, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"BIT", op : this.op_BIT, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"ROL", op : this.op_ROL, addrmode : this.adr_ZP0, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"PLP", op : this.op_PLP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"ROL", op : this.op_ROL, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"BIT", op : this.op_BIT, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"ROL", op : this.op_ROL, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"BMI", op : this.op_BMI, addrmode : this.adr_REL, cycles : 2 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"ROL", op : this.op_ROL, addrmode : this.adr_ZPX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"SEC", op : this.op_SEC, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"AND", op : this.op_AND, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"ROL", op : this.op_ROL, addrmode : this.adr_ABX, cycles : 7 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"RTI", op : this.op_RTI, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"LSR", op : this.op_LSR, addrmode : this.adr_ZP0, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"PHA", op : this.op_PHA, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"LSR", op : this.op_LSR, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"JMP", op : this.op_JMP, addrmode : this.adr_ABS, cycles : 3 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"LSR", op : this.op_LSR, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"BVC", op : this.op_BVC, addrmode : this.adr_REL, cycles : 2 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"LSR", op : this.op_LSR, addrmode : this.adr_ZPX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"CLI", op : this.op_CLI, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"EOR", op : this.op_EOR, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"LSR", op : this.op_LSR, addrmode : this.adr_ABX, cycles : 7 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"RTS", op : this.op_RTS, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"ROR", op : this.op_ROR, addrmode : this.adr_ZP0, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"PLA", op : this.op_PLA, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"ROR", op : this.op_ROR, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"JMP", op : this.op_JMP, addrmode : this.adr_IND, cycles : 5 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"ROR", op : this.op_ROR, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"BVS", op : this.op_BVS, addrmode : this.adr_REL, cycles : 2 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"ROR", op : this.op_ROR, addrmode : this.adr_ZPX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"SEI", op : this.op_SEI, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"ADC", op : this.op_ADC, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"ROR", op : this.op_ROR, addrmode : this.adr_ABX, cycles : 7 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"STY", op : this.op_STY, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"STX", op : this.op_STX, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"DEY", op : this.op_DEY, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"TXA", op : this.op_TXA, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"STY", op : this.op_STY, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"STX", op : this.op_STX, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"BCC", op : this.op_BCC, addrmode : this.adr_REL, cycles : 2 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_IZY, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"STY", op : this.op_STY, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"STX", op : this.op_STX, addrmode : this.adr_ZPY, cycles : 4 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"TYA", op : this.op_TYA, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_ABY, cycles : 5 },
		{ name :"TXS", op : this.op_TXS, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"STA", op : this.op_STA, addrmode : this.adr_ABX, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"LDY", op : this.op_LDY, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"LDX", op : this.op_LDX, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"LDY", op : this.op_LDY, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"LDX", op : this.op_LDX, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 3 },
		{ name :"TAY", op : this.op_TAY, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"TAX", op : this.op_TAX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"LDY", op : this.op_LDY, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"LDX", op : this.op_LDX, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"BCS", op : this.op_BCS, addrmode : this.adr_REL, cycles : 2 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"LDY", op : this.op_LDY, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"LDX", op : this.op_LDX, addrmode : this.adr_ZPY, cycles : 4 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"CLV", op : this.op_CLV, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"TSX", op : this.op_TSX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"LDY", op : this.op_LDY, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"LDA", op : this.op_LDA, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"LDX", op : this.op_LDX, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"CPY", op : this.op_CPY, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"CPY", op : this.op_CPY, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"DEC", op : this.op_DEC, addrmode : this.adr_ZP0, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"INY", op : this.op_INY, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"DEX", op : this.op_DEX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"CPY", op : this.op_CPY, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"DEC", op : this.op_DEC, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"BNE", op : this.op_BNE, addrmode : this.adr_REL, cycles : 2 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"DEC", op : this.op_DEC, addrmode : this.adr_ZPX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"CLD", op : this.op_CLD, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"NOP", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"CMP", op : this.op_CMP, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"DEC", op : this.op_DEC, addrmode : this.adr_ABX, cycles : 7 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"CPX", op : this.op_CPX, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_IZX, cycles : 6 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"CPX", op : this.op_CPX, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_ZP0, cycles : 3 },
		{ name :"INC", op : this.op_INC, addrmode : this.adr_ZP0, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 5 },
		{ name :"INX", op : this.op_INX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_IMM, cycles : 2 },
		{ name :"NOP", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_SBC, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"CPX", op : this.op_CPX, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_ABS, cycles : 4 },
		{ name :"INC", op : this.op_INC, addrmode : this.adr_ABS, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"BEQ", op : this.op_BEQ, addrmode : this.adr_REL, cycles : 2 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_IZY, cycles : 5 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 8 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_ZPX, cycles : 4 },
		{ name :"INC", op : this.op_INC, addrmode : this.adr_ZPX, cycles : 6 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 6 },
		{ name :"SED", op : this.op_SED, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_ABY, cycles : 4 },
		{ name :"NOP", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 2 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 },
		{ name :"???", op : this.op_NOP, addrmode : this.adr_IMP, cycles : 4 },
		{ name :"SBC", op : this.op_SBC, addrmode : this.adr_ABX, cycles : 4 },
		{ name :"INC", op : this.op_INC, addrmode : this.adr_ABX, cycles : 7 },
		{ name :"???", op : this.op_XXX, addrmode : this.adr_IMP, cycles : 7 }
	],
	
	connectBus : function(bus) {
		console.log("Connecting CPU to Bus");
		this._bus = bus;
	},


	// Reads an 8-bit byte from the bus, located at the specified 16-bit address
	read : function (address) {
		// In normal op "read only" is set to false. This may seem odd. Some
		// devices on the bus may change state when they are read from, and this 
		// is intentional under normal circumstances. However the disassembler will
		// want to read the data at an address without changing the state of the
		// devices on the bus
		return this._bus.cpuRead(address, false);
	},

	// Writes a byte to the bus at the specified address

	write : function (address, data) {
		this._bus.cpuWrite(address, data)
	},

	///////////////////////////////////////////////////////////////////////////////
	// EXTERNAL INPUTS

	// Forces the 6502 into a known state. This is hard-wired inside the CPU. The
	// registers are set to 0x00, the status register is cleared except for unused
	// bit which remains at 1. An absolute address is read from location 0xFFFC
	// which contains a second address that the program counter is set to. This 
	// allows the programmer to jump to a known and programmable location in the
	// memory to start executing from. Typically the programmer would set the value
	// at location 0xFFFC at compile time.
	reset : function () {

		// Get address to set program counter to
		this._addr_abs = 0xFFFC;
		let lo = this.read(this._addr_abs + 0);
		let hi = this.read(this._addr_abs + 1);

		// Set program counter 
		this.pc = (hi << 8) | lo;

		// Reset internal registers
		this.a = 0;
		this.x = 0;
		this.y = 0;
		this.stkp = 0xFD;
		this.status = 0x00 | this._flags.U;

		// Clear internal helper variables
		this._addr_rel = 0x0000;
		this._addr_abs = 0x0000;
		this._fetched = 0x00;

		// Reset takes time
		this._cycles = 8;
	},


	// CPU OPs
	// Interrupt requests are a complex op and only happen if the
	// "disable interrupt" flag is 0. IRQs can happen at any time, but
	// you dont want them to be destructive to the op of the running 
	// program. Therefore the current instruction is allowed to finish
	// (which I facilitate by doing the whole thing when cycles == 0) and 
	// then the current program counter is stored on the stack. Then the
	// current status register is stored on the stack. When the routine
	// that services the interrupt has finished, the status register
	// and program counter can be restored to how they where before it 
	// occurred. This is impemented by the "RTI" instruction. Once the IRQ
	// has happened, in a similar way to a reset, a programmable address
	// is read form hard coded location 0xFFFE, which is subsequently
	// set to the program counter.

	irq : function () {
		// If interrupts are allowed
		if (this.getFlag(this._flags.I) == 0) {
			// Push the program counter to the stack. 
			// It's 16-bits dont forget so that takes two pushes
			this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
			this.stkp--;
			this.write(0x0100 + this.stkp, this.pc & 0x00FF);
			this.stkp--;

			// Then Push the status register to the stack
			this.setFlag(this._flags.B, 0);
			this.setFlag(this._flags.U, 1);
			this.setFlag(this._flags.I, 1);
			this.write(0x0100 + this.stkp, this.status);
			this.stkp--;

			// Read new program counter location from fixed address
			this._addr_abs = 0xFFFE;
			let lo = this.read(this._addr_abs + 0);
			let hi = this.read(this._addr_abs + 1);
			this.pc = (hi << 8) | lo;

			// IRQs take time
			this._cycles = 7;
		}
	},

	
	// A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
	// same way as a regular IRQ, but reads the new program counter address
	// form location 0xFFFA.
	nmi : function() {
		this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
		this.stkp--;
		write(0x0100 + this.stkp, this.pc & 0x00FF);
		this.stkp--;

		this.setFlag(_flags.B, 0);
		this.setFlag(_flags.U, 1);
		this.setFlag(_flags.I, 1);
		this.write(0x0100 + this.stkp, this.status);
		this.stkp--;

		this._addr_abs = 0xFFFA;
		let lo = this.read(this._addr_abs + 0);
		let hi = this.read(this._addr_abs + 1);
		this.pc = (hi << 8) | lo;

		this._cycles = 8;
	},

	
	// Perform one clock cycles worth of emulation
	clock : function()  {
		// Each instruction requires a variable number of clock cycles to execute.
		// In my emulation, I only care about the final result and so I perform
		// the entire computation in one hit. In hardware, each clock cycle would
		// perform "microcode" style transformations of the CPUs state.
		//
		// To remain compliant with connected devices, it's important that the 
		// emulation also takes "time" in order to execute instructions, so I
		// implement that delay by simply counting down the cycles required by 
		// the instruction. When it reaches 0, the instruction is complete, and
		// the next one is ready to be executed.
		if (this._cycles == 0) {
			// Read next instruction byte. This 8-bit value is used to index
			// the translation table to get the relevant information about
			// how to implement the instruction
			this._opcode = this.read(this.pc);

			// Always set the unused status flag bit to 1
			this.setFlag(this._flags.U, 1);

			// Increment program counter, we read the opcode byte
			this.pc++;

			// Get Starting number of cycles
			this._cycles = this.lookup[this._opcode].cycles;

			// Perform fetch of intermmediate data using the
			// required addressing mode
			let additional_cycle1 = lookup[this._opcode].addrmode;

			// Perform op
			let additional_cycle2 = lookup[this._opcode].operate;

			// The addrmode and opcode may have altered the number
			// of cycles this instruction requires before its completed
			cycles += (additional_cycle1 & additional_cycle2);

			// Always set the unused status flag bit to 1
			this.setFlag(this._f.U, true);
		}

		// Increment global clock count - This is actually unused unless logging is enabled
		// but I've kept it in because its a handy watch variable for debugging
		//clock_count++;

		// Decrement the number of cycles remaining for this instruction
		cycles--;
	},


	///////////////////////////////////////////////////////////////////////////////
	// FLAG FUNCTIONS

	// Returns the value of a specific bit of the status register
	getFlag : function(f) {
		return ((this.status & f) > 0) ? 1 : 0;
	},

	// Sets or clears a specific bit of the status register
	setFlag : function(f, v) {
		if (v) {
			status |= f;
		}
		else {
			status &= ~f;
		}	
	},

	///////////////////////////////////////////////////////////////////////////////
	// ADDRESSING MODES

	// The 6502 can address between 0x0000 - 0xFFFF. The high byte is often referred
	// to as the "page", and the low byte is the offset into that page. This implies
	// there are 256 pages, each containing 256 bytes.
	//
	// Several addressing modes have the potential to require an additional clock
	// cycle if they cross a page boundary. This is combined with several instructions
	// that enable this additional clock cycle. So each addressing function returns
	// a flag saying it has potential, as does each instruction. If both instruction
	// and address function return 1, then an additional clock cycle is required.


	// Address Mode: Implied
	// There is no additional data required for this instruction. The instruction
	// does something very simple like like sets a status bit. However, we will
	// target the accumulator, for instructions like PHA
	adr_IMP : function() {
		fetched = a;
		return 0;
	},

	// Address Mode: Immediate
	// The instruction expects the next byte to be used as a value, so we'll prep
	// the read address to point to the next byte
	adr_IMM : function() {
		this.addr_abs = this.pc++;
		return 0;
	},

	// Address Mode: Zero Page
	// To save program bytes, zero page addressing allows you to absolutely address
	// a location in first 0xFF bytes of address range. Clearly this only requires
	// one byte instead of the usual two.
	adr_ZP0 : function() {
		this.addr_abs = this.read(this.pc);
		this.pc++;
		this.addr_abs &= 0x00FF;
		return 0;
	},

	// Address Mode: Zero Page with X Offset
	// Fundamentally the same as Zero Page addressing, but the contents of the X Register
	// is added to the supplied single byte address. This is useful for iterating through
	// ranges within the first page.
	adr_ZPX : function() {
		this.addr_abs = (this.read(this.pc) + this.x);
		this.pc++;
		this.addr_abs &= 0x00FF;
		return 0;
	},


	// Address Mode: Zero Page with Y Offset
	// Same as above but uses Y Register for offset
	adr_ZPY : function() {
		this.addr_abs = (this.read(this.pc) + this.y);
		this.pc++;
		this.addr_abs &= 0x00FF;
		return 0;
	},


	// Address Mode: Relative
	// This address mode is exclusive to branch instructions. The address
	// must reside within -128 to +127 of the branch instruction, i.e.
	// you cant directly branch to any address in the addressable range.
	adr_REL : function() {
		this.addr_rel = this.read(this.pc);
		this.pc++;
		if (this.addr_rel & 0x80)
			this.addr_rel |= 0xFF00;
		return 0;
	},


	// Address Mode: Absolute 
	// A full 16-bit address is loaded and used
	adr_ABS : function() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this.addr_abs = (hi << 8) | lo;

		return 0;
	},

	// Address Mode: Absolute with X Offset
	// Fundamentally the same as absolute addressing, but the contents of the X Register
	// is added to the supplied two byte address. If the resulting address changes
	// the page, an additional clock cycle is required
	adr_ABX : function() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this.addr_abs = (hi << 8) | lo;
		this.addr_abs += this.x;

		if ((this.addr_abs & 0xFF00) != (hi << 8))
			return 1;
		else
			return 0;
	},


	// Address Mode: Absolute with Y Offset
	// Fundamentally the same as absolute addressing, but the contents of the Y Register
	// is added to the supplied two byte address. If the resulting address changes
	// the page, an additional clock cycle is required
	adr_ABY : function() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this.addr_abs = (hi << 8) | lo;
		this.addr_abs += this.y;

		if ((this.addr_abs & 0xFF00) != (hi << 8))
			return 1;
		else
			return 0;
	},

	// Note: The next 3 address modes use indirection (aka Pointers!)

	// Address Mode: Indirect
	// The supplied 16-bit address is read to get the actual 16-bit address. This is
	// instruction is unusual in that it has a bug in the hardware! To emulate its
	// function accurately, we also need to emulate this bug. If the low byte of the
	// supplied address is 0xFF, then to read the high byte of the actual address
	// we need to cross a page boundary. This doesnt actually work on the chip as 
	// designed, instead it wraps back around in the same page, yielding an 
	// invalid actual address
	adr_IND : function() {
		let ptr_lo = this.read(this.pc);
		this.pc++;
		let ptr_hi = this.read(this.pc);
		this.pc++;

		let ptr = (ptr_hi << 8) | ptr_lo;

		if (ptr_lo == 0x00FF) // Simulate page boundary hardware bug
		{
			this.addr_abs = (this.read(ptr & 0xFF00) << 8) | this.read(ptr + 0);
		}
		else // Behave normally
		{
			this.addr_abs = (this.read(ptr + 1) << 8) | this.read(ptr + 0);
		}

		return 0;
	},

	// Address Mode: Indirect X
	// The supplied 8-bit address is offset by X Register to index
	// a location in page 0x00. The actual 16-bit address is read 
	// from this location
	adr_IZX : function() {
		let t = this.read(this.pc);
		this.pc++;

		let lo = this.read((t + this.x) & 0x00FF);
		let hi = this.read((t + this.x + 1) & 0x00FF);

		this.addr_abs = (hi << 8) | lo;

		return 0;
	},

	// Address Mode: Indirect Y
	// The supplied 8-bit address indexes a location in page 0x00. From 
	// here the actual 16-bit address is read, and the contents of
	// Y Register is added to it to offset it. If the offset causes a
	// change in page then an additional clock cycle is required.
	adr_IZY : function() {
		let t = this.read(this.pc);
		this.pc++;

		let lo = this.read(t & 0x00FF);
		let hi = this.read((t + 1) & 0x00FF);

		this.addr_abs = (hi << 8) | lo;
		this.addr_abs += this.y;

		if ((this.addr_abs & 0xFF00) != (hi << 8))
			return 1;
		else
			return 0;
	},

	// This function sources the data used by the instruction into 
	// a convenient numeric variable. Some instructions dont have to 
	// fetch data as the source is implied by the instruction. For example
	// "INX" increments the X register. There is no additional data
	// required. For all other addressing modes, the data resides at 
	// the location held within addr_abs, so it is read from there. 
	// Immediate adress mode exploits this slightly, as that has
	// set addr_abs = pc + 1, so it fetches the data from the
	// next byte for example "LDA $FF" just loads the accumulator with
	// 256, i.e. no far reaching memory fetch is required. "fetched"
	// is a variable global to the CPU, and is set by calling this 
	// function. It also returns it for convenience.
	fetch : function() {
		if (!(this.lookup[this._opcode].addrmode === this.adr_IMP)) {
			this.fetched = this.read(this.addr_abs);
		}
		return this.fetched;
	},

	///////////////////////////////////////////////////////////////////////////////
	// INSTRUCTION IMPLEMENTATIONS

	// Note: Ive started with the two most complicated instructions to emulate, which
	// ironically is addition and subtraction! Ive tried to include a detailed 
	// explanation as to why they are so complex, yet so fundamental. Im also NOT
	// going to do this through the explanation of 1 and 2's complement.

	// Instruction: Add with Carry In
	// Function:    A = A + M + C
	// Flags Out:   C, V, N, Z
	//
	// Explanation:
	// The purpose of this function is to add a value to the accumulator and a carry bit. If
	// the result is > 255 there is an overflow setting the carry bit. Ths allows you to
	// chain together ADC instructions to add numbers larger than 8-bits. This in itself is
	// simple, however the 6502 supports the concepts of Negativity/Positivity and Signed Overflow.
	//
	// 10000100 = 128 + 4 = 132 in normal circumstances, we know this as unsigned and it allows
	// us to represent numbers between 0 and 255 (given 8 bits). The 6502 can also interpret 
	// this word as something else if we assume those 8 bits represent the range -128 to +127,
	// i.e. it has become signed.
	//
	// Since 132 > 127, it effectively wraps around, through -128, to -124. This wraparound is
	// called overflow, and this is a useful to know as it indicates that the calculation has
	// gone outside the permissable range, and therefore no longer makes numeric sense.
	//
	// Note the implementation of ADD is the same in binary, this is just about how the numbers
	// are represented, so the word 10000100 can be both -124 and 132 depending upon the 
	// context the programming is using it in. We can prove this!
	//
	//  10000100 =  132  or  -124
	// +00010001 = + 17      + 17
	//  ========    ===       ===     See, both are valid additions, but our interpretation of
	//  10010101 =  149  or  -107     the context changes the value, not the hardware!
	//
	// In principle under the -128 to 127 range:
	// 10000000 = -128, 11111111 = -1, 00000000 = 0, 00000000 = +1, 01111111 = +127
	// therefore negative numbers have the most significant set, positive numbers do not
	//
	// To assist us, the 6502 can set the overflow flag, if the result of the addition has
	// wrapped around. V <- ~(A^M) & A^(A+M+C) :D lol, let's work out why!
	//
	// Let's suppose we have A = 30, M = 10 and C = 0
	//          A = 30 = 00011110
	//          M = 10 = 00001010+
	//     RESULT = 40 = 00101000
	//
	// Here we have not gone out of range. The resulting significant bit has not changed.
	// So let's make a truth table to understand when overflow has occurred. Here I take
	// the MSB of each component, where R is RESULT.
	//
	// A  M  R | V | A^R | A^M |~(A^M) | 
	// 0  0  0 | 0 |  0  |  0  |   1   |
	// 0  0  1 | 1 |  1  |  0  |   1   |
	// 0  1  0 | 0 |  0  |  1  |   0   |
	// 0  1  1 | 0 |  1  |  1  |   0   |  so V = ~(A^M) & (A^R)
	// 1  0  0 | 0 |  1  |  1  |   0   |
	// 1  0  1 | 0 |  0  |  1  |   0   |
	// 1  1  0 | 1 |  1  |  0  |   1   |
	// 1  1  1 | 0 |  0  |  0  |   1   |
	//
	// We can see how the above equation calculates V, based on A, M and R. V was chosen
	// based on the following hypothesis:
	//       Positive Number + Positive Number = Negative Result -> Overflow
	//       Negative Number + Negative Number = Positive Result -> Overflow
	//       Positive Number + Negative Number = Either Result -> Cannot Overflow
	//       Positive Number + Positive Number = Positive Result -> OK! No Overflow
	//       Negative Number + Negative Number = Negative Result -> OK! NO Overflow
	op_ADC : function() {
		// Grab the data that we are adding to the accumulator
		this.fetch();

		// Add is performed in 16-bit domain for emulation to capture any
		// carry bit, which will exist in bit 8 of the 16-bit word
		let temp = this.a + this._fetched + this.getFlag(this._flags.C);

		// The carry flag out exists in the high byte bit 0
		this.setFlag(this._flags.C, temp > 255);

		// The Zero flag is set if the result is 0
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0);

		// The signed Overflow flag is set based on all that up there! :D
		this.setFlag(this._flags.V, (~(this.a ^ this.fetched) & (this.a ^ this.temp)) & 0x0080);

		// The negative flag is set to the most significant bit of the result
		this.setFlag(this._flags.N, temp & 0x80);

		// Load the result into the accumulator (it's 8-bit dont forget!)
		this.a = temp & 0x00FF;

		// This instruction has the potential to require an additional clock cycle
		return 1;
	},

	// Instruction: Subtraction with Borrow In
	// Function:    A = A - M - (1 - C)
	// Flags Out:   C, V, N, Z
	//
	// Explanation:
	// Given the explanation for ADC above, we can reorganise our data
	// to use the same computation for addition, for subtraction by multiplying
	// the data by -1, i.e. make it negative
	//
	// A = A - M - (1 - C)  ->  A = A + -1 * (M - (1 - C))  ->  A = A + (-M + 1 + C)
	//
	// To make a signed positive number negative, we can invert the bits and add 1
	// (OK, I lied, a little bit of 1 and 2s complement :P)
	//
	//  5 = 00000101
	// -5 = 11111010 + 00000001 = 11111011 (or 251 in our 0 to 255 range)
	//
	// The range is actually unimportant, because if I take the value 15, and add 251
	// to it, given we wrap around at 256, the result is 10, so it has effectively 
	// subtracted 5, which was the original intention. (15 + 251) % 256 = 10
	//
	// Note that the equation above used (1-C), but this got converted to + 1 + C.
	// This means we already have the +1, so all we need to do is invert the bits
	// of M, the data(!) therfore we can simply add, exactly the same way we did 
	// before.
	op_SBC : function() {
		this.fetch();

		// Operating in 16-bit domain to capture carry out

		// We can invert the bottom 8 bits with bitwise xor
		let value = (this._fetched) ^ 0x00FF;

		// Notice this is exactly the same as addition from here!
		temp = this.a + value + this.getFlag(this._flags.C);
		this.setFlag(this._flags.C, temp & 0xFF00);
		this.setFlag(this._flags.Z, ((temp & 0x00FF) == 0));
		this.setFlag(this._flags.V, (temp ^ this.a) & (temp ^ value) & 0x0080);
		this.setFlag(this._flags.N, temp & 0x0080);
		this.a = temp & 0x00FF;
		return 1;
	},

	// OK! Complicated ops are done! the following are much simpler
	// and conventional. The typical order of events is:
	// 1) Fetch the data you are working with
	// 2) Perform calculation
	// 3) Store the result in desired place
	// 4) Set Flags of the status register
	// 5) Return if instruction has potential to require additional 
	//    clock cycle

/* 
	// Instruction: Bitwise Logic AND
	// Function:    A = A & M
	// Flags Out:   N, Z
	this.op_AND = function() {
		this.fetch();
		this.a = this.a & this._fetched;
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 1;
	}


	// Instruction: Arithmetic Shift Left
	// Function:    A = C <- (A << 1) <- 0
	// Flags Out:   N, Z, C
	uint8_t olc6502:: ASL()
	{
		fetch();
		temp = (uint16_t)fetched << 1;
		SetFlag(C, (temp & 0xFF00) > 0);
		SetFlag(Z, (temp & 0x00FF) == 0x00);
		SetFlag(N, temp & 0x80);
		if (lookup[this._opcode ].addrmode == & olc6502:: IMP)
		a = temp & 0x00FF;
	else
		write(addr_abs, temp & 0x00FF);
		return 0;
	}


	// Instruction: Branch if Carry Clear
	// Function:    if(C == 0) pc = address 
	uint8_t olc6502:: BCC()
	{
		if (GetFlag(C) == 0) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}


	// Instruction: Branch if Carry Set
	// Function:    if(C == 1) pc = address
	uint8_t olc6502:: BCS()
	{
		if (GetFlag(C) == 1) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}


	// Instruction: Branch if Equal
	// Function:    if(Z == 1) pc = address
	uint8_t olc6502:: BEQ()
	{
		if (GetFlag(Z) == 1) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}

	uint8_t olc6502:: BIT()
	{
		fetch();
		temp = a & fetched;
		SetFlag(Z, (temp & 0x00FF) == 0x00);
		SetFlag(N, fetched & (1 << 7));
		SetFlag(V, fetched & (1 << 6));
		return 0;
	}


	// Instruction: Branch if Negative
	// Function:    if(N == 1) pc = address
	uint8_t olc6502:: BMI()
	{
		if (GetFlag(N) == 1) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}


	// Instruction: Branch if Not Equal
	// Function:    if(Z == 0) pc = address
	uint8_t olc6502:: BNE()
	{
		if (GetFlag(Z) == 0) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}


	// Instruction: Branch if Positive
	// Function:    if(N == 0) pc = address
	uint8_t olc6502:: BPL()
	{
		if (GetFlag(N) == 0) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}

	// Instruction: Break
	// Function:    Program Sourced Interrupt
	uint8_t olc6502:: BRK()
	{
		pc++;

		SetFlag(I, 1);
		write(0x0100 + stkp, (pc >> 8) & 0x00FF);
		stkp--;
		write(0x0100 + stkp, pc & 0x00FF);
		stkp--;

		SetFlag(B, 1);
		write(0x0100 + stkp, status);
		stkp--;
		SetFlag(B, 0);

		pc = (uint16_t)read(0xFFFE) | ((uint16_t)read(0xFFFF) << 8);
		return 0;
	}


	// Instruction: Branch if Overflow Clear
	// Function:    if(V == 0) pc = address
	uint8_t olc6502:: BVC()
	{
		if (GetFlag(V) == 0) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}


	// Instruction: Branch if Overflow Set
	// Function:    if(V == 1) pc = address
	uint8_t olc6502:: BVS()
	{
		if (GetFlag(V) == 1) {
			cycles++;
			addr_abs = pc + addr_rel;

			if ((addr_abs & 0xFF00) != (pc & 0xFF00))
				cycles++;

			pc = addr_abs;
		}
		return 0;
	}


	// Instruction: Clear Carry Flag
	// Function:    C = 0
	uint8_t olc6502:: CLC()
	{
		SetFlag(C, false);
		return 0;
	}


	// Instruction: Clear Decimal Flag
	// Function:    D = 0
	uint8_t olc6502:: CLD()
	{
		SetFlag(D, false);
		return 0;
	}


	// Instruction: Disable Interrupts / Clear Interrupt Flag
	// Function:    I = 0
	uint8_t olc6502:: CLI()
	{
		SetFlag(I, false);
		return 0;
	}


	// Instruction: Clear Overflow Flag
	// Function:    V = 0
	uint8_t olc6502:: CLV()
	{
		SetFlag(V, false);
		return 0;
	}

	// Instruction: Compare Accumulator
	// Function:    C <- A >= M      Z <- (A - M) == 0
	// Flags Out:   N, C, Z
	uint8_t olc6502:: CMP()
	{
		fetch();
		temp = (uint16_t)a - (uint16_t)fetched;
		SetFlag(C, a >= fetched);
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		return 1;
	}


	// Instruction: Compare X Register
	// Function:    C <- X >= M      Z <- (X - M) == 0
	// Flags Out:   N, C, Z
	uint8_t olc6502:: CPX()
	{
		fetch();
		temp = (uint16_t)x - (uint16_t)fetched;
		SetFlag(C, x >= fetched);
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		return 0;
	}


	// Instruction: Compare Y Register
	// Function:    C <- Y >= M      Z <- (Y - M) == 0
	// Flags Out:   N, C, Z
	uint8_t olc6502:: CPY()
	{
		fetch();
		temp = (uint16_t)y - (uint16_t)fetched;
		SetFlag(C, y >= fetched);
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		return 0;
	}


	// Instruction: Decrement Value at Memory Location
	// Function:    M = M - 1
	// Flags Out:   N, Z
	uint8_t olc6502:: DEC()
	{
		fetch();
		temp = fetched - 1;
		write(addr_abs, temp & 0x00FF);
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		return 0;
	}


	// Instruction: Decrement X Register
	// Function:    X = X - 1
	// Flags Out:   N, Z
	uint8_t olc6502:: DEX()
	{
		x--;
		SetFlag(Z, x == 0x00);
		SetFlag(N, x & 0x80);
		return 0;
	}


	// Instruction: Decrement Y Register
	// Function:    Y = Y - 1
	// Flags Out:   N, Z
	uint8_t olc6502:: DEY()
	{
		y--;
		SetFlag(Z, y == 0x00);
		SetFlag(N, y & 0x80);
		return 0;
	}


	// Instruction: Bitwise Logic XOR
	// Function:    A = A xor M
	// Flags Out:   N, Z
	uint8_t olc6502:: EOR()
	{
		fetch();
		a = a ^ fetched;
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 1;
	}


	// Instruction: Increment Value at Memory Location
	// Function:    M = M + 1
	// Flags Out:   N, Z
	uint8_t olc6502:: INC()
	{
		fetch();
		temp = fetched + 1;
		write(addr_abs, temp & 0x00FF);
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		return 0;
	}


	// Instruction: Increment X Register
	// Function:    X = X + 1
	// Flags Out:   N, Z
	uint8_t olc6502:: INX()
	{
		x++;
		SetFlag(Z, x == 0x00);
		SetFlag(N, x & 0x80);
		return 0;
	}


	// Instruction: Increment Y Register
	// Function:    Y = Y + 1
	// Flags Out:   N, Z
	uint8_t olc6502:: INY()
	{
		y++;
		SetFlag(Z, y == 0x00);
		SetFlag(N, y & 0x80);
		return 0;
	}


	// Instruction: Jump To Location
	// Function:    pc = address
	uint8_t olc6502:: JMP()
	{
		pc = addr_abs;
		return 0;
	}


	// Instruction: Jump To Sub-Routine
	// Function:    Push current pc to stack, pc = address
	uint8_t olc6502:: JSR()
	{
		pc--;

		write(0x0100 + stkp, (pc >> 8) & 0x00FF);
		stkp--;
		write(0x0100 + stkp, pc & 0x00FF);
		stkp--;

		pc = addr_abs;
		return 0;
	}


	// Instruction: Load The Accumulator
	// Function:    A = M
	// Flags Out:   N, Z
	uint8_t olc6502:: LDA()
	{
		fetch();
		a = fetched;
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 1;
	}


	// Instruction: Load The X Register
	// Function:    X = M
	// Flags Out:   N, Z
	uint8_t olc6502:: LDX()
	{
		fetch();
		x = fetched;
		SetFlag(Z, x == 0x00);
		SetFlag(N, x & 0x80);
		return 1;
	}


	// Instruction: Load The Y Register
	// Function:    Y = M
	// Flags Out:   N, Z
	uint8_t olc6502:: LDY()
	{
		fetch();
		y = fetched;
		SetFlag(Z, y == 0x00);
		SetFlag(N, y & 0x80);
		return 1;
	}

	uint8_t olc6502:: LSR()
	{
		fetch();
		SetFlag(C, fetched & 0x0001);
		temp = fetched >> 1;
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		if (lookup[this._opcode].addrmode == & olc6502:: IMP)
		a = temp & 0x00FF;
	else
		write(addr_abs, temp & 0x00FF);
		return 0;
	}

	uint8_t olc6502:: NOP()
	{
		// Sadly not all NOPs are equal, Ive added a few here
		// based on https://wiki.nesdev.com/w/index.php/CPU_unofficial_opcodes
		// and will add more based on game compatibility, and ultimately
		// I'd like to cover all illegal opcodes too
		switch (this._opcode) {
			case 0x1C:
			case 0x3C:
			case 0x5C:
			case 0x7C:
			case 0xDC:
			case 0xFC:
				return 1;
				break;
		}
		return 0;
	}


	// Instruction: Bitwise Logic OR
	// Function:    A = A | M
	// Flags Out:   N, Z
	uint8_t olc6502:: ORA()
	{
		fetch();
		a = a | fetched;
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 1;
	}


	// Instruction: Push Accumulator to Stack
	// Function:    A -> stack
	uint8_t olc6502:: PHA()
	{
		write(0x0100 + stkp, a);
		stkp--;
		return 0;
	}


	// Instruction: Push Status Register to Stack
	// Function:    status -> stack
	// Note:        Break flag is set to 1 before push
	uint8_t olc6502:: PHP()
	{
		write(0x0100 + stkp, status | B | U);
		SetFlag(B, 0);
		SetFlag(U, 0);
		stkp--;
		return 0;
	}


	// Instruction: Pop Accumulator off Stack
	// Function:    A <- stack
	// Flags Out:   N, Z
	uint8_t olc6502:: PLA()
	{
		stkp++;
		a = read(0x0100 + stkp);
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 0;
	}


	// Instruction: Pop Status Register off Stack
	// Function:    Status <- stack
	uint8_t olc6502:: PLP()
	{
		stkp++;
		status = read(0x0100 + stkp);
		SetFlag(U, 1);
		return 0;
	}

	uint8_t olc6502:: ROL()
	{
		fetch();
		temp = (uint16_t)(fetched << 1) | GetFlag(C);
		SetFlag(C, temp & 0xFF00);
		SetFlag(Z, (temp & 0x00FF) == 0x0000);
		SetFlag(N, temp & 0x0080);
		if (lookup[this._opcode].addrmode == & olc6502:: IMP)
		a = temp & 0x00FF;
	else
		write(addr_abs, temp & 0x00FF);
		return 0;
	}

	uint8_t olc6502:: ROR()
	{
		fetch();
		temp = (uint16_t)(GetFlag(C) << 7) | (fetched >> 1);
		SetFlag(C, fetched & 0x01);
		SetFlag(Z, (temp & 0x00FF) == 0x00);
		SetFlag(N, temp & 0x0080);
		if (lookup[this._opcode].addrmode == & olc6502:: IMP)
		a = temp & 0x00FF;
	else
		write(addr_abs, temp & 0x00FF);
		return 0;
	}

	uint8_t olc6502:: RTI()
	{
		stkp++;
		status = read(0x0100 + stkp);
		status &= ~B;
		status &= ~U;

		stkp++;
		pc = (uint16_t)read(0x0100 + stkp);
		stkp++;
		pc |= (uint16_t)read(0x0100 + stkp) << 8;
		return 0;
	}

	uint8_t olc6502:: RTS()
	{
		stkp++;
		pc = (uint16_t)read(0x0100 + stkp);
		stkp++;
		pc |= (uint16_t)read(0x0100 + stkp) << 8;

		pc++;
		return 0;
	}




	// Instruction: Set Carry Flag
	// Function:    C = 1
	uint8_t olc6502:: SEC()
	{
		SetFlag(C, true);
		return 0;
	}


	// Instruction: Set Decimal Flag
	// Function:    D = 1
	uint8_t olc6502:: SED()
	{
		SetFlag(D, true);
		return 0;
	}


	// Instruction: Set Interrupt Flag / Enable Interrupts
	// Function:    I = 1
	uint8_t olc6502:: SEI()
	{
		SetFlag(I, true);
		return 0;
	}


	// Instruction: Store Accumulator at Address
	// Function:    M = A
	uint8_t olc6502:: STA()
	{
		write(addr_abs, a);
		return 0;
	}


	// Instruction: Store X Register at Address
	// Function:    M = X
	uint8_t olc6502:: STX()
	{
		write(addr_abs, x);
		return 0;
	}


	// Instruction: Store Y Register at Address
	// Function:    M = Y
	uint8_t olc6502:: STY()
	{
		write(addr_abs, y);
		return 0;
	}


	// Instruction: Transfer Accumulator to X Register
	// Function:    X = A
	// Flags Out:   N, Z
	uint8_t olc6502:: TAX()
	{
		x = a;
		SetFlag(Z, x == 0x00);
		SetFlag(N, x & 0x80);
		return 0;
	}


	// Instruction: Transfer Accumulator to Y Register
	// Function:    Y = A
	// Flags Out:   N, Z
	uint8_t olc6502:: TAY()
	{
		y = a;
		SetFlag(Z, y == 0x00);
		SetFlag(N, y & 0x80);
		return 0;
	}


	// Instruction: Transfer Stack Pointer to X Register
	// Function:    X = stack pointer
	// Flags Out:   N, Z
	uint8_t olc6502:: TSX()
	{
		x = stkp;
		SetFlag(Z, x == 0x00);
		SetFlag(N, x & 0x80);
		return 0;
	}


	// Instruction: Transfer X Register to Accumulator
	// Function:    A = X
	// Flags Out:   N, Z
	uint8_t olc6502:: TXA()
	{
		a = x;
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 0;
	}


	// Instruction: Transfer X Register to Stack Pointer
	// Function:    stack pointer = X
	uint8_t olc6502:: TXS()
	{
		stkp = x;
		return 0;
	}


	// Instruction: Transfer Y Register to Accumulator
	// Function:    A = Y
	// Flags Out:   N, Z
	uint8_t olc6502:: TYA()
	{
		a = y;
		SetFlag(Z, a == 0x00);
		SetFlag(N, a & 0x80);
		return 0;
	}


	// This function captures illegal opcodes
	uint8_t olc6502:: XXX()
	{
		return 0;
	}


	///////////////////////////////////////////////////////////////////////////////
	// HELPER FUNCTIONS

	bool olc6502:: complete()
	{
		return cycles == 0;
	}
*/

	// This is the disassembly function. Its workings are not required for emulation.
	// It is merely a convenience function to turn the binary instruction code into
	// human readable form. Its included as part of the emulator because it can take
	// advantage of many of the CPUs internal ops to do this.
	disassemble : function(nStart, nStop)
	{
		let addr = nStart;
		let value = 0x00, lo = 0x00, hi = 0x00;
		let mapLines = [];
		//let line_addr = 0;

		// Starting at the specified address we read an instruction
		// byte, which in turn yields information from the lookup table
		// as to how many additional bytes we need to read and what the
		// addressing mode is. I need this info to assemble human readable
		// syntax, which is different depending upon the addressing mode

		// As the instruction is decoded, a std::string is assembled
		// with the readable output
		while (addr <= nStop)
		{
			//line_addr = addr;
			//this = window.CPU;
			// Prefix line with instruction address
			let sInst = toHex(addr, 4) + ": ";

			// Read instruction, and get its readable name
			let opcode = this._bus.cpuRead(addr++, true);
			sInst += this.lookup[opcode].name + " ";

			// Get oprands from desired locations, and form the
			// instruction based upon its addressing mode. These
			// routines mimmick the actual fetch routine of the
			// 6502 in order to get accurate data as part of the
			// instruction
			if (this.lookup[opcode].addrmode === this.adr_IMP)
			{
				sInst += " {IMP}";
			}
			else if (this.lookup[opcode].addrmode === this.adr_IMM)
			{
				value = bus.read(addr, true); addr++;
				sInst += "#$" + toHex(value, 2) + " {IMM}";
			}
			else if (this.lookup[opcode].addrmode === this.adr_ZP0)
			{
				lo = bus.read(addr, true); addr++;
				hi = 0x00;
				sInst += "$" + toHex(lo, 2) + " {ZP0}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_ZPX)
			{
				lo = bus.read(addr, true); addr++;
				hi = 0x00;
				sInst += "$" + toHex(lo, 2) + ", X {ZPX}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_ZPY)
			{
				lo = bus.read(addr, true); addr++;
				hi = 0x00;
				sInst += "$" + toHex(lo, 2) + ", Y {ZPY}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_IZX)
			{
				lo = bus.read(addr, true); addr++;
				hi = 0x00;
				sInst += "($" + toHex(lo, 2) + ", X) {IZX}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_IZY)
			{
				lo = bus.read(addr, true); addr++;
				hi = 0x00;
				sInst += "($" + toHex(lo, 2) + "), Y {IZY}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_ABS)
			{
				lo = bus.read(addr, true); addr++;
				hi = bus.read(addr, true); addr++;
				sInst += "$" + toHex((hi << 8) | lo, 4) + " {ABS}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_ABX)
			{
				lo = bus.read(addr, true); addr++;
				hi = bus.read(addr, true); addr++;
				sInst += "$" + toHex((hi << 8) | lo, 4) + ", X {ABX}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_ABY)
			{
				lo = bus.read(addr, true); ;
				hi = bus.read(addr, true); addr++;
				sInst += "$" + toHex((uint16_t)(hi << 8) | lo, 4) + ", Y {ABY}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_IND)
			{
				lo = bus.read(addr++, true); 
				hi = bus.read(addr++, true);
				sInst += "($" + toHex((uint16_t)(hi << 8) | lo, 4) + ") {IND}";
			}
			else if (this.lookup[opcode].addrmode  === this.adr_REL)
			{
				value = bus.read(addr++, true);
				sInst += "$" + toHex(value, 2) + " [$" + hex(addr + value, 4) + "] {REL}";
			}

			// Add the formed string to a std::map, using the instruction's
			// address as the key. This makes it convenient to look for later
			// as the instructions are variable in length, so a straight up
			// incremental index is not sufficient.
			mapLines.push(sInst);
		}
		return mapLines;
	}
};