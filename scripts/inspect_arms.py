from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]
r = data[:, :, 0]
g = data[:, :, 1]
b = data[:, :, 2]

# Let's inspect arm slices from Y=180 to Y=300:
# Left arm is on the left side of canvas (X from 0 to 100)
# Right arm is on the right side of canvas (X from 160 to 260)

print("Scanning left and right arms along Y:")
for y in range(180, 310, 5):
    # Left arm
    row_left = np.where(alpha[y, :100] > 25)[0]
    left_span = f"x1={row_left[0]:2}, x2={row_left[-1]:2}, w={row_left[-1]-row_left[0]:2}, mid={(row_left[0]+row_left[-1])//2:2}" if len(row_left) > 0 else "None"
    
    # Right arm
    row_right = np.where(alpha[y, 160:] > 25)[0]
    right_span = f"x1={row_right[0]+160:3}, x2={row_right[-1]+160:3}, w={row_right[-1]-row_right[0]:2}, mid={(row_right[0]+row_right[-1]+320)//2:3}" if len(row_right) > 0 else "None"
    
    print(f"Y={y:3} | Left Arm: {left_span:25} | Right Arm: {right_span}")
