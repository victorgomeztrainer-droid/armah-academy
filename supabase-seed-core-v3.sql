-- ══════════════════════════════════════════════════════════════════════
-- ARMAH ACADEMY — CORE V3 Full Content Seed (Version 3)
-- Prerequisite module with anatomy content + 5 circuits + 10-question quiz
-- RUN AFTER: supabase-migration-v2.sql
-- ══════════════════════════════════════════════════════════════════════

-- Clean up old CORE data
delete from public.programs where slug = 'core';

do $$
declare
  prog_id  uuid;
  mod0_id  uuid;
  mod1_id  uuid;
  mod2_id  uuid;
  mod3_id  uuid;
  mod4_id  uuid;
  quiz_id  uuid;
  q_id     uuid;
begin

-- ─────────────────────────────────────────────────────────────────────────────
-- PROGRAM
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.programs (title, slug, description, category, difficulty, estimated_hours, is_published)
values (
  'CORE V3',
  'core',
  'A powerful and progressive core training experience designed for fitness professionals. 3 circuits × 8 exercises, 45 sec work / 15 sec rest, plus a Circuit 4 AMRAP finisher. Includes anatomy foundations, full exercise library, and a certification quiz.',
  'Group Fitness',
  'intermediate',
  4,
  true
)
returning id into prog_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 0 — PREREQUISITE: Foundations
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Prerequisite: Foundations',
  'Before accessing the circuits, complete these foundational lessons on spine anatomy, posture, and movement principles. This module is required to unlock the rest of the program.',
  0, true
)
returning id into mod0_id;

-- Lesson 0-1: Program Overview
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'CORE V3 — Program Overview',
  'CLASS OBJECTIVE
To deliver a powerful and progressive core training experience that leaves a lasting impact on clients across all clubs. CORE V3 challenges core strength, stability, and control through dynamic, structured, and motivating sequences. Version V3 elevates the training level with new functional movements and a methodology aimed at enhancing performance while keeping participants highly engaged.

PROGRAM STRUCTURE
• Duration per exercise: 45 seconds
• Rest between exercises: 15 seconds
• Rest between circuits: 1 minute 30 seconds
• Circuits 1–3: 8 exercises each
• Circuit 4 — AMRAP Finisher: 2 AMRAPs × 3:30 minutes, with 1 minute rest between them

WHY KETTLEBELLS?
Every circuit includes at least one kettlebell exercise. This is intentional — one of the core''s primary functions is force transfer. The kettlebell increases heart rate and trains the body to transmit power through the entire kinetic chain: feet → legs → hips → core → arms. You are not just building core endurance; you are building functional power.',
  null, 10, 0, 'presentation'
);

-- Add PDF resource to overview lesson
insert into public.resources (lesson_id, title, file_url, file_type)
select id, 'CORE V3 — Full Notebook PDF', '/core-notebook-v3.pdf', 'pdf'
from public.lessons where module_id = mod0_id and title = 'CORE V3 — Program Overview';

-- Lesson 0-2: Spine Anatomy
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'Spine Anatomy — Mobile Vertebrae',
  'THE SPINE: AN OVERVIEW
The human spine is made up of 33 total vertebrae. However, only 24 of these are mobile — meaning they can move and articulate with each other. The remaining 9 are fused into the sacrum (5 fused vertebrae) and the coccyx (4 fused vertebrae), forming the base of the spine.

THE THREE MOBILE REGIONS
1. Cervical (Neck) — 7 vertebrae
   The most mobile region of the spine. Supports the head and allows for rotation, flexion, and extension of the neck.

2. Thoracic (Mid-Back) — 12 vertebrae
   Attached to the rib cage. Less mobile than cervical, designed for protection and structural support of the thorax.

3. Lumbar (Lower Back) — 5 vertebrae
   The largest and strongest vertebrae. Carry most of the body''s weight and are critical for core stability exercises.

CLINICAL RELEVANCE
Understanding these regions helps coaches cue clients correctly. In core training, the lumbar spine is most at risk of compression or shear forces if posture is compromised. Protecting the lumbar spine is a primary concern in every CORE V3 exercise.',
  null, 5, 1, 'reading'
);

