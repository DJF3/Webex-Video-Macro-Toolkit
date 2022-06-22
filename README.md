# Webex Macro Toolkit

| Settings  | Blurring |   |
| ------------- | ------------- | ------------- | 
| Camera Exposure  | Blur Normal  | **BACKGROUNDS** |
| Pan/tilt  | Blur Depth of field  | Assign virtual backgrounds to one of the 3 User slots | 
| Self-view on/off+small/fullscr  | Blur monochrome <---great!  | Choose from +/- 150 backgrounds visible here |
| Speaker-track on/off  | Monochrome <--- great!  | **SENSORS** |
| Speaker-track diagnostics  | USB-C/HDMI  | Temp/Hum |
| Webex Assistant on/off  |   | Sound level/Volume | 
| Proximity on/off  |   | People count/Uptime | 
|  |   | **WEB** |
|   |   | Games, news, demo |
|   |   | Open page/search/clear session |


# Instructions
1 - Access: Login to your Video device.

2 - Import Macro  
- Click "Macro editor"
- Click "Import from file"
- Select "macro-MORE.js" and click open
- Save the macro (CTRL-S or CMD-S)
- Select the imported macro and click the grey toggle button to activate the macro

3 - Import GUI  
- From the main page, click "UI Extensions Editor"
- In the top-right hamburger menu, select "Merge from file"
    (NOTE: use Merge to prevent overwriting/removing other macros)
- Select "ui-MORE.xml" and click open
- On the top-right, click the up arrow to deploy the UI to the video system
- Now, go to your video system and test! 


# Customize Virtual Backgrounds
1 - Select images. Go to [HERE](https://sparkintegration.club/webexbackgrounds/) to see the available virtual background images

2 - Assign image filenames to buttons. In the UI editor:
- Add a group-button and name it "widget_bg_"+your own text ---> Example: "widget_bg_clouds". Then update button IDs with the image filenames you want to use.
OR
- Select an existing group-button and update button IDs with the image filenames you want to use.

3 - Rename buttons

Rename the BUTTON text so you know what image it contains. Use short names to make them fit.
Don't forget to UPLOAD/activate the modified UI. ('arrow up' button top right
