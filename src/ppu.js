"use strict";   
/*
	olc::NES - Picture Processing Unit (PPU) 2C02
	"Thanks Dad for believing computers were gonna be a big deal..." - javidx9

	License (OLC-3)
	~~~~~~~~~~~~~~~

	Copyright 2018-2019 OneLoneCoder.com

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions
	are met:

	1. Redistributions or derivations of source code must retain the above
	copyright notice, this list of conditions and the following disclaimer.

	2. Redistributions or derivative works in binary form must reproduce
	the above copyright notice. This list of conditions and the following
	disclaimer must be reproduced in the documentation and/or other
	materials provided with the distribution.

	3. Neither the name of the copyright holder nor the names of its
	contributors may be used to endorse or promote products derived
	from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
	"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
	LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
	A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
	HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
	SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
	DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
	THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


	Relevant Video: https://youtu.be/xdzOvpYPmGE

	Links
	~~~~~
	YouTube:	https://www.youtube.com/javidx9
				https://www.youtube.com/javidx9extra
	Discord:	https://discord.gg/WhwHUMV
	Twitter:	https://www.twitter.com/javidx9
	Twitch:		https://www.twitch.tv/javidx9
	GitHub:		https://www.github.com/onelonecoder
	Patreon:	https://www.patreon.com/javidx9
	Homepage:	https://www.onelonecoder.com

	Author
	~~~~~~
	David Barr, aka javidx9, �OneLoneCoder 2019
*/

