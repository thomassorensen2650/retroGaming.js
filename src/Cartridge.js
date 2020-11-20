window.Cartridge = function Cartridge() {

    this._reader = new FileReader();
    this.header = null;

    this.romName = "N/A";
    /*
     * 	char name[4];
		uint8_t prg_rom_chunks;
		uint8_t chr_rom_chunks;
		uint8_t mapper1;
		uint8_t mapper2;
		uint8_t prg_ram_size;
		uint8_t tv_system1;
		uint8_t tv_system2;
		char unused[5];
        */
    this.load = function (f) {


        // 
        //let file = new File(f);

        this._reader.readAsArrayBuffer(f);
       
        this._reader.onloadend = function (e) {
            console.log(e.target.result);

            this.header = e.target.result.slice(0, 16);
            console.log(this.header);

            this.romName = "";
            for (let i = 0; i < 4; i++) {
                this.romName += String.fromCharCode(this.header.Int8Array[i]);
            }
            console.log(this.romName);
            ;




        };
        //fr.onerror = errorHandler;
        //fr.onabort = () => changeStatus('Start Loading');
        //fr.onloadstart = () => changeStatus('Start Loading');
       // fr.onload = () => { changeStatus('Loaded') };


    }
}
    
