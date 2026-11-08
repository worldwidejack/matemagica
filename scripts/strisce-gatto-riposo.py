"""Dal passo alla posa di riposo: foglio 3x2 su magenta (Firefly) -> striscia di fotogrammi con alfa.
Stessa scala del ciclo di camminata (ALT_CAMMINA px per 393 px di disegno), piedi sulla stessa linea.
Uso: python scripts/strisce-gatto-riposo.py <foglio.png> <primo> <ultimo>   (fotogrammi da 1)"""
import numpy as np, json, sys
from PIL import Image
M=np.array([255,0,255],float)
SRC=sys.argv[1]; DA=int(sys.argv[2]); A=int(sys.argv[3]); OUT="public/paese/gatto-riposo"
S=132/393  # scala del ciclo di camminata (gatto-cammina.json: 132 px per 393 px di foglio)
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
for k in range(DA-1,A):
    r,c=divmod(k,3); x0,y0=c*cw+10,r*ch+10
    celle.append(Image.fromarray(chiave(im[y0:y0+ch-20,x0:x0+cw-20]),"RGBA"))
bbs=[t.getchannel("A").point(lambda v:255 if v>14 else 0).getbbox() for t in celle]
fw=max(b[2]-b[0] for b in bbs); fh=max(b[3]-b[1] for b in bbs)
tw,th=round(fw*S),round(fh*S)
St=Image.new("RGBA",(tw*len(celle),th))
for k,(t,b) in enumerate(zip(celle,bbs)):
    c=t.crop(b); c=c.resize((max(1,round(c.width*S)),max(1,round(c.height*S))),Image.LANCZOS)
    St.paste(c,(k*tw+(tw-c.width)//2,th-c.height),c)
St.save(OUT+".webp",quality=90,method=6)
json.dump({"w":tw,"h":th,"n":len(celle)},open(OUT+".json","w"))
bg=Image.new("RGBA",St.size,(200,170,110,255)); bg.alpha_composite(St); bg.convert("RGB").save("/private/tmp/claude-501/anteprima-riposo.jpg",quality=88)
print(tw,th,bbs)
