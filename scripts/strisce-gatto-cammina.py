"""Ciclo di camminata del gatto: foglio 3x2 su magenta (Firefly) -> striscia di fotogrammi con alfa.
Uso: python scripts/strisce-gatto-cammina.py <foglio.png>  (venv di fenaki: ha PIL e numpy)"""
import numpy as np, json, sys
from PIL import Image
M=np.array([255,0,255],float)
SRC=sys.argv[1]; OUT="public/paese/gatto-cammina"
ALT=132
def chiave(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    m=np.clip(np.minimum(r-g,b-g)/255,0,1)
    al=np.clip(1-(m-0.12)/0.20,0,1)
    al3=np.maximum(al,1e-3)[...,None]
    c=(a-(1-al3)*M)/al3
    return np.dstack([np.clip(c,0,255),al*255]).astype(np.uint8)
im=np.asarray(Image.open(SRC).convert("RGB")).astype(float)
H,W=im.shape[:2]; cw,ch=W//3,H//2
celle=[]
for k in range(6):
    r,c=divmod(k,3); x0,y0=c*cw+10,r*ch+10
    celle.append(Image.fromarray(chiave(im[y0:y0+ch-20,x0:x0+cw-20]),"RGBA"))
bbs=[t.getchannel("A").point(lambda v:255 if v>14 else 0).getbbox() for t in celle]
fw=max(b[2]-b[0] for b in bbs); fh=max(b[3]-b[1] for b in bbs)
# piedi tutti alla stessa altezza (fondo del disegno), centrato sul centro del disegno
fr=[]
for t,b in zip(celle,bbs):
    f=Image.new("RGBA",(fw,fh)); c=t.crop(b)
    f.paste(c,((fw-c.width)//2,fh-c.height)); fr.append(f)
s=ALT/fh; tw=round(fw*s)
S=Image.new("RGBA",(tw*6,ALT))
for k,f in enumerate(fr): S.paste(f.resize((tw,ALT),Image.LANCZOS),(k*tw,0))
S.save(OUT+".webp",quality=90,method=6)
json.dump({"w":tw,"h":ALT,"n":6},open(OUT+".json","w"))
bg=Image.new("RGBA",S.size,(200,170,110,255)); bg.alpha_composite(S); bg.convert("RGB").save("/private/tmp/claude-501/anteprima-cammina.jpg",quality=88)
print(tw,ALT,bbs)
