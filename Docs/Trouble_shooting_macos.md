---
tags:
- review
---
# Obsidian Search Logger - Trouble shooting

When Obsidian Search Logger does not work, try the following.
The problem can be either the browser javascript side, the python side, or the LaunchAgent matter.

### Javascript side debugging

1. Check userscript is activated.
   You need to activate both Userscripts (or Tampermon) extension itself and the javascript.
   Also make sure www.google.com (and any search sites you use) are marked as 'allow' in the setting of Userscripts.

### Python side debugging

1. Run `obsidian_logger.py` manually in debug mode.
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

2. Check log files in `/tmp`.
   If the manual run is fine, it's likely the LaunchAgent matter.
   Check `com.obsidian-logger.launch-stdout.log` and `com.obsidian-logger.launch-stderr.log` in `/tmp`.

3. Manually run `setup_logger_macos.py`
   Most likely, Privacy & Security setting in System Setting is teh source of the trouble.

### TCC setting
MacOS regulates accesses to certain user folders like `Documents`, `Desktop` and iCloud cloud storage. It is called TCC (Transparency, Consent and Control). Running a python script from LaunchAgent can be affected by this regulation. The easiest way to overcome this regulation is to provide `python3` a full-disk access privilege.
The full-disk access privilege is powerful therfore sometimes a risk. You need to be aware of the both sides.
`setup_logger.py` can automatically detect if any of necessary files are under TCC. Then it asks you to change the setting via System Setting.app. Because it is a security manipulation, there is no automatic ways to turn on it. Please follow this:
#### Set full-disk access privilege
 1. `setup_logger.py` opens SYstem Setting.app for you. You will see something like this:
    ![[before.png]]
 2. Click `'+'`. to add `python3` in the list. But most likely, it is in the system folder which is invisible from Finder.
 3. Type `⌘` and `Shift` and `G` keys to get a small window to directly type directory path.
    ![[command-shift-g.png]]
 4. Type the path, then type `return`. You will get a long list of commands. Find `python3` and click `Open`.
 5. You will now have `python3` in the full-disk assess list.
    ![[after.png]]

---
from README