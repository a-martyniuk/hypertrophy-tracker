from PIL import Image
import numpy as np

# Load generated clean_red_silhouette.png
img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
w, h = img.size
print(f"Canvas size: {w}x{h}")

# Let's inspect anatomical features along Y-axis from y=15 to y=530:
# Head top: y=15, Chin: y=80 -> Neck: y=88 (center x=130)
# Shoulders: y=130 (left x=58, right x=202) -> Back/Deltoids: left x=60, y=130
# Pectorals: y=155 (left pec center x=105, right pec center x=155) -> junction-pecho: x=155, y=155
# Biceps: y=180 (left bicep x=45, right bicep x=215)
# Forearms: y=235 (left forearm x=32, right forearm x=228)
# Wrists: y=290 (left wrist x=20, right wrist x=240)
# Waist / Core: y=225 (left waist x=95, right waist x=165)
# Hips: y=270 (left hip x=90, right hip x=170)
# Thighs / Quads: y=340 (left quad x=95, right quad x=165)
# Calves / Gemelos: y=435 (left calf x=95, right calf x=165)
# Ankles: y=500 (left ankle x=108, right ankle x=152)

print("Calculated precision anchors on 260x550 canvas:")
anchors_male = {
    'neck': {'x': 130, 'y': 88},
    'back': {'x': 60, 'y': 130},
    'pecho': {'x': 155, 'y': 155},
    'armL': {'x': 45, 'y': 180},
    'armR': {'x': 215, 'y': 180},
    'forearmL': {'x': 32, 'y': 235},
    'forearmR': {'x': 228, 'y': 235},
    'wristL': {'x': 20, 'y': 290},
    'wristR': {'x': 240, 'y': 290},
    'waist': {'x': 95, 'y': 225},
    'hips': {'x': 165, 'y': 270},
    'thighL': {'x': 95, 'y': 340},
    'thighR': {'x': 165, 'y': 340},
    'calfL': {'x': 95, 'y': 435},
    'calfR': {'x': 165, 'y': 435},
    'ankleL': {'x': 108, 'y': 500},
    'ankleR': {'x': 152, 'y': 500},
}
for k, v in anchors_male.items():
    print(f"  {k}: {{ x: {v['x']}, y: {v['y']} }},")
