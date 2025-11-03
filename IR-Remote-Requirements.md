# IR Remote Requirements for macOS and Windows

## Must‑have specs

- USB receiver enumerates as HID Keyboard + HID Consumer Control (Usage Page 0x01 and 0x0C)
  - Keywords: USB IR receiver HID keyboard, HID consumer control 0x0C, driverless
- Driverless on macOS 12+ and Windows 10/11 (class‑compliant HID; no kernel extensions)
- IR modulation 38 kHz; supports common protocols (NEC, RC‑5/RC‑6)
- Sends standard keycodes:
  - DPAD: Arrow keys
  - Select: Enter/Return
  - Back: Escape
  - Delete/Back: Backspace
  - Media: Play/Pause, Next, Previous, Volume Up/Down/Mute (HID Consumer Page 0x0C)
- Reliable repeat/hold behavior with sane repeat rate (no key flood)
- Line‑of‑sight range ≥ 5–10 m; activity LED on receiver preferred
- USB‑A (or USB‑C) with stable extension cable; works via hubs

## Nice‑to‑have

- Wake from sleep (Windows S3/Modern Standby; macOS “Allow accessories to wake Mac”)
- Low end‑to‑end latency (<100 ms)
- Works with RC6/MCE remotes and universal remotes (e.g., Harmony profiles)
- Good IR noise rejection/shielding; configurable debounce

## OS integration notes

- macOS mapping/remap tools: Karabiner‑Elements, BetterTouchTool, Remote Buddy, Candelair
- Windows mapping tools: AutoHotkey, EventGhost
- Device should appear as: “HID Keyboard Device” and/or “HID‑compliant consumer control device” (Windows), class‑compliant HID (macOS)

## Quick acceptance tests

- macOS: run `hidutil eventmonitor` and confirm Usage Page 0x07 (keyboard) and 0x0C (consumer); media keys control system volume/transport
- Windows: Device Manager shows HID keyboard/consumer devices; media keys control OS; arrows/Enter/Escape work in Notepad

## Recommended receivers/remotes (known good)

- FLIRC USB (Gen2) – learns any IR remote, outputs HID keyboard; macOS/Windows/Linux config app
  - Search: "FLIRC USB IR receiver macOS Windows HID 38kHz"
- Inteset USB IR Receiver (MCE/RC6 class‑compliant) – often sold with INT‑422 remote
  - Search: "Inteset USB IR receiver RC6 eHome HID mac Windows"
- HP eHome/RC6 USB IR Receiver (OVU400/OVU422 family) – used/refurb common
  - Search: "HP eHome RC6 USB IR receiver OVU422 mac Windows"
- Pairing remotes: Inteset INT‑422‑3, original Microsoft MCE remote, or any NEC/TV remote with FLIRC

## Avoid

- Receivers that require proprietary Windows‑only drivers or kernel extensions on macOS
- "IR blaster‑only" dongles (transmitters) or non‑HID serial/CDC devices unless you plan custom software

## Example search queries

- USB IR receiver HID keyboard consumer control 0x0C macOS Windows
- RC6 eHome MCE USB IR receiver driverless
- FLIRC USB review macOS Windows 38kHz
- Karabiner‑Elements media keys HID consumer control
- EventGhost MCE remote Windows 11

## App key mapping (common defaults)

- DPAD: Arrow keys
- Select: Enter/Return
- Back: Escape
- Home/Menu: F10/F11/F12 or a dedicated key you remap
- Media transport: Play/Pause, Next, Previous; Volume keys at OS level
