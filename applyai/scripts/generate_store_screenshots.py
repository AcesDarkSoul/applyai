"""Generate Play Console tablet / Chromebook / XR screenshots from phone captures."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS = Path(r"C:\Users\sagar\.cursor\projects\d-jobportal-project\assets")
OUT = Path(r"d:\jobportal project\applyai\store-assets")
LOGO = OUT / "play-icon-512.png"

# Target sizes (exact 9:16 or 16:9, within Play limits)
SIZES = {
    "tablet-7": (1080, 1920),      # 9:16, sides >= 320
    "tablet-10": (1600, 2560),     # 9:16, sides >= 1080
    "chromebook": (1920, 1080),    # 16:9 landscape, sides >= 1080
    "xr": (1920, 1080),            # 16:9 landscape, sides >= 720
}

LABELS = [
    "Dashboard",       # 144641
    "Find Jobs",       # 144712
    "Applications",    # 144802
    "Hiring Posts",    # 144834
    "Analytics",       # 144858
    "Notifications",   # 144937
]


def load_screenshots() -> list[Image.Image]:
    files = sorted(ASSETS.glob("*Screenshot_2026*"))
    if not files:
        raise SystemExit("No screenshots found in assets folder")
    images = []
    for f in files:
        im = Image.open(f).convert("RGBA")
        images.append(im)
        print(f"  source {im.size}: {f.name[:70]}...")
    return images


def gradient_bg(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, (10, 12, 28))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(12 + 40 * t)
        g = int(14 + 20 * t)
        b = int(30 + 90 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-w // 4, -h // 5, w // 2, h // 2], fill=(99, 102, 241, 50))
    gd.ellipse([w // 2, h // 3, w + w // 4, h + h // 4], fill=(56, 189, 248, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    return Image.alpha_composite(img.convert("RGBA"), glow)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


def fit_contain(im: Image.Image, box: tuple[int, int]) -> Image.Image:
    bw, bh = box
    iw, ih = im.size
    scale = min(bw / iw, bh / ih)
    nw, nh = max(1, int(iw * scale)), max(1, int(ih * scale))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def get_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    paths = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in paths:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def compose_portrait(shot: Image.Image, size: tuple[int, int], label: str) -> Image.Image:
    """9:16 tablet: phone screenshot framed on branded background."""
    canvas = gradient_bg(size)
    w, h = size

    # Header with logo + label
    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA").resize((96, 96), Image.Resampling.LANCZOS)
        canvas.alpha_composite(logo, (48, 48))

    draw = ImageDraw.Draw(canvas)
    draw.text((168, 62), "ApplyAI", fill=(255, 255, 255), font=get_font(42, True))
    draw.text((168, 112), label, fill=(165, 180, 252), font=get_font(24, False))

    # Device frame area
    max_w, max_h = int(w * 0.82), int(h * 0.78)
    framed = fit_contain(shot, (max_w, max_h))
    fw, fh = framed.size
    radius = max(28, fw // 28)

    # Shadow
    shadow = Image.new("RGBA", (fw + 40, fh + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([10, 16, fw + 30, fh + 36], radius=radius, fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))

    # Round the screenshot
    mask = rounded_mask((fw, fh), radius)
    phone = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    phone.paste(framed, (0, 0))
    phone.putalpha(mask)

    # Border
    border = Image.new("RGBA", (fw + 8, fh + 8), (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle([0, 0, fw + 7, fh + 7], radius=radius + 4, fill=(30, 34, 70, 255))
    border_mask = rounded_mask((fw + 8, fh + 8), radius + 4)
    border.putalpha(border_mask)

    x = (w - fw) // 2
    y = (h - fh) // 2 + 40
    canvas.alpha_composite(shadow, (x - 20, y - 10))
    canvas.alpha_composite(border, (x - 4, y - 4))
    canvas.alpha_composite(phone, (x, y))
    return canvas.convert("RGB")


def compose_landscape(shot: Image.Image, size: tuple[int, int], label: str) -> Image.Image:
    """16:9 Chromebook/XR: phone on left/center with text."""
    canvas = gradient_bg(size)
    w, h = size

    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA").resize((72, 72), Image.Resampling.LANCZOS)
        canvas.alpha_composite(logo, (48, 40))

    draw = ImageDraw.Draw(canvas)
    draw.text((140, 48), "ApplyAI", fill=(255, 255, 255), font=get_font(36, True))
    draw.text((140, 92), label, fill=(165, 180, 252), font=get_font(22, False))

    max_w, max_h = int(w * 0.42), int(h * 0.82)
    framed = fit_contain(shot, (max_w, max_h))
    fw, fh = framed.size
    radius = max(24, fw // 28)

    shadow = Image.new("RGBA", (fw + 40, fh + 40), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([10, 16, fw + 30, fh + 36], radius=radius, fill=(0, 0, 0, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))

    mask = rounded_mask((fw, fh), radius)
    phone = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    phone.paste(framed, (0, 0))
    phone.putalpha(mask)

    border = Image.new("RGBA", (fw + 8, fh + 8), (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle([0, 0, fw + 7, fh + 7], radius=radius + 4, fill=(30, 34, 70, 255))

    x = int(w * 0.08)
    y = (h - fh) // 2 + 20
    canvas.alpha_composite(shadow, (x - 16, y - 8))
    canvas.alpha_composite(border, (x - 4, y - 4))
    canvas.alpha_composite(phone, (x, y))

    # Right copy panel
    bullets = {
        "Dashboard": ["Top job matches", "Application overview", "AI match scores"],
        "Find Jobs": ["Live resume matching", "Auto apply", "Multi-board search"],
        "Hiring Posts": ["LinkedIn & Google Jobs", "Full post text", "Contact details"],
        "Applications": ["Track every role", "AI cover letters", "Status auto-sync"],
        "Analytics": ["Pipeline insights", "Interview tracking", "Conversion view"],
        "Notifications": ["High-match alerts", "Interview updates", "Weekly summaries"],
    }.get(label, ["AI job search", "Smart matching", "Application tracking"])

    tx = int(w * 0.55)
    ty = int(h * 0.28)
    draw = ImageDraw.Draw(canvas)
    draw.text((tx, ty), label, fill=(255, 255, 255), font=get_font(44, True))
    draw.rounded_rectangle([tx, ty + 60, tx + 100, ty + 68], radius=4, fill=(129, 140, 248))
    yy = ty + 100
    for b in bullets:
        draw.ellipse([tx, yy + 8, tx + 12, yy + 20], fill=(52, 211, 153))
        draw.text((tx + 28, yy), b, fill=(226, 232, 240), font=get_font(26, False))
        yy += 48

    return canvas.convert("RGB")


def also_scaled_raw(shot: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Simple cover-scale fill for stores that accept raw screenshots."""
    target = Image.new("RGB", size, (10, 12, 28))
    fitted = fit_contain(shot.convert("RGBA"), size)
    x = (size[0] - fitted.size[0]) // 2
    y = (size[1] - fitted.size[1]) // 2
    target.paste(fitted.convert("RGB"), (x, y), fitted.split()[-1])
    return target


