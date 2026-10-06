import sys, json, os
sys.path.insert(0, "/Users/marianonoceti/Desktop/Antigravity/PSLSC Website/portstlucie/tools")
import kie
REPO="/Users/marianonoceti/Desktop/Antigravity/PSLSC Website/portstlucie"
refs={"home":"home.png","base":"base-nostadium.png",
      "luca_front_alt":f"{REPO}/docs/luca/ref-turnaround-front-alt.png","luca_front":f"{REPO}/docs/luca/ref-turnaround-front.png",
      "luca_expr":f"{REPO}/docs/luca/ref-expressions.png","luca_details":f"{REPO}/docs/luca/ref-details.png","crest":f"{REPO}/assets/brand/crest-aqua.webp"}
urls=json.load(open("urls.json")) if os.path.exists("urls.json") else {}
for k,p in refs.items():
    if k not in urls: urls[k]=kie.upload(p, "pslsc/takeover-v3"); print("up",k)
json.dump(urls,open("urls.json","w"),indent=1)
PROMPT_A = """Edit reference image 1 (the base layout: black textured wall, pale aquamarine club crest at the top, the headline "SEASON TICKETS ARE HERE.", the subline "BE THERE FROM THE BEGINNING.", plain dark wall below) by ADDING exactly one character and changing nothing else. The background, crest, headline and subline must stay pixel-identical in position, size, color and spelling.

ADD Luca, the club mascot, exactly as designed in reference images 2, 3 and 4 (same character, same proportions, same kit, same colors, same 3D animated-film rendering style): a stylized 3D-animated young monkey, about 3 heads tall, warm medium-brown fluffy fur with a rounded plush cap of hair above the headband, large round peach skin ears, heart-shaped peach skin face, thick dark eyebrows, a wide pale aquamarine (#AAF6E6, light mint-cyan) terry sweatband tied in a small bow at the back of his head, a black rounded-square leather eye patch on his LEFT eye (the viewer's right) with a thin strap under the headband, his RIGHT eye uncovered with a large pale aquamarine iris, thick gold hoop earrings in both ears, black short-sleeve adidas football jersey with white V-neck trim, three white shoulder stripes, a white adidas logo on his right chest, the club's real crest on his left chest (reference image 5: shield with dark outline, pale aquamarine fill, gothic lettering "Port St Lucie" and an anchor) and the big white sponsor wordmark "VIXON" across the chest, black shorts with three white side stripes and the same small crest on his right leg, plain black knee socks with two thin white rings at the top and no other markings, pale aquamarine boots with three WHITE stripes and gold studs, long fluffy brown tail curling upward. Every accent on him is the same single pale aquamarine as the crest, never a saturated turquoise or sky blue.

PLACEMENT: Luca stands on the RIGHT side of the frame, in front of the dark wall, filling roughly the right 42% of the width; his head top at about 27% of the frame height and his boots at about 72% of the height. His right shoulder may be slightly cropped by the right edge. He must NOT cover any letter of the headline or subline: keep him to the right of the text block, with the words "SEASON", "TICKETS", "ARE HERE." fully readable.

POSE & EXPRESSION ("Confident", like the reference expression sheet): body facing the viewer, turned slightly toward the headline; looking straight at the viewer with a confident closed-mouth smirk and his right eyebrow raised; his right arm extended toward the headline on his right (the viewer's left) with an open, upward-facing palm, presenting the words like a host; his left hand resting on his hip. Weight on one leg, relaxed stance.

LIGHTING: the same soft studio key light from the upper front as the reference, a subtle rim light separating his fur from the black wall, and a soft contact shadow under his boots. No strong colored light, no glow.

No extra text, no watermark, no other characters, no props, no stadium, no scenery: only the dark wall. Same clean stylized 3D look as the reference images."""
tid=kie.create_task("gpt-image-2-5-sunburst-image-to-image",{"prompt":PROMPT_A,"input_urls":[urls["base"],urls["luca_front_alt"],urls["luca_expr"],urls["luca_details"],urls["crest"]],"aspect_ratio":"9:16","resolution":"2K","background":"opaque"})
print("task A2:",tid); res=kie.wait(tid,every=8,timeout=540,label="A2"); print(res)
urls["frame_a2_raw"]=res[0]; json.dump(urls,open("urls.json","w"),indent=1)
kie.download(res[0],"frame-A2-raw.png")
from PIL import Image
im=Image.open("frame-A2-raw.png").convert("RGB"); print("size",im.size); im.resize((1080,1920),Image.LANCZOS).save("frame-A2-luca.png"); print("saved frame-A2-luca.png")
open("prompt-A2.txt","w").write(PROMPT_A)
