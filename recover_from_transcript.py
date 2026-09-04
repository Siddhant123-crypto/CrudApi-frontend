import json
import re

transcript_path = r"C:\Users\thora\.gemini\antigravity-ide\brain\dfa87cbc-0255-4017-99a3-1bb68663269d\.system_generated\logs\transcript_full.jsonl"
out_path = r"d:\spring boot\UserApp\userappmobile\src\screens\HomeScreen.tsx"

# The view_file responses contain lines formatted like "1: line content"
# We need to find the VIEW_FILE actions that targeted HomeScreen.tsx
file_lines = {}

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                if data.get('type') == 'VIEW_FILE' and 'HomeScreen.tsx' in data.get('content', ''):
                    content = data['content']
                    # Look for lines that start with a number followed by a colon and a space
                    # e.g. "1: import React, {..."
                    # We can split by newline and parse each line
                    for line_str in content.split('\n'):
                        match = re.match(r'^(\d+):\s(.*)$', line_str)
                        if match:
                            line_num = int(match.group(1))
                            line_text = match.group(2)
                            file_lines[line_num] = line_text
            except Exception as e:
                pass
except Exception as e:
    print(f"Error reading transcript: {e}")

if not file_lines:
    print("No lines found in transcript.")
    exit(1)

max_line = max(file_lines.keys())
print(f"Found {len(file_lines)} unique lines, max line is {max_line}")

with open(out_path, 'w', encoding='utf-8') as out_f:
    for i in range(1, max_line + 1):
        out_f.write(file_lines.get(i, "") + "\n")

print("Successfully reconstructed file!")
