import os
import re

files_to_fix = [
    'src/app/emergency.tsx',
    'src/app/index.tsx',
    'src/app/doctor.tsx',
    'src/app/symptoms.tsx'
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the line that initializes styles and change it to getStyles
    content = content.replace("const styles = StyleSheet.create({", "const getStyles = (C: any) => StyleSheet.create({")
    
    # If it was changed, we need to inject the styles = getStyles(C) inside the Component
    if "const getStyles =" in content:
        # Find where useTheme() is called
        match = re.search(r'(const\s+\{.*C.*\}\s*=\s*useTheme\(\);\n)', content)
        if match:
            # Insert styles = getStyles(C) right after
            if "const styles = getStyles(C);" not in content:
                content = content[:match.end()] + "  const styles = getStyles(C);\n" + content[match.end():]
        
        # Replace Colors. with C. inside the StyleSheet
        style_start = content.find("const getStyles =")
        if style_start != -1:
            pre_styles = content[:style_start]
            post_styles = content[style_start:]
            # Replace Colors. with C. in post_styles
            post_styles = post_styles.replace("Colors.", "C.")
            content = pre_styles + post_styles
        
    with open(filepath, 'w') as f:
        f.write(content)
        
    print(f"Fixed {filepath}")
