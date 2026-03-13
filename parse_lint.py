import json

try:
    with open('final_lint.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
        for file in data:
            for msg in file.get('messages', []):
                if msg.get('severity') == 2:
                    print(f"{file.get('filePath')}:{msg.get('line')}:{msg.get('column')} - {msg.get('message')}")
except Exception as e:
    print(f"Error: {e}")
