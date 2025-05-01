
This page explains the setup for Chrome + Tampermonkey on macOS.

## Preliquisite
Complete steps 1 - 3 [here](Setup.md). Select  [Tampermonkey](https://www.tampermonkey.net) as browser extension, download from AppStore.

### To add and activate the javascript
Once Tampermonkey is installed, you should have an icon of a jigsaw puzzle. It's a shortcut to **Extension Setting**.
- Jigsaw puzzle icon >> Tampermonkey >> Three vertical dots >> Option
	You are now Tampermonkey setting view. Click "**+**" icon will open script editor.
- Paste the javascript code
- File >> Save
	Click **Installed UserScript** (next to "**+**" icon) to confirm the new script was listed and activated.
	
## System Settings
- General >> Login items and extensions >> **Python3 : ON**
- Privacy & Security >> Local Network >> **Python3 : OFF**

You may be asked to allow **Full-disk access** to python3 when running `setup_logger.py`.
If it appears, apply the following.
- Privacy & Security >> Full-disk Access >> **Python3 : ON**
  To do it, see [here](<Trouble shooting - macOS.md#Set full-disk access>).

## Chrome Setting
- Settings >> Extensions
	- **Tampermonkey : ON**
	- **Developper Mode : ON** (at the upper right of the window)
- Settings >> Extensions >> Tampermonkey >> More
	- **Site access** : add these.
		- http://localhost:27123/*
		- https://www.google.co.jp/*
		- https://www.google.com/*
	You can add these manually ([fig 1](figs/mac_chrome_extension_1.png), [fig 2](figs/mac_chrome_extension_2.png)).
- Jigsaw puzzle icon >> Tampermonkey >> Three vertical dots >> Option 
  \>> Installed UserScripts >> Search Logger >> Settings
  \>> XHR Security >> User domain whitelist
	- Click "**Add...**" then type "**localhost**" ([fig 3](figs/mac_chrome_tampermonkey_xhrsecurity.png))
### Tampermonkey may ask about "cross-origin resource access"
In the first run, Tampermonkey may ask to about "cross-origin resource access" ([fig 4](figs/mac_chrome_xrossorigin_access_permit.png)) or "cross-origin request privilege" ([fig 5](figs/mac_chrome_xrossorigin_request.png)).
If it appears, select "**Always allow**".