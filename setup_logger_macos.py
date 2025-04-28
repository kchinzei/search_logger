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

if platform.system() != 'Darwin':
    print('This script intended to run on macOS', file=sys.stderr)
    exit(-1)


HOME = Path.home()
LAUNCH_AGENT_PLIST = 'Library/LaunchAgents/com.obsidian-logger.plist'
LAUNCH_LOG_STDOUT = '/tmp/com.obsidian-logger.launch-stdout.log'
LAUNCH_LOG_STDERR = '/tmp/com.obsidian-logger.launch-stderr.log'

LOG_ERROR_LAUNCH = 'Operation not permitted'
LOG_ERROR_NOFILE = 'No such file or directory'
LOG_ERROR_TOUCH = '❌ Failed to touch the log file'
LOG_ERROR_SERVER = '❌ Server error'
LOG_ERROR_OTHER = '❌ Unexpected error'
LOG_SUCCESS = '🔌 Server is listening on'


def get_obsidian_config_path() -> Path:
    return HOME / 'Library/Application Support/obsidian/obsidian.json'


def detect_python() -> Path:
    candidates = [
        Path('/usr/bin/python3'),
        Path('/usr/local/bin/python3'),
        Path('/opt/homebrew/bin/python3'),
        Path(sys.executable)
    ]
    return next((p for p in candidates if p.exists()), None)


def setup(python_path: Path,
          script_path: Path,
          vault_path: Path,
          log_filename: str,
          debug = False) -> int:

    # macOS TCC (Transparency, Consent and Control) is an extra security measure.
    def is_tcc_protected(path: Path) -> bool:
        path = path.resolve()
        return (
            str(path).startswith(str(HOME / 'Library/Mobile Documents')) or
            str(path).startswith(str(HOME / 'Library/CloudStorage')) or
            str(path).startswith(str(HOME / 'Desktop')) or
            str(path).startswith(str(HOME / 'Documents')) or
            str(path).startswith(str(HOME / 'Downloads')) or
            str(path).startswith('/Volumes/')
        )

    # Step 0: Prepare the plist.
    stdout_log_path = Path(LAUNCH_LOG_STDOUT)
    stderr_log_path = Path(LAUNCH_LOG_STDERR)
    plist_path = Path.home() / LAUNCH_AGENT_PLIST
    plist_content = dedent(f'''        <?xml version='1.0' encoding='UTF-8'?>
        <!DOCTYPE plist PUBLIC '-//Apple//DTD PLIST 1.0//EN'
          'http://www.apple.com/DTDs/PropertyList-1.0.dtd'>
        <plist version='1.0'>
        <dict>
            <key>Label</key>
            <string>com.obsidian-logger</string>
            <key>ProgramArguments</key>
            <array>
                <string>{python_path.absolute()}</string>
                <string>{script_path.absolute()}</string>
                <string>{vault_path.absolute()}</string>
                <string>{log_filename}</string>
                {'<string>debug</string>' if debug else ''}
            </array>
            <key>RunAtLoad</key>
            <true/>
            <key>WorkingDirectory</key>
            <string>{script_path.parent}</string>
            <key>StandardOutPath</key>
            <string>{LAUNCH_LOG_STDOUT}</string>
            <key>StandardErrorPath</key>
            <string>{LAUNCH_LOG_STDERR}</string>
        </dict>
        </plist>
    ''')

    # Step 1: Write LaunchAgent plist and start it.
    try:
        plist_path.parent.mkdir(parents=True, exist_ok=True)
        plist_path.write_text(plist_content)
        stdout_log_path.unlink(missing_ok = True)
        stderr_log_path.unlink(missing_ok = True)
        os.system(f'launchctl unload {plist_path} > /dev/null 2>&1')
        os.system(f'launchctl load -w {plist_path}')
        print(f'⚙️ Installed LaunchAgent: {plist_path}')
    except OSError as e:
        print(f'❌ Failed {e}', file=sys.stderr)
        return -20

    # Step 2: Error analysis if there is.
    time.sleep(3)

    success = False
    if not stdout_log_path.exists() and not stderr_log_path.exists():
        print('❌ Launchctl load failed.', file=sys.stderr)

    if stderr_log_path.exists():
        stderr_content = stderr_log_path.read_text()
        if len(stderr_content) == 0 and LOG_SUCCESS in stdout_log_path.read_text():
            success = True
        elif LOG_ERROR_LAUNCH in stderr_content:
            print('❌ Launchctl load failed.', file=sys.stderr)
        elif LOG_ERROR_TOUCH in stderr_content:
            print('❌ Writing search log failed.', file=sys.stderr)
        elif LOG_ERROR_NOFILE in stderr_content:
            print(f'❌ {LOG_ERROR_NOFILE}. {script_path.absolute} correct?', file=sys.stderr)
            return -30

    if not success:
        if is_tcc_protected(python_path) or is_tcc_protected(script_path) or is_tcc_protected(vault_path):
            print(f'=== 🔒 TCC permission problem detected. Possibly attempt to use iCloud or other special folder(s).')
            print(f'=== ⚙️ Add "Full Disk Access" to {python_path}. Use "⌘ + Shift  + G" to reach {python_path.parent}')
            print(f'=== 🔓 After granting Full Disk Access to python3, run this script again.')
            os.system("open 'x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles'")
            return -40
        else:
            print('❌ Other error(s). Possibly cyber-security measures too strong', file=sys.stderr)
            return -41

    print('✅ macOS setup complete.')
    return 0


def uninstall() -> int:
    plist_path = Path.home() / LAUNCH_AGENT_PLIST
    stdout_log_path = Path(LAUNCH_LOG_STDOUT)
    stderr_log_path = Path(LAUNCH_LOG_STDERR)

    if plist_path.exists():
        os.system(f'launchctl unload {plist_path} > /dev/null 2>&1')
        plist_path.unlink()
    else:
        print(f'⚠️ No LaunchAgent file {plist_path}')
    stdout_log_path.unlink(missing_ok = True)
    stderr_log_path.unlink(missing_ok = True)
    print('✅ Uninstalled macOS agent and logs.')
    return 0


if __name__ == '__main__':
    debug = len(sys.argv) == 6 and sys.argv[5] == 'debug'
    if not (len(sys.argv) == 5 or (len(sys.argv) == 6 and debug)):
        print(f'Wrong number of arguments.', file=sys.stderr)
        print(f'Usage: python3 setup_logger_macos.py /path/to/python /path/to/stript /path/to/vault logfile.md [debug]', file=sys.stderr)
        
    python_path = Path(sys.argv[1])
    script_path = Path(sys.argv[2])
    vault_path = Path(sys.argv[3])
    log_filename = sys.argv[4]

    sys.exit(setup(python_path, script_path, vault_path, log_filename, debug))
