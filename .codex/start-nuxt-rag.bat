@echo off
set PATH=C:\nvm4w\nodejs;%PATH%
cd /d "D:\Project\My-Projects\nuxt\nuxt-interaction"
"C:\nvm4w\nodejs\pnpm.CMD" dev --host 127.0.0.1 --port 3000 > "D:\Project\My-Projects\nuxt\nuxt-interaction\.codex\nuxt-rag-dev.stdout.log" 2> "D:\Project\My-Projects\nuxt\nuxt-interaction\.codex\nuxt-rag-dev.stderr.log"