import { WidgetApp } from './components/WidgetApp'
import { SettingsApp } from './components/Settings/SettingsApp'

function isSettingsWindow(): boolean {
  return new URLSearchParams(window.location.search).get('settings') === '1'
}

export default function App() {
  return isSettingsWindow() ? <SettingsApp /> : <WidgetApp />
}
