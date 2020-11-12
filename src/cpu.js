let cpu = function (bus) {

    // Registers
    this.a = 0;
    this.x = 0;
    this.y = 0;

    this.stkp = 0;   // Stack Pointer

    this.status = 0; // Status register

    // Setup Bus Connection
    this.bus = bus;
    this.write() = function (byte) {
        this.bus.write(byte);
    }

    // Reads an 8-bit byte from the bus, located at the specified 16-bit address

    this.read(address) {
        // In normal operation "read only" is set to false. This may seem odd. Some
        // devices on the bus may change state when they are read from, and this 
        // is intentional under normal circumstances. However the disassembler will
        // want to read the data at an address without changing the state of the
        // devices on the bus
        return this.bus.read(address, false);
    }

    // Writes a byte to the bus at the specified address
    this.write(address, data) {
        this.bus.write(address, data)
    }


    ///////////////////////////////////////////////////////////////////////////////
    // EXTERNAL INPUTS

    // Forces the 6502 into a known state. This is hard-wired inside the CPU. The
    // registers are set to 0x00, the status register is cleared except for unused
    // bit which remains at 1. An absolute address is read from location 0xFFFC
    // which contains a second address that the program counter is set to. This 
    // allows the programmer to jump to a known and programmable location in the
    // memory to start executing from. Typically the programmer would set the value
    // at location 0xFFFC at compile time.
    this.reset = function () {
        // Get address to set program counter to
        addr_abs = 0xFFFC;
        lo = this.read(addr_abs + 0);
        hi = this.read(addr_abs + 1);

        // Set it
        pc = (hi << 8) | lo;

        // Reset internal registers
        a = 0;
        x = 0;
        y = 0;
        stkp = 0xFD;
        status = 0x00 | U;

        // Clear internal helper variables
        addr_rel = 0x0000;
        addr_abs = 0x0000;
        fetched = 0x00;

        // Reset takes time
        cycles = 8;
    }


    // CPU OPs


}

