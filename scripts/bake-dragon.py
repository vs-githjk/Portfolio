"""Bake the world's dragon: public/dragon/dragon.glb and dragon-lite.glb.

Run by hand, like bake-hologram.py, only when the model or its animation changes:

  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --disable-autoexec \
      -P scripts/bake-dragon.py -- <dragon_model.blend> <out dir> [preview dir]
  npx @gltf-transform/cli meshopt <out dir>/dragon.raw.glb public/dragon/dragon.glb   (see scripts/README in the commit)

Source mesh and skeleton: "Low Poly Ice Dragon" by xterryx on OpenGameArt,
https://opengameart.org/content/low-poly-ice-dragon , licence CC0 1.0 (public domain).
The download is the author's .blend (660 vertices, mirrored, 79 bones).

What this script does to it:
  1. applies the mirror, lengthens the wings about the shoulders (the span was half
     the body's length), and smooths the faceted mesh with two levels of subdivision
     (one for the phone file); the skin weights are carried through;
  2. bakes three per-vertex masks into COLOR_0 for the shader: R membrane (thin
     skin, found by casting a ray through it), G ambient occlusion, B points
     (horns, spikes, claws, teeth: convex and small);
  3. replaces the author's short "Flying" action with four clips written here as
     functions of phase (Fly, Glide, Perch, Roar), sampled every other frame;
  4. exports glTF binary with the skin and the clips, no textures and no material.
"""
import bpy, bmesh, sys, math, random
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = argv[0], argv[1]
PREVIEW = argv[2] if len(argv) > 2 else None
FPS = 24
WING_SPAN = 1.62   # wings grow this much away from the body
WING_CHORD = 1.12  # and this much fore and aft

X, Y, Z = Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1))


def prepare(level):
    bpy.ops.wm.open_mainfile(filepath=SRC, use_scripts=False)
    sc = bpy.context.scene
    sc.render.fps = FPS
    arm = next(o for o in sc.objects if o.type == 'ARMATURE')
    me = next(o for o in sc.objects if o.type == 'MESH')
    arm.animation_data_clear()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    bpy.context.view_layer.objects.active = me
    me.select_set(True)
    for m in list(me.modifiers):
        if m.type == 'ARMATURE' and m.object is None:
            me.modifiers.remove(m)
    for m in list(me.modifiers):
        if m.type == 'MIRROR':
            bpy.ops.object.modifier_apply(modifier=m.name)

    # 1a. Longer wings: every vertex moves by how much of it belongs to a wing bone.
    pivot = Vector((0.0, -0.11, 3.2))
    wing_groups = {g.index for g in me.vertex_groups if g.name.startswith('Wing')}

    def grow(p, side):
        d = p - pivot
        return Vector((p.x, pivot.y + d.y * WING_CHORD, pivot.z + d.z * WING_SPAN))

    for v in me.data.vertices:
        tot = sum(g.weight for g in v.groups)
        w = sum(g.weight for g in v.groups if g.group in wing_groups) / tot if tot else 0
        if w > 0:
            v.co = v.co.lerp(grow(v.co, 0), min(1, w * 1.4))
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    for b in eb:
        if b.name.startswith('Wing'):
            b.use_connect = False
    for b in eb:
        if b.name.startswith('Wing'):
            b.head = grow(b.head.copy(), 0)
            b.tail = grow(b.tail.copy(), 0)
    # One root: the tail hangs from the hips.
    eb['spine.007'].parent = eb['spine']
    bpy.ops.object.mode_set(mode='OBJECT')

    # 1b. Smooth.
    bpy.context.view_layer.objects.active = me
    if level:
        ss = me.modifiers.new('ss', 'SUBSURF')
        ss.levels = level
        ss.boundary_smooth = 'PRESERVE_CORNERS'
        idx = next(i for i, m in enumerate(me.modifiers) if m.type == 'ARMATURE')
        bpy.ops.object.modifier_move_to_index(modifier='ss', index=idx)
        bpy.ops.object.modifier_apply(modifier='ss')
    for p in me.data.polygons:
        p.use_smooth = True
    me.data.materials.clear()
    for uv in list(me.data.uv_layers):
        me.data.uv_layers.remove(uv)
    return sc, arm, me


