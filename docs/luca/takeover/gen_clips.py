import sys, json, os, time
sys.path.insert(0, "/Users/marianonoceti/Desktop/Antigravity/PSLSC Website/portstlucie/tools")
import kie
urls=json.load(open("urls.json"))
if "frame_a2" not in urls: urls["frame_a2"]=kie.upload("frame-A2-luca.png","pslsc/takeover-v3"); json.dump(urls,open("urls.json","w"),indent=1)
LUCA=('Luca, a stylized 3D-animated young monkey mascot: warm brown fluffy fur, wide pale aquamarine (mint) terry sweatband tied in a small bow at the back, '
      'black leather eye patch on his LEFT eye (the viewer\'s right), right eye uncovered with a pale aquamarine iris, thick gold hoop earrings in both ears, '
      'black adidas football jersey with the club crest on the chest, the white sponsor wordmark "VIXON" across the chest and "LUCA 10" on the back, '
      'black shorts with white side stripes, plain black socks with two white rings, pale aquamarine boots with white stripes and gold studs, long fluffy tail curling upward. '
      'Every accent on him is the same pale aquamarine, never saturated turquoise')
P1=f"""SCENE / FRAMING: a vertical 9:16 mobile phone screen, full frame. The FIRST frame is a football club's website home page: dark, a crest at the top left, a mint "BECOME A FOUNDER" button, the headline "You're watching a club be born." over a construction-site photo, two buttons below. The LAST frame is a matte black textured wall with a pale aquamarine crest at the top, the headline "SEASON TICKETS ARE HERE.", the subline "BE THERE FROM THE BEGINNING.", plain dark wall below, and the club mascot Luca standing on the right side presenting the headline with an open palm.

CAMERA & LENS: completely static, locked-off, no pan, no zoom, no camera movement, no parallax, no shake. Full uncropped frame.

SUBJECT: {LUCA}. He looks exactly like he does in the last frame at every moment; his design, colors and kit never change.

ACTION & MOVEMENT, in this exact order:
1. (0 to 1 s) The home page stays perfectly still, exactly as in the first frame. Nothing moves.
2. (1 to 2.5 s) Luca's peach-skinned hands grab the RIGHT edge of the screen from outside the frame, then his head peeks in from the right edge, curious and playful, looking straight at the viewer.
3. (2.5 to 6 s) Luca steps in and pushes the home page with both hands. The entire home page behaves like ONE flat, rigid panel: it slides HORIZONTALLY to the LEFT on a straight line and exits completely through the LEFT edge. It does not fade, bend, warp, shrink or dissolve. Behind it, the black wall with the crest and the headline "SEASON TICKETS ARE HERE." is revealed already in place, completely static.
4. (6 to 8 s) Luca turns to the viewer, stops on the right side of the frame and settles into the exact pose of the last frame: confident smirk, right arm extended toward the headline with an open palm, left hand on his hip. He keeps facing the camera the whole time and never turns his back fully to the viewer; if his back is briefly visible, the jersey reads "LUCA 10".

ENVIRONMENT & LIGHTING: soft studio key light from the upper front, a subtle rim light on his fur; the revealed wall is matte near-black with a faint texture, nothing else behind it.

COLOR GRADE: near-black, warm white, and pale aquamarine (mint) as the only accent color. No saturated turquoise, no sky blue.

MOTION QUALITY: smooth, weighty, animated-film character motion; the panel slides with a clean ease-in and ease-out; no morphing of limbs, no flicker; the text on the wall never jitters, blurs or changes.

NEGATIVES: no camera movement, no zoom, no new text, no captions, no subtitles, no spoken words, no watermark, no timecode, no film frame, no letterbox, no phone bezel, no extra characters, no second monkey, no stadium or scenery behind the wall, no change of spelling in any text, the eye patch never changes eye, a wrong number on the back, the home page never moves toward the camera or upward, only to the left."""
P2=f"""SCENE / FRAMING: a vertical 9:16 mobile phone screen, full frame. The FIRST frame shows a matte black textured wall with a pale aquamarine crest at the top, the headline "SEASON TICKETS ARE HERE.", the subline "BE THERE FROM THE BEGINNING.", plain dark wall below, and Luca, the 3D monkey mascot, standing on the right side presenting the headline with an open palm. The LAST frame is the exact same layout with Luca gone: only the wall, crest, headline and subline remain, pixel-identical to the first frame's background.

CAMERA & LENS: completely static, locked-off, no pan, no zoom, no camera movement, no parallax.

SUBJECT: {LUCA}.

ACTION & MOVEMENT: Luca holds his presenting pose for a beat, gives the viewer a quick playful wink with his right eye and a small nod toward the headline, then turns and walks briskly HORIZONTALLY to the RIGHT, seen in profile, parallel to the camera, and exits completely through the RIGHT edge of the frame, his tail following him out last. After he has left, the frame holds perfectly still on the clean layout until the end.

ENVIRONMENT & LIGHTING: same soft studio key light and rim light as the first frame; nothing in the background changes.

COLOR GRADE: near-black, warm white, pale aquamarine (mint) as the only accent. No saturated turquoise.

MOTION QUALITY: smooth, weighty animated-film character motion, no morphing; the background, crest and text never move, shift, blur or change.

NEGATIVES: no camera movement, no new text, no captions, no spoken words, no watermark, no timecode, no letterbox, no extra characters, no stadium or scenery; he does NOT walk toward the camera, NOT to the left, NOT downward; he does NOT fade out, shrink or vanish; he leaves only by walking out through the right edge."""
open("prompts-v3.txt","w").write("=== CLIP 1 ===\n"+P1+"\n\n=== CLIP 2 ===\n"+P2+"\n")
tasks=json.load(open("tasks.json")) if os.path.exists("tasks.json") else {}
def submit(name,prompt,first,last,dur):
    if name in tasks: print("reuse",name); return
    tasks[name]=kie.create_task("bytedance/seedance-2",{"prompt":prompt,"first_frame_url":urls[first],"last_frame_url":urls[last],"resolution":"1080p","aspect_ratio":"9:16","duration":dur,"generate_audio":False})
    print("submitted",name,tasks[name]); json.dump(tasks,open("tasks.json","w"),indent=1)
submit("clip1",P1,"home","frame_a2",8)
submit("clip2",P2,"frame_a2","base",4)
t0=time.time(); done={}
while time.time()-t0<560 and len(done)<2:
    for name,tid in tasks.items():
        if name in done: continue
        d=kie.task_info(tid).get("data") or {}; st=d.get("state")
        if st=="success":
            rj=d.get("resultJson"); rj=json.loads(rj) if isinstance(rj,str) else rj
            done[name]=rj.get("resultUrls",[None])[0]; print(f"  {name} SUCCESS {int(time.time()-t0)}s credits={d.get('creditsConsumed')}",flush=True); kie.download(done[name],f"{name}.mp4")
        elif st=="fail": done[name]=None; print(f"  {name} FAIL {d.get('failCode')} {d.get('failMsg')}",flush=True)
    if len(done)<2: time.sleep(15)
print("pending:",[n for n in tasks if n not in done])
