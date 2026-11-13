#!/bin/zsh
set -e
B=/jack-tools/matemagica-app
cd /Users/giacomolevi/Desktop/JACK/_GITHUB/matemagica-paese-app
npx vite build --base=$B/ >/dev/null 2>&1
cd dist
grep -rlE "(['\"\`])/(isole|giochi|personaggi|paese|schermate|sw\.js|manifest\.webmanifest|icona|favicon)" . | grep -v "\.webp$" | grep -v manifest.webmanifest | while read f; do sed -i '' -E "s#(['\"\`])/(isole|giochi|personaggi|paese|schermate|sw\.js|manifest\.webmanifest|icona|favicon)#\1$B/\2#g" "$f"; done
sed -i '' 's#"/\(icona\|jack\)#"'$B'/\1#g; s#"start_url": "/"#"start_url": "'$B'/"#; s#"scope": "/"#"scope": "'$B'/"#' manifest.webmanifest || true
printf "self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.map(c=>caches.delete(c)))).then(()=>self.registration.unregister())));" > sw.js
cd /Users/giacomolevi/Desktop/JACK/_GITHUB/jack-tools
git pull -q --rebase origin main
rm -rf matemagica-app; cp -R ../matemagica-paese-app/dist matemagica-app
git add matemagica-app; git commit -q -m "$1

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>"; git push -q origin HEAD
git log --oneline -1