def masks(me):
    """COLOR_0: R membrane, G occlusion, B points."""
    mesh = me.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    bm.normal_update()
    tree = BVHTree.FromBMesh(bm)
    rnd = random.Random(7)
    n = len(bm.verts)
    thin = [0.0] * n
    occ = [1.0] * n
    tip = [0.0] * n
    dirs = []
    while len(dirs) < 40:
        d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1)))
        if 0.05 < d.length <= 1:
            dirs.append(d.normalized())
    for v in bm.verts:
        nrm = v.normal
        hit = tree.ray_cast(v.co - nrm * 0.004, -nrm, 0.5)
        t = hit[3] if hit[0] is not None else 9
        thin[v.index] = 1.0 - min(1.0, max(0.0, (t - 0.12) / 0.3))
        free = 0
        cnt = 0
        for d in dirs:
            if d.dot(nrm) < 0.15:
                continue
            cnt += 1
            if tree.ray_cast(v.co + nrm * 0.01, d, 1.6)[0] is None:
                free += 1
        occ[v.index] = free / max(1, cnt)
        # convex: neighbours sit behind the tangent plane
        if v.link_edges:
            k = sum((e.other_vert(v).co - v.co).normalized().dot(nrm) for e in v.link_edges) / len(v.link_edges)
            tip[v.index] = min(1.0, max(0.0, (-k - 0.25) / 0.45))
    # the membrane mask is the wings only; a thin tail tip or a horn is not skin
    wing = {g.index for g in me.vertex_groups if g.name.startswith('Wing')}
    for v in mesh.vertices:
        tot = sum(g.weight for g in v.groups)
        w = sum(g.weight for g in v.groups if g.group in wing) / tot if tot else 0
        thin[v.index] *= min(1.0, w * 3.0)
    # soften each mask over the mesh
    for _ in range(2):
        for arr in (thin, occ, tip):
            nxt = arr[:]
            for v in bm.verts:
                if v.link_edges:
                    nxt[v.index] = 0.5 * arr[v.index] + 0.5 * sum(arr[e.other_vert(v).index] for e in v.link_edges) / len(v.link_edges)
            arr[:] = nxt
    bm.free()
    col = mesh.color_attributes.new('Color', 'BYTE_COLOR', 'POINT')
    for i in range(n):
        col.data[i].color = (thin[i], occ[i], tip[i], 1.0)
    mesh.color_attributes.active_color = col
    mesh.color_attributes.render_color_index = 0


# ---------------------------------------------------------------- the clips --
class Poser:
    """Rotations are given in the creature's own frame (head toward -Y, up +Z,
    left wing +X), about a bone's head, parents first."""

    def __init__(self, arm):
        self.arm = arm
        self.pb = arm.pose.bones
        for b in self.pb:
            b.rotation_mode = 'QUATERNION'
        self.touched = set()

    def reset(self):
        for b in self.pb:
            b.rotation_quaternion = (1, 0, 0, 0)
            b.location = (0, 0, 0)
            b.scale = (1, 1, 1)
        bpy.context.view_layer.update()

    def rot(self, name, axis, deg):
        if abs(deg) < 1e-6:
            return
        b = self.pb[name]
        m = b.matrix.copy()
        h = m.translation.copy()
        b.matrix = Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg), 4, axis) @ Matrix.Translation(-h) @ m
        bpy.context.view_layer.update()
        self.touched.add(name)

    def both(self, name, axis, deg):
        """The same move on the left and the right, mirrored."""
        self.rot(name.replace('#', 'L'), axis, deg)
        self.rot(name.replace('#', 'R'), Vector((axis.x, -axis.y, -axis.z)), deg)

    def move(self, name, v):
        b = self.pb[name]
        m = b.matrix.copy()
        m.translation = m.translation + Vector(v)
        b.matrix = m
        bpy.context.view_layer.update()
        self.touched.add(name)

    def key(self, frame):
        for name in self.touched:
            b = self.pb[name]
            b.keyframe_insert('rotation_quaternion', frame=frame)
            if name == 'spine':
                b.keyframe_insert('location', frame=frame)


TAU = math.tau
FINGERS = ['Wing.002.#', 'Wing.001.#.001', 'Wing.001.#.004']
TAIL = ['spine.007', 'spine.008', 'spine.009', 'spine.010']


def wave(ph, lag=0.0):
    return math.sin(TAU * (ph - lag))