-- Lesson 0-3: Axial Lengthening
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'Axial Lengthening — The Most Important Postural Principle',
  'DEFINITION
Axial Lengthening is the capacity to maintain a safe distance between each vertebral body, creating a long spine through its vertical axis. It is not about flattening the spine''s natural curves or stretching the neck upward — it is about creating space within the spine to relieve inter-vertebral pressure.

WHY IT IS THE MOST IMPORTANT POSTURAL PRINCIPLE
When the spine is compressed (from poor posture, heavy loading, or gravity), the intervertebral discs bear excessive pressure. Over time, this leads to:
• Disc herniation
• Nerve compression (radiating pain, weakness)
• Accelerated degeneration of facet joints

Axial lengthening actively counteracts compression by:
1. Reducing pressure on vertebrae and intervertebral discs
2. Preventing spinal nerve compression
3. Creating optimal alignment for force transfer

HOW TO APPLY IT
Think of your head gently floating upward — as if a thread were pulling the crown of your head toward the ceiling — while your feet ground firmly into the floor. The spine naturally lengthens between these two opposing forces. Maintain this sense of length in EVERY exercise.',
  null, 5, 2, 'reading'
);

-- Lesson 0-4: Pelvic Girdle
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'Pelvic Girdle — Finding Neutral Position',
  'THE PELVIC GIRDLE
The pelvis is the foundation of the spine. How it is positioned directly determines the alignment of the lumbar spine, hip joints, and — by extension — the entire kinetic chain above it.

PELVIC NEUTRAL POSITION
The pelvis is in neutral when:
• The Anterior Superior Iliac Spines (ASIS — the two bony points you can feel at the front of your hips) are horizontally aligned (same height)
• The ASIS share the same vertical plane as the Pubic Symphysis (the midpoint of the front of the pelvis)

In practical terms: imagine the pelvis as a bowl filled with water. Neutral = the water does not spill forward or backward.

ANTERIOR TILT (Excess Lordosis)
The ASIS drops forward and down. The lower back arches excessively. This compresses the lumbar facet joints and puts the iliopsoas in a shortened, overactive state. Common in trainers who sit for long periods.

POSTERIOR TILT (Flat Back)
The ASIS lifts and the pubic symphysis moves forward. The lumbar curve is reduced or reversed. This increases load on the intervertebral discs and reduces the spine''s natural shock-absorbing ability.

APPLICATION IN CORE TRAINING
Before every exercise, establish pelvic neutral. This is the foundation from which the core muscles function most efficiently.',
  null, 5, 3, 'reading'
);

-- Lesson 0-5: Shoulder Girdle & Scapular Dyskinesia
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'Shoulder Girdle — Scapular Dyskinesia',
  'THE SCAPULOHUMERAL RHYTHM
During arm elevation, the scapula and humerus move in a coordinated ratio called the scapulohumeral rhythm. For every 3 degrees of shoulder elevation, the humerus contributes 2 degrees and the scapula contributes 1 degree of upward rotation. This rhythm is essential for shoulder health and pain-free overhead movement.

WHAT IS SCAPULAR DYSKINESIA?
Scapular Dyskinesia is defined as a change in the normal position or motion of the scapula relative to the humerus during shoulder movement. It disrupts the scapulohumeral rhythm.

Causes include:
• Weakness in the serratus anterior and lower trapezius
• Overactivity of the upper trapezius and levator scapulae
• Previous shoulder injury or poor postural habits

CONSEQUENCES
If left unaddressed, scapular dyskinesia can lead to:
• Shoulder impingement syndrome (subacromial impingement)
• Rotator cuff tendinopathy or tears
• Acromioclavicular joint problems
• Glenohumeral instability

APPLICATION IN CORE TRAINING
Several CORE V3 exercises involve arm movements under load (Around the World, Halo Lunges, Bear Press). Coaches must watch for winging scapulae, asymmetrical shoulder height, or compensatory trunk lean — all signs of scapular dyskinesia.',
  null, 5, 4, 'reading'
);

-- Lesson 0-6: Functional Movement Principles
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'Functional Movement — The Correct Learning Sequence',
  'THE THREE-STEP SEQUENCE
When re-learning or teaching a functional movement pattern, there is a specific order that must be followed for safety and effectiveness:

