# Ensure the script stops if any command fails
$ErrorActionPreference = "Stop"

# Navigate to the directory containing the WebAssembly package (update this path as needed)
Set-Location "audio-processor"

# Run the wasm-pack build command
Write-Host "Running wasm-pack build --target web..."
wasm-pack build --target web

# Check if the build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Error "wasm-pack build failed. Exiting..."
    exit $LASTEXITCODE
}

Set-Location ..

# Define source and destination directories
$sourceDir = "audio-processor/pkg"
$destinationDir = "src/wasm"

# Ensure the destination directory exists
if (-Not (Test-Path $destinationDir)) {
    Write-Host "Creating destination directory: $destinationDir"
    New-Item -ItemType Directory -Path $destinationDir
}

# Copy the contents from source to destination
Write-Host "Copying files from $sourceDir to $destinationDir..."
Copy-Item -Path "$sourceDir\*" -Destination $destinationDir -Recurse -Force

Write-Host "Build and copy completed successfully."