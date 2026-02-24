# Icon Tofu Problem & Resolution

## What is "Icon Tofu"?

"Tofu" refers to blank rectangles (▯) or empty spaces that appear where icons should render. The name comes from the Unicode community — missing glyphs display as small blank boxes that resemble blocks of tofu.

## The Problem

After replacing emoji placeholders (🔍, ❤️, 🔖, etc.) with `react-native-vector-icons/Ionicons`, all icons appeared as invisible/blank — tofu.

### Symptoms

- Bottom tab bar showed empty spaces instead of home/categories/saved/profile icons
- Article cards showed no heart or bookmark icons
- Search, error, and empty-state icons were all invisible
- No crash — the app ran fine, just no icons rendered

### Root Cause

`react-native-vector-icons` renders icons by loading **native font files** (e.g., `Ionicons.ttf`) that must be bundled into the platform binary. This requires:

- **Android**: A gradle task (`fonts.gradle`) to copy `.ttf` files into `assets/fonts/` during build
- **iOS**: Registering font files in `Info.plist` and running `pod install` to link them

If the font file is missing from the binary, the system tries to render a glyph from a font that doesn't exist, resulting in tofu. This is a **native build problem** — no amount of JavaScript-side fixes can resolve it without a clean rebuild that includes the font assets.

#### Why this is error-prone

| Step | What can go wrong |
|------|-------------------|
| `npm install` | Package installed, but native fonts not linked |
| Android `build.gradle` | `fonts.gradle` line missing or placed incorrectly |
| iOS `Info.plist` | `UIAppFonts` array missing `Ionicons.ttf` entry |
| Metro bundler restart | JS updates but native binary still uses old (font-less) APK/IPA |
| Clean build skipped | Cached build artifacts don't include the new font files |

Even after correct configuration, forgetting to do a **clean rebuild** (`gradlew clean` / `pod install`) is the most common cause.

## The Solution: Custom SVG Icons

Instead of fighting native font linking, the project switched to **custom SVG path rendering** using `react-native-svg` — a library that is already auto-linked by React Native and requires zero native font configuration.

### How it works

```
react-native-vector-icons          Custom SVG approach
─────────────────────────          ────────────────────
Ionicons.ttf (font file)    →     iconPaths.ts (SVG path data)
Native font loading          →     react-native-svg rendering
Glyph lookup by codepoint    →     <Svg><Path d="..."/></Svg>
Requires native rebuild      →     Pure JS — hot reload works
```

#### Architecture

```
src/components/icons/
├── Icon.tsx          Main component — renders <Svg> with <Path> elements
└── iconPaths.ts      SVG path data extracted from Ionicons (MIT license)
```

**Icon.tsx** takes `name`, `size`, and `color` props — same API as `react-native-vector-icons`:

```tsx
<Icon name="home" size={24} color="#007AFF" />
<Icon name="heart-outline" size={20} color="#FF3B30" />
```

**iconPaths.ts** stores path data for each icon with metadata:

```ts
{
  viewBox: '0 0 512 512',   // SVG coordinate space
  paths: ['M261.56 ...'],   // SVG path data strings
  stroke?: boolean,          // true = outline icon (stroked, not filled)
  strokeWidth?: number,      // line thickness for outline icons
}
```

### Why SVG icons don't have the tofu problem

| Font-based icons | SVG icons |
|------------------|-----------|
| Need `.ttf` bundled in native binary | Pure JavaScript — no native assets |
| Fail silently (tofu) if font missing | Render immediately, or `null` if name unknown |
| Require platform-specific build config | `react-native-svg` auto-links, no extra config |
| Need clean rebuild after install | Work with hot reload |
| Font rendering differs across OS versions | Pixel-identical rendering on all platforms |

## Available Icons

11 icons currently implemented, covering all app screens:

### Filled icons (solid)

| Name | Usage |
|------|-------|
| `home` | Home tab |
| `grid` | Categories tab |
| `bookmark` | Saved tab, save button (active) |
| `person` | Profile tab |
| `heart` | Like button (active) |
| `alert-circle` | Error messages |

### Outline icons (stroked)

| Name | Usage |
|------|-------|
| `bookmark-outline` | Save button (inactive), empty states |
| `search` | Search header button, empty states |
| `heart-outline` | Like button (inactive) |
| `sad-outline` | No-results empty state |
| `create-outline` | Edit profile |
| `chevron-forward` | Navigation arrow |

## Adding New Icons

1. Find the icon on [Ionicons](https://ionic.io/ionicons)
2. Download or inspect the SVG source
3. Extract the `viewBox` and `<path d="...">` values
4. Add an entry to `iconPaths.ts`:

```ts
'new-icon-name': {
  viewBox: '0 0 512 512',
  paths: ['M...'],           // from the SVG <path d=""> attribute
  stroke: true,              // only for outline-style icons
  strokeWidth: 32,           // only for outline-style icons
},
```

For icons with non-path elements (circles, rects), handle them as special cases in `Icon.tsx` — see the `sad-outline` eyes as an example.

## Icon Sizes Used in the App

| Context | Size | Example |
|---------|------|---------|
| Tab bar | 24px | Bottom navigation icons |
| Action buttons | 20–24px | Like/save on article cards |
| Header buttons | 24px | Search button |
| Error display | 48px | Error message icon |
| Empty states | 64px | "No results" illustrations |

## Icon Colors

| State | Color | Token |
|-------|-------|-------|
| Liked (active) | Red | `colors.error` |
| Saved (active) | Blue | `colors.primary` |
| Inactive / outline | Gray | `colors.gray[500]` |
| Empty state | Light gray | `colors.gray[400]` |
| General | Dark | `colors.text` |
| Tab active | Blue | `colors.primary` |
| Tab inactive | Gray | `colors.gray[500]` |