STEP 1 — SET THE POSTURE
Before any movement begins, establish the correct position in space:
• Pelvic neutral (bowl of water, level)
• Axial lengthening (crown of head floating up)
• Scapulae retracted and depressed (shoulders back and down)
• Feet grounded, weight distributed evenly

WHY THIS COMES FIRST: Movement built on a faulty foundation will reinforce dysfunction. Setting the posture first ensures that the movement engages the intended muscles.

STEP 2 — STABILIZE
Once posture is set, create active tension through the core before moving:
• Engage the deep transverse abdominis (draw the navel gently toward the spine)
• Activate the pelvic floor
• Maintain diaphragmatic breathing

WHY THIS COMES SECOND: Stabilization creates the rigid cylinder that protects the spine during dynamic movement. If you move before stabilizing, the load is transferred to passive structures (discs, ligaments).

STEP 3 — MOVE
Only now should the limbs or body move through the desired range:
• Execute with control and intention
• Maintain the posture and stabilization throughout
• Do not sacrifice position for range or speed

COMMON MISTAKE: Starting with movement (jumping into an exercise without first setting posture or stabilizing) is the most common error in group fitness. Teach this sequence and your clients will move safer and stronger.',
  null, 5, 5, 'reading'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 1 — CIRCUIT 1
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 1',
  '8 exercises — 45 sec work / 15 sec rest. Crunch variations and full-body integration with kettlebell work. Focus on core engagement, breathing, and spinal alignment.',
  1, false
)
returning id into mod1_id;

-- Circuit 1 overview video
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod1_id,
  'Circuit 1 — Full Demo Video',
  'Watch the full Circuit 1 demonstration before starting the individual exercises. Study the form, transitions, and coaching cues in motion.',
  'https://www.youtube.com/embed/vTTORrhin9U',
  5, -1, 'video'
);

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values

(mod1_id, 'Exercise 1 — Squat Jump & Alternative Catch',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Toes pointed outside, keep the back straight throughout
• Jump explosively and land softly — knees track over toes on landing
• Catch the kettlebell (or object) with alternating hands on each rep
• Maintain a proud chest — do not round forward at any point

MUSCLES: Quadriceps, glutes, core stabilizers, shoulders',
null, 5, 0, 'video'),

(mod1_id, 'Exercise 2 — Crunch: Forehead to Knee',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Bring your forehead toward your knees — not your hands pulling your neck
• Exhale sharply as you crunch up, inhale on the way down
• Press the inner thighs together to engage the adductors and deepen the crunch
• Control the eccentric — do not drop back down quickly

MUSCLES: Rectus abdominis, hip flexors, adductors',
null, 5, 1, 'video'),

(mod1_id, 'Exercise 3 — 2× Crunch + Forehead to Knee',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Perform 2 short crunches first, then drive your forehead all the way to your knees on the 3rd rep
• Exhale on every crunch — use your breath to power each contraction
• Press the inner thighs together throughout the full set
• Keep the movement continuous and rhythmic — feel the tempo

MUSCLES: Rectus abdominis, obliques, hip flexors',
null, 5, 2, 'video'),

(mod1_id, 'Exercise 4 — Military Bear Press',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Fingers pointed inward (toward each other) — protects the wrists and loads the medial deltoid
• Chest tucked in — do not let the chest drop toward the floor at any point
• Knees remain bent and hovering just off the floor throughout the entire set
• Press firmly through the palms to stabilize the shoulder girdle and engage the deep core

MUSCLES: Shoulders (medial deltoid), triceps, wrists, core stabilizers',
null, 5, 3, 'video'),

(mod1_id, 'Exercise 5 — Around the World (Kettlebell)',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Pivot the foot as you rotate to allow full hip and torso twist — the rotation comes from the whole body, not just the arms
• Drive the torso to rotate first, then the arms follow
• Bring the kettlebell up to shoulder height at the top of the arc
• Keep a strong, stable base — feet slightly wider than hip-width throughout

MUSCLES: Obliques, shoulders, rotational core, glutes, hip rotators',
null, 5, 4, 'video'),

