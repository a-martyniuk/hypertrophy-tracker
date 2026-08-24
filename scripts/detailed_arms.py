from PIL import Image
import numpy as np

img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

# For each Y row, find all contiguous segments where alpha > 30
print("Detailed Anatomical Arm Analysis:")
for y in range(160, 310, 5):
    row = alpha[y, :]
    indices = np.where(row > 30)[0]
    if len(indices) == 0:
        continue
    
    diffs = np.diff(indices)
    gap_points = np.where(diffs > 4)[0]
    
    segments = []
    start = indices[0]
    for gp in gap_points:
        end = indices[gp]
        segments.append((start, end))
        start = indices[gp + 1]
    segments.append((start, indices[-1]))
    
    # Identify left arm (first segment) and right arm (last segment)
    left_arm = segments[0] if segments[0][1] < 110 else None
    right_arm = segments[-1] if segments[-1][0] > 150 else None
    
    la_str = f"x1={left_arm[0]:2}, x2={left_arm[1]:2}, w={left_arm[1]-left_arm[0]:2}, mid={(left_arm[0]+left_arm[1])//2:2}" if left_arm else "N/A (joined)"
    ra_str = f"x1={right_arm[0]:3}, x2={right_arm[1]:3}, w={right_arm[1]-right_arm[0]:2}, mid={(right_arm[0]+right_arm[1])//2:3}" if right_arm else "N/A (joined)"
    
    print(f"Y={y:3} | L_Arm: {la_str:25} | R_Arm: {ra_str}")
