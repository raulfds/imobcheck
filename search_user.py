import os

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith((".ts", ".tsx")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                    if len(lines) >= 5:
                        if "User" in lines[4]: # Line 5 is index 4
                            print(f"{path}:5: {lines[4].strip()}")
            except:
                pass