(mod1_id, 'Exercise 6 — Cross Crunch Press',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Left palm presses the right knee, right foot presses the left knee — create isometric tension between them
• Press hand and knee against each other actively — the isometric contraction deepens the oblique engagement
• Keep the opposite leg extended low without letting it touch the floor
• Alternate sides with full control — do not rush the transitions

MUSCLES: Obliques, transverse abdominis, hip flexors',
null, 5, 5, 'video'),

(mod1_id, 'Exercise 7 — Double Crunch Twist + Press',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Perform 2 short crunches first, then bring your elbow to the opposite knee with a pressing action
• Left palm presses right knee, right foot presses left knee — feel the cross-body tension
• Double the crunch before the twist — feel the oblique contract fully before pressing
• Control the descent — do not flop back between reps

MUSCLES: Rectus abdominis, obliques, hip flexors',
null, 5, 6, 'video'),

(mod1_id, 'Exercise 8 — Plank Cross Press',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• From a plank, rotate to a side plank and press the ground with opposite limbs (foot on foot, hand to floor)
• Create cross-body isometric tension — press the raised knee against the side to engage the oblique
• Keep hips level and core rock solid during the rotation
• Return to center with full control before switching sides

MUSCLES: Obliques, transverse abdominis, shoulder stabilizers, hip abductors',
null, 5, 7, 'video');

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 2 — CIRCUIT 2
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 2',
  '8 exercises — 45 sec work / 15 sec rest. Bridge variations, kettlebell swing, and progressive C-crunch sequences. Focus on posterior chain activation and lumbar protection.',
  2, false
)
returning id into mod2_id;

-- Circuit 2 overview video
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod2_id,
  'Circuit 2 — Full Demo Video',
  'Watch the full Circuit 2 demonstration before starting the individual exercises. Pay special attention to the kettlebell swing hip drive and bridge alignment cues.',
  'https://www.youtube.com/embed/o1yTho4URrU',
  5, -1, 'video'
);

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values

(mod2_id, 'Exercise 1 — Kettlebell Swing',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Engage your glutes and drive your hips forward with power — do NOT lift the kettlebell with your arms
• Keep your chest open and spine neutral — the weight swings from hip drive, not from the knees bending
• This is a hip hinge on the way down, not a squat — push your hips back, not your knees forward
• Let the bell float to chest height naturally as a result of explosive hip extension

MUSCLES: Glutes, hamstrings, posterior chain, core, lats',
null, 5, 0, 'video'),

(mod2_id, 'Exercise 2 — Bridge Plank',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Squeeze your glutes hard at the top — imagine holding a coin between them
• Keep the pelvis level — do not let the hips sag or hyperextend the lower back
• Press your heels firmly into the floor to activate the hamstrings and glutes together
• Your body should form one straight line from shoulders to knees — not head to feet

MUSCLES: Glutes, hamstrings, lower back, core stabilizers',
null, 5, 1, 'video'),

(mod2_id, 'Exercise 3 — Bridge & Marching',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Hold the bridge position and alternate lifting one knee at a time in a controlled march
• Keep the hips perfectly steady and level — no dropping on the side of the lifted leg
• Engage the core and glutes actively before lifting each leg
• Slow and controlled beats fast and sloppy — quality march, not a race

MUSCLES: Glutes, core stabilizers, hip flexors, single-leg stability',
null, 5, 2, 'video'),

(mod2_id, 'Exercise 4 — Crab Bridge: Alternate Cross Touch',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• In the reverse tabletop (crab) position, keep hips lifted and stable as you reach one hand to the opposite foot
• Do not let the torso collapse or the hips drop — maintain the bridge throughout the entire reach
• Engage glutes and core actively at all times
• Control the movement — touch with intention, do not flop or swing

MUSCLES: Glutes, posterior deltoid, obliques, triceps, hip stabilizers',
null, 5, 3, 'video'),

(mod2_id, 'Exercise 5 — Kettlebell Cross Lunge',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Keep your chest tall and hold the kettlebell close to your body as you cross the back leg behind you
• Engage your glutes as you drive back up to standing — this is the power phase
• Prevent the front knee from caving inward — actively push it out over the second and third toes
• Move with deliberate strength — this is a loaded strength exercise, not a cardio drill

MUSCLES: Glutes, quadriceps, adductors, core, single-leg balance',
null, 5, 4, 'video'),

