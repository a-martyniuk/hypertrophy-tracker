from PIL import Image
import numpy as np

# Load transparent silhouette image
img = Image.open(r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png").convert("RGBA")
data = np.array(img)
alpha = data[:, :, 3]

w, h = img.size
print(f"Image canvas size: {w}x{h}")

# Define key Y levels to measure body contour
# Let's inspect rows from top to bottom
def get_contour_at_y(y, min_alpha=20):
    row = alpha[y, :]
    indices = np.where(row > min_alpha)[0]
    if len(indices) == 0:
        return None
    # Check if there are separate segments (e.g. two arms and torso, or two legs)
    diffs = np.diff(indices)
    gaps = np.where(diffs > 8)[0]
    if len(gaps) == 0:
        return [(indices[0], indices[-1])]
    else:
        segments = []
        start = indices[0]
        for g in gaps:
            end = indices[g]
            segments.append((start, end))
            start = indices[g + 1]
        segments.append((start, indices[-1]))
        return segments

# Target anatomical features:
anatomical_y = {
    'neck': 82,
    'pecho': 148,
    'arm': 180,
    'forearm': 230,
    'waist': 248,
    'wrist': 282,
    'hips': 282,
    'thigh': 340,
    'calf': 420,
    'ankle': 488
}

for name, y in anatomical_y.items():
    segs = get_contour_at_y(y)
    print(f"Feature: {name:10} (Y={y:3}): {segs}")
