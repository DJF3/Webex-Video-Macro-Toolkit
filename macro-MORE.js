// version May 12th 2022 v3 - DJ Uittenbogaard - duittenb@cisco.com
import xapi from 'xapi';
const my_debug = true;
const imageBaseUrl = "https://sparkintegration.club/webexbackgrounds/";


//___ Background: "unselect" a pressed button _____________________________________________
function unsetGUIValue(guiId) {
    xapi.Command.UserInterface.Extensions.Widget.UnsetValue({WidgetId: guiId}).catch(() => {displayErr('Unsetting pressed button');})
}

//__ Open webpage: check if URL is valid
function isValidURL(string) {
  var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null)
};


//___ Find Widget ID (number) __________________________________________________
async function getWidgetId(widgetId) {
  const list = await xapi.Status.UserInterface.Extensions.Widget.get().catch(() => {displayErr('Getting widget id for ' + widgetId);})
  const widget = list.find(widget => widget.WidgetId === widgetId);
  let return_data = widget ? widget.Value : null;
  return return_data
} 

//___ Background: Set Virtual Background __________________________________________________
async function setBackground(e) {
    xapi.Command.UserInterface.Message.Alert.Display({Title: '', Text: 'Getting new virtual background', Duration: 3});
    await unsetGUIValue(e.WidgetId); // BUTTON unselect!
    // turn on small selfview
    xapi.Command.Video.Selfview.Set({Mode: 'On'}).then(() => {
      xapi.Command.Video.Selfview.Set({FullscreenMode: 'Off'}).catch(() => {displayErr('SelfView fullscreenmode off');});
    });
    // Get the widget ID of the user-slot selection widget (called 'bg_userslot')
    let usr_slot = await getWidgetId("bg_userslot");
    if (!['User1', 'User2', 'User3'].includes(usr_slot) && usr_slot.length == 4) {
      usr_slot = "User3";
    }
    await xapi.Command.Cameras.Background.Set({ Mode: 'BlurMonochrome'}).catch(() => {displayErr('Set BlurMono');  });
    await xapi.Command.Cameras.Background.Fetch({ Image: usr_slot, Url: imageBaseUrl + e.Value}).catch(() => {displayErr('Fetch background');});
    await xapi.Command.Cameras.Background.Set({ Image: usr_slot, Mode: 'Image'}).catch(() => {displayErr('Background switch');  });
  } 


//_____________________ GET DESKPRO DATA _____________________________________
function updateTempInfo(){
  xapi.Status.RoomAnalytics.AmbientTemperature.get()
    .then((myTemp) => xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'Temp: ' + myTemp + '°', WidgetId: 'widget_info_temp' }))
    .catch(() => {displayErr('updating Temperature')})
  xapi.Status.RoomAnalytics.RelativeHumidity.get()
    .then((myHum) => xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'Hum: ' + myHum + '%', WidgetId: 'widget_info_hum' }))
    .catch(() => {displayErr('updating Humidity')})
  xapi.Status.RoomAnalytics.Sound.Level.A.get()
    .then((mySound) => xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'Sound:' + mySound + 'dB', WidgetId: 'widget_info_sound' }))
    .catch(() => {displayErr('updating Soundlevel')})
  xapi.Status.Audio.Volume.get()
    .then((myVolume) => xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'Volume:' + myVolume, WidgetId: 'widget_info_volume' }))
    .catch(() => {displayErr('updating Volume')})
  xapi.Status.RoomAnalytics.PeopleCount.Current.get()
    .then((myPeopleCount) => xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'People: ' + myPeopleCount, WidgetId: 'widget_info_pc' }))
    .catch(() => {displayErr('counting People')})
  xapi.Status.SystemUnit.Uptime.get()
    .then((myUptime) => xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'Uptime:' + Math.round(myUptime/60) + 'm', WidgetId: 'widget_info_uptime' }))
    .catch(() => {displayErr('getting Uptime')})
}


//___ Display ERROR _____________________________________
function displayErr(error) {
  console.error('Error: ' + error);
  if (my_debug) {
    xapi.Command.UserInterface.Message.Alert.Display({Title: 'Error:', Text: error, Duration: 5});
  } 
}
//____ Display MESSAGE _____________________________________
function displayMsg(msgtext) {
    xapi.Command.UserInterface.Message.Alert.Display({Title: '', Text: msgtext, Duration: 5});
  }
  

