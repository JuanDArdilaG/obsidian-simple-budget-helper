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

# Internal: Get current version from manifest.json
_get-version:
    @node -p "require('./manifest.json').version"

# Internal: Update manifest.json with new version
_update-version version:
    #!/usr/bin/env bash
    node -e "
        const fs = require('fs');
        const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
        manifest.version = '{{ version }}';
        fs.writeFileSync('./manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
    "

# Internal: Show confirmation dialog
_confirm-bump current_version new_version bump_type:
    #!/usr/bin/env bash
    echo ""
    echo "════════════════════════════════════════"
    echo "  📦 Version Bump Confirmation"
    echo "════════════════════════════════════════"
    echo "  Current version: {{ current_version }}"
    echo "  New version:     {{ new_version }}"
    echo "  Bump type:       {{ bump_type }}"
    echo "════════════════════════════════════════"
    echo ""
    read -p "Proceed with version bump? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Version bump cancelled"
        exit 1
    fi

# Bump version in manifest.json
bump type="patch":
    #!/usr/bin/env bash
    set -euo pipefail

    # Read current version
    current_version=$(just _get-version)

    # Parse version components
    IFS='.' read -ra VERSION_PARTS <<< "$current_version"
    major="${VERSION_PARTS[0]}"
    minor="${VERSION_PARTS[1]}"
    patch="${VERSION_PARTS[2]}"

    # Update version based on type
    case "{{ type }}" in
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
            echo "❌ Error: Invalid version type. Use 'major', 'minor', or 'patch'/'fix'"
            exit 1
            ;;
    esac

    new_version="$major.$minor.$patch"

    # Show confirmation and update
    just _confirm-bump "$current_version" "$new_version" "{{ type }}"
    just _update-version "$new_version"

    echo "✅ Version bumped to $new_version in manifest.json"

# Internal: Commit and push version change
_push-version:
    #!/usr/bin/env bash
    # Get the new version from manifest.json
    current_version=$(just _get-version)

    # Commit the version change
    git add manifest.json
    git commit -m "chore: bump version to $current_version"

    # Push changes
    git push

    echo "✅ Committed version $current_version successfully!"

# Internal: Create and push git tag for new version
_tag-version:
    #!/usr/bin/env bash
    current_version=$(just _get-version)

    # Create and push tag
    git tag -a $current_version -m "$current_version"
    git push origin $current_version

    echo "✅ Tagged version $current_version successfully!"

alias de := deploy

deploy type="patch": check-git build test (bump type)
    #!/usr/bin/env bash
    echo "🚀 Deploying version..."

    just _push-version
    just _tag-version

    current_version=$(just _get-version)

    echo "✅ Deployed version $current_version successfully!"

# Bump beta version in manifest.json (format: x.y.z-beta.a)
bump-beta type="beta":
    #!/usr/bin/env bash
    set -euo pipefail

    # Read current version
    current_version=$(just _get-version)

    # Parse version components (handle beta versions)
    if [[ $current_version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-beta\.([0-9]+))?$ ]]; then
        major="${BASH_REMATCH[1]}"
        minor="${BASH_REMATCH[2]}"
        patch="${BASH_REMATCH[3]}"
        beta_num="${BASH_REMATCH[5]:-0}"
    else
        echo "❌ Error: Invalid version format: $current_version"
        exit 1
    fi

    # Determine if current version is a beta
    is_beta=false
    if [[ $current_version =~ -beta\. ]]; then
        is_beta=true
    fi

    # Update version based on type
    case "{{ type }}" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            beta_num=1
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            beta_num=1
            ;;
        "patch"|"fix")
            patch=$((patch + 1))
            beta_num=1
            ;;
        "beta"|"")
            if [ "$is_beta" = true ]; then
                beta_num=$((beta_num + 1))
            else
                beta_num=1
            fi
            ;;
        *)
            echo "❌ Error: Invalid version type. Use 'major', 'minor', 'patch'/'fix', or 'beta'"
            exit 1
            ;;
    esac

    new_version="$major.$minor.$patch-beta.$beta_num"

    # Show confirmation and update
    just _confirm-bump "$current_version" "$new_version" "{{ type }}"
    just _update-version "$new_version"

    echo "✅ Version bumped to $new_version in manifest.json"

alias de-b := deploy-beta

deploy-beta type="beta": check-git build test (bump-beta type)
    #!/usr/bin/env bash
    echo "🚀 Deploying beta version..."

    just _push-version
    just _tag-version

    current_version=$(just _get-version)

    echo "✅ Deployed version $current_version successfully!"

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
