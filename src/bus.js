"use strict";

// The bus is the NES.
window.Bus = function Bus(cartridge, cpu, ppu) {

    this._cartridge = cartridge;
    this._cpuRam = new Array();
    this._systemClockCounter = 0;
    this._cpu = cpu;

    this._ppu = ppu;
    this._ppu.connectCartridge(this._cartridge);
    for (let i = 0; i < 0xFFFF; i++) {
        this._cpuRam.push(0);
    }

    this.cpuRead = function (addr, readOnly) {

        //console.log("CPU Read address " + addr);
        let cartData = this._cartridge.cpuRead(addr);
        if (cartData !== false) {
            return cartData;
        }
        else if (addr >= 0x0000 && addr <= 0x1FFF) {
            // System RAM Address Range, mirrored every 2048
            return this._cpuRam[addr & 0x07FF];
        }
        else if (addr >= 0x2000 && addr <= 0x3FFF) {
            // PPU Address range, mirrored every 8
            return this._ppu.cpuRead(addr & 0x0007, readOnly);
        }
        else if (addr == 0x4015)
        {
            // APU Read Status
            // data = apu.cpuRead(addr);
            return 0;
        }
        else if (addr >= 0x4016 && addr <= 0x4017)
        {
            // Read out the MSB of the controller status word
            //data = (controller_state[addr & 0x0001] & 0x80) > 0;
            //controller_state[addr & 0x0001] <<= 1;
            return 0;
        }else
        {
            //console.log("try to load " + addr);
            return 0;
        }
    }

    this.cpuWrite = function (addr, data) {

        if (addr == 6000 || addr == 0x6000) {
            console.log(data);
        }
        //console.log("CPU Write address " + addr + " data: " + data);
        if (this._cartridge.cpuWrite(addr, data)) {
            // The cartridge "sees all" and has the facility to veto
            // the propagation of the bus transaction if it requires.
            // This allows the cartridge to map any address to some
            // other data, including the facility to divert transactions
            // with other physical devices. The NES does not do this
            // but I figured it might be quite a flexible way of adding
            // "custom" hardware to the NES in the future!
        }
        else if (addr >= 0x0000 && addr <= 0x1FFF) {
            // System RAM Address Range. The range covers 8KB, though
            // there is only 2KB available. That 2KB is "mirrored"
            // through this address range. Using bitwise AND to mask
            // the bottom 11 bits is the same as addr % 2048.
            this._cpuRam[addr & 0x07FF] = data;
    
        }
        else if (addr >= 0x2000 && addr <= 0x3FFF) {
            // PPU Address range. The PPU only has 8 primary registers
            // and these are repeated throughout this range. We can
            // use bitwise AND operation to mask the bottom 3 bits, 
            // which is the equivalent of addr % 8.
            ppu.cpuWrite(addr & 0x0007, data);
        }	
    }
    
    this.clock = function() {
        // Clocking. The heart and soul of an emulator. The running
        // frequency is controlled by whatever calls this function.
        // So here we "divide" the clock as necessary and call
        // the peripheral devices clock() function at the correct
        // times.

        // The fastest clock frequency the digital system cares
        // about is equivalent to the PPU clock. So the PPU is clocked
        // each time this function is called.
        this._ppu.clock();

        // The CPU runs 3 times slower than the PPU so we only call its
        // clock() function every 3 times this function is called. We
        // have a global counter to keep track of this.
        if (this._systemClockCounter % 3 == 0)
        {
            this._cpu.clock();
        }

        // The PPU is capable of emitting an interrupt to indicate the
        // vertical blanking period has been entered. If it has, we need
        // to send that irq to the CPU.
        if (this._ppu.nmi)
        {
            this._ppu.nmi = false;
            this._cpu.nmi();
        }

        this._systemClockCounter++;
    },

    this.drawPatternTable = function(canvas) {
        let pt = this._ppu.getPatternTable(0, 0);
        var ctx = canvas.getContext('2d');

        var id = ctx.createImageData(128, 128); // only do this once per page
        var d  = id.data; 

        for (let i = 0; i < pt.length; i++) {
            d[i*4+0] = pt[i].c.r;
            d[i*4+1] = pt[i].c.g;
            d[i*4+2] = pt[i].c.b;
            d[i*4+3] = 255;
        }
        ctx.putImageData(id, 0, 0 );  
    },
    
    this.loadCartridge = function(cartridgeBuffer) {
        this._cartridge.load(cartridgeBuffer);
    }

}