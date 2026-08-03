For your Expo app, you currently reference these assets:

"icon": "./assets/icon.png"
"splash": {
  "image": "./assets/splash-icon.png"
},
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png"
  }
},
"web": {
  "favicon": "./assets/favicon.png"
}

So you need 4 image files. However, I recommend designing one master logo and exporting multiple sizes.

Asset	File	Size (px)	Background	Format
App Icon	icon.png	1024 × 1024	Solid (no transparency)	PNG
Android Adaptive Foreground	adaptive-icon.png	1024 × 1024	Transparent	PNG
Splash Logo	splash-icon.png	1024 × 1024 (or 2048 × 2048 if detailed)	Transparent	PNG
Favicon	favicon.png	48 × 48 (or export from 1024)	Transparent	PNG
Photoshop setup

Create your master artwork at:

2048 × 2048 px
RGB Color
8-bit
72 PPI
Transparent background

The pixel dimensions matter much more than the PPI for app icons.

1. App Icon (icon.png)
Canvas: 1024 × 1024
Background: solid color
No transparency
Keep the logo inside about 80% of the canvas (leave padding around the edges).

Example:

┌────────────────────┐
│                    │
│     LOGO HERE      │
│                    │
└────────────────────┘
2. Adaptive Icon (adaptive-icon.png)
Canvas: 1024 × 1024
Transparent background
Only the logo/foreground graphic
Leave generous padding (~20–25%) because Android masks icons into circles, squircles, etc.
3. Splash Icon (splash-icon.png)
Transparent PNG
1024 × 1024 is usually sufficient
This should be just the logo or symbol, not a full splash screen background. Expo centers it on the splash screen using your configured background color (#ffffff).
4. Favicon (favicon.png)

You don't need to design this separately.

Export your app icon at:

48 × 48

or

64 × 64

and save as favicon.png.

Recommended workflow

Design one master file:

MosqueBuddy_Master.psd
2048 × 2048

Then export:

icon.png             1024 × 1024
adaptive-icon.png    1024 × 1024
splash-icon.png      1024 × 1024
favicon.png          48 × 48
For your web admin (Next.js)

You'll likely also want these in client/web/public:

favicon.ico (16×16, 32×32, 48×48)
apple-touch-icon.png (180×180)
icon-192.png (192×192)
icon-512.png (512×512)

These are separate from the Expo assets but are useful for a polished web app and PWA support.


resolution for all these?

For digital app assets, resolution (PPI/DPI) is largely irrelevant—what matters is the pixel dimensions. However, if you're creating them in Photoshop, use these settings consistently:

Asset	Canvas Size	Resolution	Color Mode	Background
icon.png	1024 × 1024 px	72 PPI	RGB, 8-bit	Solid
adaptive-icon.png	1024 × 1024 px	72 PPI	RGB, 8-bit	Transparent
splash-icon.png	1024 × 1024 px	72 PPI	RGB, 8-bit	Transparent
favicon.png	48 × 48 px	72 PPI	RGB, 8-bit	Transparent
Photoshop New Document Settings

Use these settings when creating your master design:

Width: 2048 px
Height: 2048 px
Resolution: 72 Pixels/Inch
Color Mode: RGB Color, 8 bit
Background: Transparent
Color Profile: sRGB IEC61966-2.1
Pixel Aspect Ratio: Square

Then export:

icon.png → 1024 × 1024
adaptive-icon.png → 1024 × 1024
splash-icon.png → 1024 × 1024
favicon.png → 48 × 48
Export Settings
Format: PNG
Compression: Default/lossless
Color Profile: Convert to sRGB
Interlaced: Off
