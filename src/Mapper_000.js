window.mapper_000 = {

    nPRGBanks : 0,
    nCHRBanks : 0,
    
    cpuMapRead : function(addr) {
        // if PRGROM is 16KB
        //     CPU Address Bus          PRG ROM
        //     0x8000 -> 0xBFFF: Map    0x0000 -> 0x3FFF
        //     0xC000 -> 0xFFFF: Mirror 0x0000 -> 0x3FFF
        // if PRGROM is 32KB
        //     CPU Address Bus          PRG ROM
        //     0x8000 -> 0xFFFF: Map    0x0000 -> 0x7FFF	
        if (addr >= 0x8000 && addr <= 0xFFFF) {
            return addr & (this.nPRGBanks > 1 ? 0x7FFF : 0x3FFF);
        }
        return false;
    },

    cpuMapWrite : function(addr, mapped_addr) {
        if (addr >= 0x8000 && addr <= 0xFFFF) {
            return addr & (this.nPRGBanks > 1 ? 0x7FFF : 0x3FFF);
        }
        return false;
    },

    ppuMapRead : function(addr) {
        // There is no mapping required for PPU
        // PPU Address Bus          CHR ROM
        // 0x0000 -> 0x1FFF: Map    0x0000 -> 0x1FFF
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            return addr;
        }

        return false;
    },

    ppuMapWrite : function(addr, mapped_addr) {
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            if (this.nCHRBanks == 0) {
                // Treat as RAM
                return addr;
            }
        }
        return false;
    },

    scanline : function () {

    }
}