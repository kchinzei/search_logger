# Preliquisite
Complete steps 1 - 3 [here](Setup). Select  [Tampermonkey](https://www.tampermonkey.net) as browser extension, download from AppStore.

## To add and activate the javascript
Once Tampermonkey is installed, you should have an icon of a jigsaw puzzle. It's a shortcut to **Extension Setting**.
- Extension setting icon >> Tampermonkey >> Three vertical dots >> Option
	You are now Tampermonkey setting view. Click "**+**" icon will open script editor.
- Paste the javascript code
- File >> Save
	Click **Installed UserScript** (next to "**+**" icon) to confirm the new script was listed and activated.
	
# System Settings
- General >> Login items and extensions >> **Python3 : ON**
- Privacy & Security >> Local Network >> **Python3 : OFF**

You may be asked to allow **Full-disk access** to python3 when running `setup_logger.py`.
If it appears, apply the following.
- Privacy & Security >> Full-disk Access >> **Python3 : ON**
  To do it, see [here](<Trouble shooting - macOS#Set full-disk access>).
# Chrome Setting
- Settings >> Extensions
	- **Tampermonkey : ON**
	- **Developper Mode : ON** (at the upper right of the window)
- Settings >> Extensions >> Tampermonkey >> More
	- **Site access** : add these.
		- http://localhost:27123/*
		- https://www.google.co.jp/*
		- https://www.google.com/*
	  You can add these manually.
