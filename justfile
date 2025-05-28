dev:
    npm run dev
deploy version:
    git push && git tag -a {{version}} -m "{{version}}" && git push origin {{version}}