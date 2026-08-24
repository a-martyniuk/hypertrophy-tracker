from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

for y in range(118, 134, 2):
    row = alpha[y, :]
    pts = np.where(row > 30)[0]
    if len(pts) > 0:
        print(f"Y={y:3} | x1={pts[0]:3}, x2={pts[-1]:3}, width={pts[-1]-pts[0]:3}, center={(pts[0]+pts[-1])//2:3}")
