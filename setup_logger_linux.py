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
from textwrap import dedent

if platform.system() != 'Linux':
    print('This script intended to run on Linux', file=sys.stderr)
    exit(-1)


HOME = Path.home()


def get_obsidian_config_path() -> Path | None:
    default_path = HOME / '.config/obsidian/obsidian.json'
    snap_path = HOME / 'snap/obsidian/current/.config/obsidian/obsidian.json'       
    if default_path.exists():
        return default_path
    else:
        return snap_path


def detect_python() -> Path:
    candidates = [
        Path('/usr/bin/python3'),
        Path('/usr/local/bin/python3'),
        Path('/opt/bin/python3'),
        Path(sys.executable)
    ]
    return next((p for p in candidates if p.exists()), None)


def setup(python_path: Path,
          script_path: Path,
          vault_path: Path,
          log_filename: str,
          debug = False) -> int:
    # TODO: stringent eror check.
    
    autostart_dir_path = HOME / '.config' / 'autostart'
    autostart_dir_path.mkdir(parents=True, exist_ok=True)
    desktop_path = autostart_dir_path / 'com.obsidian-logger.desktop'
    entry = dedent(f'''[Desktop Entry]
        Type=Application
        Name=Obsidian Logger
        Exec={python_path} {script_path} "{vault_path}" "{log_filename}"
        X-GNOME-Autostart-enabled=true
    ''')
    desktop_path.write_text(entry)
    print('✅ Linux autostart entry created.')
    return 0


def uninstall() -> int:
    autostart_dir_path = HOME / '.config' / 'autostart'
    desktop_path = autostart_dir_path / 'com.obsidian-logger.desktop'

    desktop.unlink(missing_ok = True)
    print('✅ Uninstalled Linux autostart entry.')
    return 0


if __name__ == '__main__':
    debug = len(sys.argv) == 6 and sys.argv[5] == 'debug'
    if not (len(sys.argv) == 5 or (len(sys.argv) == 6 and debug)):
        print(f'Wrong number of arguments.', file=sys.stderr)
        print(f'Usage: python3 setup_logger_linux.py /path/to/python /path/to/stript /path/to/vault logfile.md [debug]', file=sys.stderr)
        
    python_path = Path(sys.argv[1])
    script_path = Path(sys.argv[2])
    vault_path = Path(sys.argv[3])
    log_filename = sys.argv[4]

    sys.exit(setup(python_path, script_path, vault_path, log_filename, debug))