(mod2_id, 'Exercise 6 — C-Crunch + Cross Lateral Touch (Legs Grounded)',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Gently round the upper back into a "C" curve — reach your shoulder (not your elbow) toward the opposite knee
• The movement originates in the abs — do not pull on the neck or use momentum
• Keep both feet grounded and flat on the floor throughout
• Press the lower back into the floor at all times — keep that contact constant

MUSCLES: Rectus abdominis (upper), obliques, transverse abdominis',
null, 5, 5, 'video'),

(mod2_id, 'Exercise 7 — C-Crunch + Cross Lateral Touch + Extended Leg (Legs Elevated)',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Extend one leg long while curling your shoulder toward the opposite bent knee in a "C" shape
• The extended leg stays low (just above the floor) — this creates more tension on the lower abs
• Do not pull on the neck — the contraction is coming from the abs, not the hands
• Press the lower back into the floor and keep it there throughout the movement

MUSCLES: Rectus abdominis (full), obliques, hip flexors, transverse abdominis',
null, 5, 6, 'video'),

(mod2_id, 'Exercise 8 — C-Crunch + Cross Lateral Touch + Scissors',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Perform the C-crunch with cross shoulder reach, then alternate legs in a scissor motion
• Keep the lower back pressed firmly into the floor at all times — no arching
• Draw the belly button inward toward the spine with every rep
• Relax the neck — if it fatigues, you are pulling with the hands. Let the core do the work

MUSCLES: Rectus abdominis, obliques, hip flexors, transverse abdominis',
null, 5, 7, 'video');

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 3 — CIRCUIT 3
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 3',
  '8 exercises — 45 sec work / 15 sec rest. Side rolls, halo lunges, and advanced oblique sequences. Focus on spinal rotation, lateral core, and coordination.',
  3, false
)
returning id into mod3_id;

-- Circuit 3 overview video
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod3_id,
  'Circuit 3 — Full Demo Video',
  'Watch the full Circuit 3 demonstration. Focus on the side roll mechanics, the 3-second holds, and the kettlebell halo coordination during the lunges.',
  'https://www.youtube.com/embed/bzJ-Qsc9VYs',
  5, -1, 'video'
);

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values

(mod3_id, 'Exercise 1 — Splits with Side Swing',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Take a wide-leg split stance and swing the kettlebell side to side in front of the body in a controlled arc
• The rotation engages the hips, core, and adductors simultaneously — feel all three working together
• Keep a slight bend in the knees and maintain a stable, proud torso throughout
• The swing is guided momentum — not uncontrolled — keep the core braced at all times

MUSCLES: Adductors (inner thighs), core rotators, hips, shoulders',
null, 5, 0, 'video'),

(mod3_id, 'Exercise 2 — Side Roll',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Lying on your back, roll your entire body from side to side using your abdominals
• Focus on oblique activation and conscious core control — not momentum from swinging arms or legs
• Breathe rhythmically — exhale as you initiate the roll, inhale to reset
• Let the obliques lead the movement, not the arms or shoulders

MUSCLES: Obliques, transverse abdominis, spinal rotators',
null, 5, 1, 'video'),

(mod3_id, 'Exercise 3 — Side Roll with Extended Legs',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Perform the side roll but keep both legs straight and extended throughout
• Straight legs increase the lever arm — this makes the obliques work significantly harder
• Challenges core stability with greater rotational demand
• Do not bend the knees to make it easier — use the core to control the extended lever

MUSCLES: Obliques, spinal rotators, core stability (higher demand than basic side roll)',
null, 5, 2, 'video'),

(mod3_id, 'Exercise 4 — Side Roll + Extended Legs + Crunch Touch (3-sec Hold)',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Perform the side roll with extended legs, then at the end range add a crunch and hold for a full 3 seconds
• Do not rush the hold — 3 seconds means 3 seconds. Count it out
• The pause creates additional time under tension that maximizes oblique recruitment
• Embrace the burn — this is where the adaptation happens

MUSCLES: Obliques, rectus abdominis, core endurance',
null, 5, 3, 'video'),