//_____ SET SLIDER ________________________________________
async function set_Slider(e_value, s_slider) {
  switch (s_slider) {
    case 'widget_slider_exposure':  // Applies to: nearly all products
      var output = await slider_val(false, e_value, -3, 7);
      await xapi.Config.Cameras.Camera.ExposureCompensation.Level.set(output).catch(() => {displayErr('Setting exposure level to ' + output);})
      await xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: output, WidgetId: 'widget_slider_exposure_text'}).catch(() => {displayErr('Set exposure widget text');})
      break;
    case 'widget_slider_tilt':  // Applies to: nearly all products
      var output = await slider_val(false, e_value, -128, 250);
      await xapi.Command.Camera.PositionSet({CameraId: '1', Tilt: output }).catch(() => {displayErr('Tilting camera');})
  }
}


//_____ TOGGLE FEATURE ____________________________________
function toggle_me(m_widget, m_value) {
  let w_value = "";
  switch (m_widget) {
    case 'widget_toggle_sptrack':  // Applies to: all products
      w_value = (m_value == "on") ? "Auto" : "Off";
      xapi.Config.Cameras.SpeakerTrack.Mode.set(w_value).catch(() => {displayErr('Setting speakertrack mode to ' + w_value);})
      break;
    case 'widget_toggle_ultrasound':  // Applies to: all products
      w_value = (m_value == "on") ? "70" : "0";
      xapi.Config.Audio.Ultrasound.MaxVolume.set(w_value).catch(() => {displayErr('Setting Ultrasound to ' + w_value);})
      break;
    case 'widget_toggle_assistant':  // Applies to: all products
      m_value = (m_value == "on") ? "On" : "Off";
      xapi.Config.UserInterface.Assistant.Mode.set(m_value).catch(() => {displayErr('Setting Assistant mode to ' + m_value);})
      break;
    }
}


//____ Calculate SLIDER VALUE ________________________________________
async function slider_val(to_slider, event_val, s_lowest, s_steps) {
  let return_val = "";
  if (to_slider)  {  // ___FROM: real value    ___TO: slider value
    return_val = Math.round((parseInt(event_val) + 1 + (Math.sign(parseInt(s_lowest))*parseInt(s_lowest)*1)) * (254/(parseInt(s_steps)+1)));
  } else {  // ___FROM: slider value    ___TO: real value
    return_val = Math.round((parseInt(event_val)-128) / (254/parseInt(s_steps)));
  }
  return return_val
}


//_____________________ UPDATE TOGGLES & SLIDERS on START ____________________________________
async function update_page(my_page) {
  if (my_page == "more_display") {
    let s_expos = await xapi.Config.Cameras.Camera.ExposureCompensation.Level.get().catch(() => {displayErr('Getting Exposure level');})
    let s_tilt = await xapi.Status.Cameras.Camera.Position.Tilt.get().catch(() => {displayErr('Getting Tilt position');})
    let s_fullself = await xapi.Status.Video.SelfView.FullscreenMode.get().catch(() => {displayErr('Getting fullscreen mode');})
    let w_value4 = await slider_val(true, s_expos, -3, 7);
    let w_value5 = await slider_val(true, s_tilt, -128, 254);
    if (s_fullself == "On") { s_fullself = "on" } else { s_fullself = "off" }
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: w_value4, WidgetId: 'widget_slider_exposure'}).catch(() => {displayErr('setting Exposure widget');})
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: s_expos, WidgetId: 'widget_slider_exposure_text'}).catch(() => {displayErr('setting Exposure text widget');})
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: w_value5, WidgetId: 'widget_slider_tilt'}).catch(() => {displayErr('setting Tilt widget');})
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: s_fullself, WidgetId: 'widget_toggle_fullself'}).catch(() => {displayErr('setting SelfView fullscreen widget');})
  }
  if (my_page == "more_control") {
    let s_sptrack = await xapi.Status.Cameras.SpeakerTrack.Status.get().catch(() => {displayErr('Getting speakertrack mode');})
    let s_assmode = await xapi.Config.UserInterface.Assistant.Mode.get().catch(() => {displayErr('Getting Assistant mode');})
    let s_usvol = await xapi.Status.Audio.Ultrasound.Volume.get().catch(() => {displayErr('Getting Proximity status');})
    if (s_sptrack == "Active") { s_sptrack = "on" } else { s_sptrack = "off" }
    if (s_usvol == "0") { s_usvol = "off" } else { s_usvol = "on" }
    if (s_assmode == "On") { s_assmode = "on" } else { s_assmode = "off" }
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: s_sptrack, WidgetId: 'widget_toggle_sptrack'}).catch(() => {displayErr('setting speakertrack widget');})
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: s_usvol, WidgetId: 'widget_toggle_ultrasound'}).catch(() => {displayErr('setting Proximity widget');})
    xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: s_assmode, WidgetId: 'widget_toggle_assistant'}).catch(() => {displayErr('setting Assistant widget');})
  }
}


