from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

# Inspect waist contour at Y = 238, 240, 242
for y in [238, 240, 242]:
    row = alpha[y, :]
    # Torso is between x: 75 and 185
    torso_pts = np.where((row > 25) & (np.arange(len(row)) >= 75) & (np.arange(len(row)) <= 185))[0]
    print(f"Y={y} | x1={torso_pts[0]}, x2={torso_pts[-1]}, width={torso_pts[-1]-torso_pts[0]}, center={(torso_pts[0]+torso_pts[-1])//2}")
