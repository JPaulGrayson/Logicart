#!/bin/bash
# Cartographer Extension Setup Script
# Run this in your new "Cartographer Extension v2" Repl

set -e

echo "🚀 Setting up Cartographer Extension..."

# Download the extension bundle from the original Repl
echo "📦 Downloading extension files..."
wget -q --show-progress https://cartographer.jpaulgraygrayson.repl.co/cartographer-extension.tar.gz

# Create public directory
echo "📁 Creating public directory..."
mkdir -p public

# Extract to public folder
echo "📂 Extracting files to public/..."
tar -xzf cartographer-extension.tar.gz -C public/

# Copy extension.json to root
echo "📄 Copying extension.json to root..."
cp public/extension.json extension.json

# Create .replit configuration
echo "⚙️  Creating .replit configuration..."
cat > .replit << 'EOF'
run = "python3 -m http.server 8080 --directory public"

[nix]
channel = "stable-24_05"

[deployment]
publicDir = "public"

[[ports]]
localPort = 8080
externalPort = 80
EOF

# Clean up
echo "🧹 Cleaning up..."
rm cartographer-extension.tar.gz

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open the Tools menu (top toolbar)"
echo "2. Click 'Extensions Devtools'"
echo "3. Click 'Load Locally'"
echo "4. Preview your Cartographer tool!"
echo ""
