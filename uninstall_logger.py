#!/usr/bin/env python3
import os
import sys
import platform
from pathlib import Path

SYSTEM = platform.system()

def uninstall_macos():
    plist_path = Path.home() / 'Library/LaunchAgents/com.obsidian-logger.plist'
    if plist_path.exists():
        os.system(f'launchctl unload {plist_path}')
        plist_path.unlink()
        print(f'✅ Removed LaunchAgent: {plist_path}')
    else:
        print('⚠️ No LaunchAgent found.')

    # Also remove log files
    for log_file in [
        '/tmp/com.obsidian-logger.launch-stdout.log',
        '/tmp/com.obsidian-logger.launch-stderr.log'
    ]:
        path = Path(log_file)
        if path.exists():
            path.unlink()
            print(f'🧹 Deleted log file: {log_file}')

def uninstall_linux():
    desktop_file = Path.home() / '.config' / 'autostart' / 'obsidian-logger.desktop'
    if desktop_file.exists():
        desktop_file.unlink()
        print(f'✅ Removed autostart entry: {desktop_file}')
    else:
        print('⚠️ No autostart .desktop file found.')

def uninstall_windows():
    startup_dir = Path(os.environ['APPDATA']) / 'Microsoft' / 'Windows' / 'Start Menu' / 'Programs' / 'Startup'
    shortcut = startup_dir / 'ObsidianLogger.lnk'
    if shortcut.exists():
        shortcut.unlink()
        print(f'✅ Removed startup shortcut: {shortcut}')
    else:
        print('⚠️ No startup shortcut found.')

# --- MAIN ---
if SYSTEM == 'Darwin':
    uninstall_macos()
elif SYSTEM == 'Linux':
    uninstall_linux()
elif SYSTEM == 'Windows':
    uninstall_windows()
else:
    print(f'❌ Unsupported platform: {SYSTEM}')
    sys.exit(1)
