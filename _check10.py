from bonus.deepfake import scan_url_for_deepfakes, extract_images_from_url
print('PASS: Deepfake module imports correctly')
images = extract_images_from_url('https://en.wikipedia.org/wiki/Eiffel_Tower')
print(f'PASS: Found {len(images)} images from test URL')
