import os

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    if len(lines) >= 81:
                        if "newPassword" in lines[80]: # Line 81 is index 80
                            print(f"{path}:81: {lines[80].strip()}")
            except:
                pass