(mod3_id, 'Exercise 5 — Step Forward Lunges with Halo',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Step forward into a deep lunge, then perform a full kettlebell halo around your head while in the lunge position
• Keep the core braced throughout the halo — do not let the weight pull your torso to one side
• The halo is performed while in the lunge, not after returning to standing
• This combination strengthens legs, shoulders, and core simultaneously while challenging balance

MUSCLES: Quadriceps, glutes, shoulders (deltoids), core, multi-planar balance',
null, 5, 4, 'video'),

(mod3_id, 'Exercise 6 — C-Crunch',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Curl both your upper body and your knees toward each other at the same time, forming a full "C" with the spine
• This creates a double contraction — the upper and lower abs fire simultaneously
• Exhale forcefully as you curl in — squeeze the abs hard at the peak position
• Control the lowering phase — resist gravity rather than dropping

MUSCLES: Rectus abdominis (upper and lower), hip flexors',
null, 5, 5, 'video'),

(mod3_id, 'Exercise 7 — Reverse Crunch: Right Side / Left Side',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• Sit slightly leaned back with hands on the floor behind you for support, knees bent
• Extend both legs out straight and rotate your hips to the right, then bring them back and repeat to the left
• Engage the lower abs and obliques on every rotation — the movement is initiated from the core, not a hip swing
• Keep the movement controlled — resist the urge to use momentum

MUSCLES: Lower abs, obliques, hip flexors',
null, 5, 6, 'video'),

(mod3_id, 'Exercise 8 — Leg Raises: Right Side / Left Side',
'Work: 45 sec | Rest: 15 sec

COACHING CUES
• From lying on your back, lift both legs and simultaneously angle them to the right side, lower, then repeat to the left
• This lateral variation targets the lower abs and deeply activates the internal and external obliques
• The movement should be slow and controlled — feel the obliques working eccentrically on the way down
• Do not use hip flexor momentum to swing the legs — the abs lift and lower the legs

MUSCLES: Lower abs (rectus abdominis — lower fibers), obliques (internal and external)',
null, 5, 7, 'video');

-- ─────────────────────────────────────────────────────────────────────────────
-- MODULE 4 — CIRCUIT 4: AMRAP FINISHER + COOL DOWN
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 4 — AMRAP Finisher',
  'Two AMRAPs of 3:30 minutes with 1 minute rest between them. Freestyle selection from Circuits 1–3. Followed by mandatory cool-down stretching protocol.',
  4, false
)
returning id into mod4_id;

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values

(mod4_id, 'AMRAP 1 — How It Works',
'Duration: 3 minutes 30 seconds | Rest after: 1 minute

WHAT IS AN AMRAP?
AMRAP = As Many Rounds As Possible. The goal is to complete as many full rounds of the selected exercise sequence as possible within the time limit. Record your rounds — this is your benchmark to beat next time.

AMRAP 1 — Recommended Selection:
1. Squat Jump & Alternative Catch — 10 reps
2. Military Bear Press — 10 reps
3. C-Crunch — 15 reps

COACHING:
• Set a target number of rounds before you start — give your clients a goal
• Maintain form even as fatigue accumulates — quality always over quantity
• Breathe continuously — no breath-holding
• Use the 1-minute rest fully: stand, walk, reset mentally for AMRAP 2
• The instructor may freely choose or reorganize exercises from any of Circuits 1–3',
null, 4, 0, 'video'),

(mod4_id, 'AMRAP 2 — The Final Push',
'Duration: 3 minutes 30 seconds

AMRAP 2 — Recommended Selection:
1. Kettlebell Swing — 10 reps
2. Crab Bridge Alternate Cross Touch — 10 reps
3. Step Forward Lunges with Halo — 8 reps per side

COACHING:
• This is the final effort — push harder than AMRAP 1
• Keep breathing through every single rep — fatigue shuts breathing down first
• The kettlebell swing must stay powerful even under fatigue — hip drive, not arms
• End with the same quality as the first rep — last rep same as the first
• Celebrate the effort with your class after the final buzzer',
null, 4, 1, 'video'),

