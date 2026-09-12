import json, kie
urls = json.load(open("urls.json"))
urls["frame_b_raw"] = "https://tempfile.aiquickdraw.com/p/3a79c24b7e7aae97bc5d46afcfb51bc6_1_1789166459_4614.png"
json.dump(urls, open("urls.json","w"), indent=1)

PROMPT_A = """Edit reference image 1 (the base layout: black textured wall, aquamarine crest at the top, the headline "SEASON TICKETS ARE HERE.", the subline "BE THERE FROM THE BEGINNING.", and the night stadium at the bottom) by ADDING exactly one character and changing nothing else. The background, crest, headline, subline and stadium must stay pixel-identical in position, size, color and spelling.

ADD Luca, the club mascot, exactly as designed in reference images 2 and 3 (same character, same proportions, same kit, same colors, same 3D animated-film rendering style): a stylized 3D-animated young monkey, about 3 heads tall, warm medium-brown fluffy fur with a messy tuft above the headband, large round peach skin ears, heart-shaped peach/tan skin face, thick dark eyebrows, a wide pale aquamarine (#AAF6E6) terry sweatband, a black rounded-square leather eye patch on his LEFT eye (the viewer's right) with a thin strap under the headband, his RIGHT eye uncovered with a large pale aquamarine iris, small gold hoop earrings in both ears, black short-sleeve adidas football jersey with white V-neck trim, three white shoulder stripes, the aquamarine club crest on his left chest and the white sponsor wordmark "VIXON" across the chest, black shorts with white side stripes, black knee socks, pale aquamarine boots with black stripes, long fluffy brown tail curling upward.

PLACEMENT: Luca stands on the RIGHT side of the frame, in front of the dark wall, filling roughly the right 42% of the width; his head top at about 27% of the frame height and his boots at about 72% of the height, so his legs end just above the stadium. His right shoulder may be slightly cropped by the right edge. He must NOT cover any letter of the headline or subline: keep him to the right of the text block, with the words "SEASON", "TICKETS", "ARE HERE." fully readable.

POSE & EXPRESSION ("Confident", like the reference expression sheet): body facing the viewer, turned slightly toward the headline; looking straight at the viewer with a confident closed-mouth smirk and his right eyebrow raised; his right arm extended toward the headline on his right (the viewer's left) with an open, upward-facing palm, presenting the words like a host; his left hand resting on his hip. Weight on one leg, relaxed stance.

LIGHTING: the same soft studio key light from the upper front as the reference, a subtle rim light separating his fur from the black wall, and a soft contact shadow under his boots. No strong colored light, no glow.

No extra text, no watermark, no other characters, no props. Same clean stylized 3D look as the reference images; every accent color on him is the single pale aquamarine, never a saturated turquoise."""

tid = kie.create_task("gpt-image-2-5-sunburst-image-to-image",
    {"prompt": PROMPT_A, "input_urls": [urls["frame_b_raw"], urls["luca_front_alt"], urls["luca_expr"]],
     "aspect_ratio": "9:16", "resolution": "2K", "background": "opaque"})
print("task A:", tid)
res = kie.wait(tid, every=8, timeout=540, label="A")
print("result:", res)
urls["frame_a_raw"] = res[0]; json.dump(urls, open("urls.json","w"), indent=1)
kie.download(res[0], "frame-A-luca-raw.png")
from PIL import Image
im=Image.open("frame-A-luca-raw.png"); print("size", im.size)
im.convert("RGB").resize((1080,1920), Image.LANCZOS).save("frame-A-luca.png"); print("saved frame-A-luca.png")
