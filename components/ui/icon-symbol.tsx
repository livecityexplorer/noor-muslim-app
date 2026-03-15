import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation
  "house.fill": "home",
  "book.fill": "menu-book",
  "moon.stars.fill": "nightlight-round",
  "location.north.fill": "explore",
  "ellipsis": "more-horiz",
  "gearshape.fill": "settings",
  // Quran
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "forward.end.fill": "skip-next",
  "backward.end.fill": "skip-previous",
  "forward.15.fill": "forward-10",
  "backward.15.fill": "replay-10",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  "bookmark.fill": "bookmark",
  "bookmark": "bookmark-border",
  "list.bullet": "format-list-bulleted",
  "magnifyingglass": "search",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // Prayer
  "bell.fill": "notifications",
  "bell.slash.fill": "notifications-off",
  "clock.fill": "schedule",
  "location.fill": "location-on",
  "location.slash.fill": "location-off",
  "arrow.clockwise": "refresh",
  // Qibla
  "arrow.up": "arrow-upward",
  "compass.drawing": "explore",
  // Hadith
  "text.book.closed.fill": "library-books",
  "quote.bubble.fill": "format-quote",
  // Dhikr
  "circle.fill": "fiber-manual-record",
  "arrow.counterclockwise": "replay",
  "target": "gps-fixed",
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  // Scanner / Halal
  "qrcode.viewfinder": "qr-code-scanner",
  "square.and.arrow.up": "ios-share",
  // General
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "info.circle.fill": "info",
  "star.fill": "star",
  "heart.fill": "favorite",
  "share": "share",
  "globe": "language",
  "person.fill": "person",
  "minus.circle.fill": "remove-circle",
  "plus.circle.fill": "add-circle",
} as unknown as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
