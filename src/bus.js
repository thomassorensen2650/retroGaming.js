"use strict";

// The bus is the NES.
window.Bus = function Bus() {

    this._ram = new Array();

    for (let i = 0; i < 0xFFFF; i++) {
        this._ram.push(0);
    }

    this.cpuRead = function (addr) {
        if (addr >= 0x0000 && addr <= 0xFFFF) {
            return this._ram[addr];
        }
        return 0x0;
    }

    this.cpuWrite = function (address, value) {
        if (address > 0xFFFF) {
            this._ram[address] = value;
        }
    }
}