import os
import glob
import re

files = glob.glob('src/**/*.ts', recursive=True) + glob.glob('src/**/*.tsx', recursive=True)

for filepath in files:
    if os.path.isfile(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace '@/app/(main)/' with '@/app/[locale]/(main)/'
        new_content = content.replace("@/app/(main)/", "@/app/[locale]/(main)/")
        
        if new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
                print(f"Fixed imports in {filepath}")

print("done")
