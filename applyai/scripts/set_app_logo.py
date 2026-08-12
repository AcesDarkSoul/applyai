from pathlib import Path
from PIL import Image

src_path = Path(
    r"C:\Users\sagar\.cursor\projects\d-jobportal-project\assets"
    r"\c__Users_sagar_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"cb308927d1a53265a4b099bd3aaeee48_images_logo_apply-eef803ad-bf80-456c-9f64-bdff1a2ee327.png"
)
assets = Path(r"d:\jobportal project\applyai\assets\images")
res = Path(r"d:\jobportal project\applyai\android\app\src\main\res")
src = Image.open(src_path).convert("RGBA")

# Brand purple from interior sample (250,450)
BRAND_BG = (85, 89, 248, 255)  # #5559F8


def resize(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def save_png(im: Image.Image, path: Path) -> None:
    im.save(path, "PNG", optimize=True)


def save_webp(im: Image.Image, path: Path) -> None:
    im.save(path, "WEBP", quality=92, method=6)


# --- Expo / JS assets ---
icon = resize(src, 1024)
save_png(icon, assets / "icon.png")
save_png(icon, assets / "android-icon-foreground.png")
save_png(Image.new("RGBA", (1024, 1024), BRAND_BG), assets / "android-icon-background.png")

mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
px, out_px = icon.load(), mono.load()
for y in range(1024):
    for x in range(1024):
        r, g, b, a = px[x, y]
        if a < 16:
            continue
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        sat = max(r, g, b) - min(r, g, b)
        if lum < 70 or (sat > 60 and lum > 120):
            out_px[x, y] = (0, 0, 0, 255)
save_png(mono, assets / "android-icon-monochrome.png")

splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
logo = resize(src, 780)
splash.paste(logo, ((1024 - 780) // 2, (1024 - 780) // 2), logo)
save_png(splash, assets / "splash-icon.png")
save_png(resize(src, 48), assets / "favicon.png")

play_dir = Path(r"d:\jobportal project\applyai\store-assets")
play_dir.mkdir(exist_ok=True)
save_png(resize(src, 512), play_dir / "play-icon-512.png")

# --- Native Android mipmaps ---
# Legacy launcher icon sizes (48dp)
legacy = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
# Adaptive layer sizes (108dp)
adaptive = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}

for folder, size in legacy.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    layered = resize(src, size)
    save_webp(layered, d / "ic_launcher.webp")
    save_webp(layered, d / "ic_launcher_round.webp")

for folder, size in adaptive.items():
    d = res / folder
    d.mkdir(parents=True, exist_ok=True)
    save_webp(resize(src, size), d / "ic_launcher_foreground.webp")
    save_webp(Image.new("RGBA", (size, size), BRAND_BG), d / "ic_launcher_background.webp")
    # monochrome scaled
    m = mono.resize((size, size), Image.Resampling.LANCZOS)
    save_webp(m, d / "ic_launcher_monochrome.webp")

print("Logo installed for Expo assets + Android mipmaps")
print("Brand bg #5559F8")
