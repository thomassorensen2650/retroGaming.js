"use strict";
/**
 * This is a virtual 6502 CPU used in the 8-bit Nitendo.
 */
window.CPU = {

	//
	// Registers
	//

	/**
	 * The A Register
	 * @type {number}
	 */
	_a : 0,
	set a(newValue) { this._a = newValue & 0xFF;  this.propertyListener("a", newValue) },	
	get a() { return this._a; },

	/**
	 * The X Register
	 * @type {number}
	 */
	_x : 0,
	set x(newValue) { this._x = newValue & 0xFF;  this.propertyListener("x", newValue) },	
	get x() { return this._x; },

	/**
	 * The Y Register
	 * @type {number}
	 */
	_y : 0,
	set y(newValue) { this._y = newValue & 0xFF;  this.propertyListener("y", newValue) },		
	get y() { return this._y; },

	/**
	 * The Stack Pointer
	 * @type {number}
	 */
	_stkp : 0,   // Stack pointer
	set stkp(newValue) { this._stkp = newValue & 0xFFFF; this.propertyListener("stkp", newValue) },	
	get stkp() { return this._stkp; },

	/**
	 * The Status Resgister
	 * @type {number}
	 */
	_status : 0, // Status register
	set status(newValue) { this._status = newValue & 0xFFFF; this.propertyListener("status", newValue) },	
	get status() { return this._status; },

	/**
	 * @type {number}
	 */
	_pc : 0, // Program Counter
	set pc(newValue) { this._pc = newValue & 0xFFFF; this.propertyListener("pc", newValue) },	
	get pc() { return this._pc; },

	// A listerner that will be called if any public properties are changed.
	propertyListener: function(property, newValue) {},

	//
	// Internal helper variabvles
	//

	/**
	 * @type {number}
	 */
	_addr_rel : 0x0000,
	/**
	 * @type {number}
	 */
	_addr_abs : 0x0000,
	/**
	 * @type {number}
	 */
	_fetched : 0x00,
	/**
	 * @type {number}
	 */
	_cycles : 8,
	/**
	 * @type {number}
	 */
	_opcode : 0,
	/**
	 * @type {object}
	 */
	_bus : null,

	/** @enum {number} */
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

	connectBus : function(bus) {
		console.log("Connecting CPU to Bus");
		this._bus = bus;
	},


	// 
	/**
	 * Reads an 8-bit byte from the bus, located at the specified 16-bit address
	 * @param address {number}
	 * @returns {number}
	 */
	read : function (address) {
		// In normal op "read only" is set to false. This may seem odd. Some
		// devices on the bus may change state when they are read from, and this 
		// is intentional under normal circumstances. However the disassembler will
		// want to read the data at an address without changing the state of the
		// devices on the bus
		return this._bus.cpuRead(address, false);
	},

	/**
	 * Writes a byte to the bus at the specified address
	 * @param address {number}
	 * @param data {number}
	 * @returns {void}
	 */
	write : function (address, data) {
		this._bus.cpuWrite(address, data)
	},

	///////////////////////////////////////////////////////////////////////////////
	// EXTERNAL INPUTS

	/** Forces the 6502 into a known state. This is hard-wired inside the CPU. The
	 * registers are set to 0x00, the status register is cleared except for unused
	 * bit which remains at 1. An absolute address is read from location 0xFFFC
	 * which contains a second address that the program counter is set to. This 
	 * allows the programmer to jump to a known and programmable location in the
	 * memory to start executing from. Typically the programmer would set the value
	 * at location 0xFFFC at compile time.
	 * @returns {void}
	*/
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


	/** CPU OPs
	 *  Interrupt requests are a complex op and only happen if the
	 * "disable interrupt" flag is 0. IRQs can happen at any time, but
	 * you dont want them to be destructive to the op of the running 
	 * program. Therefore the current instruction is allowed to finish
	 * (which I facilitate by doing the whole thing when cycles == 0) and 
	 * then the current program counter is stored on the stack. Then the
	 * current status register is stored on the stack. When the routine
	 * that services the interrupt has finished, the status register
	 * and program counter can be restored to how they where before it 
	 * occurred. This is impemented by the "RTI" instruction. Once the IRQ
	 * has happened, in a similar way to a reset, a programmable address
	 * is read form hard coded location 0xFFFE, which is subsequently
	 * set to the program counter.
	 * @returns {void}
	 */
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

	
	/**  A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
	 * same way as a regular IRQ, but reads the new program counter address
	 * form location 0xFFFA.
	 * @returns {void}
	 */
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

	
	/**
	 * Perform one clock cycles worth of emulation
	 */ 
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
			let additional_cycle1 = this.lookup[this._opcode].addrmode.call(this);

			// Perform op
			let additional_cycle2 = this.lookup[this._opcode].op.call(this);

			// The addrmode and opcode may have altered the number
			// of cycles this instruction requires before its completed
			this._cycles += (additional_cycle1 & additional_cycle2);

			// Always set the unused status flag bit to 1
			this.setFlag(this._flags.U, true);
		}

		// Increment global clock count - This is actually unused unless logging is enabled
		// but I've kept it in because its a handy watch variable for debugging
		//clock_count++;

		// Decrement the number of cycles remaining for this instruction
		this._cycles--;
	},


	///////////////////////////////////////////////////////////////////////////////
	// FLAG FUNCTIONS

	/** Returns the value of a specific bit of the status register 
	 * @param f {number} flag to read
	 * @returns {number}
	 */ 
	getFlag : function(f) {
		return ((this.status & f) > 0) ? 1 : 0;
	},

	/**
	 * Sets or clears a specific bit of the status register
	 *  @param f {number} the flag to set
	 *  @param v {number} the value to set
	 */ 
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


	/**
	 * Address Mode: Implied
 	 * There is no additional data required for this instruction. The instruction
	 * does something very simple like like sets a status bit. However, we will
	 * target the accumulator, for instructions like PHA
	* @returns {number}  - always returns zero
	*/
	adr_IMP : function() {
		this._fetched = this.a;
		return 0;
	},

	/** Address Mode: Immediate
	* The instruction expects the next byte to be used as a value, so we'll prep
	* the read address to point to the next byte
	* @returns {number} - always returns zero
	*/
	adr_IMM : function() {
		this._addr_abs = this.pc++;
		return 0;
	},

	/** Address Mode: Zero Page
	* To save program bytes, zero page addressing allows you to absolutely address
	* a location in first 0xFF bytes of address range. Clearly this only requires
	* one byte instead of the usual two.
	* @returns {number} - always returns zero
	*/
	adr_ZP0 : function() {
		this._addr_abs = this.read(this.pc);
		this.pc++;
		this._addr_abs &= 0x00FF;
		return 0;
	},

	/** Address Mode: Zero Page with X Offset
	 * Fundamentally the same as Zero Page addressing, but the contents of the X Register
	 * is added to the supplied single byte address. This is useful for iterating through
	 * ranges within the first page.
	 * @returns {number} - always returns zero
	 */
	adr_ZPX : function() {
		this._addr_abs = (this.read(this.pc) + this.x);
		this.pc++;
		this._addr_abs &= 0x00FF;
		return 0;
	},


	/** Address Mode: Zero Page with Y Offset
	 * Same as above but uses Y Register for offset
	 * @returns {number} - always returns zero
	 * */ 
	adr_ZPY : function() {
		this._addr_abs = (this.read(this.pc) + this.y);
		this.pc++;
		this._addr_abs &= 0x00FF;
		return 0;
	},

	/** Address Mode: Relative
	 * This address mode is exclusive to branch instructions. The address
	 * must reside within -128 to +127 of the branch instruction, i.e.
	 * you cant directly branch to any address in the addressable range.
	 * @returns {number} - always returns zero
	 */
	adr_REL : function() {
		this._addr_rel = this.read(this.pc);
		this.pc++;
		if (this._addr_rel & 0x80 > 0)
			this._addr_rel |= 0xFF00;
		return 0;
	},

	/** Address Mode: Absolute 
	* A full 16-bit address is loaded and used
	* @returns {number} - always returns zero
	*/
	adr_ABS : function() {
		let lo = this.read(this.pc); // TODO: PC ++ inline everywhere when tested
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this._addr_abs = (hi << 8) | lo;

		return 0;
	},

	/** Address Mode: Absolute with X Offset
	 * Fundamentally the same as absolute addressing, but the contents of the X Register
	 * is added to the supplied two byte address. If the resulting address changes
	 * the page, an additional clock cycle is required
	 * @returns {number} - 1 if extra cycle is required
	 */
	adr_ABX : function() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this._addr_abs = (hi << 8) | lo;
		this._addr_abs += this.x;

		if ((this._addr_abs & 0xFF00) != (hi << 8))
			return 1;
		else
			return 0;
	},

	/** Address Mode: Absolute with Y Offset
	 * Fundamentally the same as absolute addressing, but the contents of the Y Register
	 * is added to the supplied two byte address. If the resulting address changes
	 * the page, an additional clock cycle is required
	 * @returns {number} - 1 if extra cycle is required
	 */
	adr_ABY : function() {
		let lo = this.read(this.pc);
		this.pc++;
		let hi = this.read(this.pc);
		this.pc++;

		this._addr_abs = (hi << 8) | lo;
		this._addr_abs += this.y;

		if ((this._addr_abs & 0xFF00) != (hi << 8))
			return 1;
		else
			return 0;
	},

	// Note: The next 3 address modes use indirection (aka Pointers!)

	/**  Address Mode: Indirect
	 * The supplied 16-bit address is read to get the actual 16-bit address. This is
	 * instruction is unusual in that it has a bug in the hardware! To emulate its
	 * function accurately, we also need to emulate this bug. If the low byte of the
	 * supplied address is 0xFF, then to read the high byte of the actual address
	 * we need to cross a page boundary. This doesnt actually work on the chip as 
	 * designed, instead it wraps back around in the same page, yielding an 
	 * invalid actual address
	 * @returns {number} - always returns zero
	 */
	adr_IND : function() {
		let ptr_lo = this.read(this.pc);
		this.pc++;
		let ptr_hi = this.read(this.pc);
		this.pc++;

		let ptr = (ptr_hi << 8) | ptr_lo;

		if (ptr_lo == 0x00FF) // Simulate page boundary hardware bug
		{
			this._addr_abs = (this.read(ptr & 0xFF00) << 8) | this.read(ptr + 0);
		}
		else // Behave normally
		{
			this._addr_abs = (this.read(ptr + 1) << 8) | this.read(ptr + 0);
		}

		return 0;
	},

	/** Address Mode: Indirect X
	 * The supplied 8-bit address is offset by X Register to index
	 * a location in page 0x00. The actual 16-bit address is read 
	 * from this location
	 * @returns {number} - always returns zero
	 */
	adr_IZX : function() {
		let t = this.read(this.pc);
		this.pc++;

		let lo = this.read((t + this.x) & 0x00FF);
		let hi = this.read((t + this.x + 1) & 0x00FF);

		this._addr_abs = (hi << 8) | lo;

		return 0;
	},

	/**  Address Mode: Indirect Y
	 * The supplied 8-bit address indexes a location in page 0x00. From 
	 * here the actual 16-bit address is read, and the contents of
	 * Y Register is added to it to offset it. If the offset causes a
	 * change in page then an additional clock cycle is required.
	 * @returns {number} - 1 if extra cycle is required
	 */
	adr_IZY : function() {
		let t = this.read(this.pc);
		this.pc++;

		let lo = this.read(t & 0x00FF);
		let hi = this.read((t + 1) & 0x00FF);

		this._addr_abs = (hi << 8) | lo;
		this._addr_abs += this.y;

		if ((this._addr_abs & 0xFF00) != (hi << 8))
			return 1;
		else
			return 0;
	},

	/**  This function sources the data used by the instruction into 
	 * a convenient numeric variable. Some instructions dont have to 
	 * fetch data as the source is implied by the instruction. For example
	 * "INX" increments the X register. There is no additional data
	 * required. For all other addressing modes, the data resides at 
	 * the location held within addr_abs, so it is read from there. 
	 * Immediate adress mode exploits this slightly, as that has
	 * set addr_abs = pc + 1, so it fetches the data from the
	 * next byte for example "LDA $FF" just loads the accumulator with
	 * 256, i.e. no far reaching memory fetch is required. "fetched"
	 * is a variable global to the CPU, and is set by calling this 
	 * function. It also returns it for convenience.
	 * @returns {number} the fetched value
	 */
	fetch : function() {
		if (!(this.lookup[this._opcode].addrmode === c.adr_IMP)) {
			this._fetched = this.read(this._addr_abs);
		}
		return this._fetched;
	},

	///////////////////////////////////////////////////////////////////////////////
	// INSTRUCTION IMPLEMENTATIONS

	/** Note: Ive started with the two most complicated instructions to emulate, which
	 * ironically is addition and subtraction! Ive tried to include a detailed 
	 * explanation as to why they are so complex, yet so fundamental. Im also NOT
	 * going to do this through the explanation of 1 and 2's complement.

	 * Instruction: Add with Carry In
	 * Function:    A = A + M + C
	 * Flags Out:   C, V, N, Z
	 *
	 * Explanation:
	 * The purpose of this function is to add a value to the accumulator and a carry bit. If
	 * the result is > 255 there is an overflow setting the carry bit. Ths allows you to
	 * chain together ADC instructions to add numbers larger than 8-bits. This in itself is
	 * simple, however the 6502 supports the concepts of Negativity/Positivity and Signed Overflow.
	 *
	 * 10000100 = 128 + 4 = 132 in normal circumstances, we know this as unsigned and it allows
	 * us to represent numbers between 0 and 255 (given 8 bits). The 6502 can also interpret 
	 * this word as something else if we assume those 8 bits represent the range -128 to +127,
	 * i.e. it has become signed.
	 *
	 * Since 132 > 127, it effectively wraps around, through -128, to -124. This wraparound is
	 * called overflow, and this is a useful to know as it indicates that the calculation has
	 * gone outside the permissable range, and therefore no longer makes numeric sense.
	 *
	 * Note the implementation of ADD is the same in binary, this is just about how the numbers
	 * are represented, so the word 10000100 can be both -124 and 132 depending upon the 
	 * context the programming is using it in. We can prove this!
	 *
	 *  10000100 =  132  or  -124
	 * +00010001 = + 17      + 17
	 *  ========    ===       ===     See, both are valid additions, but our interpretation of
	 *  10010101 =  149  or  -107     the context changes the value, not the hardware!
	 *
	 * In principle under the -128 to 127 range:
	 * 10000000 = -128, 11111111 = -1, 00000000 = 0, 00000000 = +1, 01111111 = +127
	 * therefore negative numbers have the most significant set, positive numbers do not
	 *
	 * To assist us, the 6502 can set the overflow flag, if the result of the addition has
	 * wrapped around. V <- ~(A^M) & A^(A+M+C) :D lol, let's work out why!
	 *
	 * Let's suppose we have A = 30, M = 10 and C = 0
	 *          A = 30 = 00011110
	 *          M = 10 = 00001010+
	 *     RESULT = 40 = 00101000
	 *
	 * Here we have not gone out of range. The resulting significant bit has not changed.
	 * So let's make a truth table to understand when overflow has occurred. Here I take
	 * the MSB of each component, where R is RESULT.
	 *
	 * A  M  R | V | A^R | A^M |~(A^M) | 
	 * 0  0  0 | 0 |  0  |  0  |   1   |
	 * 0  0  1 | 1 |  1  |  0  |   1   |
	 * 0  1  0 | 0 |  0  |  1  |   0   |
	 * 0  1  1 | 0 |  1  |  1  |   0   |  so V = ~(A^M) & (A^R)
	 * 1  0  0 | 0 |  1  |  1  |   0   |
	 * 1  0  1 | 0 |  0  |  1  |   0   |
	 * 1  1  0 | 1 |  1  |  0  |   1   |
	 * 1  1  1 | 0 |  0  |  0  |   1   |
	 *
	 * We can see how the above equation calculates V, based on A, M and R. V was chosen
	 * based on the following hypothesis:
	 *       Positive Number + Positive Number = Negative Result -> Overflow
	 *       Negative Number + Negative Number = Positive Result -> Overflow
	 *       Positive Number + Negative Number = Either Result -> Cannot Overflow
	 *       Positive Number + Positive Number = Positive Result -> OK! No Overflow
	 *       Negative Number + Negative Number = Negative Result -> OK! NO Overflow
	 * @returns {number} always 1
	 */
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
		this.setFlag(this._flags.V, (~(this.a ^ this._fetched) & (this.a ^ this.temp)) & 0x0080);

		// The negative flag is set to the most significant bit of the result
		this.setFlag(this._flags.N, temp & 0x80);

		// Load the result into the accumulator (it's 8-bit dont forget!)
		this.a = temp & 0x00FF;

		// This instruction has the potential to require an additional clock cycle
		return 1;
	},

	/** Instruction: Subtraction with Borrow In
	 * Function:    A = A - M - (1 - C)
	 * Flags Out:   C, V, N, Z
	 *
	 * Explanation:
	 * Given the explanation for ADC above, we can reorganise our data
	 * to use the same computation for addition, for subtraction by multiplying
	 * the data by -1, i.e. make it negative
	 *
	 * A = A - M - (1 - C)  ->  A = A + -1 * (M - (1 - C))  ->  A = A + (-M + 1 + C)
	 *
	 * To make a signed positive number negative, we can invert the bits and add 1
	 * (OK, I lied, a little bit of 1 and 2s complement :P)
	 *
	 *  5 = 00000101
	 * -5 = 11111010 + 00000001 = 11111011 (or 251 in our 0 to 255 range)
	 *
	 * The range is actually unimportant, because if I take the value 15, and add 251
	 * to it, given we wrap around at 256, the result is 10, so it has effectively 
	 * subtracted 5, which was the original intention. (15 + 251) % 256 = 10
	 *
	 * Note that the equation above used (1-C), but this got converted to + 1 + C.
	 * This means we already have the +1, so all we need to do is invert the bits
	 * of M, the data(!) therfore we can simply add, exactly the same way we did 
	 * before.
	 * @returns {number} always 1
	 */
	op_SBC : function() {

		// Operating in 16-bit domain to capture carry out
		// We can invert the bottom 8 bits with bitwise xor
		let value = this.fetch() ^ 0x00FF;

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


	/**Instruction: Bitwise Logic AND
	 * Function:    A = A & M
	 * Flags Out:   N, Z
	 * @returns {number} always 1
	 */ 
	op_AND : function() {
		this.a = this.a & this.fetch();
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);

		return 1;
	},


	/** Instruction: Arithmetic Shift Left
	 * Function:    A = C <- (A << 1) <- 0
	 * Flags Out:   N, Z, C
	 * @returns {number} always 0
	 */
	op_ASL : function(){
		
		temp = this.fetch() << 1;
		this.setFlag(this._flags.C, (temp & 0xFF00) > 0);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x00);
		this.setFlag(this._flags.N, temp & 0x80);
		if (lookup[this._opcode].addrmode == this.adr_IMP) {
			this.a = temp & 0x00FF;
		}
		else {
			this.write(this._addr_abs, temp & 0x00FF);
		}
		return 0;
	},


	/** Instruction: Branch if Carry Clear
	  * Function:    if(C == 0) pc = address 
	  * @returns {number} always 0
	  */
	op_BCC : function() {
		if (this.getFlag(this._flags.C) == 0) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00))
				this._cycles++;

			this.pc = _addr_abs;
		}
		return 0;
	},


	/** Instruction: Branch if Carry Set
	  * Function:    if(C == 1) pc = address
	  * @returns {number} always 0
	  */
	op_BCS : function() {
		if (this.getFlag(this._flags.C) == 1) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00)) {
				this._cycles++;
			}
			this.pc = this._addr_abs;
		}
		return 0;
	},


	/** Instruction: Branch if Equal
	 * Function:    if(Z == 1) pc = address
	 * @returns {number} always 0
	 */
	op_BEQ : function() {
		if (this.getFlag(this._flags.Z) == 1) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00)) {
				this._cycles++;
			}
			this.pc = this._addr_abs;
		}
		return 0;
	},

	/**
	 * Add description XXX FIXME.
	 * @returns {number} always 0
	 */
	op_BIT : function() {
		temp = a & this.fetch();
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x00);
		this.setFlag(this._flags.N, this._fetched & (1 << 7));
		this.setFlag(this._flags.V, this._fetched & (1 << 6));
		return 0;
	},

	/** Instruction: Branch if Negative
	  * Function:    if(N == 1) pc = address
	  * @returns {number} always 0
	  */
	op_BMI : function() {
		if (this.getFlag(this._flags.N) == 1) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00)) {
				this._cycles++;
			}
			this.pc = this._addr_abs;
		}
		return 0;
	},

	/** Instruction: Branch if Not Equal
	  * Function:    if(Z == 0) pc = address
	  * @returns {number} always 0
	  */
	op_BNE : function() {
		if (this.getFlag(this._flags.Z) == 0) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00)) {
				this._cycles++;
			}
			this.pc = this._addr_abs;
		}
		return 0;
	},

	/** Instruction: Branch if Positive
	  * Function:    if(N == 0) pc = address
	  * @returns {number} always 0
	  */
	op_BPL : function() {
		if (this.getFlag(this._flags.N) == 0) {
			this._cycles++;
			this._addr_abs = (this.pc + this._addr_rel) & 0xFFFF; // FIXME: Check that this is correct

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00)) {
				this._cycles++;
			}
			this.pc = this._addr_abs;
		}
		return 0;
	},

	/** Instruction: Break
	 * Function:    Program Sourced Interrupt
	 * @returns {number} always 0
	 */
	op_BRK : function() {
		this.pc++;

		this.setFlag(this._flags.I, 1);
		this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
		this.stkp--;
		this.write(0x0100 + this.stkp, this.pc & 0x00FF);
		this.stkp--;

		this.setFlag(this._flags.B, 1);
		this.write(0x0100 + this.stkp, this.status);
		stkp--;
		this.setFlag(this._flags.B, 0);

		this.pc = this.read(0xFFFE) | (this.read(0xFFFF) << 8);
		return 0;
	},

	/** Instruction: Branch if Overflow Clear
	  * Function:    if(V == 0) pc = address
	  * @returns {number} always 0
	  */
	op_BVC : function() {
		if (this.getFlag(this._flags.V) == 0) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this.pc & 0xFF00))
				this._cycles++;

			this.pc = this._addr_abs;
		}
		return 0;
	},

	/** Instruction: Branch if Overflow Set
	  * Function:    if(V == 1) pc = address
	  * @returns {number} always 0
	  */
	op_BVS : function() {
		if (this.getFlag(this._flags.V) == 1) {
			this._cycles++;
			this._addr_abs = this.pc + this._addr_rel;

			if ((this._addr_abs & 0xFF00) != (this._pc & 0xFF00))
				this._cycles++;

			this.pc = this._addr_abs;
		}
		return 0;
	},

	/** Instruction: Clear Carry Flag
	 * Function:    C = 0
	 * @returns {number} always 0
	 */
	op_CLC : function() {
		this.setFlag(this._flags.C, false);
		return 0;
	},

	/** Instruction: Clear Decimal Flag
	  * Function:    D = 0
	  * @returns {number} always 0
	  */
	op_CLD : function() {
		this.setFlag(this._flags.D, false);
		return 0;
	},

	/** Instruction: Disable Interrupts / Clear Interrupt Flag
	  * Function:    I = 0
	  * @returns {number} always 0
	  */
	op_CLI : function() {
		this.setFlag(this._flags.I, false);
		return 0;
	},

	/** Instruction: Clear Overflow Flag
	  * Function:    V = 0
	  * @returns {number} always 0
	  */
	op_CLV : function() {
		this.setFlag(this._flags.V, false);
		return 0;
	},

	/** Instruction: Compare Accumulator
	  * Function:    C <- A >= M      Z <- (A - M) == 0
	  * Flags Out:   N, C, Z
 	  * @returns {number} always 1
	  */
	op_CMP : function() {
		this.fetch();
		let temp = this.a - this._fetched;
		this.setFlag(this._flags.C, this.a >= this._fetched);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		return 1;
	},

	/** Instruction: Compare X Register
	  * Function:    C <- X >= M      Z <- (X - M) == 0
	  * Flags Out:   N, C, Z
	  * @returns {number} always 0
	  */
	op_CPX : function() {
		this.fetch();
		let temp = this.x - this._fetched;
		this.setFlag(this._flags.C, x >= this._fetched);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		return 0;
	},

	/** Instruction: Compare Y Register
	  * Function:    C <- Y >= M      Z <- (Y - M) == 0
	  * Flags Out:   N, C, Z
	  * @returns {number} always 0
	  */
	op_CPY : function() {
		this.fetch();
		let temp = this.y - this._fetched;
		this.setFlag(this._flags.C, this.y >= this._fetched);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		return 0;
	},

	/** Instruction: Decrement Value at Memory Location
	  * Function:    M = M - 1
	  * Flags Out:   N, Z
	  * @returns {number} always 0
	  */
	op_DEC : function() {
		let temp = this.fetch() - 1;
		this.write(this._addr_abs, this.temp & 0x00FF);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		return 0;
	},

	/** Instruction: Decrement X Register
	  * Function:    X = X - 1
	  * Flags Out:   N, Z
	  * @returns {number} always 0
	  */
	op_DEX : function(){
		this.x--;
		this.setFlag(this._flags.Z, this.x == 0x00);
		this.setFlag(this._flags.N, this.x & 0x80);
		return 0;
	},

	/** Instruction: Decrement Y Register
	  * Function:    Y = Y - 1
	  * Flags Out:   N, Z
	  * @returns {number} always 0
	  */
	op_DEY : function() {
		this.y--;
		this.setFlag(this._flags.Z, this.y == 0x00);
		this.setFlag(this._flags.N, this.y & 0x80);
		return 0;
	},

	/** Instruction: Bitwise Logic XOR
	  * Function:    A = A xor M
	  * Flags Out:   N, Z
	  * @returns {number} always 1
	  */
	op_EOR : function() {
		this.a = this.a ^ this.fetch();
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);
		return 1;
	},

	/** Instruction: Increment Value at Memory Location
	  * Function:    M = M + 1
	  * Flags Out:   N, Z
	  * @returns {number} always 0
	  */
	op_INC : function() {	
		let temp = this.fetch() + 1;
		this.write(this._addr_abs, temp & 0x00FF);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		return 0;
	},

	/** Instruction: Increment X Register
	  * Function:    X = X + 1
	  * Flags Out:   N, Z
	  * @returns {number} always 0
	  */
	op_INX : function() {
		this.x++;
		this.setFlag(this._flags.Z, this.x == 0x00);
		this.setFlag(this._flags.N, this.x & 0x80);
		return 0;
	},

	/** Instruction: Increment Y Register
	  * Function:    Y = Y + 1
	  * Flags Out:   N, Z
	  * @returns {number} always 0
	  */
	op_INY : function() {
		this.y++;
		this.setFlag(this._flags.Z, this.y == 0x00);
		this.setFlag(this._flags.N, this.y & 0x80);
		return 0;
	},

	/** Instruction: Jump To Location
	  * Function:    pc = address
	  * @returns {number} always 0
	  */
	op_JMP : function()
	{
		this.pc = this._addr_abs;
		return 0;
	},

	/** Instruction: Jump To Sub-Routine
	  * Function:    Push current pc to stack, pc = address
	  * @returns {number} always 0
	  */
	op_JSR : function() {
		this.pc--;

		this.write(0x0100 + this.stkp, (this.pc >> 8) & 0x00FF);
		this.stkp--;
		this.write(0x0100 + this.stkp, this.pc & 0x00FF);
		this.stkp--;

		this.pc = this._addr_abs;
		return 0;
	},

	/** Instruction: Load The Accumulator
	  * Function:    A = M
	  * Flags Out:   N, Z
	  * @returns {number} always 1
	  */
	op_LDA : function() {
		this.a = this.fetch();
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);
		return 1;
	},

	/** Instruction: Load The X Register
	  * Function:    X = M
	  * Flags Out:   N, Z
	  * @returns {number} always 1
	  */
	op_LDX : function() {
		this.x = this.fetch();
		this.setFlag(this._flags.Z, this.x == 0x00);
		this.setFlag(this._flags.N, this.x & 0x80);
		return 1;
	},

	/** Instruction: Load The Y Register
	  * Function:    Y = M
	  * Flags Out:   N, Z
	  * @returns {number} always 1
	  */
	op_LDY : function() {
		
		this.y = this.fetch();
		this.setFlag(this._flags.Z, this.y == 0x00);
		this.setFlag(this._flags.N, this.y & 0x80);
		return 1;
	},

	/**
	 * LSR
	 */
	op_LSR : function() {
		this.fetch();
		this.setFlag(this._flags.C, this._fetched & 0x0001);
		let temp = this._fetched >> 1;
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		if (this.lookup[this._opcode].addrmode == adr_IMP) {
			this.a = temp & 0x00FF;
		}
		else {
			this.write(this._addr_abs, temp & 0x00FF);
		}
		return 0;
	},

	op_NOP() {
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
	},

	/** Instruction: Bitwise Logic OR
	  *Function:    A = A | M
	  * Flags Out:   N, Z
	  */
	op_ORA(){
		this.a = this.a | this.fetch();
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);
		return 1;
	},

	/** Instruction: Push Accumulator to Stack
	  * Function:    A -> stack
	  */
	op_PHA() {
		this.write(0x0100 + this.stkp, this.a);
		this.stkp--;
		return 0;
	},

	/** Instruction: Push Status Register to Stack
	  * Function:    status -> stack
	  * Note:        Break flag is set to 1 before push
	  */
	op_PHP() {
		this.write(0x0100 + this.stkp, this.status | this._flags.B | this._flags.U);
		this.setFlag(this._flags.B, 0);
		this.setFlag(this._flags.U, 0);
		this.stkp--;
		return 0;
	},

	/** Instruction: Pop Accumulator off Stack
	  * Function:    A <- stack
	  * Flags Out:   N, Z
	  */
	op_PLA() {
		this.stkp++;
		this.a = this.read(0x0100 + this.stkp);
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);
		return 0;
	},

	/** Instruction: Pop Status Register off Stack
	  * Function:    Status <- stack
	  */
	op_PLP() {
		this.stkp++;
		this.status = read(0x0100 + this.stkp);
		this.setFlag(this._flags.U, 1);
		return 0;
	},

	op_ROL() {
		
		let temp = (fetch() << 1) | this.getFlag(this._flags.C);
		this.setFlag(this._flags.C, temp & 0xFF00);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x0000);
		this.setFlag(this._flags.N, temp & 0x0080);
		if (this.lookup[this._opcode].addrmode == adr_IMP) {
			this.a = temp & 0x00FF;
		}
		else {
			this.write(this._addr_abs, temp & 0x00FF);
		}
		return 0;
	},

	op_ROR : function() {
		this.fetch();
		let temp = (GetFlag(C) << 7) | (this._fetched >> 1);
		this.setFlag(this._flags.C, this._fetched & 0x01);
		this.setFlag(this._flags.Z, (temp & 0x00FF) == 0x00);
		this.setFlag(this._flags.N, temp & 0x0080);
		if (this.lookup[this._opcode].addrmode ==  adr_IMP) {
			this.a = temp & 0x00FF;
		}
		else {
			this.write(this._addr_abs, temp & 0x00FF);
		}
		return 0;
	},

	op_RTI : function() {
		this.stkp++;
		this.status = this.read(0x0100 + this.stkp);
		this.status &= ~this._flags.B; // TODO: why are we not using the setFlags function??
		this.status &= ~this._flags.U;

		this.stkp++;
		this.pc = this.read(0x0100 + this.stkp);
		this.stkp++;
		this.pc |= this.read(0x0100 + this.stkp) << 8;
		return 0;
	},

	op_RTS : function() {
		this.stkp++;
		this.pc = this.read(0x0100 + this.stkp);
		this.stkp++;
		this.pc |= this.read(0x0100 + this.stkp) << 8;

		this.pc++;
		return 0;
	},

	/** Instruction: Set Carry Flag
	  * Function:    C = 1
	  */
	op_SEC : function() {
		this.setFlag(this._flags.C, true);
		return 0;
	},

	/** Instruction: Set Decimal Flag
	  * Function:    D = 1
	  */
	op_SED : function() {
		this.setFlag(this._flags.D, true);
		return 0;
	},

	/** Instruction: Set Interrupt Flag / Enable Interrupts
	  * Function:    I = 1
	  */
	op_SEI : function() {
		this.setFlag(this._flags.I, true);
		return 0;
	},

	/** Instruction: Store Accumulator at Address
	  * Function:    M = A
	  */
	op_STA : function() {
		this.write(this._addr_abs, this.a);
		return 0;
	},

	/** Instruction: Store X Register at Address
	  * Function:    M = X
	  */
	op_STX() {
		this.write(this._addr_abs, this.x);
		return 0;
	},

	/** Instruction: Store Y Register at Address
	  * Function:    M = Y
	  */
	op_STY : function() {
		this.write(this._addr_abs, this.y);
		return 0;
	},

	/** Instruction: Transfer Accumulator to X Register
	  * Function:    X = A
	  * Flags Out:   N, Z
	  */
	op_TAX : function() {
		this.x = this.a;
		this.setFlag(this._flags.Z, x == 0x00);
		this.setFlag(this._flags.N, x & 0x80);
		return 0;
	},

	/** Instruction: Transfer Accumulator to Y Register
	  * Function:    Y = A
	  * Flags Out:   N, Z
	  */
	op_TAY : function() {
		this.y = this.a;
		this.setFlag(this._flags.Z, this.y == 0x00);
		this.setFlag(this._flags.N, this.y & 0x80);
		return 0;
	},

	/** Instruction: Transfer Stack Pointer to X Register
	  * Function:    X = stack pointer
	  * Flags Out:   N, Z
	  */
	op_TSX : function() {
		this.x = this.stkp;
		this.setFlag(this._flags.Z, this.x == 0x00);
		this.setFlag(this._flags.N, this.x & 0x80);
		return 0;
	},

	/** Instruction: Transfer X Register to Accumulator
	  * Function:    A = X
	  * Flags Out:   N, Z
	  */
	op_TXA : function() {
		this.a = this.x;
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);
		return 0;
	},

	/** Instruction: Transfer X Register to Stack Pointer
	  * Function:    stack pointer = X
	  */
	op_TXS() {
		this.stkp = this.x;
		return 0;
	},

	/** Instruction: Transfer Y Register to Accumulator
	  * Function:    A = Y
	  * Flags Out:   N, Z
	  */
	op_TYA() {
		this.a = this.y;
		this.setFlag(this._flags.Z, this.a == 0x00);
		this.setFlag(this._flags.N, this.a & 0x80);
		return 0;
	},


	/** This function captures illegal opcodes  */ 
	op_XXX :function (){
		return 0;
	},

	///////////////////////////////////////////////////////////////////////////////
	// HELPER FUNCTIONS

	complete : function() {
		return this._cycles == 0;
	},

	// This is the disassembly function. Its workings are not required for emulation.
	// It is merely a convenience function to turn the binary instruction code into
	// human readable form. Its included as part of the emulator because it can take
	// advantage of many of the CPUs internal ops to do this.
	disassemble : function(nStart, nStop)
	{
		let addr = nStart;
		let value = 0x00, lo = 0x00, hi = 0x00;
		let mapLines = [];
		let _cpu = window.CPU;
		//let line_addr = 0;

		// Starting at the specified address we read an instruction
		// byte, which in turn yields information from the lookup table
		// as to how many additional bytes we need to read and what the
		// addressing mode is. I need this info to assemble human readable
		// syntax, which is different depending upon the addressing mode

		// As the instruction is decoded, a string is assembled
		// with the readable output
		while (addr <= nStop)
		{

			//line_addr = addr;
			//this = window.CPU;
			// Prefix line with instruction address
			//let sInst = toHex(addr, 4) + ": ";

			// Read instruction, and get its readable name
			let opcode = _cpu._bus.cpuRead(addr++, true) 
			//sInst += this.lookup[opcode].name + " ";
			
			 // FIXME : Remove the ?? null check, this is a hack
			if (isNaN(opcode)) {
				//console.log("ERROR:" + opcode);
				opcode = 2; // NOP
			}

			let op = {
				address : toHex(addr -1, 4),
				opCode : opcode,
				op : _cpu.lookup[opcode].name,
				addrMode : ""
			};

			// Get oprands from desired locations, and form the
			// instruction based upon its addressing mode. These
			// routines mimmick the actual fetch routine of the
			// 6502 in order to get accurate data as part of the
			// instruction
			if (_cpu.lookup[opcode].addrmode === c.adr_IMP)
			{
				op.addrMode = "{IMP}";
			}
			else if (this.lookup[opcode].addrmode === c.adr_IMM)
			{
				value = this._bus.cpuRead(addr, true); addr++;
				op.addrMode = "#$" + toHex(value, 2) + " {IMM}";
			}
			else if (this.lookup[opcode].addrmode === c.adr_ZP0)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = 0x00;
				op.addrMode = "$" + toHex(lo, 2) + " {ZP0}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_ZPX)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = 0x00;
				op.addrMode = "$" + toHex(lo, 2) + ", X {ZPX}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_ZPY)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = 0x00;
				op.addrMode = "$" + toHex(lo, 2) + ", Y {ZPY}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_IZX)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = 0x00;
				op.addrMode = "($" + toHex(lo, 2) + ", X) {IZX}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_IZY)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = 0x00;
				op.addrMode = "($" + toHex(lo, 2) + "), Y {IZY}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_ABS)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = this._bus.cpuRead(addr, true); addr++;
				op.addrMode = "$" + toHex((hi << 8) | lo, 4) + " {ABS}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_ABX)
			{
				lo = this._bus.cpuRead(addr, true); addr++;
				hi = this._bus.cpuRead(addr, true); addr++;
				op.addrMode = "$" + toHex((hi << 8) | lo, 4) + ", X {ABX}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_ABY)
			{
				lo = this._bus.cpuRead(addr, true); ;
				hi = this._bus.cpuRead(addr, true); addr++;
				op.addrMode = "$" + toHex((hi << 8) | lo, 4) + ", Y {ABY}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_IND)
			{
				lo = this._bus.cpuRead(addr++, true); 
				hi = this._bus.cpuRead(addr++, true);
				op.addrMode = "($" + toHex((hi << 8) | lo, 4) + ") {IND}";
			}
			else if (this.lookup[opcode].addrmode  === c.adr_REL)
			{
				value = this._bus.cpuRead(addr++, true);
				op.addrMode = "$" + toHex(value, 2) + " [$" + toHex(addr + value, 4) + "] {REL}";
			}

			// Add the formed string to a std::map, using the instruction's
			// address as the key. This makes it convenient to look for later
			// as the instructions are variable in length, so a straight up
			// incremental index is not sufficient.
			mapLines.push(op);
		}
		return mapLines;
	}
};

// Setup OP Code Mapping
let c = window.CPU;
window.CPU.lookup = 
	[
		{ name :"BRK", op : c.op_BRK, addrmode : c.adr_IMM, cycles : 7 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"ASL", op : c.op_ASL, addrmode : c.adr_ZP0, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"PHP", op : c.op_PHP, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"ASL", op : c.op_ASL, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"ASL", op : c.op_ASL, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"BPL", op : c.op_BPL, addrmode : c.adr_REL, cycles : 2 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"ASL", op : c.op_ASL, addrmode : c.adr_ZPX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"CLC", op : c.op_CLC, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"ORA", op : c.op_ORA, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"ASL", op : c.op_ASL, addrmode : c.adr_ABX, cycles : 7 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"JSR", op : c.op_JSR, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"BIT", op : c.op_BIT, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"ROL", op : c.op_ROL, addrmode : c.adr_ZP0, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"PLP", op : c.op_PLP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"ROL", op : c.op_ROL, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"BIT", op : c.op_BIT, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"ROL", op : c.op_ROL, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"BMI", op : c.op_BMI, addrmode : c.adr_REL, cycles : 2 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"ROL", op : c.op_ROL, addrmode : c.adr_ZPX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"SEC", op : c.op_SEC, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"AND", op : c.op_AND, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"ROL", op : c.op_ROL, addrmode : c.adr_ABX, cycles : 7 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"RTI", op : c.op_RTI, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"LSR", op : c.op_LSR, addrmode : c.adr_ZP0, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"PHA", op : c.op_PHA, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"LSR", op : c.op_LSR, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"JMP", op : c.op_JMP, addrmode : c.adr_ABS, cycles : 3 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"LSR", op : c.op_LSR, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"BVC", op : c.op_BVC, addrmode : c.adr_REL, cycles : 2 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"LSR", op : c.op_LSR, addrmode : c.adr_ZPX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"CLI", op : c.op_CLI, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"EOR", op : c.op_EOR, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"LSR", op : c.op_LSR, addrmode : c.adr_ABX, cycles : 7 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"RTS", op : c.op_RTS, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"ROR", op : c.op_ROR, addrmode : c.adr_ZP0, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"PLA", op : c.op_PLA, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"ROR", op : c.op_ROR, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"JMP", op : c.op_JMP, addrmode : c.adr_IND, cycles : 5 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"ROR", op : c.op_ROR, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"BVS", op : c.op_BVS, addrmode : c.adr_REL, cycles : 2 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"ROR", op : c.op_ROR, addrmode : c.adr_ZPX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"SEI", op : c.op_SEI, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"ADC", op : c.op_ADC, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"ROR", op : c.op_ROR, addrmode : c.adr_ABX, cycles : 7 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"STY", op : c.op_STY, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"STX", op : c.op_STX, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"DEY", op : c.op_DEY, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"TXA", op : c.op_TXA, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"STY", op : c.op_STY, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"STX", op : c.op_STX, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"BCC", op : c.op_BCC, addrmode : c.adr_REL, cycles : 2 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_IZY, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"STY", op : c.op_STY, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"STX", op : c.op_STX, addrmode : c.adr_ZPY, cycles : 4 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"TYA", op : c.op_TYA, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_ABY, cycles : 5 },
		{ name :"TXS", op : c.op_TXS, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"STA", op : c.op_STA, addrmode : c.adr_ABX, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"LDY", op : c.op_LDY, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"LDX", op : c.op_LDX, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"LDY", op : c.op_LDY, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"LDX", op : c.op_LDX, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 3 },
		{ name :"TAY", op : c.op_TAY, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"TAX", op : c.op_TAX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"LDY", op : c.op_LDY, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"LDX", op : c.op_LDX, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"BCS", op : c.op_BCS, addrmode : c.adr_REL, cycles : 2 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"LDY", op : c.op_LDY, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"LDX", op : c.op_LDX, addrmode : c.adr_ZPY, cycles : 4 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"CLV", op : c.op_CLV, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"TSX", op : c.op_TSX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"LDY", op : c.op_LDY, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"LDA", op : c.op_LDA, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"LDX", op : c.op_LDX, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"CPY", op : c.op_CPY, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"CPY", op : c.op_CPY, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"DEC", op : c.op_DEC, addrmode : c.adr_ZP0, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"INY", op : c.op_INY, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"DEX", op : c.op_DEX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"CPY", op : c.op_CPY, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"DEC", op : c.op_DEC, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"BNE", op : c.op_BNE, addrmode : c.adr_REL, cycles : 2 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"DEC", op : c.op_DEC, addrmode : c.adr_ZPX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"CLD", op : c.op_CLD, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"NOP", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"CMP", op : c.op_CMP, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"DEC", op : c.op_DEC, addrmode : c.adr_ABX, cycles : 7 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"CPX", op : c.op_CPX, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_IZX, cycles : 6 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"CPX", op : c.op_CPX, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_ZP0, cycles : 3 },
		{ name :"INC", op : c.op_INC, addrmode : c.adr_ZP0, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 5 },
		{ name :"INX", op : c.op_INX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_IMM, cycles : 2 },
		{ name :"NOP", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_SBC, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"CPX", op : c.op_CPX, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_ABS, cycles : 4 },
		{ name :"INC", op : c.op_INC, addrmode : c.adr_ABS, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"BEQ", op : c.op_BEQ, addrmode : c.adr_REL, cycles : 2 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_IZY, cycles : 5 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 8 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_ZPX, cycles : 4 },
		{ name :"INC", op : c.op_INC, addrmode : c.adr_ZPX, cycles : 6 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 6 },
		{ name :"SED", op : c.op_SED, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_ABY, cycles : 4 },
		{ name :"NOP", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 2 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 },
		{ name :"???", op : c.op_NOP, addrmode : c.adr_IMP, cycles : 4 },
		{ name :"SBC", op : c.op_SBC, addrmode : c.adr_ABX, cycles : 4 },
		{ name :"INC", op : c.op_INC, addrmode : c.adr_ABX, cycles : 7 },
		{ name :"???", op : c.op_XXX, addrmode : c.adr_IMP, cycles : 7 }
	];