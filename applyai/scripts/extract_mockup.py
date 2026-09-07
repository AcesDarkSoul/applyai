from PIL import Image
import os

light_path = r"C:\Users\sagar\.cursor\projects\d-jobportal-project\assets\c__Users_sagar_AppData_Roaming_Cursor_User_workspaceStorage_cb308927d1a53265a4b099bd3aaeee48_images_image-b6a2252c-004b-4647-a961-f61615984384.png"
dark_path = r"C:\Users\sagar\.cursor\projects\d-jobportal-project\assets\c__Users_sagar_AppData_Roaming_Cursor_User_workspaceStorage_cb308927d1a53265a4b099bd3aaeee48_images_image-c4949783-9606-4140-8a08-f7f0f26be27b.png"

light = Image.open(light_path).convert("RGB")
dark = Image.open(dark_path).convert("RGB")


def hx(im, x, y):
    r, g, b = im.getpixel((x, y))
    return f"#{r:02x}{g:02x}{b:02x}"


print("LIGHT", light.size)
print("DARK", dark.size)

samples = {
    "bg_left": (8, 8),
    "sidebar": (40, 200),
    "sidebar_top": (50, 40),
    "active_nav": (50, 90),
    "main_bg": (280, 40),
    "search": (280, 55),
    "hero": (300, 160),
    "hero_right": (500, 180),
    "stat": (250, 280),
    "card": (280, 400),
}

print("\nLIGHT samples:")
for n, (x, y) in samples.items():
    print(n, x, y, hx(light, x, y))

print("\nDARK samples:")
for n, (x, y) in samples.items():
    print(n, x, y, hx(dark, x, y))

print("\nLIGHT extra")
for xy in [
    (30, 30),
    (45, 70),
    (55, 110),
    (90, 40),
    (220, 40),
    (250, 70),
    (270, 130),
    (400, 150),
    (520, 150),
    (240, 250),
    (300, 250),
    (360, 250),
    (430, 250),
    (280, 340),
    (450, 340),
    (260, 520),
    (450, 560),
    (70, 80),
    (80, 140),
    (80, 180),
    (80, 620),
    (90, 640),
]:
    print(xy, hx(light, *xy))

print("\nDARK extra")
for xy in [
    (30, 30),
    (45, 70),
    (55, 110),
    (90, 40),
    (220, 40),
    (250, 70),
    (270, 130),
    (400, 150),
    (520, 150),
    (240, 250),
    (300, 250),
    (360, 250),
    (430, 250),
    (280, 340),
    (450, 340),
    (260, 520),
    (450, 560),
    (70, 80),
    (80, 140),
    (80, 180),
    (80, 620),
    (90, 640),
]:
    print(xy, hx(dark, *xy))

out = r"d:\jobportal project\applyai\assets\images"
os.makedirs(out, exist_ok=True)

light.crop((0, 0, 620, 682)).save(os.path.join(out, "_ref_desktop_light.png"))
dark.crop((0, 0, 620, 682)).save(os.path.join(out, "_ref_desktop_dark.png"))

for name, box in {
    "hero_wide": (360, 90, 600, 250),
    "hero_char": (420, 100, 590, 250),
    "hero_char2": (400, 80, 610, 260),
    "sidebar": (10, 10, 180, 670),
    "full": (18, 18, 610, 664),
}.items():
    light.crop(box).save(os.path.join(out, f"_ref_{name}.png"))

print("saved refs")
