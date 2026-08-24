from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

# Let's inspect the bicep at Y = 170, 172, 174, 175, 176, 178, 180
print("Bicep contour analysis:")
for y in [170, 172, 174, 175, 176, 178, 180]:
    row = alpha[y, :]
    # Left arm is around x: 45 to 80
    # Torso starts around x: 86
    l_arm_pts = np.where((row > 30) & (np.arange(len(row)) >= 45) & (np.arange(len(row)) <= 85))[0]
    # Right arm is around x: 175 to 215
    r_arm_pts = np.where((row > 30) & (np.arange(len(row)) >= 175) & (np.arange(len(row)) <= 215))[0]
    
    lp_str = f"x1={l_arm_pts[0]:2}, x2={l_arm_pts[-1]:2}, w={l_arm_pts[-1]-l_arm_pts[0]:2}, mid={(l_arm_pts[0]+l_arm_pts[-1])//2:2}" if len(l_arm_pts)>0 else "None"
    rp_str = f"x1={r_arm_pts[0]:3}, x2={r_arm_pts[-1]:3}, w={r_arm_pts[-1]-r_arm_pts[0]:2}, mid={(r_arm_pts[0]+r_arm_pts[-1])//2:3}" if len(r_arm_pts)>0 else "None"
    print(f"Y={y:3} | Left Bicep: {lp_str:25} | Right Bicep: {rp_str}")
