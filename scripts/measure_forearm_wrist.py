from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

print("Arm slices around Forearm (Y=205 to 220):")
for y in range(200, 225, 2):
    row = alpha[y, :]
    # Left arm: x < 70
    left_pts = np.where((row > 30) & (np.arange(len(row)) < 70))[0]
    # Right arm: x > 190
    right_pts = np.where((row > 30) & (np.arange(len(row)) > 190))[0]
    
    lp_str = f"x1={left_pts[0]:2}, x2={left_pts[-1]:2}, w={left_pts[-1]-left_pts[0]:2}, mid={(left_pts[0]+left_pts[-1])//2:2}" if len(left_pts)>0 else "None"
    rp_str = f"x1={right_pts[0]:3}, x2={right_pts[-1]:3}, w={right_pts[-1]-right_pts[0]:2}, mid={(right_pts[0]+right_pts[-1])//2:3}" if len(right_pts)>0 else "None"
    print(f"Y={y:3} | L: {lp_str:25} | R: {rp_str}")

print("\nArm slices around Wrist (Y=248 to 260):")
for y in range(248, 262, 2):
    row = alpha[y, :]
    left_pts = np.where((row > 30) & (np.arange(len(row)) < 55))[0]
    right_pts = np.where((row > 30) & (np.arange(len(row)) > 205))[0]
    
    lp_str = f"x1={left_pts[0]:2}, x2={left_pts[-1]:2}, w={left_pts[-1]-left_pts[0]:2}, mid={(left_pts[0]+left_pts[-1])//2:2}" if len(left_pts)>0 else "None"
    rp_str = f"x1={right_pts[0]:3}, x2={right_pts[-1]:3}, w={right_pts[-1]-right_pts[0]:2}, mid={(right_pts[0]+right_pts[-1])//2:3}" if len(right_pts)>0 else "None"
    print(f"Y={y:3} | L: {lp_str:25} | R: {rp_str}")
