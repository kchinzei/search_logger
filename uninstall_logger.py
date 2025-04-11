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

from pathlib import Path
import os

try:
    plist_path = Path.home() / 'Library/LaunchAgents/com.obsidian.logger.plist'

    if plist_path.exists():
        print(f'🔍 Found LaunchAgent plist at:\n  {plist_path}')
        confirm = input('Do you want to unload and delete this LaunchAgent? [Y/n]: ').strip().lower() or 'y'
        if confirm == 'y':
            os.system(f'launchctl unload {plist_path}')
            plist_path.unlink()
            print('✅ LaunchAgent unloaded and deleted.')
        else:
            print('❌ Operation cancelled.')
    else:
        print('⚠️ No LaunchAgent found at expected location.')

    log_out = Path('/tmp/obsidian_logger.out')
    log_err = Path('/tmp/obsidian_logger.err')
    for log_file in [log_out, log_err]:
        if log_file.exists():
            log_file.unlink()
            print(f'🧹 Deleted log file: {log_file}')
except KeyboardInterrupt:
    print('\n❌ Interrupted by user.')