def main() -> None:
    print("Loading screenshots...")
    shots = load_screenshots()
    OUT.mkdir(parents=True, exist_ok=True)

    folders = {
        "tablet-7": OUT / "tablet-7inch",
        "tablet-10": OUT / "tablet-10inch",
        "chromebook": OUT / "chromebook",
        "xr": OUT / "android-xr",
    }
    for p in folders.values():
        p.mkdir(parents=True, exist_ok=True)

    count = min(8, len(shots))
    for i in range(count):
        shot = shots[i]
        label = LABELS[i] if i < len(LABELS) else f"Screen {i + 1}"
        idx = f"{i + 1:02d}"

        # 7-inch portrait framed
        img7 = compose_portrait(shot, SIZES["tablet-7"], label)
        path7 = folders["tablet-7"] / f"tablet7-{idx}-{label.lower().replace(' ', '-')}.png"
        img7.save(path7, "PNG", optimize=True)
        print("wrote", path7.name, img7.size)

        # 10-inch portrait framed
        img10 = compose_portrait(shot, SIZES["tablet-10"], label)
        path10 = folders["tablet-10"] / f"tablet10-{idx}-{label.lower().replace(' ', '-')}.png"
        img10.save(path10, "PNG", optimize=True)
        print("wrote", path10.name, img10.size)

        # Chromebook landscape (need at least 4)
        img_cb = compose_landscape(shot, SIZES["chromebook"], label)
        path_cb = folders["chromebook"] / f"chromebook-{idx}-{label.lower().replace(' ', '-')}.png"
        img_cb.save(path_cb, "PNG", optimize=True)
        print("wrote", path_cb.name, img_cb.size)

        # XR landscape
        img_xr = compose_landscape(shot, SIZES["xr"], label)
        path_xr = folders["xr"] / f"xr-{idx}-{label.lower().replace(' ', '-')}.png"
        img_xr.save(path_xr, "PNG", optimize=True)
        print("wrote", path_xr.name, img_xr.size)

    print("\nDone. Upload folders under store-assets/")
    for name, path in folders.items():
        n = len(list(path.glob("*.png")))
        print(f"  {name}: {n} files -> {path}")


if __name__ == "__main__":
    main()
