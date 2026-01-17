alias d := dev
dev: test
    npm run dev

alias b := build
build:
    npm run build

alias t := test
test:
    npm run test

# Start Obsidian with debugging enabled
debug-obsidian:
    #!/usr/bin/env bash
    echo "🚀 Starting Obsidian with debugging enabled..."
    open -a Obsidian --args --enable-logging --remote-debugging-port=9222
    echo "✅ Obsidian started with debugging on port 9222"
    echo "🔗 You can now attach the Chrome debugger to localhost:9222"

# Start development server with debugging
debug-dev:
    #!/usr/bin/env bash
    echo "🔧 Starting development server with debugging..."
    npm run dev &
    sleep 3
    echo "🚀 Starting Obsidian with debugging..."
    open -a Obsidian --args --enable-logging --remote-debugging-port=9222
    echo "✅ Development environment ready!"
    echo "🔗 Chrome DevTools: localhost:9222"
    echo "📝 VS Code: Use '🔗 Attach to Obsidian (Chrome)' configuration"

# Open Chrome DevTools for debugging
debug-chrome:
    #!/usr/bin/env bash
    echo "🌐 Opening Chrome DevTools..."
    open -a "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
    echo "✅ Chrome DevTools opened on port 9222"

# Show debugging information
debug-info:
    #!/usr/bin/env bash
    echo "🔍 Debugging Information:"
    echo "=========================="
    echo "📁 Workspace: $(pwd)"
    echo "📦 Package: $(node -p "require('./package.json').name")"
    echo "🏷️  Version: $(node -p "require('./package.json').version")"
    echo "🔧 Obsidian Version: $(node -p "require('./package.json').devDependencies.obsidian")"
    echo ""
    echo "🚀 Available Debug Configurations:"
    echo "  • 🔍 Debug Obsidian Plugin (Chrome DevTools)"
    echo "  • 🐛 Debug Plugin Main Process"
    echo "  • 🔗 Attach to Obsidian (Chrome)"
    echo "  • 🔗 Attach to Obsidian (Node)"
    echo "  • 🧪 Debug with Hot Reload"
    echo "  • 🚀 Full Debug Session"
    echo ""
    echo "📋 Quick Commands:"
    echo "  • just debug-obsidian    - Start Obsidian with debugging"
    echo "  • just debug-dev         - Start dev server + Obsidian"
    echo "  • just debug-chrome      - Open Chrome DevTools"
    echo "  • just debug-info        - Show this information"

# Bump version in manifest.json
bump type="patch":
    #!/usr/bin/env bash
    # Read current version from manifest.json
    current_version=$(node -p "require('./manifest.json').version")
    echo "Current version: $current_version"
    
    # Parse version components
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    major="${VERSION_PARTS[0]}"
    minor="${VERSION_PARTS[1]}"
    patch="${VERSION_PARTS[2]}"
    
    # Update version based on type
    case "{{type}}" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch"|"fix")
            patch=$((patch + 1))
            ;;
        *)
            echo "Error: Invalid version type. Use 'major', 'minor', or 'patch'/'fix'"
            exit 1
            ;;
    esac
    
    new_version="$major.$minor.$patch"
    echo "New version: $new_version"
    
    # Update manifest.json
    node -e "
        const fs = require('fs');
        const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
        manifest.version = '$new_version';
        fs.writeFileSync('./manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
    "
    
    echo "✅ Version bumped to $new_version in manifest.json"

alias de := deploy
deploy type="patch": check-git build test (bump type)
    #!/usr/bin/env bash
    # Get the new version from manifest.json
    new_version=$(node -p "require('./manifest.json').version")
    
    # Commit the version change
    git add manifest.json
    git commit -m "chore: bump version to $new_version"
    
    # Push changes
    git push
    
    # Create and push tag
    git tag -a $new_version -m "$new_version"
    git push origin $new_version
    
    echo "✅ Deployed version $new_version successfully!"

alias de-b := deploy-beta
deploy-beta: check-git build test
    #!/usr/bin/env bash
    echo "🚀 Deploying beta version..."
    # Delete existing beta tag if it exists
    git tag -d beta 2>/dev/null || true  
    git push origin --delete beta 2>/dev/null || true
    # Create and push tag
    git tag -a beta -m "beta"
    git push origin beta
    
    echo "✅ Deployed version beta successfully!"

check-git:
    #!/usr/bin/env bash
    echo "🔍 Checking git status..."
    # Check for unstaged changes
    if ! git diff --quiet; then
        echo "There are unstaged changes"
        exit 1
    fi

    # Check for staged changes
    if ! git diff --cached --quiet; then
        echo "There are staged changes"
        exit 1
    fi

    # Check for untracked files
    if [ -n "$(git status --porcelain)" ]; then
        echo "There are untracked files or changes"
        exit 1
    fi
