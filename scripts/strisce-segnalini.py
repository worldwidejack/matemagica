import numpy as np, json, sys
from PIL import Image
M=np.array([255,0,255],float)
SRC="/Users/giacomolevi/Desktop/JACK/_GITHUB/matemagica/_handoff/paese-1959/madri/marker2/"
OUT="public/paese/seg/"
ALT=200
def chiave(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    m=np.clip(np.minimum(r-g,b-g)/255,0,1)
    al=np.clip(1-(m-0.12)/0.20,0,1)
    al3=np.maximum(al,1e-3)[...,None]
    c=(a-(1-al3)*M)/al3
    return np.dstack([np.clip(c,0,255),al*255]).astype(np.uint8)
info={}
SCELTE={"fiore-a":[0,1,2,3,4],"fiore-b":[0,1,2,3,4],"cristallo":[0,1,2,3],"cerchio":[0,1,2,4]}
for nome in ["fiore-a","fiore-b","cristallo","cerchio"]:
    im=np.asarray(Image.open(SRC+f"anim-{nome}.png").convert("RGB")).astype(float)
    H,W=im.shape[:2]; cw,ch=W//3,H//2
    celle=[]
    for k in range(6):
        r,c=divmod(k,3); x0,y0=c*cw+10,r*ch+10
        celle.append(chiave(im[y0:y0+ch-20,x0:x0+cw-20]))
    celle=[celle[k] for k in SCELTE[nome]]
    bb=None
    for t in celle:
        b=Image.fromarray(t,"RGBA").getchannel("A").point(lambda v:255 if v>14 else 0).getbbox()
        bb=b if bb is None else (min(bb[0],b[0]),min(bb[1],b[1]),max(bb[2],b[2]),max(bb[3],b[3]))
    x0,y0,x1,y1=bb; w,h=x1-x0,y1-y0
    s=ALT/h; tw=round(w*s)
    S=Image.new("RGBA",(tw*len(celle),ALT))
    for k,t in enumerate(celle):
        f=Image.fromarray(t,"RGBA").crop(bb).resize((tw,ALT),Image.LANCZOS); S.paste(f,(k*tw,0))
    S.save(OUT+nome+".webp",quality=88,method=6)
    info[nome]={"w":tw,"h":ALT,"n":len(celle)}
    # anteprima su fondo scuro
    bg=Image.new("RGBA",S.size,(10,20,60,255)); bg.alpha_composite(S); bg.convert("RGB").save(f"/private/tmp/claude-501/anteprima-{nome}.jpg",quality=85)
json.dump(info,open(OUT+"seg.json","w"))
print(info)
