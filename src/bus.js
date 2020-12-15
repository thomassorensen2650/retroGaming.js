"use strict";

// The bus is the NES.
window.Bus = function Bus(cartridge) {

    this._cartridge = cartridge;
    this._cpuRam = new Array();

    for (let i = 0; i < 0xFFFF; i++) {
        this._cpuRam.push(0);
    }

    this.cpuRead = function (addr, readOnly) {

        //console.log("CPU Read address " + addr);
        let cartData = this._cartridge.cpuRead(addr);
        if (cartData !== false)
        {
            return cartData;
        }
        else if (addr >= 0x0000 && addr <= 0x1FFF)
        {
            // System RAM Address Range, mirrored every 2048
            return this._cpuRam[addr & 0x07FF];
        }
        else if (addr >= 0x2000 && addr <= 0x3FFF)
        {
            return 0; // fixme
            // PPU Address range, mirrored every 8
            //return this.ppu.cpuRead(addr & 0x0007, bReadOnly);
        }
    }

    this.cpuWrite = function (addr, data) {
        console.log("CPU Write address " + addr + " data: " + data);
        if (this._cartridge.cpuWrite(addr, data))
        {
            // The cartridge "sees all" and has the facility to veto
            // the propagation of the bus transaction if it requires.
            // This allows the cartridge to map any address to some
            // other data, including the facility to divert transactions
            // with other physical devices. The NES does not do this
            // but I figured it might be quite a flexible way of adding
            // "custom" hardware to the NES in the future!
        }
        else if (addr >= 0x0000 && addr <= 0x1FFF)
        {
            // System RAM Address Range. The range covers 8KB, though
            // there is only 2KB available. That 2KB is "mirrored"
            // through this address range. Using bitwise AND to mask
            // the bottom 11 bits is the same as addr % 2048.
            this._cpuRam[addr & 0x07FF] = data;
    
        }
        else if (addr >= 0x2000 && addr <= 0x3FFF)
        {
            // PPU Address range. The PPU only has 8 primary registers
            // and these are repeated throughout this range. We can
            // use bitwise AND operation to mask the bottom 3 bits, 
            // which is the equivalent of addr % 8.
           // ppu.cpuWrite(addr & 0x0007, data);
        }	
    }
}