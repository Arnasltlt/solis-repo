#!/bin/bash

# Find all TypeScript and TSX files
find . -type f -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Skip node_modules and .next directories
  if [[ "$file" != *"node_modules"* && "$file" != *".next"* ]]; then
    # Replace imports from @/lib/utils with @/lib/utils/index
    sed -i '' 's/from "@\/lib\/utils"/from "@\/lib\/utils\/index"/g' "$file"
    sed -i '' "s/from '@\/lib\/utils'/from '@\/lib\/utils\/index'/g" "$file"
    echo "Updated imports in $file"
  fi
done

echo "Import update complete!"
