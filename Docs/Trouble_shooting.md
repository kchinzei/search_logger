---
tags:
- review
---
# Obsidian Search Logger - Trouble shooting

When Obsidian Search Logger does not work, try the following.
The problem can be either the browser javascript side, the python side, or the LaunchAgent matter.

1. Check userscript is activated.
   You need to activate both Userscripts extension itself and the javascript.
   Also make sure www.google.com (and any search sites you use) are marked as 'allow' in the setting of Userscripts.

2. Run `obsidian_logger.py` manually in debug mode.
   You can run the python script in Terminal.app with
   ```
   cd (this folder)
   ./obsidian_logger.py ~/ test.md debug
   ```
   This will record the log in ~/test.md -- actually the save folder is not limited to an Obsidian vault -- any folder you have a write permission will work.
   Running `obsidian_logger.py` in debug mode will print information on how the script works. If everything goes file, it should look like
   ```
   🟢 Starting logger...
   📒 Logging to:  /Users/(your login name)/test.md
   🔌 Server is listening on http://localhost:(port number)
   ```
   If the last line is
   ```
   ❌ Server error: [Errno 48] Address already in use
   ```
   It means that `obsidian_logger.py` is already running fine. If so the problem is likely in the browser side. Go back 1.

3. Check log files in `/tmp`.
   If the manual run is fine, it's likely the LaunchAgent matter.
   Check `com.obsidian-logger.launch-stdout.log` and `com.obsidian-logger.launch-stderr.log` in `/tmp`.

---
from README