(mod4_id, 'Cool Down — Stretching Protocol',
'Duration: 2–3 minutes | Hold each stretch: 15–20 seconds

NEVER SKIP THE STRETCH.
A proper cool-down reduces delayed-onset muscle soreness (DOMS), restores resting muscle length, improves long-term flexibility, and prepares the body for the next training session.

STRETCHING SEQUENCE:
1. Samson Stretch — Right side (15–20 sec)
   Lunge position, back knee down, arms overhead. Opens hip flexor and thoracic spine.

2. Samson Stretch — Left side (15–20 sec)

3. Cobra with Dorsal Flexion (15–20 sec)
   Prone, arms press up, hips stay down. Extends the lumbar spine after flexion-dominant training.

4. Downward Facing Dog (15–20 sec)
   Inverted V position. Stretches the hamstrings, calves, and thoracic spine simultaneously.

5. Double Knee to Chest (15–20 sec)
   Lying on back, hug both knees in. Decompresses the lumbar spine.

6. Trunk Rotation (15–20 sec per side)
   Supine with knees together, rotate both legs to one side. Releases the thoracolumbar fascia.

7. Cat / Cow Stretch (5–8 breath cycles)
   Alternates spinal flexion and extension. Mobilizes all spinal segments.

8. Full V Stretch (15–20 sec)
   Seated with legs wide apart, reach forward through center. Stretches adductors and lower back.',
null, 5, 2, 'video');

-- ─────────────────────────────────────────────────────────────────────────────
-- FINAL CERTIFICATION QUIZ (1 quiz per program — 10 questions)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.quizzes (program_id, title, passing_score, max_attempts)
values (prog_id, 'CORE V3 — Final Certification Quiz', 70, 3)
returning id into quiz_id;

-- Question 1: Spine anatomy
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'How many mobile vertebrae does the human spine have, and what are the three mobile regions?',
  'multiple_choice', 0,
  'The spine has 33 total vertebrae, but only 24 are mobile: 7 cervical (neck), 12 thoracic (mid-back), and 5 lumbar (lower back). The sacrum (5 fused) and coccyx are fixed.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '33 vertebrae: Cervical, Thoracic, and Lumbar', false, 0),
(q_id, '24 vertebrae: Cervical (7), Thoracic (12), and Lumbar (5)', true, 1),
(q_id, '26 vertebrae: Cervical (7), Thoracic (12), and Sacral (7)', false, 2),
(q_id, '24 vertebrae: Cervical (5), Thoracic (12), and Lumbar (7)', false, 3);

-- Question 2: Axial lengthening
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'What is "Axial Lengthening" and why is it considered the most important postural principle?',
  'multiple_choice', 1,
  'Axial lengthening is the capacity to keep a safe distance between each vertebral body through its axis, relieving pressure on vertebrae and discs while preventing spinal nerve compression.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Flattening the spine curves to reduce pressure on discs', false, 0),
(q_id, 'Keeping a safe distance between each vertebral body, creating a long spine through its axis', true, 1),
(q_id, 'Stretching the neck upward to improve breathing capacity', false, 2),
(q_id, 'Increasing the lumbar lordosis to support the visceral mass', false, 3);

-- Question 3: Pelvic neutral
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'When is the pelvis considered to be in a "Neutral Position"?',
  'multiple_choice', 2,
  'Pelvic neutral is achieved when the ASIS (anterior superior iliac spine) are horizontally aligned and share the same vertical plane as the pubic symphysis.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'When the hip bones are tilted anteriorly and the lumbar lordosis is maximized', false, 0),
(q_id, 'When the superior anterior iliac crests are horizontally aligned and in the same vertical plane as the pubic symphysis', true, 1),
(q_id, 'When the sacrum is in full posterior tilt and the glutes are contracted', false, 2),
(q_id, 'When the ischial tuberosities are the only point of contact while sitting', false, 3);

-- Question 4: Functional movement sequence
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'According to the training fundamentals, what is the correct order for re-learning a functional movement process?',
  'multiple_choice', 3,
  'The process is: first set the posture (pelvis, spine, shoulders), then stabilize the core, then move. This sequence ensures safe and effective functional patterns.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Move, stabilize, then set posture', false, 0),