//____ Background: update background userslot button ____________________________________
async function update_bg_slot(us_widgetid) {
  let my_userstatus = await xapi.Status.Cameras.Background.Image.get()
  await xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: my_userstatus , WidgetId: us_widgetid });
}


//___ INITialization of settings required to use all features ____________________________
function init_settings() {   // some require ADMIN access!
  // enable httpclient mode for backgrounds
  xapi.Config.HttpClient.Mode.set('On').catch(() => {displayErr('enabling HTTPclient mode');})
  // enable virtual backgrounds
  xapi.Config.Cameras.Background.Enabled.set(true).catch(() => {displayErr('enabling Backgrounds');})
  // allow custom (user) images for virtual backgrounds
  xapi.Config.Cameras.Background.UserImagesAllowed.set(true).catch(() => {displayErr('allowing userImages');})
  // enable web browsing on device
  xapi.Config.Webengine.Mode.set('On').catch(() => {displayErr('enabling Webengine mode');})
}


//_____________________ GUI: listen _____________________________________
//___ LISTENER for text input (open webpage) ____________________________
xapi.Event.UserInterface.Message.TextInput.Response.on((event) => {
  let my_url;
  if (event.FeedbackId === 'input_url') {
    if (isValidURL(event.Text)) {
      my_url = event.Text;
      displayMsg("Opening page..");
    } else {
      my_url = "https://www.startpage.com/do/dsearch?query=" + event.Text
      displayMsg("Searching internet..");
    }
    xapi.Command.UserInterface.WebView.Display({URL: my_url});
  }
});
//___ LISTENER for Page Load ____________________
xapi.Event.UserInterface.Extensions.Page.Action.on((event) => {
  if (event.Type == "Opened") {
    switch (event.PageId) {
      case 'more_control':
        updateTempInfo();
      case 'more_display':
        update_page("more_display");  // display page opened: updating settings
        xapi.Status.Cameras.Background.Mode.get().then((status_blur) => {
              xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'button_' + status_blur, WidgetId: 'widget_blur' });
            });
        update_bg_slot("bg_userslot2");
        break;
      case 'more_background':
        update_bg_slot("bg_userslot");
        break;
      case 'more_control':
        update_page("more_control");
        break;
      }
  }
});
//___ LISTENER for Widgets ____________________
xapi.Event.UserInterface.Extensions.Widget.Action.on((event) => {
  //______________________ TOGGLE ____________________
  if (['widget_toggle_sptrack', 'widget_toggle_ultrasound', 'widget_toggle_assistant'].includes(event.WidgetId)) {
    toggle_me(event.WidgetId, event.Value);
  }
  //______________________ BG: Background ____________________
  if (event.Type == 'released' && event.WidgetId.includes('widget_bg_')) {
    setBackground(event);
  }
  //______________________ OPEN WEBPAGES ____________________
  if (event.Type == 'released' && event.WidgetId.includes('widget_web_')) {
    xapi.Command.UserInterface.WebView.Display({URL: event.Value}).catch((error) => {displayErr('opening website<br>' + error.message);})
    unsetGUIValue(event.WidgetId);
  }
  //______________________ SET BLURRING ____________________
  if (event.Type == 'released' && event.WidgetId == 'widget_blur') {
    let pressed_button = (event.Value).replace("button_","");
    xapi.Command.Cameras.Background.Set({Mode: pressed_button } ).catch(() => {displayErr('setting Blur to ' + pressed_button);})
  }
  if (event.Type === 'pressed') {
    switch (event.WidgetId) {   //--Webpage
      case 'widget_www_search':
        xapi.Command.UserInterface.Message.TextInput.Display({
          FeedbackId: 'input_url',
          Title: 'Enter URL',
          Text: 'Without a dot it will search the internet',
          SubmitText: 'Go!',
          InputText: 'https://',
        });
        break;
      case 'bg_userslot':
        xapi.Command.Cameras.Background.Set({ Image: event.Value, Mode: 'Image'}).catch((error) => {displayErr('1setting Background image<br>' + error.message);})
        xapi.Command.Video.Selfview.Set({Mode: 'On'}).then(() => {
          xapi.Command.Video.Selfview.Set({FullscreenMode: 'Off'});
        });
        update_bg_slot("bg_userslot2");
        break;
      case 'bg_userslot2':
        xapi.Command.Cameras.Background.Set({ Image: event.Value, Mode: 'Image'}).catch((error) => {displayErr('2setting Background image<br>' + error.message);})
        xapi.Command.Video.Selfview.Set({Mode: 'On'}).then(() => {
          xapi.Command.Video.Selfview.Set({FullscreenMode: 'Off'});
        });
        update_bg_slot("bg_userslot");
        break;
      case 'widget_control_tilt_center':  // Applies to: all products
        xapi.Command.Camera.PositionSet({CameraId: '1', Tilt: 0}).then(() => {
          xapi.Command.UserInterface.Extensions.Widget.SetValue({WidgetId: 'widget_slider_tilt', Value: 128});
        })
        .catch(() => {displayErr('changing tilt');});
        break;
      case 'button_image_usbc':  // Applies to: DeskPro/DeskLE DeskMini WebexDesk
        xapi.Command.Cameras.Background.Set({Mode: 'UsbC'}).catch(() => {displayErr('setting output USBc');})
        xapi.Command.UserInterface.Extensions.Panel.Close;
        break;
      case 'widget_www_clearsession':   // clear web session cache
        xapi.Command.Webengine.DeleteStorage().then(() => {displayMsg('Cleared web session data');}).catch(() => {displayErr('clearing cache');})
        break;
      case 'button_image_hdmi':  // Applies to: DeskPro/DeskLE DeskMini WebexDesk
        xapi.Command.Cameras.Background.Set({Mode: 'Hdmi'}).catch(() => {displayErr('setting output hdmi');})
        xapi.Command.UserInterface.Extensions.Panel.Close;
        break;
      case 'widget_control_selfview_on':  // Applies to: all products
        xapi.Command.Video.Selfview.Set({Mode: 'On'}).then(() => {
          xapi.Command.Video.Selfview.Set({FullscreenMode: 'Off'});
        });
        break;
      case 'widget_control_selfview_off':  // Applies to: all products
        xapi.Command.Video.Selfview.Set({Mode: 'Off'}).catch(() => {displayErr('turning off Selfview');})
        break;
      case 'widget_sptrack_diag_on':  // Applies to: nearly all products
        xapi.Config.Cameras.SpeakerTrack.Mode.set('Auto').then(() => {
          xapi.Command.Cameras.SpeakerTrack.Diagnostics.Start().catch(() => {displayErr('setting Speakertrack diag on');})
        })
        xapi.Command.Video.Selfview.Set({Mode: 'On'}).then(() => {
          xapi.Command.Video.Selfview.Set({FullscreenMode: 'Off'});
        });
        xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: 'on', WidgetId: 'widget_toggle_sptrack'}).catch(() => {displayErr('setting speakertrack widget');})
        break;
      case 'widget_sptrack_diag_off':  // Applies to: nearly all products
        xapi.Command.Cameras.SpeakerTrack.Diagnostics.Stop().catch(() => {displayErr('setting Speakertrack diag off');})
        break;
      case 'widget_info_refresh':
        updateTempInfo();
        break;
    }
  } else if (event.Type === 'changed') {
    switch (event.WidgetId) {
      case 'widget_slider_exposure':
        set_Slider(event.Value, 'widget_slider_exposure');
        break;
      case 'widget_slider_tilt':
        set_Slider(event.Value, 'widget_slider_tilt');
        break;
      case 'widget_toggle_fullself':
        let new_state = (event.Value == "on") ? "On" : "Off";
        xapi.Command.UserInterface.Extensions.Panel.Close().then(() => {
          xapi.Command.Video.Selfview.Set({FullscreenMode: new_state});
        });
        break;
    }
  }
});


init_settings();