def legs_tucked(P, k=1.0):
    P.both('thigh.#', X, 62 * k)
    P.both('shin.#', X, -48 * k)
    P.both('foot.#', X, 58 * k)
    P.both('toe.#', X, 30 * k)


def wings(P, elev, tip, fold, twist):
    """elev: degrees above the horizon at the root; tip: extra at the hand;
    fold: fingers swept back toward the tail; twist: leading edge down."""
    th = 90 - elev
    c, si = math.cos(math.radians(th)), math.sin(math.radians(th))
    span = Vector((si, 0, c))    # root to tip, on the left
    nrm = Vector((c, 0, -si))    # out of the wing's face
    P.both('Wing.#', Y, th)
    P.both('Wing.#', span, twist)
    P.both('Wing.001.#', Y, -tip * 0.45)
    for f in FINGERS:
        P.both(f, Y, -tip * 0.55)
    if fold:
        P.both('Wing.001.#', nrm, -fold * 0.5)
        for i, f in enumerate(FINGERS):
            P.both(f, nrm, fold * (0.5 + 0.35 * i))


def flight_body(P, pitch=0.0, heave=0.0):
    P.rot('spine', X, 9 + pitch)          # the standing back comes level
    P.move('spine', (0, 0, heave))
    P.rot('spine.002', X, 5)
    P.rot('spine.004', X, 4)
    P.rot('spine.006', X, -6)
    P.rot('neck.001', X, -5 - pitch * 0.6)
    P.rot('neck.002', X, -4)
    P.rot('head', X, 6 - pitch * 0.4)
    P.rot('beak_001.B', X, -11)   # the jaw is modelled open: nearly shut in flight


def tail_trail(P, ph, amp=5.0, side=0.0, lift=0.0):
    for i, n in enumerate(TAIL):
        P.rot(n, X, -4 + lift + amp * wave(ph, 0.18 + 0.16 * i) * (0.6 + 0.3 * i))
        if side:
            P.rot(n, Z, side * wave(ph * 0.5, 0.1 + 0.12 * i))


def pose_fly(P, ph):
    # the downstroke takes 45% of the beat
    a = ph / 0.45 * 0.5 if ph < 0.45 else 0.5 + (ph - 0.45) / 0.55 * 0.5
    elev = 6 + 44 * math.cos(TAU * a)
    tip = 18 * math.sin(TAU * (a - 0.04))         # the hand trails the arm: up on the way down
    up = max(0.0, -math.sin(TAU * a))             # 1 in the middle of the upstroke
    flight_body(P, pitch=2.5 * wave(a, 0.3), heave=0.22 * wave(a, 0.32))
    wings(P, elev, tip, fold=26 * up, twist=9 * math.sin(TAU * a))
    legs_tucked(P)
    tail_trail(P, a, amp=4.5)


def pose_glide(P, ph):
    flight_body(P, pitch=1.0 * wave(ph), heave=0.06 * wave(ph, 0.25))
    wings(P, 12 + 3 * wave(ph, 0.1), 8 + 3 * wave(ph, 0.3), fold=4, twist=0)
    legs_tucked(P)
    tail_trail(P, ph, amp=3.0, side=5)


def perch_base(P, breath=0.0, alert=0.0):
    P.rot('spine.003', X, -3 - breath)
    P.rot('spine.006', X, -16 - 8 * alert)
    P.rot('neck.001', X, -20 - 6 * alert)
    P.rot('neck.002', X, 8 + 10 * alert)
    P.rot('head', X, 26 + 6 * alert)
    P.rot('beak_001.B', X, -11 * (1 - alert))
    # the tail lies level behind it and curls to one side, its tip off the ground
    for i, n in enumerate(TAIL):
        P.rot(n, X, 3 + 3 * i)
        P.rot(n, Z, 14 + 8 * i + 3 * breath * (i + 1) * 0.5)


def perch_wings(P, open_=0.0, breath=0.0):
    """Half folded and held up behind the shoulders: mantled."""
    P.both('Wing.#', X, -28 + 14 * open_)                 # swept back
    P.both('Wing.#', Y, 16 + 34 * open_ + 2 * breath)     # leaning out
    for i, f in enumerate(FINGERS):
        P.both(f, X, (-24, -6, 16)[i] * (1 - open_))      # the fan half shut


def pose_perch(P, ph):
    br = wave(ph)
    perch_base(P, breath=br)
    perch_wings(P, 0.0, br)