(q_id, 'Stabilize, move, then correct posture', false, 1),
(q_id, 'Set the posture in space, stabilize, then move', true, 2),
(q_id, 'Breathe, contract the core, then execute the movement', false, 3);

-- Question 5: Scapular dyskinesia
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'What is "Scapular Dyskinesia" and what can it lead to?',
  'multiple_choice', 4,
  'Scapular dyskinesia is a dysfunction of the scapulohumeral rhythm caused by abnormal scapular positioning relative to the humerus, potentially leading to shoulder pathology such as impingement and rotator cuff issues.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Normal movement of the scapula during overhead reaching', false, 0),
(q_id, 'A change in the normal position of the scapula relative to the humerus, which can lead to shoulder health conditions', true, 1),
(q_id, 'Excessive retraction of the scapulae during bench press exercises', false, 2),
(q_id, 'The inability to elevate the scapula beyond 90 degrees of flexion', false, 3);

-- Question 6: Program timing
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'What is the work/rest timing protocol for each exercise in the CORE V3 circuits?',
  'multiple_choice', 5,
  'Each exercise in CORE V3 follows a 45-second work / 15-second rest protocol, with 1 minute and 30 seconds of rest between circuits.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '30 seconds work / 30 seconds rest', false, 0),
(q_id, '60 seconds work / 15 seconds rest', false, 1),
(q_id, '45 seconds work / 15 seconds rest', true, 2),
(q_id, '45 seconds work / 30 seconds rest', false, 3);

-- Question 7: Military Bear Press
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'During the "Military Bear Press" exercise in Circuit 1, what are the key coaching cues?',
  'multiple_choice', 6,
  'The Military Bear Press requires fingers pointed inward (toward each other), chest tucked in, and knees bent at all times to maintain proper wrist protection and core engagement.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Keep arms extended, back arched, and look upward', false, 0),
(q_id, 'Fingers pointed in, chest tucked in, knees bent at all times', true, 1),
(q_id, 'Elbows flared out, hips high, and head between the arms', false, 2),
(q_id, 'Hands shoulder-width apart, legs straight, and core relaxed', false, 3);

-- Question 8: Kettlebell swing
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'In Circuit 2, what is the primary coaching focus for the "Kettlebell Swing"?',
  'multiple_choice', 7,
  'The kettlebell swing is hip-driven. Engage glutes and drive hips forward with power — the arms do not lift the kettlebell. Chest open, spine neutral, hip hinge on the way down.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Lift the kettlebell with your arms and keep your knees forward', false, 0),
(q_id, 'Engage your glutes and drive your hips forward with power; do not lift with your arms', true, 1),
(q_id, 'Swing the kettlebell overhead and catch it at the top', false, 2),
(q_id, 'Keep your back rounded and use momentum from the lower back', false, 3);

-- Question 9: AMRAP structure
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'How is Circuit 4 (AMRAP Finisher) structured?',
  'multiple_choice', 8,
  'Circuit 4 consists of two AMRAPs of 3:30 minutes each, separated by 1 minute of rest. Trainers can choose or freely organize exercises from the previous 3 circuits.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'One continuous AMRAP of 7 minutes with all exercises from Circuits 1–3', false, 0),
(q_id, 'Two AMRAPs of 3:30 minutes each, with 1 minute rest between them, using selected exercises from the previous circuits', true, 1),
(q_id, 'Three AMRAPs of 2 minutes each with no rest between them', false, 2),
(q_id, 'One AMRAP of 5 minutes followed by a 2-minute plank hold', false, 3);

-- Question 10: Kettlebell integration rationale
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (
  quiz_id,
  'What role does the kettlebell play in the CORE V3 program design, and why is it included in each circuit?',
  'multiple_choice', 9,
  'Each circuit includes kettlebell exercises specifically aimed at increasing heart rate and improving force transfer — one of the core''s primary functions. This integrates cardiovascular work with core stability training.'
)
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'It replaces bodyweight exercises to increase muscle hypertrophy', false, 0),
(q_id, 'It is used to increase heart rate and improve force transfer, which is one of the core''s main functions', true, 1),
(q_id, 'It serves only as a counterbalance during stretching exercises', false, 2),
(q_id, 'It is optional equipment that can be replaced with dumbbells without modification', false, 3);

end $$;
