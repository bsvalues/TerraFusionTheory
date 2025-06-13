# PowerShell script to prepare a minimal deploy directory for Netlify/static hosting

$deployDir = "deploy_dist"

# Remove existing deploy directory if it exists
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}

# Create the deploy directory
New-Item -ItemType Directory -Path $deployDir

# Copy the production build output
Copy-Item -Recurse -Force dist $deployDir\dist

# Copy essential config files
Copy-Item netlify.toml $deployDir\
Copy-Item package.json $deployDir\
Copy-Item package-lock.json $deployDir\

# Copy index.html if it exists in root
if (Test-Path "index.html") {
    Copy-Item index.html $deployDir\
}
# Copy index.html from client if not in root
elseif (Test-Path "client/index.html") {
    Copy-Item client/index.html $deployDir\index.html
}

# Copy vite.config.ts if it exists
if (Test-Path "vite.config.ts") {
    Copy-Item vite.config.ts $deployDir\
}

# (Optional) Copy .netlifyignore if you use it
if (Test-Path ".netlifyignore") {
    Copy-Item .netlifyignore $deployDir\
}

Write-Host "Minimal deploy directory created at $deployDir"