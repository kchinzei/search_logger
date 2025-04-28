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
import sys
import json
import time
import platform
from pathlib import Path

if platform.system() != 'Windows':
    print('This script intended to run on Windows', file=sys.stderr)
    exit(-1)


STARTUP = Path(os.environ['APPDATA']) / 'Microsoft' / 'Windows' / 'Start Menu' / 'Programs' / 'Startup'


def get_obsidian_config_path() -> Path:
    return Path(os.environ['APPDATA']) / 'Obsidian' / 'obsidian.json'


def detect_python() -> Path:
    candidates = [
        Path(sys.executable)
    ]
    return next((p for p in candidates if p.exists()), None)


def setup(python_path, script_path, vault_path, log_filename):
    # TODO: not tested on Windows!
    # FIXME: need error check.
    try:
        from win32com.client import Dispatch
    except ImportError:
        print('❌ pywin32 needed (pip install pywin32)')
        return

    pythonw = Path(python_path).with_name('pythonw.exe')
    if not pythonw.exists():
        print('❌ pythonw.exe not found.')
        return

    shell = Dispatch('WScript.Shell')
    shortcut = shell.CreateShortcut(str(STARTUP / 'ObsidianLogger.lnk'))
    shortcut.TargetPath = str(pythonw)
    shortcut.Arguments = f'"{script_path}" "{vault_path}" "{log_filename}"'
    shortcut.WorkingDirectory = str(script_path.parent)
    shortcut.save()
    print('✅ Windows startup shortcut created.')
    return 0

def uninstall() -> int:
    lnk = STARTUP / 'ObsidianLogger.lnk'
    if lnk.exists():
        lnk.unlink()
    print('✅ Uninstalled Windows shortcut.')
    return 0


if __name__ == '__main__':
    # When run it from command line...
    debug = len(sys.argv) == 6 and sys.argv[5] == 'debug'
    if not (len(sys.argv) == 5 or (len(sys.argv) == 6 and debug)):
        print(f'Wrong number of arguments.', file=sys.stderr)
        print(f'Usage: python3 setup_logger_windows.py /path/to/python /path/to/stript /path/to/vault logfile.md [debug]', file=sys.stderr)
        
    python_path = Path(sys.argv[1])
    script_path = Path(sys.argv[2])
    vault_path = Path(sys.argv[3])
    log_filename = sys.argv[4]

    sys.exit(setup(python_path, script_path, vault_path, log_filename, debug))