def pose_roar(P, ph):
    # in, hold, out
    k = min(1.0, ph / 0.22) if ph < 0.7 else max(0.0, (1 - ph) / 0.3)
    k = k * k * (3 - 2 * k)
    shake = math.sin(TAU * ph * 9) * (1 if 0.22 < ph < 0.7 else 0)
    perch_base(P, breath=0, alert=k)
    perch_wings(P, 0.85 * k)
    P.rot('beak_001.B', X, 34 * k + 2 * shake)
    P.rot('beak.001.T', X, -9 * k)
    P.rot('head', X, -14 * k)
    P.rot('head', Y, 3 * shake)


CLIPS = [
    ('Fly', pose_fly, 30, True),
    ('Glide', pose_glide, 96, True),
    ('Perch', pose_perch, 96, True),
    ('Roar', pose_roar, 60, False),
]


def animate(arm):
    P = Poser(arm)
    arm.animation_data_create()
    made = []
    # every clip keys every bone any clip moves, so a blend never falls back to the bind pose
    P.reset()
    for _, fn, _, _ in CLIPS:
        for ph in (0.0, 0.37, 0.6):
            fn(P, ph)
    moved = set(P.touched)
    for name, fn, frames, loop in CLIPS:
        act = bpy.data.actions.new(name)
        arm.animation_data.action = act
        P.touched = set(moved)
        step = 2 if frames <= 60 else 4
        for f in range(0, frames + 1, step):
            ph = f / frames
            P.reset()
            fn(P, ph % 1.0 if loop else ph)
            P.key(f)
        act.use_fake_user = True
        made.append(act)
        arm.animation_data.action = None
    # The tracks come last: a strip that exists while the next clip is being posed is evaluated over it.
    for act in made:
        tr = arm.animation_data.nla_tracks.new()
        tr.name = act.name
        tr.strips.new(act.name, 0, act).name = act.name
    P.reset()
    return made


def preview(sc, arm, tag):
    import os
    os.makedirs(PREVIEW, exist_ok=True)
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'MATCAP'; sh.show_cavity = True; sh.color_type = 'SINGLE'; sh.single_color = (0.82, 0.82, 0.82)
    sc.render.resolution_x = 560; sc.render.resolution_y = 420
    sc.render.image_settings.file_format = 'JPEG'
    cd = bpy.data.cameras.new('pc'); cam = bpy.data.objects.new('pc', cd); sc.collection.objects.link(cam); sc.camera = cam
    cd.type = 'ORTHO'; cd.ortho_scale = 24
    views = {'side': (1, 0, 0), 'front': (0, -1, 0.15), 'q': (0.8, -1, 0.4), 'top': (0, 0.001, 1)}
    for tr in arm.animation_data.nla_tracks:
        tr.mute = True
    for name, fn, frames, loop in CLIPS:
        arm.animation_data.action = bpy.data.actions[name]
        try:
            arm.animation_data.action_slot = bpy.data.actions[name].slots[0]
        except Exception:
            pass
        for vn, d in views.items():
            d = Vector(d).normalized()
            cam.location = Vector((0, 2, 3)) + d * 60
            cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
            for q in (0, 0.25, 0.5, 0.75):
                sc.frame_set(int(frames * q))
                sc.render.filepath = f'{PREVIEW}/{tag}_{name}_{vn}_{int(q * 100):02d}.jpg'
                bpy.ops.render.render(write_still=True)
    arm.animation_data.action = None
    bpy.data.objects.remove(cam)


for tag, level in (('dragon', 2), ('dragon-lite', 1)):
    sc, arm, me = prepare(level)
    masks(me)
    animate(arm)
    print('BAKED', tag, 'verts', len(me.data.vertices), 'tris', sum(len(p.vertices) - 2 for p in me.data.polygons), 'bones', len(arm.data.bones))
    if PREVIEW and tag == 'dragon':
        preview(sc, arm, tag)
    for o in list(sc.objects):
        if o not in (arm, me):
            bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=f'{OUT}/{tag}.raw.glb', export_format='GLB', use_selection=True,
        export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_step=2,
        export_skins=True, export_materials='NONE', export_texcoords=False, export_normals=True,
        export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_active_vertex_color_when_no_material=True,
        export_yup=True, export_optimize_animation_size=True, export_def_bones=False,
    )
    print('EXPORTED', tag)
