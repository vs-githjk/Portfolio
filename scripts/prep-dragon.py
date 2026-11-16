"""Trim the dragon's source glTF before it is compressed into public/dragon/.

Source: "European Dragon" by Nonexistent 101 on Sketchfab,
https://sketchfab.com/3d-models/european-dragon-82f393a2e6c048ad80c171ce3b3a7b87 ,
licence CC-BY 4.0 (credit required; it is in content.js, contact.credits.borrowed).
The download is scene.gltf + scene.bin + six 4096 px textures, 42k triangles,
169 joints, five clips. It is not in the repo (29 MB): download it again to rebuild.

  python3 scripts/prep-dragon.py <unzipped download> <work dir>
  G="npx @gltf-transform/cli@4.1.1"; cd <work dir>
  $G prune scene.gltf a.glb && $G resample a.glb b.glb --tolerance 0.001
  $G resize b.glb c.glb --width 1024 --height 1024 && $G webp c.glb d.glb --quality 78
  $G meshopt d.glb dragon.glb --level medium                      # desktop: 1.12 MB, 661 KB gzip
  $G simplify d.glb e.glb --ratio 0.4 --error 0.002
  $G resize e.glb f.glb --width 512 --height 512
  $G meshopt f.glb dragon-lite.glb --level medium                 # phones: 785 KB, 385 KB gzip

What this script does: keeps three of the five clips and names them for the scene
(Fly, Idle Sit -> Perch, Idle Stand -> Stand; Walk and Run are dropped), drops the
second and third UV sets and the tangents (the shader builds its own frame), and
drops the metal/rough map (the shader paints the dragon itself: only the base
colour's light and dark and the normal map are used).
"""
import json, shutil, sys, os

src, dst = sys.argv[1], sys.argv[2]
g = json.load(open(os.path.join(src, 'scene.gltf')))
keep = {'Fly': 'Fly', 'Idle Sit': 'Perch', 'Idle Stand': 'Stand'}
g['animations'] = [dict(a, name=keep[a['name']]) for a in g['animations'] if a['name'] in keep]
for m in g['meshes']:
    for p in m['primitives']:
        for k in ('TEXCOORD_1', 'TEXCOORD_2', 'TANGENT'):
            p['attributes'].pop(k, None)
for m in g['materials']:
    m.get('pbrMetallicRoughness', {}).pop('metallicRoughnessTexture', None)
os.makedirs(dst, exist_ok=True)
json.dump(g, open(os.path.join(dst, 'scene.gltf'), 'w'))
shutil.copy(os.path.join(src, 'scene.bin'), dst)
shutil.copytree(os.path.join(src, 'textures'), os.path.join(dst, 'textures'), dirs_exist_ok=True)
