from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

# Test all bands on the image and print the exact center & edges
bands = [
    {"name": "neck", "y": 82, "x1": 110, "x2": 150},
    {"name": "pecho", "y": 148, "x1": 76, "x2": 184},
    {"name": "armL", "y": 178, "x1": 42, "x2": 84},
    {"name": "armR", "y": 178, "x1": 176, "x2": 218},
    {"name": "waist", "y": 240, "x1": 98, "x2": 162},
    {"name": "forearmL", "y": 228, "x1": 26, "x2": 58},
    {"name": "forearmR", "y": 228, "x1": 202, "x2": 234},
    {"name": "hips", "y": 280, "x1": 84, "x2": 176},
    {"name": "wristL", "y": 280, "x1": 14, "x2": 38},
    {"name": "wristR", "y": 280, "x1": 222, "x2": 246},
    {"name": "thighL", "y": 335, "x1": 74, "x2": 122},
    {"name": "thighR", "y": 335, "x1": 138, "x2": 186},
    {"name": "calfL", "y": 415, "x1": 72, "x2": 120},
    {"name": "calfR", "y": 415, "x1": 140, "x2": 188},
    {"name": "ankleL", "y": 485, "x1": 84, "x2": 116},
    {"name": "ankleR", "y": 485, "x1": 144, "x2": 176},
]

print("Precision calibrated bands:")
for b in bands:
    print(f"  {b['name']:10}: Y={b['y']:3}, X1={b['x1']:3}, X2={b['x2']:3}, width={b['x2']-b['x1']:3}, center_x={(b['x1']+b['x2'])//2:3}")
