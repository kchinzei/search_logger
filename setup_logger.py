#!/usr/bin/env python3

#    The MIT License (MIT)
#    Copyright (c) Kiyo Chinzei (kchinzei@gmail.com)
#    Permission is hereby granted, free of charge, to any person obtaining a copy
#    of this software and associated documentation files (the "Software"), to deal
#    in the Software without restriction, including without limitation the rights
#    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#    copies of the Software, and to permit persons to whom the Software is
#    furnished to do so, subject to the following conditions:
#    The above copyright notice and this permission notice shall be included in
#    all copies or substantial portions of the Software.
#    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
#    THE SOFTWARE.

import sys
import json
import platform
from pathlib import Path

SYSTEM = platform.system()

if SYSTEM == 'Darwin':
    from setup_logger_macos import setup, get_obsidian_config_path, detect_python
elif SYSTEM == 'Linux':
    from setup_logger_linux import setup, get_obsidian_config_path, detect_python
elif SYSTEM == 'Windows':
    from setup_logger_windows import setup, get_obsidian_config_path, detect_pythonset
else:
    print('❌ Unsupported platform')
    sys.exit(1)

# --- MAIN FLOW ---

config_path = get_obsidian_config_path()
if not config_path.exists():
    print(f'❌ Cannot find Obsidian settings at: {config_path}')
    sys.exit(1)

with config_path.open() as f:
    data = json.load(f)

vaults = data.get('vaults', {})
if not vaults:
    print('❌ No vaults found in your Obsidian configuration.')
    sys.exit(1)

vault_list = list(vaults.values())
print('📂 Available Obsidian vaults:')
print('0: Manually enter a vault path')
for idx, v in enumerate(vault_list):
    print(f'{idx + 1}: {v["path"]}')

choice = input(f'Select a vault [0-{len(vault_list)}] (default 1): ').strip() or '1'
try:
    if choice == '0':
        vault_path = Path(input('Enter full path to your Obsidian vault: ').strip())
        if not vault_path.exists():
            print('❌ That path does not exist.')
            sys.exit(1)
        if not os.access(vault_path, os.W_OK):
            print('❌ You do not have write access to that folder.')
            sys.exit(1)
    else:
        vault_path = Path(vault_list[int(choice) - 1]['path'])
except (IndexError, ValueError):
    print('❌ Invalid selection.')
    sys.exit(1)

log_filename = input('Enter log file name (default: SearchLog.md): ').strip() or 'SearchLog.md'

script_path = Path(__file__).resolve().parent / 'obsidian_logger.py'
if not script_path.exists():
    print(f'❌ Cannot find obsidian_logger.py in: {script_path.parent}')
    sys.exit(1)

python_path = detect_python()
if not python_path:
    print('❌ Could not locate a usable python3 interpreter.')
    sys.exit(1)

sys.exit(setup(python_path, script_path, vault_path, log_filename))
