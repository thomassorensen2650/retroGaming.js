#include <iostream> 

int main() 
{
  union PPUMASK
  {
    struct
    {
      uint8_t grayscale : 1;
      uint8_t render_background_left : 1;
      uint8_t render_sprites_left : 1;     
      uint8_t render_background : 1;
      uint8_t render_sprites : 1;
      uint8_t enhance_red : 1;
      uint8_t enhance_green : 1;
      uint8_t enhance_blue : 1;
    };
    uint8_t reg;
  };

  PPUMASK x;
  x.reg = 2;
  x.render_background = 0;
  x.render_sprites = 1;
  std::cout << "A:" << x.grayscale << " reg:" << x.reg << std::endl;
}