window.PPU = {

    /** Lookup table of all colors that the PPU can generate */
    palScreen : [
        { r: 84, g: 84,  b: 84,  hex: "#545454" }, // 0x00 RGB : 84, 84, 84
        { r: 0,  g: 30,  b: 116, hex: "#001E74", }, // 0x01 RGB : 0, 30, 116
        { r: 8,  g: 16,  b: 144, hex: "#081090", }, // 0x02 RGB : 8, 16, 144
        { r: 48, g: 0,   b: 136, hex: "#300088", }, // 0x03 RGB : 48, 0, 136
        { r: 68, g: 0,   b: 100, hex: "#440064", }, // 0x04 RGB : 68, 0, 100
        { r: 92, g: 0,   b: 48,  hex: "#5C0030", }, // 0x05 RGB : 92, 0, 48
        { r: 84, g: 4,   b: 0,   hex: "#540400", }, // 0x06 RGB : 84, 4, 0
        { r: 60, g: 24,  b: 0,   hex: "#3E1800", }, // 0x07 RGB : 60, 24, 0
        { r: 32, g: 42,  b: 0,   hex: "#202A00", }, // 0x08 RGB : 32, 42, 0
        { r: 8,  g: 58,  b: 0,   hex: "#083A00", }, // 0x09 RGB : 8, 58, 0 
        { r: 0,  g: 64,  b: 0,   hex: "#004000", }, // 0x0A RGB : 0, 64, 0
        { r: 0,  g: 60,  b: 0,   hex: "#003C00", }, // 0x0B RGB : 0, 60, 0
        { r: 0,  g: 50,  b: 60,  hex: "#00323C", }, // 0x0C RGB : 0, 50, 60
        { r: 0,  g: 0,   b: 0,   hex: "#000000", }, // 0x0D RGB : 0, 0, 0
        { r: 0,  g: 0,   b: 0,   hex: "#000000", }, // 0x0E RGB : 0, 0, 0
        { r: 0,  g: 0,   b: 0,   hex: "#000000", }, // 0x0F RGB : 0, 0, 
        
        { r: 152, g: 150, b: 152,   hex: "#989698", }, // 0x10 RGB : 152, 150, 152
        { r: 8,   g: 76,  b: 196,   hex: "#08B0C4", }, // 0x11 RGB : 8, 76, 196
        { r: 48,  g: 50,  b: 236,   hex: "#3032EC", }, // 0x12 RGB : 48, 50, 236
        { r: 92,  g: 30,  b: 228,   hex: "#5C1EE4", }, // 0x13 RGB : 92, 30, 228
        { r: 136, g: 20,  b: 176,   hex: "#8814B0", }, // 0x14 RGB : 136, 20, 176
        { r: 160, g: 20,  b: 100,   hex: "#A01464", }, // 0x15 RGB : 160, 20, 100
        { r: 152, g: 34,  b: 32,    hex: "#982220", }, // 0x16 RGB : 152, 34, 32
        { r: 120, g: 60,  b: 0,     hex: "#783C00", }, // 0x17 RGB : 120, 60, 0
        { r: 84,  g: 90,  b: 0,     hex: "#545A00", }, // 0x18 RGB : 84, 90, 0
        { r: 40,  g: 114, b: 0,     hex: "#287200", }, // 0x19 RGB : 40, 114, 0
        { r: 8,  g: 124,  b: 0,     hex: "#087C00", }, // 0x1A RGB : 8, 124, 0
        { r: 0,  g: 118,  b: 40,    hex: "#007628", }, // 0x1B RGB : 0, 118, 40
        { r: 0,  g: 102,  b: 120,   hex: "#006678", }, // 0x1C RGB : 0, 102, 120
        { r: 0,  g: 0,    b: 0,     hex: "#000000", }, // 0x1D RGB : 0, 0, 0
        { r: 0,  g: 0,    b: 0,     hex: "#000000", }, // 0x1E RGB : 0, 0, 0
        { r: 0,  g: 0,    b: 0,     hex: "#000000", }, // 0x1F RGB : 0, 0, 0
        
        { r: 236,  g: 236,  b: 236, hex: "#ECEEEC", }, // 0x20 RGB : 236, 238, 236
        { r: 6,    g: 154,  b: 236, hex: "#069AEC", }, // 0x21 RGB : 6, 154, 236
        { r: 20,   g: 124,  b: 236, hex: "#147CEC", }, // 0x22 RGB : 20, 124, 236
        { r: 176,  g: 98,   b: 236, hex: "#B062EC", }, // 0x23 RGB : 176, 98, 236
        { r: 228,  g: 84,   b: 236, hex: "#E454EC", }, // 0x24 RGB : 228, 84, 236
        { r: 236,  g: 88,   b: 180, hex: "#EC58B4", }, // 0x25 RGB : 236, 88, 180
        { r: 236,  g: 106,  b: 100, hex: "#EC6A64", }, // 0x26 RGB : 236, 106, 100
        { r: 212,  g: 136,  b: 32,  hex: "#D48820", }, // 0x27 RGB : 212, 136, 32
        { r: 160,  g: 170,  b: 0,   hex: "#A0AA00", }, // 0x28 RGB : 160, 170, 0
        { r: 116,  g: 196,  b: 0,   hex: "#74C400", }, // 0x29 RGB : 116, 196, 0
        { r: 76,   g: 208,  b: 32,  hex: "#4CD020", }, // 0x2A RGB : 76, 208, 32
        { r: 56,   g: 204,  b: 108, hex: "#38CC6C", }, // 0x2B RGB : 56, 204, 108
        { r: 56,   g: 180,  b: 204, hex: "#38B4CC", }, // 0x2C RGB : 56, 180, 204
        { r: 60,   g: 60,   b: 60,  hex: "#3C3C3C", }, // 0x2D RGB : 60, 60, 60
        { r: 0,    g: 0,    b: 0,   hex: "#000000", }, // 0x2E RGB : 0, 0, 0
        { r: 0,    g: 0,    b: 0,   hex: "#000000", }, // 0x2F RGB : 0, 0, 0

        { r: 236, g: 238, b: 236, hex: "#ECEEEC", }, // 0x30 RGB : 236, 238, 236
        { r: 168, g: 204, b: 236, hex: "#A8CCEC", }, // 0x31 RGB : 168, 204, 236
        { r: 188, g: 188, b: 236, hex: "#BCBCEC", }, // 0x32 RGB : 188, 188, 236
        { r: 212, g: 178, b: 236, hex: "#D4B2EC", }, // 0x33 RGB : 212, 178, 236
        { r: 236, g: 174, b: 236, hex: "#ECAEEC", }, // 0x34 RGB : 236, 174, 236
        { r: 236, g: 174, b: 212, hex: "#ECAED4", }, // 0x35 RGB : 236, 174, 212
        { r: 236, g: 180, b: 176, hex: "#ECB4B0", }, // 0x36 RGB : 236, 180, 176
        { r: 228, g: 196, b: 144, hex: "#E4C490", }, // 0x37 RGB : 228, 196, 144
        { r: 204, g: 210, b: 120, hex: "#CCD278", }, // 0x38 RGB : 204, 210, 120
        { r: 180, g: 222, b: 120, hex: "#B4DE78", }, // 0x39 RGB : 180, 222, 120
        { r: 168, g: 226, b: 144, hex: "#A8E290", }, // 0x3A RGB : 168, 226, 144
        { r: 52,  g: 226, b: 180, hex: "#98E2B4", }, // 0x3B RGB : 152, 226, 180
        { r: 160, g: 214, b: 228, hex: "#A0D6E4", }, // 0x3C RGB : 160, 214, 228
        { r: 160, g: 162, b: 160, hex: "#A0A2A0", }, // 0x3D RGB : 160, 162, 160
        { r: 0,   g: 0,   b: 0,   hex: "#000000", }, // 0x3E RGB : 0, 0, 0
        { r: 0,   g: 0,   b: 0,   hex: "#000000", }, // 0x3F RGB : 0, 0, 0
    ],

    _bitToByte : function(bitArray) {
        let byte = 0x0;

        for (let i = bitArray.length; i != 0; i--) {
            let v = bitArray[i];
            let bit = 1 << i;
            if (v) {
                byte |= bit;
            }
            else {
                byte &= ~bit;
            }	
          }
        return byte;
    },
    _byteToBit : function(byte) {
        bits = [];
        for (let i = 0; i < 8; i++) {
            bit = (byte & 1 << i) > 0 ? 1 : 0;
            bits.push(bit);     
        }
        return bits;
    },
    
    	// A listerner that will be called if any public properties are changed.
    frameCompleteListener: function(frame) {},
    
    // The OAM is conveniently package above to work with, but the DMA
    // mechanism will need access to it for writing one byute at a time
    pOAM : [],

    nmi : false,

    cycle : 0,
    
    bg_next_tile_id         : 0x00,
	bg_next_tile_attrib     : 0x00,
	bg_next_tile_lsb        : 0x00,
	bg_next_tile_msb        : 0x00,
	bg_shifter_pattern_lo   : 0x0000,
	bg_shifter_pattern_hi   : 0x0000,
	bg_shifter_attrib_lo    : 0x0000,
    bg_shifter_attrib_hi    : 0x0000,

    oam_addr : 0,
    sprite_count : 0,
    
    sprite_shifter_pattern_lo : new Array(8).fill(0),
    sprite_shifter_pattern_hi : new Array(8).fill(0),
    
    // Sprite Zero Collision Flags
	bSpriteZeroHitPossible : false,
    bSpriteZeroBeingRendered : false,
    
    // Pixel offset horizontally
	fine_x : 0x00,

    /**
     * True if the frame has been fully rendered
     */
    frame_complete : false,

	// Internal communications
	address_latch : 0x00,
	ppu_data_buffer : 0x00,

	// Pixel "dot" position information
	scanline : 0,
	cycle : 0,

    odd_frame : false,
    ppu_data_buffer :    0x00,

    vram_addr :  {

        coarse_x : 0, // Size 5
        coarse_y : 0, // Size 5
        nametable_x : 0, // Size 1
        nametable_y : 0, // Size 1
        fine_y : 0, // Size 3
        unused : 0, // Size 1

		get : function() {
            return (this.coarse_x    & 0b11111)       | // Size 5
                   (this.coarse_y    & 0b11111) << 5  | // Size 5
                   (this.nametable_x & 0b00001) << 10 | // Size 1
                   (this.nametable_y & 0b00001) << 11 | // size 1
                   (this.fine_y      & 0b00111) << 14 | // Size 3
                   (this.unused      & 0b00001) << 15 ; // Size 1
        },
        set : function(value) {
            this.coarse_x =     (value & (1 << 0)) > 0 ? 1 : 0;
            this.coarse_y =     (value & (1 << 1)) > 0 ? 1 : 0;
            this.nametable_x =  (value & (1 << 2)) > 0 ? 1 : 0;
            this.nametable_y =  (value & (1 << 3)) > 0 ? 1 : 0;
            this.fine_y =       (value & (1 << 4)) > 0 ? 1 : 0;
            this.unused =       (value & (1 << 5)) > 0 ? 1 : 0;
        }
    },

    tram_addr :  {

        coarse_x : 0, // Size 5
        coarse_y : 0, // Size 5
        nametable_x : 0, // Size 1
        nametable_y : 0, // Size 1
        fine_y : 0, // Size 3
        unused : 0, // Size 1

		get : function() {
            return this.coarse_x |
                   this.coarse_y << 5 |
                   this.nametable_x << 11 |
                   this.nametable_y << 12 |
                   this.fine_y << 15 |
                   this.unused << 16;
        },
        set : function(value)  {
            if (this == window) throw 'This is Fucked!' ;

            this.coarse_x =     (value & (1 << 0)) > 0 ? 1 : 0;
            this.coarse_y =     (value & (1 << 1)) > 0 ? 1 : 0;
            this.nametable_x =  (value & (1 << 2)) > 0 ? 1 : 0;
            this.nametable_y =  (value & (1 << 3)) > 0 ? 1 : 0;
            this.fine_y =       (value & (1 << 4)) > 0 ? 1 : 0;
            this.unused =       (value & (1 << 5)) > 0 ? 1 : 0;
        }
    },

    control :  {

        //
        nametable_x : 0,
		nametable_y : 0,
		increment_mode : 0,
		pattern_sprite : 0,
		pattern_background : 0,
		sprite_size : 0,
		slave_mode : 0, // unused
        enable_nmi : 0,

		get : function() {
            return this.nametable_x |
                   this.nametable_y << 1 |
                   this.increment_mode << 2 |
                   this.pattern_sprite << 3 |
                   this.pattern_background << 4 |
                   this.sprite_size << 5 |
                   this.slave_mode << 6 |
                   this.enable_nmi << 7;
        },
        set : function(value) {
            if (this == window) throw 'This is Fucked!' ;
            this.nametable_x            = (value & (1 << 0)) > 0 ? 1 : 0;
            this.nametable_y            = (value & (1 << 1)) > 0 ? 1 : 0;
            this.increment_mode         = (value & (1 << 2)) > 0 ? 1 : 0;
            this.pattern_sprite         = (value & (1 << 3)) > 0 ? 1 : 0;
            this.pattern_background     = (value & (1 << 4)) > 0 ? 1 : 0;
            this.sprite_size            = (value & (1 << 5)) > 0 ? 1 : 0;
            this.slave_mode             = (value & (1 << 6)) > 0 ? 1 : 0;
            this.enable_nmi             = (value & (1 << 7)) > 0 ? 1 : 0;
        }
    },

    mask : {
        grayscale : 0,
        render_background_left : 0,
        render_sprites_left : 0,
        render_background : 0,
        render_sprites : 0,
        enhance_red : 0,
        enhance_green : 0,
        enhance_blue : 0,

        get : function() {
            return this.grayscale &
                   this.render_background_left << 1 |
                   this.render_sprites_left << 2 |
                   this.render_background << 3 |
                   this.render_sprites << 4 |
                   this.enhance_red << 5 |
                   this.enhance_green << 6 |
                   this.enhance_blue << 7;
        },
        set : function(value) {
            if (this == window) throw 'This is Fucked!' ;
            this.grayscale              = (value & (1 << 0)) > 0 ? 1 : 0;
            this.render_background_left = (value & (1 << 1)) > 0 ? 1 : 0;
            this.render_sprites_left    = (value & (1 << 2)) > 0 ? 1 : 0;
            this.render_background      = (value & (1 << 3)) > 0 ? 1 : 0;
            this.render_sprites         = (value & (1 << 4)) > 0 ? 1 : 0;
            this.enhance_red            = (value & (1 << 5)) > 0 ? 1 : 0;
            this.enhance_green          = (value & (1 << 6)) > 0 ? 1 : 0;
            this.enhance_blue           = (value & (1 << 7)) > 0 ? 1 : 0;
        }
    },


    status : {
        //unused : 5;
        sprite_overflow : 0,
        sprite_zero_hit : 0,
        vertical_blank : 0,

        get : function() {
            return (this.sprite_overflow << 5) |
                   (this.sprite_zero_hit << 6) |
                   (this.vertical_blank << 7);
        },
        set : function(value) {
            if (this == window) throw 'This is Fucked!' ;
            this.enhance_red    = (value & (1 << 5)) > 0 ? 1 : 0;
            this.enhance_green  = (value & (1 << 6)) > 0 ? 1 : 0;
            this.enhance_blue   = (value & (1 << 7)) > 0 ? 1 : 0;
        }
    },


    /** Foreground "Sprite" rendering ================================
	 The OAM is an additional memory internal to the PPU. It is
	 not connected via the any bus. It stores the locations of
	 64off 8x8 (or 8x16) tiles to be drawn on the next frame. */
     OAM : new Array(64).fill(
        {
            y : 0,			    // Y position of sprite
            id : 0,			    // ID of tile from pattern memory
            attribute : 0,	    // Flags define how sprite should be rendered
            x : 0,		        // X position of sprite
        }
     ),

     spriteScanline : new Array(8).fill({
        y : 0,			    // Y position of sprite
        id : 0,			    // ID of tile from pattern memory
        attribute : 0,	    // Flags define how sprite should be rendered
        x : 0,		        // X position of sprite
     }),


    
    tblPattern : new Array(2).fill(0).map(() => new Array(4096).fill(0)),
    sprPatternTable : new Array(2).fill(0),
    sprScreen : new Array(256).fill(0).map(() => new Array(240).fill(0)),

    tblPalette : [],
    tblName : new Array(2).fill(0).map(() => new Array(1024).fill(0)), //[2][1024];

   
    /**  Simply returns the current sprite holding the rendered screen */
    getScreen : function() {
        return this.sprScreen;
    },

    /**
     * This is a convenience function that takes a specified palette and pixel
     * index and returns the appropriate screen colour.
     * @param {number} palette the pallet number
     * @param {number} pixel  the pixel number
     * @returns {string} Hex color code
     */
    getColourFromPaletteRam : function(palette, pixel) {

        // "0x3F00"       - Offset into PPU addressable range where palettes are stored
        // "palette << 2" - Each palette is 4 bytes in size
        // "pixel"        - Each pixel index is either 0, 1, 2 or 3
        // "& 0x3F"       - Stops us reading beyond the bounds of the palScreen array
        return this.palScreen[this.ppuRead(0x3F00 + (palette << 2) + pixel) & 0x3F];

        // Note: We dont access tblPalette directly here, instead we know that ppuRead()
        // will map the address onto the seperate small RAM attached to the PPU bus.
    },

    /**
     * This function draw the CHR ROM for a given pattern table into
	 * an object, using a specified palette. Pattern tables consist
	 * of 16x16 "tiles or characters". It is independent of the running
	 * emulation and using it does not change the systems state, though
	 * it gets all the data it needs from the live system. Consequently,
	 * if the game has not yet established palettes or mapped to relevant
	 * CHR ROM banks, the sprite may look empty. This approach permits a 
	 * "live" extraction of the pattern table exactly how the NES, and 
	 * ultimately the player would see it.
	 * A tile consists of 8x8 pixels. On the NES, pixels are 2 bits, which
	 * gives an index into 4 different colours of a specific palette. There
	 * are 8 palettes to choose from. Colour "0" in each palette is effectively
	 * considered transparent, as those locations in memory "mirror" the global
	 * background colour being used. This mechanics of this are shown in 
	 * detail in ppuRead() & ppuWrite()
     * @param {number} i 
     * @param {number} palette 
     * @returns {object} Pattern Table
     */
    getPatternTable : function(i, palette) {

        // Characters on NES
        // ~~~~~~~~~~~~~~~~~
        // The NES stores characters using 2-bit pixels. These are not stored sequentially
        // but in singular bit planes. For example:
        //
        // 2-Bit Pixels       LSB Bit Plane     MSB Bit Plane
        // 0 0 0 0 0 0 0 0	  0 0 0 0 0 0 0 0   0 0 0 0 0 0 0 0
        // 0 1 1 0 0 1 1 0	  0 1 1 0 0 1 1 0   0 0 0 0 0 0 0 0
        // 0 1 2 0 0 2 1 0	  0 1 1 0 0 1 1 0   0 0 1 0 0 1 0 0
        // 0 0 0 0 0 0 0 0 =  0 0 0 0 0 0 0 0 + 0 0 0 0 0 0 0 0
        // 0 1 1 0 0 1 1 0	  0 1 1 0 0 1 1 0   0 0 0 0 0 0 0 0
        // 0 0 1 1 1 1 0 0	  0 0 1 1 1 1 0 0   0 0 0 0 0 0 0 0
        // 0 0 0 2 2 0 0 0	  0 0 0 1 1 0 0 0   0 0 0 1 1 0 0 0
        // 0 0 0 0 0 0 0 0	  0 0 0 0 0 0 0 0   0 0 0 0 0 0 0 0
        //
        // The planes are stored as 8 bytes of LSB, followed by 8 bytes of MSB

        this.sprPatternTable[i] = [];
        // Loop through all 16x16 tiles
        for (let nTileY = 0; nTileY < 16; nTileY++) {
            for (let nTileX = 0; nTileX < 16; nTileX++) {
                // Convert the 2D tile coordinate into a 1D offset into the pattern
                // table memory.
                let nOffset = nTileY * 256 + nTileX * 16;

                // Now loop through 8 rows of 8 pixels
                for (let row = 0; row < 8; row++) {
                    // For each row, we need to read both bit planes of the character
                    // in order to extract the least significant and most significant 
                    // bits of the 2 bit pixel value. in the CHR ROM, each character
                    // is stored as 64 bits of lsb, followed by 64 bits of msb. This
                    // conveniently means that two corresponding rows are always 8
                    // bytes apart in memory.
                    let tile_lsb = this.ppuRead(i * 0x1000 + nOffset + row + 0x0000);
                    let tile_msb = this.ppuRead(i * 0x1000 + nOffset + row + 0x0008);


                    // Now we have a single row of the two bit planes for the character
                    // we need to iterate through the 8-bit words, combining them to give
                    // us the final pixel index
                    for (let col = 0; col < 8; col++) {
                        // We can get the index value by simply adding the bits together
                        // but we're only interested in the lsb of the row words because...
                        let pixel = (tile_msb & 0x01) << 1 | (tile_lsb & 0x01);

                        // ...we will shift the row words 1 bit right for each column of
                        // the character.
                        tile_lsb >>= 1; tile_msb >>= 1;

                        // Now we know the location and NES pixel value for a specific location
                        // in the pattern table, we can translate that to a screen colour, and an
                        // (x,y) location in the sprite
                        let _this = this;
                        
                        this.sprPatternTable[i].push( //.SetPixel
                        {
                            x : nTileX * 8 + (7 - col), // Because we are using the lsb of the row word first
                                                    // we are effectively reading the row from right
                                                    // to left, so we need to draw the row "backwards"
                            y : nTileY * 8 + row, 
                            c : _this.getColourFromPaletteRam(palette, pixel)
                        });
                    }
                }
            }
        }

        // Finally return the updated sprite representing the pattern table
        return this.sprPatternTable[i];
},


/**
 * 
 * @param {number} i the id of the name table 
 */
getNameTable : function(i) {
	// As of now unused, but a placeholder for nametable visualisation in teh future
	return this.sprNameTable[i];
},

/**
 * 
 * @param {number} addr 
 * @param {boolean} rdonly 
 * @returns {number} the value of the register
 */
cpuRead : function(addr, rdonly) {
	let data = 0x00;

	if (rdonly) {
		// Reading from PPU registers can affect their contents
		// so this read only option is used for examining the
		// state of the PPU without changing its state. This is
		// really only used in debug mode.
		switch (addr) {
            case 0x0000: // Control
                data = this.control.get();
                break;
            case 0x0001: // Mask
                data = this.mask.get();
                break;
            case 0x0002: // Status
                //this.status.vertical_blank = 0;
                data = this.status.get();
                break;
            case 0x0003: // OAM Address
                break;
            case 0x0004: // OAM Data
                break;
            case 0x0005: // Scroll
                break;
            case 0x0006: // PPU Address
                break;
            case 0x0007: // PPU Data
                break;
		}
	}
	else
	{
		// These are the live PPU registers that repsond
		// to being read from in various ways. Note that not
		// all the registers are capable of being read from
		// so they just return 0x00
		switch (addr) {
			// Control - Not readable
		case 0x0000: break;
		
			// Mask - Not Readable
		case 0x0001: break;
		
			// Status
		case 0x0002:

            // FIXME : his.status.vertical_blank = 0;
            this.status.vertical_blank = 1;

			// Reading from the status register has the effect of resetting
			// different parts of the circuit. Only the top three bits
			// contain status information, however it is possible that
			// some "noise" gets picked up on the bottom 5 bits which 
			// represent the last PPU bus transaction. Some games "may"
			// use this noise as valid data (even though they probably
            // shouldn't)
            let test = this.status.get()
			data = (this.status.get() & 0xE0) | (this.ppu_data_buffer & 0x1F);

        	// Clear the vertical blanking flag
           // this.status.vertical_blank = 0;

			// Reset Loopy's Address latch flag
			this.address_latch = 0;
			break;

			// OAM Address - Not Readable
		case 0x0003: break;

			// OAM Data
		case 0x0004: 
			data = this.pOAM[this.oam_addr];
			break;

			// Scroll - Not Readable
		case 0x0005: break;

			// PPU Address - Not Readable
		case 0x0006: break;

			// PPU Data
		case 0x0007: 
			// Reads from the NameTable ram get delayed one cycle, 
			// so output buffer which contains the data from the 
			// previous read request
			data = this.ppu_data_buffer;
			// then update the buffer for next time
			this.ppu_data_buffer = this.ppuRead(this.vram_addr.get());
			// However, if the address was in the palette range, the
			// data is not delayed, so it returns immediately
			if (this.vram_addr.get() >= 0x3F00) data = this.ppu_data_buffer;
			// All reads from PPU data automatically increment the nametable
			// address depending upon the mode set in the control register.
			// If set to vertical mode, the increment is 32, so it skips
			// one whole nametable row; in horizontal mode it just increments
			// by 1, moving to the next column
			this.vram_addr.set(this.vram_addr.get() + (this.control.increment_mode ? 32 : 1));
			break;
		}
	}

	return data;
},

/**
 * 
 * @param {Number} addr 
 * @param {Number} data 
 */
cpuWrite(addr, data) {
	switch (addr) {
	case 0x0000: // Control
		this.control.set(data);
		this.tram_addr.nametable_x = this.control.nametable_x;
		this.tram_addr.nametable_y = this.control.nametable_y;
		break;
	case 0x0001: // Mask
		this.mask.set(data);
		break;
	case 0x0002: // Status
		break;
	case 0x0003: // OAM Address
		this.oam_addr = data;
		break;
	case 0x0004: // OAM Data
		this.pOAM[this.oam_addr] = data;
		break;
	case 0x0005: // Scroll
		if (this.address_latch == 0) {
			// First write to scroll register contains X offset in pixel space
			// which we split into coarse and fine x values
			this.fine_x = data & 0x07;
			this.tram_addr.coarse_x = data >> 3;
			this.address_latch = 1;
		}
		else
		{
			// First write to scroll register contains Y offset in pixel space
			// which we split into coarse and fine Y values
			this.tram_addr.fine_y = data & 0x07;
			this.tram_addr.coarse_y = data >> 3;
			this.address_latch = 0;
		}
		break;
	case 0x0006: // PPU Address
		if (this.address_latch == 0)
		{
			// PPU address bus can be accessed by CPU via the ADDR and DATA
			// registers. The fisrt write to this register latches the high byte
			// of the address, the second is the low byte. Note the writes
			// are stored in the tram register...
			this.tram_addr.set(((data & 0x3F) << 8) | (this.tram_addr.get() & 0x00FF));
			this.address_latch = 1;
		}
		else
		{
			// ...when a whole address has been written, the internal vram address
			// buffer is updated. Writing to the PPU is unwise during rendering
			// as the PPU will maintam the vram address automatically whilst
			// rendering the scanline position.
			this.tram_addr.set((this.tram_addr.get() & 0xFF00) | data);
			this.vram_addr.set(this.tram_addr);
			this.address_latch = 0;
		}
		break;
	case 0x0007: // PPU Data
		this.ppuWrite(this.vram_addr.get(), data);
		// All writes from PPU data automatically increment the nametable
		// address depending upon the mode set in the control register.
		// If set to vertical mode, the increment is 32, so it skips
		// one whole nametable row; in horizontal mode it just increments
		// by 1, moving to the next column
		this.vram_addr.set(this.vram_addr.get() + (this.control.increment_mode ? 32 : 1));
		break;
	}
},

ppuRead : function(addr, rdonly) {
	addr &= 0x3FFF;

    let data = this._cart.ppuRead(addr);
	if (data !== false) {
        return data;
	}
	else if (addr >= 0x0000 && addr <= 0x1FFF) {
		// If the cartridge cant map the address, have
		// a physical location ready here
		data = this.tblPattern[(addr & 0x1000) >> 12][addr & 0x0FFF];
	}
	else if (addr >= 0x2000 && addr <= 0x3EFF) {
		addr &= 0x0FFF;

		if (this._cart._mirror ==  "VERTICAL") {
			// Vertical
			if (addr >= 0x0000 && addr <= 0x03FF)
				data = this.tblName[0][addr & 0x03FF];
			if (addr >= 0x0400 && addr <= 0x07FF)
				data = this.tblName[1][addr & 0x03FF];
			if (addr >= 0x0800 && addr <= 0x0BFF)
				data = this.tblName[0][addr & 0x03FF];
			if (addr >= 0x0C00 && addr <= 0x0FFF)
				data = this.tblName[1][addr & 0x03FF];
		}
		else if (this._cart._mirror == "HORIZONTAL") {
			// Horizontal
			if (addr >= 0x0000 && addr <= 0x03FF)
				data = this.tblName[0][addr & 0x03FF];
			if (addr >= 0x0400 && addr <= 0x07FF)
				data = this.tblName[0][addr & 0x03FF];
			if (addr >= 0x0800 && addr <= 0x0BFF)
				data = this.tblName[1][addr & 0x03FF];
			if (addr >= 0x0C00 && addr <= 0x0FFF)
				data = this.tblName[1][addr & 0x03FF];
		}
	}
	else if (addr >= 0x3F00 && addr <= 0x3FFF) {
		addr &= 0x001F;
		if (addr == 0x0010) addr = 0x0000;
		if (addr == 0x0014) addr = 0x0004;
		if (addr == 0x0018) addr = 0x0008;
		if (addr == 0x001C) addr = 0x000C;
		data = this.tblPalette[addr] & (this.mask.grayscale ? 0x30 : 0x3F);
	}
	return data;
},

ppuWrite : function(addr, data) {
	addr &= 0x3FFF;

	if (this._cart.ppuWrite(addr, data)){

	}
	else if (addr >= 0x0000 && addr <= 0x1FFF) {
		this.tblPattern[(addr & 0x1000) >> 12][addr & 0x0FFF] = data;
	}
	else if (addr >= 0x2000 && addr <= 0x3EFF) {
		addr &= 0x0FFF;
		if (this._cart.Mirror() == "VERTICAL") {
			// Vertical
			if (addr >= 0x0000 && addr <= 0x03FF)
				this.tblName[0][addr & 0x03FF] = data;
			if (addr >= 0x0400 && addr <= 0x07FF)
				this.tblName[1][addr & 0x03FF] = data;
			if (addr >= 0x0800 && addr <= 0x0BFF)
				this.tblName[0][addr & 0x03FF] = data;
			if (addr >= 0x0C00 && addr <= 0x0FFF)
				this.tblName[1][addr & 0x03FF] = data;
		}
		else if (this._cart.Mirror() == "HORIZONTAL") {
			// Horizontal
			if (addr >= 0x0000 && addr <= 0x03FF)
				this.tblName[0][addr & 0x03FF] = data;
			if (addr >= 0x0400 && addr <= 0x07FF)
				this.tblName[0][addr & 0x03FF] = data;
			if (addr >= 0x0800 && addr <= 0x0BFF)
				this.tblName[1][addr & 0x03FF] = data;
			if (addr >= 0x0C00 && addr <= 0x0FFF)
				this.tblName[1][addr & 0x03FF] = data;
		}
	}
	else if (addr >= 0x3F00 && addr <= 0x3FFF) {
		addr &= 0x001F;
		if (addr == 0x0010) addr = 0x0000;
		if (addr == 0x0014) addr = 0x0004;
		if (addr == 0x0018) addr = 0x0008;
		if (addr == 0x001C) addr = 0x000C;
		this.tblPalette[addr] = data;
	}
},

connectCartridge : function(cartridge) {
	this._cart = cartridge;
},

reset : function() {
	this.fine_x = 0x00;
	this.address_latch = 0x00;
	this.ppu_data_buffer = 0x00;
	this.scanline = 0;
	this.cycle = 0;
	this.bg_next_tile_id = 0x00;
	this.bg_next_tile_attrib = 0x00;
	this.bg_next_tile_lsb = 0x00;
	this.bg_next_tile_msb = 0x00;
	this.bg_shifter_pattern_lo = 0x0000;
	this.bg_shifter_pattern_hi = 0x0000;
	this.bg_shifter_attrib_lo = 0x0000;
	this.bg_shifter_attrib_hi = 0x0000;
	this.status.set(0x00);
	this.mask.set(0x00);
	this.control.set(0x00);
	this.vram_addr.set(0x0000);
	this.tram_addr.set(0x0000);
	this.scanline_trigger = false;
	this.odd_frame = false;
},

// ==============================================================================
// Increment the background tile "pointer" one scanline vertically
_incrementScrollY : function() {
    // Incrementing vertically is more complicated. The visible nametable
    // is 32x30 tiles, but in memory there is enough room for 32x32 tiles.
    // The bottom two rows of tiles are in fact not tiles at all, they
    // contain the "attribute" information for the entire table. This is
    // information that describes which palettes are used for different 
    // regions of the nametable.
    
    // In addition, the NES doesnt scroll vertically in chunks of 8 pixels
    // i.e. the height of a tile, it can perform fine scrolling by using
    // the fine_y component of the register. This means an increment in Y
    // first adjusts the fine offset, but may need to adjust the whole
    // row offset, since fine_y is a value 0 to 7, and a row is 8 pixels high

    // Ony if rendering is enabled
    if (this.mask.render_background || this.mask.render_sprites) {
        // If possible, just increment the fine y offset
        if (this.vram_addr.fine_y < 7) {
            this.vram_addr.fine_y++;
        }
        else {
            // If we have gone beyond the height of a row, we need to
            // increment the row, potentially wrapping into neighbouring
            // vertical nametables. Dont forget however, the bottom two rows
            // do not contain tile information. The coarse y offset is used
            // to identify which row of the nametable we want, and the fine
            // y offset is the specific "scanline"

            // Reset fine y offset
            this.vram_addr.fine_y = 0;

            // Check if we need to swap vertical nametable targets
            if (this.vram_addr.coarse_y == 29) {
                // We do, so reset coarse y offset
                this.vram_addr.coarse_y = 0;
                // And flip the target nametable bit
                this.vram_addr.nametable_y = ~this.vram_addr.nametable_y;
            }
            else if (this.vram_addr.coarse_y == 31) {
                // In case the pointer is in the attribute memory, we
                // just wrap around the current nametable
                this.vram_addr.coarse_y = 0;
            }
            else {
                // None of the above boundary/wrapping conditions apply
                // so just increment the coarse y offset
                this.vram_addr.coarse_y++;
            }
        }
    }
},

// ==============================================================================
// Increment the background tile "pointer" one tile/column horizontally
_incrementScrollX : function() {
    // Note: pixel perfect scrolling horizontally is handled by the 
    // data shifters. Here we are operating in the spatial domain of 
    // tiles, 8x8 pixel blocks.
    
    // Ony if rendering is enabled
    if (this.mask.render_background || this.mask.render_sprites) {
        // A single name table is 32x30 tiles. As we increment horizontally
        // we may cross into a neighbouring nametable, or wrap around to
        // a neighbouring nametable
        if (this.vram_addr.coarse_x == 31) {
            // Leaving nametable so wrap address round
            this.vram_addr.coarse_x = 0;
            // Flip target nametable bit
            this.vram_addr.nametable_x = ~this.vram_addr.nametable_x;
        }
        else {
            // Staying in current nametable, so just increment
            this.vram_addr.coarse_x++;
        }
    }
},

// ==============================================================================
// Transfer the temporarily stored horizontal nametable access information
// into the "pointer". Note that fine x scrolling is not part of the "pointer"
// addressing mechanism
_transferAddressX : function() {
    // Ony if rendering is enabled
    if (this.mask.render_background || this.mask.render_sprites)
    {
        this.vram_addr.nametable_x = this.tram_addr.nametable_x;
        this.vram_addr.coarse_x    = this.tram_addr.coarse_x;
    }
},

// ==============================================================================
// Transfer the temporarily stored vertical nametable access information
// into the "pointer". Note that fine y scrolling is part of the "pointer"
// addressing mechanism
_transferAddressY : function() {
    // Ony if rendering is enabled
    if (this.mask.render_background || this.mask.render_sprites) {
        this.vram_addr.fine_y      = this.tram_addr.fine_y;
        this.vram_addr.nametable_y = this.tram_addr.nametable_y;
        this.vram_addr.coarse_y    = this.tram_addr.coarse_y;
    }
},

// ==============================================================================
// Prime the "in-effect" background tile shifters ready for outputting next
// 8 pixels in scanline.
_loadBackgroundShifters : function() {	
    // Each PPU update we calculate one pixel. These shifters shift 1 bit along
    // feeding the pixel compositor with the binary information it needs. Its
    // 16 bits wide, because the top 8 bits are the current 8 pixels being drawn
    // and the bottom 8 bits are the next 8 pixels to be drawn. Naturally this means
    // the required bit is always the MSB of the shifter. However, "fine x" scrolling
    // plays a part in this too, whcih is seen later, so in fact we can choose
    // any one of the top 8 bits.
    this.bg_shifter_pattern_lo = (this.bg_shifter_pattern_lo & 0xFF00) | this.bg_next_tile_lsb;
    this.bg_shifter_pattern_hi = (this.bg_shifter_pattern_hi & 0xFF00) | this.bg_next_tile_msb;

    // Attribute bits do not change per pixel, rather they change every 8 pixels
    // but are synchronised with the pattern shifters for convenience, so here
    // we take the bottom 2 bits of the attribute word which represent which 
    // palette is being used for the current 8 pixels and the next 8 pixels, and 
    // "inflate" them to 8 bit words.
    this.bg_shifter_attrib_lo  = (this.bg_shifter_attrib_lo & 0xFF00) | ((this.bg_next_tile_attrib & 0b01) ? 0xFF : 0x00);
    this.bg_shifter_attrib_hi  = (this.bg_shifter_attrib_hi & 0xFF00) | ((this.bg_next_tile_attrib & 0b10) ? 0xFF : 0x00);
},

// ==============================================================================
// Every cycle the shifters storing pattern and attribute information shift
// their contents by 1 bit. This is because every cycle, the output progresses
// by 1 pixel. This means relatively, the state of the shifter is in sync
// with the pixels being drawn for that 8 pixel section of the scanline.
_updateShifters : function() {
    if (this.mask.render_background) {
        // Shifting background tile pattern row
        this.bg_shifter_pattern_lo <<= 1;
        this.bg_shifter_pattern_hi <<= 1;

        // Shifting palette attributes by 1
        this.bg_shifter_attrib_lo <<= 1;
        this.bg_shifter_attrib_hi <<= 1;
    }

    if (this.mask.render_sprites && this.cycle >= 1 && this.cycle < 258)
    {
        for (let i = 0; i < this.sprite_count; i++)
        {
            if (this.spriteScanline[i].x > 0)
            {
                this.spriteScanline[i].x--;
            }
            else
            {
                this.sprite_shifter_pattern_lo[i] <<= 1;
                this.sprite_shifter_pattern_hi[i] <<= 1;
            }
        }
    }
},

// This little lambda function "flips" a byte
// so 0b11100000 becomes 0b00000111. It's very
// clever, and stolen completely from here:
// https://stackoverflow.com/a/2602885
_flipbyte : function() {
    b = (b & 0xF0) >> 4 | (b & 0x0F) << 4;
    b = (b & 0xCC) >> 2 | (b & 0x33) << 2;
    b = (b & 0xAA) >> 1 | (b & 0x55) << 1;
    return b;
},


clock : function() {
	// As we progress through scanlines and cycles, the PPU is effectively
	// a state machine going through the motions of fetching background 
	// information and sprite information, compositing them into a pixel
	// to be output.
	
	// All but 1 of the secanlines is visible to the user. The pre-render scanline
	// at -1, is used to configure the "shifters" for the first visible scanline, 0.
	if (this.scanline >= -1 && this.scanline < 240)
	{		
		// Background Rendering ======================================================

		if (this.scanline == 0 && this.cycle == 0 && this.odd_frame && (this.mask.render_background || this.mask.render_sprites))
		{
			// "Odd Frame" cycle skip
			this.cycle = 1;
		}

		if (this.scanline == -1 && this.cycle == 1)
		{
			// Effectively start of new frame, so clear vertical blank flag
			this.status.vertical_blank = 0;

			// Clear sprite overflow flag
			this.status.sprite_overflow = 0;
			
			// Clear the sprite zero hit flag
			this.status.sprite_zero_hit = 0;

			// Clear Shifters
			for (let i = 0; i < 8; i++)
			{
				this.sprite_shifter_pattern_lo[i] = 0;
				this.sprite_shifter_pattern_hi[i] = 0;
			}
		}


		if ((this.cycle >= 2 && this.cycle < 258) || (this.cycle >= 321 && this.cycle < 338))
		{
			this._updateShifters();
			
			
			// In these cycles we are collecting and working with visible data
			// The "shifters" have been preloaded by the end of the previous
			// scanline with the data for the start of this scanline. Once we
			// leave the visible region, we go dormant until the shifters are
			// preloaded for the next scanline.

			// Fortunately, for background rendering, we go through a fairly
			// repeatable sequence of events, every 2 clock cycles.
			switch ((this.cycle - 1) % 8) {
			case 0:
				// Load the current background tile pattern and attributes into the "shifter"
				this._loadBackgroundShifters();

				// Fetch the next background tile ID
				// "(vram_addr.reg & 0x0FFF)" : Mask to 12 bits that are relevant
				// "| 0x2000"                 : Offset into nametable space on PPU address bus
				this.bg_next_tile_id = this.ppuRead(0x2000 | (this.vram_addr.get() & 0x0FFF));

				// Explanation:
				// The bottom 12 bits of the loopy register provide an index into
				// the 4 nametables, regardless of nametable mirroring configuration.
				// nametable_y(1) nametable_x(1) coarse_y(5) coarse_x(5)
				//
				// Consider a single nametable is a 32x32 array, and we have four of them
				//   0                1
				// 0 +----------------+----------------+
				//   |                |                |
				//   |                |                |
				//   |    (32x32)     |    (32x32)     |
				//   |                |                |
				//   |                |                |
				// 1 +----------------+----------------+
				//   |                |                |
				//   |                |                |
				//   |    (32x32)     |    (32x32)     |
				//   |                |                |
				//   |                |                |
				//   +----------------+----------------+
				//
				// This means there are 4096 potential locations in this array, which 
				// just so happens to be 2^12!
				break;
			case 2:
				// Fetch the next background tile attribute. OK, so this one is a bit
				// more involved :P

				// Recall that each nametable has two rows of cells that are not tile 
				// information, instead they represent the attribute information that
				// indicates which palettes are applied to which area on the screen.
				// Importantly (and frustratingly) there is not a 1 to 1 correspondance
				// between background tile and palette. Two rows of tile data holds
				// 64 attributes. Therfore we can assume that the attributes affect
				// 8x8 zones on the screen for that nametable. Given a working resolution
				// of 256x240, we can further assume that each zone is 32x32 pixels
				// in screen space, or 4x4 tiles. Four system palettes are allocated
				// to background rendering, so a palette can be specified using just
				// 2 bits. The attribute byte therefore can specify 4 distinct palettes.
				// Therefore we can even further assume that a single palette is
				// applied to a 2x2 tile combination of the 4x4 tile zone. The very fact
				// that background tiles "share" a palette locally is the reason why
				// in some games you see distortion in the colours at screen edges.

				// As before when choosing the tile ID, we can use the bottom 12 bits of
				// the loopy register, but we need to make the implementation "coarser"
				// because instead of a specific tile, we want the attribute byte for a 
				// group of 4x4 tiles, or in other words, we divide our 32x32 address
				// by 4 to give us an equivalent 8x8 address, and we offset this address
				// into the attribute section of the target nametable.

				// Reconstruct the 12 bit loopy address into an offset into the
				// attribute memory

				// "(vram_addr.coarse_x >> 2)"        : integer divide coarse x by 4, 
				//                                      from 5 bits to 3 bits
				// "((vram_addr.coarse_y >> 2) << 3)" : integer divide coarse y by 4, 
				//                                      from 5 bits to 3 bits,
				//                                      shift to make room for coarse x

				// Result so far: YX00 00yy yxxx

				// All attribute memory begins at 0x03C0 within a nametable, so OR with
				// result to select target nametable, and attribute byte offset. Finally
				// OR with 0x2000 to offset into nametable address space on PPU bus.				
				this.bg_next_tile_attrib = this.ppuRead(0x23C0 | (this.vram_addr.nametable_y << 11) 
					                                 | (this.vram_addr.nametable_x << 10) 
					                                 | ((this.vram_addr.coarse_y >> 2) << 3) 
					                                 | (this.vram_addr.coarse_x >> 2));
				
				// Right we've read the correct attribute byte for a specified address,
				// but the byte itself is broken down further into the 2x2 tile groups
				// in the 4x4 attribute zone.

				// The attribute byte is assembled thus: BR(76) BL(54) TR(32) TL(10)
				//
				// +----+----+			    +----+----+
				// | TL | TR |			    | ID | ID |
				// +----+----+ where TL =   +----+----+
				// | BL | BR |			    | ID | ID |
				// +----+----+			    +----+----+
				//
				// Since we know we can access a tile directly from the 12 bit address, we
				// can analyse the bottom bits of the coarse coordinates to provide us with
				// the correct offset into the 8-bit word, to yield the 2 bits we are
				// actually interested in which specifies the palette for the 2x2 group of
				// tiles. We know if "coarse y % 4" < 2 we are in the top half else bottom half.
				// Likewise if "coarse x % 4" < 2 we are in the left half else right half.
				// Ultimately we want the bottom two bits of our attribute word to be the
				// palette selected. So shift as required...				
				if (this.vram_addr.coarse_y & 0x02) {
                    this.bg_next_tile_attrib >>= 4;
                }
				if (this.vram_addr.coarse_x & 0x02) {
                    this.bg_next_tile_attrib >>= 2;
                }
				this.bg_next_tile_attrib &= 0x03;
				break;

				// Compared to the last two, the next two are the easy ones... :P

			case 4: 
				// Fetch the next background tile LSB bit plane from the pattern memory
				// The Tile ID has been read from the nametable. We will use this id to 
				// index into the pattern memory to find the correct sprite (assuming
				// the sprites lie on 8x8 pixel boundaries in that memory, which they do
				// even though 8x16 sprites exist, as background tiles are always 8x8).
				//
				// Since the sprites are effectively 1 bit deep, but 8 pixels wide, we 
				// can represent a whole sprite row as a single byte, so offsetting
				// into the pattern memory is easy. In total there is 8KB so we need a 
				// 13 bit address.

				// "(control.pattern_background << 12)"  : the pattern memory selector 
				//                                         from control register, either 0K
				//                                         or 4K offset
				// "((uint16_t)bg_next_tile_id << 4)"    : the tile id multiplied by 16, as
				//                                         2 lots of 8 rows of 8 bit pixels
				// "(vram_addr.fine_y)"                  : Offset into which row based on
				//                                         vertical scroll offset
				// "+ 0"                                 : Mental clarity for plane offset
				// Note: No PPU address bus offset required as it starts at 0x0000
				this.bg_next_tile_lsb = this.ppuRead((this.control.pattern_background << 12) 
					                       + (this.bg_next_tile_id << 4) 
					                       + (this.vram_addr.fine_y) + 0);

				break;
			case 6:
				// Fetch the next background tile MSB bit plane from the pattern memory
				// This is the same as above, but has a +8 offset to select the next bit plane
				this.bg_next_tile_msb = this.ppuRead((this.control.pattern_background << 12)
					                       + (this.bg_next_tile_id << 4)
					                       + (this.vram_addr.fine_y) + 8);
				break;
			case 7:
				// Increment the background tile "pointer" to the next tile horizontally
				// in the nametable memory. Note this may cross nametable boundaries which
				// is a little complex, but essential to implement scrolling
				this._incrementScrollX();
				break;
			}
		}

		// End of a visible scanline, so increment downwards...
		if (this.cycle == 256) {
			this._incrementScrollY();
		}

		//...and reset the x position
		if (this.cycle == 257) {
			this._loadBackgroundShifters();
			this._transferAddressX();
		}

		// Superfluous reads of tile id at end of scanline
		if (this.cycle == 338 || this.cycle == 340) {
			this.bg_next_tile_id = this.ppuRead(0x2000 | (this.vram_addr.get() & 0x0FFF));
		}

		if (this.scanline == -1 && this.cycle >= 280 && this.cycle < 305) {
			// End of vertical blank period so reset the Y address ready for rendering
			this._transferAddressY();
		}


		// Foreground Rendering ========================================================
		// I'm gonna cheat a bit here, which may reduce compatibility, but greatly
		// simplifies delivering an intuitive understanding of what exactly is going
		// on. The PPU loads sprite information successively during the region that
		// background tiles are not being drawn. Instead, I'm going to perform
		// all sprite evaluation in one hit. THE NES DOES NOT DO IT LIKE THIS! This makes
		// it easier to see the process of sprite evaluation.
		if (this.cycle == 257 && this.scanline >= 0) {
			// We've reached the end of a visible scanline. It is now time to determine
			// which sprites are visible on the next scanline, and preload this info
			// into buffers that we can work with while the scanline scans the row.

			// Firstly, clear out the sprite memory. This memory is used to store the
			// sprites to be rendered. It is not the OAM.
			// FIXME: std::memset(spriteScanline, 0xFF, 8 * sizeof(sObjectAttributeEntry));

			// The NES supports a maximum number of sprites per scanline. Nominally
			// this is 8 or fewer sprites. This is why in some games you see sprites
			// flicker or disappear when the scene gets busy.
			this.sprite_count = 0;

			// Secondly, clear out any residual information in sprite pattern shifters
			for (let i = 0; i < 8; i++) {
				this.sprite_shifter_pattern_lo[i] = 0;
				this.sprite_shifter_pattern_hi[i] = 0;
			}

			// Thirdly, Evaluate which sprites are visible in the next scanline. We need
			// to iterate through the OAM until we have found 8 sprites that have Y-positions
			// and heights that are within vertical range of the next scanline. Once we have
			// found 8 or exhausted the OAM we stop. Now, notice I count to 9 sprites. This
			// is so I can set the sprite overflow flag in the event of there being > 8 sprites.
			let nOAMEntry = 0;

			// New set of sprites. Sprite zero may not exist in the new set, so clear this
			// flag.
			this.bSpriteZeroHitPossible = false;

			while (nOAMEntry < 64 && this.sprite_count < 9)
			{
				// Note the conversion to signed numbers here
				let diff = (this.scanline - this.OAM[nOAMEntry].y);

				// If the difference is positive then the scanline is at least at the
				// same height as the sprite, so check if it resides in the sprite vertically
				// depending on the current "sprite height mode"
				// FLAGGED
				
				if (diff >= 0 && diff < (this.control.sprite_size ? 16 : 8) && this.sprite_count < 8) {
					// Sprite is visible, so copy the attribute entry over to our
					// scanline sprite cache. Ive added < 8 here to guard the array
					// being written to.
					if (this.sprite_count < 8)
					{
						// Is this sprite sprite zero?
						if (nOAMEntry == 0)
						{
							// It is, so its possible it may trigger a 
							// sprite zero hit when drawn
							this.bSpriteZeroHitPossible = true;
						}

						//memcpy(&spriteScanline[sprite_count], &OAM[nOAMEntry], sizeof(sObjectAttributeEntry));						
					}			
					this.sprite_count++;
				}
				nOAMEntry++;
			} // End of sprite evaluation for next scanline

			// Set sprite overflow flag
			this.status.sprite_overflow = (this.sprite_count >= 8);

			// Now we have an array of the 8 visible sprites for the next scanline. By 
			// the nature of this search, they are also ranked in priority, because
			// those lower down in the OAM have the higher priority.

			// We also guarantee that "Sprite Zero" will exist in spriteScanline[0] if
			// it is evaluated to be visible. 
		}

		if (this.cycle == 340) {
			// Now we're at the very end of the scanline, I'm going to prepare the 
			// sprite shifters with the 8 or less selected sprites.

			for (let i = 0; i < this.sprite_count; i++) {
				// We need to extract the 8-bit row patterns of the sprite with the
				// correct vertical offset. The "Sprite Mode" also affects this as
				// the sprites may be 8 or 16 rows high. Additionally, the sprite
				// can be flipped both vertically and horizontally. So there's a lot
				// going on here :P

				let sprite_pattern_bits_lo, sprite_pattern_bits_hi;
				let sprite_pattern_addr_lo, sprite_pattern_addr_hi;

				// Determine the memory addresses that contain the byte of pattern data. We
				// only need the lo pattern address, because the hi pattern address is always
				// offset by 8 from the lo address.
				if (!this.control.sprite_size) {
					// 8x8 Sprite Mode - The control register determines the pattern table
					if (!(this.spriteScanline[i].attribute & 0x80)) {
						// Sprite is NOT flipped vertically, i.e. normal    
						sprite_pattern_addr_lo = 
						  (this.control.pattern_sprite << 12  )  // Which Pattern Table? 0KB or 4KB offset
						| (this.spriteScanline[i].id   << 4   )  // Which Cell? Tile ID * 16 (16 bytes per tile)
						| (this.scanline - this.spriteScanline[i].y); // Which Row in cell? (0->7)
												
					}
					else {
						// Sprite is flipped vertically, i.e. upside down
						sprite_pattern_addr_lo = 
						  (this.control.pattern_sprite << 12  )  // Which Pattern Table? 0KB or 4KB offset
						| (this.spriteScanline[i].id   << 4   )  // Which Cell? Tile ID * 16 (16 bytes per tile)
						| (7 - (this.scanline - this.spriteScanline[i].y)); // Which Row in cell? (7->0)
					}

				}
				else {
					// 8x16 Sprite Mode - The sprite attribute determines the pattern table
					if (!(this.spriteScanline[i].attribute & 0x80)) {
						// Sprite is NOT flipped vertically, i.e. normal
						if (this.scanline - this.spriteScanline[i].y < 8) {
							// Reading Top half Tile
							sprite_pattern_addr_lo = 
							  ((this.spriteScanline[i].id & 0x01)      << 12)  // Which Pattern Table? 0KB or 4KB offset
							| ((this.spriteScanline[i].id & 0xFE)      << 4 )  // Which Cell? Tile ID * 16 (16 bytes per tile)
							| ((this.scanline - this.spriteScanline[i].y) & 0x07 ); // Which Row in cell? (0->7)
						}
						else
						{
							// Reading Bottom Half Tile
							sprite_pattern_addr_lo = 
							  ( (this.spriteScanline[i].id & 0x01)      << 12)  // Which Pattern Table? 0KB or 4KB offset
							| (((this.spriteScanline[i].id & 0xFE) + 1) << 4 )  // Which Cell? Tile ID * 16 (16 bytes per tile)
							| ((this.scanline - this.spriteScanline[i].y) & 0x07  ); // Which Row in cell? (0->7)
						}
					}
					else
					{
						// Sprite is flipped vertically, i.e. upside down
						if (this.scanline - this.spriteScanline[i].y < 8)
						{
							// Reading Top half Tile
							sprite_pattern_addr_lo = 
							  ( (this.spriteScanline[i].id & 0x01)      << 12)    // Which Pattern Table? 0KB or 4KB offset
							| (((this.spriteScanline[i].id & 0xFE) + 1) << 4 )    // Which Cell? Tile ID * 16 (16 bytes per tile)
							| (7 - (this.scanline - this.spriteScanline[i].y) & 0x07); // Which Row in cell? (0->7)
						}
						else
						{
							// Reading Bottom Half Tile
							sprite_pattern_addr_lo = 
							  ((this.spriteScanline[i].id & 0x01)       << 12)    // Which Pattern Table? 0KB or 4KB offset
							| ((this.spriteScanline[i].id & 0xFE)       << 4 )    // Which Cell? Tile ID * 16 (16 bytes per tile)
							| (7 - (this.scanline - this.spriteScanline[i].y) & 0x07); // Which Row in cell? (0->7)
						}
					}
				}

				// Phew... XD I'm absolutely certain you can use some fantastic bit 
				// manipulation to reduce all of that to a few one liners, but in this
				// form it's easy to see the processes required for the different
				// sizes and vertical orientations

				// Hi bit plane equivalent is always offset by 8 bytes from lo bit plane
				sprite_pattern_addr_hi = sprite_pattern_addr_lo + 8;

				// Now we have the address of the sprite patterns, we can read them
				sprite_pattern_bits_lo = this.ppuRead(sprite_pattern_addr_lo);
				sprite_pattern_bits_hi = this.ppuRead(sprite_pattern_addr_hi);

				// If the sprite is flipped horizontally, we need to flip the 
				// pattern bytes. 
				if (this.spriteScanline[i].attribute & 0x40) {
					// Flip Patterns Horizontally
					sprite_pattern_bits_lo = this._flipbyte(sprite_pattern_bits_lo);
					sprite_pattern_bits_hi = this._flipbyte(sprite_pattern_bits_hi);
				}

				// Finally! We can load the pattern into our sprite shift registers
				// ready for rendering on the next scanline
				this.sprite_shifter_pattern_lo[i] = sprite_pattern_bits_lo;
				this.sprite_shifter_pattern_hi[i] = sprite_pattern_bits_hi;
			}
		}
	}

	if (this.scanline == 240) {
		// Post Render Scanline - Do Nothing!
	}

	if (this.scanline >= 241 && this.scanline < 261) {
		if (this.scanline == 241 && this.cycle == 1) {
			// Effectively end of frame, so set vertical blank flag
			this.status.vertical_blank = 1;

			// If the control register tells us to emit a NMI when
			// entering vertical blanking period, do it! The CPU
			// will be informed that rendering is complete so it can
			// perform operations with the PPU knowing it wont
			// produce visible artefacts
			if (this.control.enable_nmi) 
				this.nmi = true;
		}
	}
	// Composition - We now have background & foreground pixel information for this cycle

	// Background =============================================================
	let bg_pixel = 0x00;   // The 2-bit pixel to be rendered
	let bg_palette = 0x00; // The 3-bit index of the palette the pixel indexes

	// We only render backgrounds if the PPU is enabled to do so. Note if 
	// background rendering is disabled, the pixel and palette combine
	// to form 0x00. This will fall through the colour tables to yield
	// the current background colour in effect
	if (this.mask.render_background) {
		if (this.mask.render_background_left || (this.cycle >= 9)) {
			// Handle Pixel Selection by selecting the relevant bit
			// depending upon fine x scolling. This has the effect of
			// offsetting ALL background rendering by a set number
			// of pixels, permitting smooth scrolling
			let bit_mux = 0x8000 >> this.fine_x;

			// Select Plane pixels by extracting from the shifter 
			// at the required location. 
			let p0_pixel = (this.bg_shifter_pattern_lo & bit_mux) > 0;
			let p1_pixel = (this.bg_shifter_pattern_hi & bit_mux) > 0;

			// Combine to form pixel index
			bg_pixel = (p1_pixel << 1) | p0_pixel;

			// Get palette
			let bg_pal0 = (bg_shifter_attrib_lo & bit_mux) > 0;
			let bg_pal1 = (bg_shifter_attrib_hi & bit_mux) > 0;
			bg_palette = (bg_pal1 << 1) | bg_pal0;
		}
	}

	// Foreground =============================================================
	let fg_pixel = 0x00;   // The 2-bit pixel to be rendered
	let fg_palette = 0x00; // The 3-bit index of the palette the pixel indexes
	let fg_priority = 0x00;// A bit of the sprite attribute indicates if its
							   // more important than the background
	if (this.mask.render_sprites) {
		// Iterate through all sprites for this scanline. This is to maintain
		// sprite priority. As soon as we find a non transparent pixel of
		// a sprite we can abort
		if (this.mask.render_sprites_left || (this.cycle >= 9)) {

			this.bSpriteZeroBeingRendered = false;

			for (let i = 0; i < this.sprite_count; i++) {
				// Scanline cycle has "collided" with sprite, shifters taking over
				if (this.spriteScanline[i].x == 0) {
					// Note Fine X scrolling does not apply to sprites, the game
					// should maintain their relationship with the background. So
					// we'll just use the MSB of the shifter

					// Determine the pixel value...
					let fg_pixel_lo = (sprite_shifter_pattern_lo[i] & 0x80) > 0;
					let fg_pixel_hi = (sprite_shifter_pattern_hi[i] & 0x80) > 0;
					fg_pixel = (fg_pixel_hi << 1) | fg_pixel_lo;

					// Extract the palette from the bottom two bits. Recall
					// that foreground palettes are the latter 4 in the 
					// palette memory.
					fg_palette = (spriteScanline[i].attribute & 0x03) + 0x04;
					fg_priority = (spriteScanline[i].attribute & 0x20) == 0;

					// If pixel is not transparent, we render it, and dont
					// bother checking the rest because the earlier sprites
					// in the list are higher priority
					if (fg_pixel != 0)
					{
						if (i == 0) // Is this sprite zero?
						{
							this.bSpriteZeroBeingRendered = true;
						}

						break;
					}
				}
			}
		}		
	}

	// Now we have a background pixel and a foreground pixel. They need
	// to be combined. It is possible for sprites to go behind background
	// tiles that are not "transparent", yet another neat trick of the PPU
	// that adds complexity for us poor emulator developers...

	let pixel = 0x00;   // The FINAL Pixel...
	let palette = 0x00; // The FINAL Palette...

	if (bg_pixel == 0 && fg_pixel == 0) {
		// The background pixel is transparent
		// The foreground pixel is transparent
		// No winner, draw "background" colour
		pixel = 0x00;
		palette = 0x00;
	}
	else if (bg_pixel == 0 && fg_pixel > 0) {
		// The background pixel is transparent
		// The foreground pixel is visible
		// Foreground wins!
		pixel = fg_pixel;
		palette = fg_palette;
	}
	else if (bg_pixel > 0 && fg_pixel == 0) {
		// The background pixel is visible
		// The foreground pixel is transparent
		// Background wins!
		pixel = bg_pixel;
		palette = bg_palette;
	}
	else if (bg_pixel > 0 && fg_pixel > 0) {
		// The background pixel is visible
		// The foreground pixel is visible
		// Hmmm...
		if (fg_priority)
		{
			// Foreground cheats its way to victory!
			pixel = fg_pixel;
			palette = fg_palette;
		}
		else
		{
			// Background is considered more important!
			pixel = bg_pixel;
			palette = bg_palette;
		}

		// Sprite Zero Hit detection
		if (this.bSpriteZeroHitPossible && this.bSpriteZeroBeingRendered)
		{
			// Sprite zero is a collision between foreground and background
			// so they must both be enabled
			if (this.mask.render_background & this.mask.render_sprites)
			{
				// The left edge of the screen has specific switches to control
				// its appearance. This is used to smooth inconsistencies when
				// scrolling (since sprites x coord must be >= 0)
				if (!(this.mask.render_background_left | this.mask.render_sprites_left))
				{
					if (this.cycle >= 9 && this.cycle < 258)
					{
						this.status.sprite_zero_hit = 1;
					}
				}
				else
				{
					if (this.cycle >= 1 && this.cycle < 258)
					{
						this.status.sprite_zero_hit = 1;
					}
				}
			}
		}
	}

	// Now we have a final pixel colour, and a palette for this cycle
	// of the current scanline. Let's at long last, draw that ^&%*er :P
	this.sprScreen[this.cycle - 1, this.scanline] = this.getColourFromPaletteRam(palette, pixel);

	// Advance renderer - it never stops, it's relentless
	this.cycle++;
	if (this.mask.render_background || this.mask.render_sprites) {
		if (this.cycle == 260 && this.scanline < 240) {
			this._cart.getMapper().scanline();
		}
	}

	if (this.cycle >= 341)
	{
		this.cycle = 0;
		this.scanline++;
		if (this.scanline >= 261)
		{
			this.scanline = -1;
            this.frame_complete = true;
            this.frameCompleteListener(this.sprScreen);
			this.odd_frame = !this.odd_frame;
		}
    }
}
}