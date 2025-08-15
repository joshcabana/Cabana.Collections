#!/bin/bash
# Install cwebp first: brew install webp (Mac) or apt-get install webp (Linux)

# Hero images
cwebp -q 85 assets/Images/HERO-BANNER.png -o assets/Images/HERO-BANNER.webp
cwebp -q 85 assets/Images/HERO-BANNER-mobile.png -o assets/Images/HERO-BANNER-mobile.webp

# Product images  
cwebp -q 90 assets/Images/CABANA-BOXERS-FRONT.png -o assets/Images/CABANA-BOXERS-FRONT.webp
cwebp -q 90 assets/Images/CABANA-BOXERS-SIDE.png -o assets/Images/CABANA-BOXERS-SIDE.webp
cwebp -q 90 assets/Images/CABANA-BOXERS-BACK.png -o assets/Images/CABANA-BOXERS-BACK.webp
cwebp -q 90 assets/Images/CABANA-WOMEN.PNG -o assets/Images/CABANA-WOMEN.webp

# Create poster frame for towel video (needs ffmpeg)
ffmpeg -i assets/Images/TowelTease.mp4 -ss 00:00:01 -frames:v 1 assets/Images/towel-poster.jpg
cwebp -q 85 assets/Images/towel-poster.jpg -o assets/Images/towel-poster.webp

echo "Image conversion complete!"


