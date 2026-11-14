#!/bin/zsh
# Pubblica la Matemagica a carta bianca su jack-tools, in matemagica-notte/.
#   scripts/pubblica-notte.sh "messaggio del commit"
set -e
B=/jack-tools/matemagica-notte
P='isole|giochi|carte|medaglie|oggetti|motivi|personaggi|paese|schermate|luoghi|sw\.js|manifest\.webmanifest|icona|favicon|apple-touch-icon'
cd /Users/giacomolevi/Desktop/JACK/_GITHUB/matemagica-carta-bianca
npx vite build --base=$B/ >/dev/null 2>&1
cd dist
grep -rlE "(['\"\`])/($P)" . | grep -v "\.webp$" | grep -v manifest.webmanifest | while read f; do sed -i '' -E "s#(['\"\`])/($P)#\1$B/\2#g" "$f"; done
sed -i '' -E 's#"/(icona)#"'$B'/\1#g; s#"start_url": "/"#"start_url": "'$B'/"#; s#"scope": "/"#"scope": "'$B'/"#' manifest.webmanifest
# niente cache sul link di prova: un service worker che si toglie da solo
printf "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(c=>caches.delete(c)))).then(()=>self.registration.unregister())));" > sw.js
cd /Users/giacomolevi/Desktop/JACK/_GITHUB/jack-tools
git pull -q --rebase origin main
rm -rf matemagica-notte; cp -R ../matemagica-carta-bianca/dist matemagica-notte
git add matemagica-notte; git commit -q -m "$1

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"; git push -q origin HEAD
git log --oneline -1
