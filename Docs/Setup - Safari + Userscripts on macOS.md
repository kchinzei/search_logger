
This page explains the setup for Safari + Userscripts on macOS.

# Preliquisite
Complete steps 1 - 3 [here](Setup.md). Select [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887) as browser extension, download from AppStore.

## To add and activate the javascript
Once Userscripts is installed, you should have an icon of "**</>**" beside the URL/Search window. It's a shortcut to **Userscripts Setting**.
- "**</>**" icon >> Open Extension Page
	You are now Userscript setting view. Click "**+**" icon and select "**New JS**".
- Paste the javascript code
	Make sure it appears as "**Search Logger**" and the switch is **ON**.
	
# OS Settings
In System Settings.app,
- General >> Login items and extensions >> **Python3 : ON**
- Privacy & Security >> Local Network >> **Python3 : OFF**
You may be asked to allow **Full-disk access** to python3 when running `setup_logger.py`.
If it appears, apply the following.
- Privacy & Security >> Full-disk Access >> **Python3 : ON**
  To do it, see [here](<Trouble shooting - macOS.md#Set full-disk access>).
# Safari Setting
- Settings >> Extensions >> Userscripts 
	This will show a list of URLs that Userscripts will apply ([fig1](mac_safari_extension.png)). Set **Allow** for
	- **google.com**
	- **google.co.jp**
- Other sites can be **Deny** (unless you need them for other scripts).
