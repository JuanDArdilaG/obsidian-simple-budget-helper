alias d := dev
dev: build test
    npm run dev

alias b := build
build:
    npm run build

alias t := test
test:
    npm run test

alias de := deploy
deploy version:
    git push
    git tag -a {{version}} -m "{{version}}"
    git push origin {{version}}