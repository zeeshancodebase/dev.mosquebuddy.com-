// src/components/TabIcon.js
import Svg, { Path, Circle } from "react-native-svg";

// Each icon is a 24×24 SVG. Stroke-based, consistent 1.8px stroke width,
// rounded caps — feels modern and clean, matches the App design register.

function HomeIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dome top */}
      <Path
        d="M12 3C12 3 10 5 10 7C10 8.1 10.9 9 12 9C13.1 9 14 8.1 14 7C14 5 12 3 12 3Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NearbyIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function JumuahIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Crescent */}
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Star dot */}
      <Circle cx="16" cy="8" r="1" fill={color} />
    </Svg>
  );
}

function SearchIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <Path
        d="M16.5 16.5L21 21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

const ICON_MAP = {
  Home: HomeIcon,
  Nearby: NearbyIcon,
  Jumuah: JumuahIcon,
  Search: SearchIcon,
  Profile: ProfileIcon,
};

export default function TabIcon({ name, color, size = 24 }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon color={color} size={size} />;
}