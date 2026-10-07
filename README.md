# Daylo

A quiet desktop widget for Windows: digital time, date, weather, and an analog clock.
Built with Tauri 2, React, TypeScript and Tailwind.

## Install
Run `src-tauri/target/release/bundle/nsis/Daylo_0.1.0_x64-setup.exe`. Daylo starts, sits on the desktop
behind other windows, and lives in the system tray. Hover the widget and click the gear (or use the tray icon)
to open Settings.

## Develop
```
npm install
npm run tauri dev      # run with hot reload
npm run tauri build    # produce the installer
```
Requires Node, Rust (MSVC toolchain) and the Visual Studio C++ Build Tools.

## Data sources
Weather and city search: Open-Meteo. Automatic location: IP lookup (ipwho.is, falling back to geojs.io),
cached for six hours. No API keys are used.

## Credits
Weather icons by [Meteocons](https://meteocons.com/) (MIT licensed). See `src/assets/weather/LICENSE-meteocons.txt`.
