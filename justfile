alias d := dev
dev: build test
    npm run dev

alias b := build
build:
    npm run build

alias t := test
test:
    npm run test

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
deploy type="patch": (bump type) build
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