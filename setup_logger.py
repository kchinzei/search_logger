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

import os
import json
from pathlib import Path
from textwrap import dedent

try:
    config_path = Path.home() / 'Library/Application Support/obsidian/obsidian.json'
    rdomain = 'com.obsidian-logger'
    if not config_path.exists():
        print('❌ Cannot find Obsidian settings at:', config_path)
        print('Make sure Obsidian has been run at least once.')
        exit(1)

    with config_path.open() as f:
        data = json.load(f)

    vaults = data.get('vaults', {})
    if not vaults:
        print('❌ No vaults found in your Obsidian configuration.')
        exit(1)

    vault_list = list(vaults.values())
    print('📂 Available Obsidian vaults:')
    print('0: Manually enter a vault path')
    for idx, v in enumerate(vault_list):
        print(f'{idx + 1}: {v["path"]}')

    choice = input(f'Select a vault [0-{len(vault_list)}] (default 1): ').strip() or '1'
    try:
        if choice == '0':
            vault_path = input('Enter full path to your Obsidian vault: ').strip()
            if not Path(vault_path).exists():
                print('❌ That path does not exist.')
                exit(1)
            if not os.access(vault_path, os.W_OK):
                print('❌ You do not have write access to that folder.')
                exit(1)
        else:
            vault_path = vault_list[int(choice) - 1]['path']
    except (IndexError, ValueError):
        print('❌ Invalid selection.')
        exit(1)

    log_filename = input('Enter log file name (default: SearchLog.md): ').strip() or 'SearchLog.md'

    script_path = Path(__file__).resolve().parent / 'obsidian_logger.py'
    if not script_path.exists():
        print(f'❌ Cannot find obsidian_logger.py in: {script_path.parent}')
        exit(1)

    candidates = [
        '/opt/homebrew/bin/python3',
        '/usr/local/bin/python3',
        '/usr/bin/python3'
    ]
    python_path = next((p for p in candidates if Path(p).exists()), None)
    if not python_path:
        print('❌ Could not locate a usable python3 interpreter.')
        exit(1)

    plist_path =  Path.home() / f'Library/LaunchAgents/{rdomain}.plist'
    plist_content = dedent(f'''        <?xml version='1.0' encoding='UTF-8'?>
        <!DOCTYPE plist PUBLIC '-//Apple//DTD PLIST 1.0//EN'
          'http://www.apple.com/DTDs/PropertyList-1.0.dtd'>
        <plist version='1.0'>
        <dict>
            <key>Label</key>
            <string>{rdomain}</string>
            <key>ProgramArguments</key>
            <array>
                <string>{python_path}</string>
                <string>{script_path}</string>
                <string>{vault_path}</string>
                <string>{log_filename}</string>
            </array>
            <key>RunAtLoad</key>
            <true/>
            <key>WorkingDirectory</key>
            <string>{script_path.parent}</string>
            <key>StandardOutPath</key>
            <string>/tmp/{rdomain}.launch-stdout.log</string>
            <key>StandardErrorPath</key>
            <string>/tmp/{rdomain}.launch-stderr.log</string>
        </dict>
        </plist>
    ''')

    plist_path.parent.mkdir(parents=True, exist_ok=True)
    plist_path.write_text(plist_content)
    print(f'✅ LaunchAgent written to:\n  {plist_path}')

    enable = input('Enable LaunchAgent now? [Y/n]: ').strip().lower() or 'y'
    if enable == 'y':
        os.system(f'launchctl unload {plist_path} > /dev/null 2>&1')
        os.system(f'launchctl load -w {plist_path}')
        print('✅ LaunchAgent loaded. Logger will start at login.')
    else:
        print('ℹ️ You can load it manually with:\n   launchctl load -w ~/Library/LaunchAgents/com.obsidian.logger.plist')
except KeyboardInterrupt:
    print('\n❌ Interrupted by user.')
