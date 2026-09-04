import json
import re
import sys

extract_path = r"d:\spring boot\UserApp\userappmobile\scratch_log_extract.jsonl"
output_path = r"d:\spring boot\UserApp\userappmobile\src\screens\HomeScreen.tsx"

file_content_lines = {}

try:
    with open(extract_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            try:
                data = json.loads(line)
                if 'content' in data:
                    content_str = data['content']
                    # Look for lines like "1: import React, ..."
                    # The response output is inside content_str (which might be JSON itself or just a string from the tool response)
                    # Let's just find all occurrences of line number patterns
                    lines = content_str.split('\n')
                    for l in lines:
                        match = re.match(r'^(\d+):\s(.*)$', l)
                        if match:
                            line_num = int(match.group(1))
                            line_text = match.group(2)
                            file_content_lines[line_num] = line_text
            except Exception as e:
                print(f"Parse error: {e}")
                
    if not file_content_lines:
        print("No lines extracted!")
        sys.exit(1)
        
    max_line = max(file_content_lines.keys())
    print(f"Extracted up to line {max_line}")
    
    with open(output_path, "w", encoding="utf-8") as out_f:
        for i in range(1, max_line + 1):
            out_f.write(file_content_lines.get(i, "") + "\n")
            
    print("Successfully reconstructed HomeScreen.tsx!")
except Exception as e:
    print(f"Error: {e}")
