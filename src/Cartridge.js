
window.Cartridge = {
    //"use strict";
    _reader : new FileReader(),
    _programBanks : null,
    _chrBanks : null,
    _hasTrainer : false,
    _mirror : 0,
    _mapperID : null,
    _mapper : null,
    // char name[4]; // This is a hardcoded file format name.
    // uint8_t prg_rom_chunks; // Sized in bytes x 16384
    // uint8_t chr_rom_chunks; // Sized in bytes x 8192
    // uint8_t mapper1;
    // uint8_t mapper2;
    // uint8_t prg_ram_size;
    // uint8_t tv_system1;
    // uint8_t tv_system2;
    // char unused[5];
    header : null,
    isValidRom : false,

    // Load a cartridge into the NES
    load : function (f) {
        
        this._reader.readAsArrayBuffer(f);

        let _this = this;
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

                if (_this._mapperID === 0) {
                    _this._mapper = window.mapper_000;
                }else 
                {
                    throw 'Unknown Mapper ID:' + _this._mapperID;
                }
                // FIXME
                _this._mapper.nPRGBanks = _this.header[4];

                // Read program banks
                let programBankSize = _this.header[4] * 16384;
                _this._programBanks = new Uint8Array(buffer.slice(dataOffset, programBankSize + dataOffset));
    

                _this._mapper.nCHRBanks = _this.header[5];

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
    },

    getMapper : function() {
        return this._mapper;
    },
    cpuRead : function (addr) {
        let mapped_addr = this._mapper.cpuMapRead(addr);
        return mapped_addr !== false ? this._programBanks[mapped_addr] : false;           
    },

    cpuWrite : function (address, value) {
        if (address > 0xFFFF) {
            this._programBanks[address] = value;
            return true;
        }
        return false;

    },

    ppuRead : function(addr) {
	    let mapped_addr = this._mapper.ppuMapRead(addr);
        if (mapped_addr !== false) {
            return this._chrBanks[mapped_addr];
        }
        else
            return false;
    },

    ppuWrite : function(addr, data)
    {
        let mapped_addr = 0;
        if (this._mapper.ppuMapWrite(addr, mapped_addr))
        {
            this._chrBanks[mapped_addr] = data;
            return true;
        }
        else
            return false;
    }

}