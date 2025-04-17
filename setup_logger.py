#!/usr/bin/env python3
import os
import sys
import json
import platform
from pathlib import Path
from textwrap import dedent

SYSTEM = platform.system()

# Step 1: detect Obsidian vaults
def get_obsidian_config_path():
    if SYSTEM == 'Darwin':
        return Path.home() / 'Library/Application Support/obsidian/obsidian.json'
    elif SYSTEM == 'Linux':
        return Path.home() / '.config/obsidian/obsidian.json'
    elif SYSTEM == 'Windows':
        return Path(os.environ['APPDATA']) / 'Obsidian' / 'obsidian.json'
    else:
        print(f'Unsupported platform: {SYSTEM}')
        sys.exit(1)

def detect_python():
    candidates = [
        '/opt/homebrew/bin/python3',
        '/usr/local/bin/python3',
        '/usr/bin/python3',
        sys.executable
    ]
    return next((p for p in candidates if Path(p).exists()), None)

def setup_macos(python_path, script_path, vault_path, log_filename):
    plist_path = Path.home() / 'Library/LaunchAgents/com.obsidian-logger.plist'
    plist_content = dedent(f'''        <?xml version='1.0' encoding='UTF-8'?>
        <!DOCTYPE plist PUBLIC '-//Apple//DTD PLIST 1.0//EN'
          'http://www.apple.com/DTDs/PropertyList-1.0.dtd'>
        <plist version='1.0'>
        <dict>
            <key>Label</key>
            <string>com.obsidian-logger</string>
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
            <string>/tmp/com.obsidian-logger.launch-stdout.log</string>
            <key>StandardErrorPath</key>
            <string>/tmp/com.obsidian-logger.launch-stderr.log</string>
        </dict>
        </plist>
    ''')
    plist_path.parent.mkdir(parents=True, exist_ok=True)
    plist_path.write_text(plist_content)
    os.system(f'launchctl unload {plist_path} > /dev/null 2>&1')
    os.system(f'launchctl load -w {plist_path}')
    print(f'✅ Installed LaunchAgent: {plist_path}')

def setup_linux(python_path, script_path, vault_path, log_filename):
    autostart_dir = Path.home() / '.config' / 'autostart'
    autostart_dir.mkdir(parents=True, exist_ok=True)
    desktop_entry = dedent(f'''        [Desktop Entry]
        Type=Application
        Name=Obsidian Logger
        Exec={python_path} {script_path} "{vault_path}" "{log_filename}"
        X-GNOME-Autostart-enabled=true
    ''')
    (autostart_dir / 'obsidian-logger.desktop').write_text(desktop_entry)
    print(f'✅ Created autostart entry: {autostart_dir / "obsidian-logger.desktop"}')

def setup_windows(python_path, script_path, vault_path, log_filename):
    try:
        from win32com.client import Dispatch
    except ImportError:
        print('❌ pywin32 is required on Windows. Install with: pip install pywin32')
        sys.exit(1)

    pythonw = Path(sys.executable).with_name('pythonw.exe')
    if not pythonw.exists():
        print('❌ pythonw.exe not found.')
        sys.exit(1)

    startup_dir = Path(os.environ['APPDATA']) / 'Microsoft' / 'Windows' / 'Start Menu' / 'Programs' / 'Startup'
    shell = Dispatch('WScript.Shell')
    shortcut = shell.CreateShortcut(str(startup_dir / 'ObsidianLogger.lnk'))
    shortcut.TargetPath = str(pythonw)
    shortcut.Arguments = f'"{script_path}" "{vault_path}" "{log_filename}"'
    shortcut.WorkingDirectory = str(script_path.parent)
    shortcut.IconLocation = str(script_path)
    shortcut.save()
    print(f'✅ Shortcut created in startup folder: {startup_dir / "ObsidianLogger.lnk"}')

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
        vault_path = input('Enter full path to your Obsidian vault: ').strip()
        if not Path(vault_path).exists():
            print('❌ That path does not exist.')
            sys.exit(1)
        if not os.access(vault_path, os.W_OK):
            print('❌ You do not have write access to that folder.')
            sys.exit(1)
    else:
        vault_path = vault_list[int(choice) - 1]['path']
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

if SYSTEM == 'Darwin':
    setup_macos(python_path, script_path, vault_path, log_filename)
elif SYSTEM == 'Linux':
    setup_linux(python_path, script_path, vault_path, log_filename)
elif SYSTEM == 'Windows':
    setup_windows(python_path, script_path, vault_path, log_filename)
