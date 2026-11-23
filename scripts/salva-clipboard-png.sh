#!/bin/zsh
D=/Users/giacomolevi/Desktop/JACK/_GITHUB/matemagica/_handoff/paese-1959/madri/marker2
osascript -e 'set f to open for access POSIX file "'$D/$1'" with write permission' -e 'set eof f to 0' -e 'write (the clipboard as «class PNGf») to f' -e 'close access f'
/Users/giacomolevi/Desktop/JACK/_GITHUB/jackos-lab/progetti/fenaki/.venv/bin/python -c "
from PIL import Image;print(Image.open('$D/$1').size)"
