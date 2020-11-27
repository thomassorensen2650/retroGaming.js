
window.Cartridge = function Cartridge() {
    "use strict";
    this._reader = new FileReader();
    this._programBanks = null;
    this._chrBanks = null;
    this._hasTrainer = false;
    this._mirror = 0;
    this._mapperID = null;
    var _this = this;

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

    // Load a cartridge into the NES
    this.load = function (f) {
        
        

        this._reader.readAsArrayBuffer(f);

        this._reader.onloadend = function (e) {
            let buffer = e.target.result;

            console.log(`Read ${buffer.byteLength} from ROM file`);
            _this.header = new Uint8Array(buffer.slice(0, 16));
            _this.isValidRom = (_this.header[0] === 78 && _this.header[1] === 69 && _this.header[2] === 83 && _this.header[3] === 26) ? true : false;
            
            if (_this.isValidRom) {
                
                // If a "trainer" exists we just need to read past it before we get to the good stuff
                _this._hasTrainer = new Boolean(_this.header[6] & 0x04);   
                let dataOffset = 16; // Offset Header
                dataOffset += _this._hasTrainer === true ? 512 : 0;
    

                _this._mirror  = (_this.header[6] & 0x01) ? "VERTICAL" : "HORIZONTAL";
                _this._mapperID = ((_this.header[7] >> 4) << 4) | (_this.header[6] >> 4);

                // Read program banks
                let programBankSize = _this.header[4] * 16384;
                _this._programBanks = new Uint8Array(buffer.slice(dataOffset, programBankSize + dataOffset));
    
                // Read chr banks.
                dataOffset += programBankSize;
                let chrBankSize = _this.header[5] * 8192;
                _this._chrBanks = new Uint8Array(buffer.slice(dataOffset, chrBankSize + dataOffset));


                // Debug
                window.CPU.reset();

                /*switch (this._mapperID) {
                    case 0: pMapper = std::make_shared<Mapper_000>(nPRGBanks, nCHRBanks); break;
                    }
                
                    }
                }; */

        // TODO: Add other handlers .
        // fr.onerror = errorHandler;
        // fr.onabort = () => changeStatus('Start Loading');
        // fr.onloadstart = () => changeStatus('Start Loading');
        // fr.onload = () => { changeStatus('Loaded') };

            }
        }
    }

    this.cpuRead = function (addr) {
      
       return this._programBanks[addr];
        /*
        if (pMapper.cpuMapRead(addr, mapped_addr))
        {
            data = vPRGMemory[mapped_addr];
            return true;
        }
        else
            return false;
            */
    }

    this.cpuWrite = function (address, value) {
        if (address > 0xFFFF) {
            this._programBanks[address] = value;
        }
    }
}
    
