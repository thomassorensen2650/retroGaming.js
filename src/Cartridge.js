"use strict";
window.Cartridge = function Cartridge() {

    this._reader = new FileReader();
    this._programBanks = null;
    this._chrBanks = null;
    this._hasTrainer = false;

    // char name[4]; // This is a hardcoded file format name.
    // uint8_t prg_rom_chunks; // Sized in bytes x 16384
    // uint8_t chr_rom_chunks; // Sized in bytes x 8192
    // uint8_t mapper1;
    // uint8_t mapper2;
    // uint8_t prg_ram_size;
    // uint8_t tv_system1;
    // uint8_t tv_system2;
    // char unused[5];
    this.header = null;
    this.isValidRom = false;

    // Load c cartridge into the NES
    this.load = function (f) {

        this._reader.readAsArrayBuffer(f);

        this._reader.onloadend = function (e) {
            let buffer = e.target.result;

            console.log(`Read ${buffer.byteLength} from ROM file`);
            this.header = new Uint8Array(buffer.slice(0, 16));
            this.isValidRom = (this.header[0] === 78 && this.header[1] === 69 && this.header[2] === 83 && this.header[3] === 26) ? true : false;

            // If a "trainer" exists we just need to read past it before we get to the good stuff
            this._hasTrainer = new Boolean(this.header[6] & 0x04);   
            let dataOffset = 16; // Offset Header
            dataOffset += this._hasTrainer === true ? 512 : 0;

            // Read program banks
            let programBankSize = this.header[4] * 16384;
            this._programBanks = new Uint8Array(buffer.slice(dataOffset, programBankSize + dataOffset));

            // Read chr banks.
            dataOffset += programBankSize;
            let chrBankSize = this.header[5] * 8192;
            this._chrBanks = new Uint8Array(buffer.slice(dataOffset, chrBankSize + dataOffset));

        };

        // TODO: Add other handlers .
        // fr.onerror = errorHandler;
        // fr.onabort = () => changeStatus('Start Loading');
        // fr.onloadstart = () => changeStatus('Start Loading');
        // fr.onload = () => { changeStatus('Loaded') };


    }
}
    
