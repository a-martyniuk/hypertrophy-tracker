from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

print("Thigh contour scan from Y=290 to Y=335:")
for y in range(295, 335, 3):
    row = alpha[y, :]
    # Left thigh is around x: 70 to 125
    # Right thigh is around x: 135 to 190
    l_pts = np.where((row > 30) & (np.arange(len(row)) >= 65) & (np.arange(len(row)) <= 125))[0]
    r_pts = np.where((row > 30) & (np.arange(len(row)) >= 135) & (np.arange(len(row)) <= 195))[0]
    
    lp_str = f"x1={l_pts[0]:2}, x2={l_pts[-1]:2}, w={l_pts[-1]-l_pts[0]:2}, mid={(l_pts[0]+l_pts[-1])//2:2}" if len(l_pts)>0 else "None"
    rp_str = f"x1={r_pts[0]:3}, x2={r_pts[-1]:3}, w={r_pts[-1]-r_pts[0]:2}, mid={(r_pts[0]+r_pts[-1])//2:3}" if len(r_pts)>0 else "None"
    print(f"Y={y:3} | L_Thigh: {lp_str:25} | R_Thigh: {rp_str}")
