-- ══════════════════════════════════════════════════════════════
-- ARMAH ACADEMY — CORE V3 Full Content Seed
-- Replace placeholder content with real data from Notebook Core V3
-- ══════════════════════════════════════════════════════════════

-- Clean up old CORE program and everything under it
delete from public.programs where slug = 'core';

do $$
declare
  prog_id uuid;
  mod0_id uuid; mod1_id uuid; mod2_id uuid; mod3_id uuid; mod4_id uuid;
  quiz0_id uuid; quiz1_id uuid; quiz2_id uuid; quiz3_id uuid;
  q_id uuid;
  lesson_id uuid;
begin

-- ── Program ──────────────────────────────────────────────────────────────────
insert into public.programs (title, slug, description, category, difficulty, estimated_hours, is_published)
values (
  'CORE',
  'core',
  'A powerful and progressive core training experience — 3 circuits of 8 exercises each, targeting core strength, stability, and control through dynamic and structured sequences. 45 sec work / 15 sec rest. Version 3.',
  'Group Fitness',
  'intermediate',
  4,
  true
)
returning id into prog_id;

-- ── Module 0: Prerequisite — Warm-Up & Foundations ───────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Prerequisite: Foundations & Warm-Up',
  'Before starting the circuits, understand the program structure and complete the warm-up protocol. This module is mandatory before accessing the circuits.',
  0,
  true
)
returning id into mod0_id;

-- Lesson: Program Overview
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (
  mod0_id,
  'CORE V3 — Program Overview',
  'Class Objective: To deliver a powerful and progressive core training experience that leaves a lasting impact on clients across all clubs. This class is designed to challenge core strength, stability, and control through dynamic, structured, and motivating sequences. Version V3 elevates the training level with new approaches, functional movements, and a methodology aimed at enhancing performance while keeping participants highly engaged.

Structure:
• Duration of Each Exercise: 45 seconds
• Rest Between Exercises: 15 seconds
• Rest Between Circuits: 1 minute 30 seconds
• 3 circuits × 8 exercises
• Circuit 4: 2 AMRAPs of 3:30 minutes with 1 min rest between them',
  null,
  10,
  0,
  'presentation'
) returning id into lesson_id;

-- Add PDF as resource for overview lesson
insert into public.resources (lesson_id, title, file_url, file_type)
values (lesson_id, 'CORE V3 — Full Notebook PDF', '/core-notebook-v3.pdf', 'pdf');

-- Warm-Up Lessons
insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values
(mod0_id, 'Warm-Up: High Knees', 'Duration: 30 seconds. Drive your knees up to hip height alternately while pumping your arms. Keep your core tight and land softly on the balls of your feet. Increase tempo progressively.', null, 1, 1, 'video'),
(mod0_id, 'Warm-Up: Squat to Reach', 'Duration: 30 seconds. Descend into a deep squat, then drive through your heels to stand and reach both arms overhead. Keep your chest up and spine neutral throughout the movement.', null, 1, 2, 'video'),
(mod0_id, 'Warm-Up: Inchworm to Plank', 'Duration: 30 seconds. From standing, hinge at the hips and walk your hands out to a plank position. Hold for a breath, then walk hands back and stand. Keep your core braced and legs as straight as possible.', null, 1, 3, 'video'),
(mod0_id, 'Warm-Up: Jumping Jacks', 'Duration: 30 seconds. Classic full-body warm-up. Keep a soft bend in the knees on landing and maintain a consistent rhythm to elevate heart rate progressively.', null, 1, 4, 'video'),
(mod0_id, 'Warm-Up: Lunge with Rotation', 'Duration: 30 seconds. Step forward into a lunge, then rotate your torso toward your front leg. Drive off the front foot to return to standing. Alternate legs. Keep your back knee low and your spine tall.', null, 1, 5, 'video'),
(mod0_id, 'Warm-Up: Plank Shoulder Taps', 'Duration: 30 seconds. In a high plank, alternate tapping each shoulder with the opposite hand. Squeeze your glutes and core to minimize hip rotation. Control the movement — quality over speed.', null, 1, 6, 'video');

-- Quiz for Module 0
insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod0_id, 'Foundations Quiz', 70, 3)
returning id into quiz0_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'How long is each exercise in the CORE circuits?', 'multiple_choice', 0, 'Each exercise lasts 45 seconds, followed by 15 seconds of rest.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '30 seconds', false, 0), (q_id, '45 seconds', true, 1), (q_id, '60 seconds', false, 2), (q_id, '20 seconds', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'How long is the rest between circuits?', 'multiple_choice', 1, 'Rest between circuits is 1 minute and 30 seconds to allow adequate recovery before the next circuit.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '30 seconds', false, 0), (q_id, '1 minute', false, 1), (q_id, '1 minute 30 seconds', true, 2), (q_id, '2 minutes', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'How many exercises are in each circuit?', 'multiple_choice', 2, 'Each of the 3 main circuits contains 8 exercises.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '6', false, 0), (q_id, '10', false, 1), (q_id, '8', true, 2), (q_id, '5', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'Circuit 4 consists of two AMRAP blocks with how much rest between them?', 'multiple_choice', 3, 'Circuit 4 has two AMRAPs of 3:30 minutes each, with 1 minute of rest in between.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '30 seconds', false, 0), (q_id, '1 minute', true, 1), (q_id, '2 minutes', false, 2), (q_id, 'No rest', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'The warm-up includes Plank Shoulder Taps. What should you minimize during this exercise?', 'multiple_choice', 4, 'You should minimize hip rotation by squeezing your glutes and core — control matters more than speed.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Arm movement', false, 0), (q_id, 'Hip rotation', true, 1), (q_id, 'Shoulder engagement', false, 2), (q_id, 'Core activation', false, 3);

-- ── Module 1: Circuit 1 ───────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 1',
  '8 exercises — 45 sec work / 15 sec rest. Focus on crunch variations and full-body integration with kettlebell work.',
  1,
  false
)
returning id into mod1_id;

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values
(mod1_id,
  'Exercise 1 — Squat Jump & Alternative Catch',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Toes outside, keep the back straight
• Jump explosively and land softly with knees tracking over toes
• Catch the kettlebell or object with alternating hands on each rep
• Maintain a proud chest throughout — do not round forward

MUSCLES: Quadriceps, glutes, core stabilizers, shoulders',
  null, 5, 0, 'video'),

(mod1_id,
  'Exercise 2 — Crunch: Forehead to Knee',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Bring your head toward your knees — not your hands behind your neck
• Exhale sharply as you crunch up
• Press the legs toward the inside to engage inner thighs and deepen the crunch
• Slow the eccentric — do not drop back down

MUSCLES: Rectus abdominis, hip flexors',
  null, 5, 1, 'video'),

(mod1_id,
  'Exercise 3 — 2× Crunch + Forehead to Knee',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Perform 2 crunches first, then bring your forehead to your knees on the 3rd rep
• Exhale on every crunch — use your breath to power the movement
• Press the legs toward the inside throughout
• Keep the movement continuous and rhythmic

MUSCLES: Rectus abdominis, obliques, hip flexors',
  null, 5, 2, 'video'),

(mod1_id,
  'Exercise 4 — Military Bear Press',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Fingers pointed inward (toward each other) — this protects the wrists
• Chest tucked in — do not let the chest drop toward the floor
• Knees bent at all times, hovering just off the floor
• Press through the palms to stabilize the shoulder girdle

MUSCLES: Shoulders, triceps, core, wrists',
  null, 5, 3, 'video'),

(mod1_id,
  'Exercise 5 — Around the World (Kettlebell)',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Pivot the leg as you rotate to allow full hip and torso twist
• Twist the body — do not just move the arms
• Bring the kettlebell up to shoulder height at the top of the arc
• Keep a strong base — feet slightly wider than hip-width

MUSCLES: Obliques, shoulders, rotational core, glutes',
  null, 5, 4, 'video'),

(mod1_id,
  'Exercise 6 — Cross Crunch Press',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Left palm presses the right knee, right foot presses the left knee — then reverse
• Create tension by pressing hand and knee against each other isometrically
• Keep the opposite leg extended low without touching the floor
• Alternate sides with control

MUSCLES: Obliques, transverse abdominis, hip flexors',
  null, 5, 5, 'video'),

(mod1_id,
  'Exercise 7 — Double Crunch Twist + Press',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Bring elbow to opposite knee on the twist, then press
• Left palm presses right knee, right foot presses left knee — then reverse
• Double the crunch before the twist press — feel the oblique contraction
• Control the descent — do not flop back

MUSCLES: Rectus abdominis, obliques, hip flexors',
  null, 5, 6, 'video'),

(mod1_id,
  'Exercise 8 — Plank Cross Press',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• From a plank, turn to the side and press the floor with opposite limbs
• Press your raised knee with the foot that''s in the air — create tension
• Keep your hips level and your core rock solid during the rotation
• Return to center with control before switching sides

MUSCLES: Obliques, transverse abdominis, shoulder stabilizers',
  null, 5, 7, 'video');

-- Quiz Circuit 1
insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod1_id, 'Circuit 1 Quiz', 70, 3)
returning id into quiz1_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'In the Military Bear Press, which direction should the fingers point?', 'multiple_choice', 0, 'Fingers should point inward (toward each other) to protect the wrists and properly engage the shoulder girdle.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Forward', false, 0), (q_id, 'Outward', false, 1), (q_id, 'Inward toward each other', true, 2), (q_id, 'Backward', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'During the Around the World kettlebell exercise, what should happen with the leg?', 'multiple_choice', 1, 'You should pivot the leg as you rotate — this allows full hip and torso twist and protects the knee joint.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Keep it completely still', false, 0), (q_id, 'Pivot the leg to allow rotation', true, 1), (q_id, 'Extend it straight out', false, 2), (q_id, 'Cross it behind the other leg', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'In the Cross Crunch Press, what does the left palm do?', 'multiple_choice', 2, 'The left palm presses the right knee, creating isometric tension that deepens the oblique contraction.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Presses the left knee', false, 0), (q_id, 'Supports the head', false, 1), (q_id, 'Presses the right knee', true, 2), (q_id, 'Reaches toward the ceiling', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'In the Plank Cross Press, you turn to the side and press the floor with opposite limbs.', 'true_false', 3, 'True. The cross-body pressing creates anti-rotation tension, heavily engaging the obliques and core.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'True', true, 0), (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'During the Crunch Forehead to Knee, where should you focus the breath?', 'multiple_choice', 4, 'Exhale sharply as you crunch up — using the breath activates the deep core muscles and increases intra-abdominal pressure.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Inhale on the way up', false, 0), (q_id, 'Hold breath throughout', false, 1), (q_id, 'Exhale as you crunch up', true, 2), (q_id, 'Breathing does not matter', false, 3);

-- ── Module 2: Circuit 2 ───────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 2',
  '8 exercises — 45 sec work / 15 sec rest. Bridge variations, kettlebell swing, and progressive C-crunch sequences.',
  2,
  false
)
returning id into mod2_id;

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values
(mod2_id,
  'Exercise 1 — Kettlebell Swing',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Engage your glutes and drive your hips forward with power — don''t lift the kettlebell with your arms
• Keep your chest open, spine neutral — feel the weight swing from your hips, not your knees
• Hinge at the hips on the way down — it''s a hip hinge, not a squat
• Let the bell float to chest height naturally from hip drive

MUSCLES: Glutes, hamstrings, core, posterior chain',
  null, 5, 0, 'video'),

(mod2_id,
  'Exercise 2 — Bridge Plank',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Squeeze your glutes like you''re holding a coin — keep your pelvis in line, do not arch your back
• Press your heels firmly into the floor
• Engage your core and hold tension from shoulders to knees
• Your body should form one straight line from shoulder to knee

MUSCLES: Glutes, hamstrings, core, lower back',
  null, 5, 1, 'video'),

(mod2_id,
  'Exercise 3 — Bridge & Marching',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Keep your hips steady and level — do not let them drop when you lift one leg
• Engage your core and glutes before moving the leg
• The motion should be controlled — no wobble in the hips
• March with intention: slow and controlled beats fast and sloppy

MUSCLES: Glutes, core stabilizers, hip flexors',
  null, 5, 2, 'video'),

(mod2_id,
  'Exercise 4 — Crab Bridge: Alternate Cross Touch',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Keep your hips lifted and stable as you reach your hand to the opposite foot
• Do not let your torso collapse — maintain the bridge position throughout
• Engage glutes and core at all times
• Control matters more than speed — slow it down if needed

MUSCLES: Glutes, posterior deltoid, obliques, triceps',
  null, 5, 3, 'video'),

(mod2_id,
  'Exercise 5 — Kettlebell Cross Lunge',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Keep your chest tall and the kettlebell close as you cross the leg behind with control
• Engage your glutes as you rise from the lunge
• Prevent the front knee from caving inward — push it out over the toes
• Move with purpose — this is a strength exercise, not a cardio drill

MUSCLES: Glutes, quadriceps, core, balance',
  null, 5, 4, 'video'),

(mod2_id,
  'Exercise 6 — C-Crunch + Cross Lateral Touch (Legs on Ground)',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Gently round the upper back into a "C" shape — reach your shoulder toward the opposite knee
• Do not pull your neck — the movement comes from the abs, not the head
• Keep your feet grounded throughout
• Core is always engaged — imagine pressing your lower back into the floor

MUSCLES: Rectus abdominis, obliques',
  null, 5, 5, 'video'),

(mod2_id,
  'Exercise 7 — C-Crunch + Cross Lateral Touch + Extended Leg (Legs in Air)',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Extend one leg long and curl your shoulder toward the opposite knee in a "C" shape
• Keep your core tight — avoid pulling on your neck
• Control the lowering leg — do not let it drop
• Keep your lower back pressed into the floor at all times

MUSCLES: Rectus abdominis, obliques, hip flexors',
  null, 5, 6, 'video'),

(mod2_id,
  'Exercise 8 — C-Crunch + Cross Lateral Touch + Scissors',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Perform a "C" crunch, reach across to the opposite knee, then alternate legs in a scissor motion
• Keep your lower back stable — do not arch off the floor
• Pull the belly button inward toward the spine
• Relax the neck — keep your core strong like a plank the entire time

MUSCLES: Rectus abdominis, obliques, hip flexors, transverse abdominis',
  null, 5, 7, 'video');

-- Quiz Circuit 2
insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod2_id, 'Circuit 2 Quiz', 70, 3)
returning id into quiz2_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'In the Kettlebell Swing, the power comes from:', 'multiple_choice', 0, 'The hip drive is the engine of the kettlebell swing. The arms are just a guide — never lift with your arms.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'The arms pulling the bell up', false, 0), (q_id, 'A squat motion', false, 1), (q_id, 'Hip drive and glute engagement', true, 2), (q_id, 'The lower back extension', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'During the Bridge Plank, your body should form a straight line from:', 'multiple_choice', 1, 'The body forms a straight line from shoulders to knees — not hips to feet. This is the key alignment cue.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Head to feet', false, 0), (q_id, 'Shoulders to knees', true, 1), (q_id, 'Hips to ankles', false, 2), (q_id, 'Neck to hips', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'In the C-Crunch exercises, the "C" shape refers to:', 'multiple_choice', 2, 'The "C" shape is formed by rounding the upper back — curling the spine to create a C-curve that maximally engages the abs.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'The path of the kettlebell', false, 0), (q_id, 'The shape of the legs', false, 1), (q_id, 'The rounded upper back position', true, 2), (q_id, 'The direction of the head', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'During the Crab Bridge Cross Touch, it is acceptable to let the torso collapse when reaching.', 'true_false', 3, 'False. The hips must stay lifted and stable throughout — collapsing the torso loses the bridge position and reduces glute activation.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'True', false, 0), (q_id, 'False', true, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'In the C-Crunch + Scissors, what should your lower back be doing?', 'multiple_choice', 4, 'The lower back should be pressed into the floor at all times — this protects the lumbar spine and ensures the abs are doing the work.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Arching off the floor', false, 0), (q_id, 'Pressed into the floor', true, 1), (q_id, 'Neutral — not touching the floor', false, 2), (q_id, 'Rotating side to side', false, 3);

-- ── Module 3: Circuit 3 ───────────────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 3',
  '8 exercises — 45 sec work / 15 sec rest. Side rolls, splits, halo lunges, and advanced oblique sequences.',
  3,
  false
)
returning id into mod3_id;

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values
(mod3_id,
  'Exercise 1 — Splits with Side Swing',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• From a wide-leg split stance, swing the kettlebell side to side in front of the body
• This engages the hips, core, and adductors simultaneously
• Keep a slight bend in the knees and maintain a stable, proud torso
• The swing is controlled — momentum is guided, not uncontrolled

MUSCLES: Adductors, core, hips, shoulders',
  null, 5, 0, 'video'),

(mod3_id,
  'Exercise 2 — Side Roll',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Lie on your back and roll your body from side to side using your abs
• Focus on oblique activation and core control — not momentum
• Keep your arms and legs extended to increase difficulty and engage the full core
• Breathe rhythmically and let the obliques lead the movement

MUSCLES: Obliques, transverse abdominis, core stabilizers',
  null, 5, 1, 'video'),

(mod3_id,
  'Exercise 3 — Side Roll with Extended Legs',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Keep the legs straight throughout the entire movement
• This targets the obliques more deeply and improves spinal mobility
• Challenges core stability with the increased lever arm
• Do not use momentum — use your core to control the roll

MUSCLES: Obliques, spinal rotators, core stability',
  null, 5, 2, 'video'),

(mod3_id,
  'Exercise 4 — Side Roll + Extended Legs + Crunch Touch (Hold 3 sec)',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Perform the side roll with extended legs, then add a crunch and hold for 3 seconds
• Make sure your obliques are fully engaged during the hold
• The pause creates additional time under tension — embrace it
• Do not rush the hold — 3 seconds means 3 seconds

MUSCLES: Obliques, rectus abdominis, core endurance',
  null, 5, 3, 'video'),

(mod3_id,
  'Exercise 5 — Step Forward Lunges with Halo',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Step forward into a lunge, then perform a kettlebell halo around your head
• Keep your core tight throughout the halo — do not let the weight pull you
• This combo strengthens the legs, shoulders, and core simultaneously
• Improves balance and coordination — control every phase

MUSCLES: Quadriceps, glutes, shoulders, core, balance',
  null, 5, 4, 'video'),

(mod3_id,
  'Exercise 6 — C-Crunch',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Curl your upper body and knees toward each other, forming a "C" shape with your spine
• This targets the upper and lower abs simultaneously
• Exhale as you curl in — squeeze the abs hard at the top
• Control the lowering phase — do not drop

MUSCLES: Rectus abdominis (upper and lower), hip flexors',
  null, 5, 5, 'video'),

(mod3_id,
  'Exercise 7 — Reverse Crunch: Right Side / Left Side',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Sit slightly leaned back with hands on the floor, knees bent
• Extend your legs out and rotate your hips to the right and left alternately
• Engage your lower abs and obliques with each side crunch
• Keep the movement controlled — resist the urge to swing

MUSCLES: Lower abs, obliques, hip flexors',
  null, 5, 6, 'video'),

(mod3_id,
  'Exercise 8 — Leg Raises: Right Side / Left Side',
  'Work: 45 sec | Rest: 15 sec

COACHING CUES:
• Lift both legs up while slightly angling them to the right side, then lower and repeat to the left
• This variation targets the lower abs and deeply activates the obliques
• Keep the movement slow and controlled — feel the burn in the lower abs
• Do not use momentum — the abs lift the legs, not the hip flexors

MUSCLES: Lower abs, obliques, hip flexors',
  null, 5, 7, 'video');

-- Quiz Circuit 3
insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod3_id, 'Circuit 3 Quiz', 70, 3)
returning id into quiz3_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'In the Side Roll exercise, keeping arms and legs extended does what?', 'multiple_choice', 0, 'Extended arms and legs increase the lever arm, making the exercise harder and engaging the full core more deeply.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Makes it easier', false, 0), (q_id, 'Increases difficulty and engages the full core', true, 1), (q_id, 'Has no effect', false, 2), (q_id, 'Reduces oblique activation', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'How long should the hold be in the Side Roll + Extended Legs + Crunch Touch?', 'multiple_choice', 1, 'The hold is 3 seconds — this creates time under tension and ensures the obliques are fully engaged.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, '1 second', false, 0), (q_id, '5 seconds', false, 1), (q_id, '3 seconds', true, 2), (q_id, 'As long as possible', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'The Splits with Side Swing engages which muscle group that is unique to this exercise?', 'multiple_choice', 2, 'The wide-leg split stance specifically targets the adductors (inner thighs) along with the core and hips.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Quadriceps', false, 0), (q_id, 'Adductors (inner thighs)', true, 1), (q_id, 'Calves', false, 2), (q_id, 'Biceps', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'The C-Crunch targets both upper and lower abs simultaneously.', 'true_false', 3, 'True. By curling both the upper body and knees toward each other, the C-Crunch creates a double contraction hitting the full rectus abdominis.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'True', true, 0), (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'During the Step Forward Lunges with Halo, the kettlebell halo is performed:', 'multiple_choice', 4, 'The halo is performed around the head while in the lunge position — keeping the core tight to prevent the weight from pulling you off balance.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
(q_id, 'Before stepping into the lunge', false, 0), (q_id, 'While in the lunge position', true, 1), (q_id, 'After returning to standing', false, 2), (q_id, 'While jumping', false, 3);

-- ── Module 4: Circuit 4 — AMRAP ───────────────────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (
  prog_id,
  'Circuit 4 — AMRAP Finisher',
  'Two AMRAPs of 3:30 minutes each with 1 minute rest between them. Choose exercises freely from the previous 3 circuits, or follow the recommended selection below. This is the final test.',
  4,
  false
)
returning id into mod4_id;

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type) values
(mod4_id,
  'AMRAP 1 — Recommended Selection',
  'Duration: 3:30 minutes | Rest after: 1 minute

AMRAP 1 — Complete as many rounds as possible:
1. Squat Jump & Alternative Catch — 10 reps
2. Military Bear Press — 10 reps
3. C-Crunch — 15 reps

COACHING:
• Set a target number of rounds before you start
• Maintain form even as fatigue sets in — quality over reps
• Use the 1-minute rest to fully recover before AMRAP 2
• The instructor may freely choose or reorganize exercises from Circuits 1-3',
  null, 4, 0, 'video'),

(mod4_id,
  'AMRAP 2 — Recommended Selection',
  'Duration: 3:30 minutes

AMRAP 2 — Complete as many rounds as possible:
1. Kettlebell Swing — 10 reps
2. Crab Bridge & Alternate Cross Touch — 10 reps
3. Step Forward Lunges with Halo — 8 reps

COACHING:
• Push harder than AMRAP 1 — this is your final effort
• Keep breathing through every rep
• The kettlebell swing should stay powerful even when fatigued
• End strong — last rep same as the first',
  null, 4, 1, 'video'),

(mod4_id,
  'Cool Down: Stretching Protocol',
  'Hold each stretch 15-20 seconds. Complete full sequence after every session.

STRETCHING SEQUENCE:
1. Samson Stretch Right — 15-20 sec
2. Samson Stretch Left — 15-20 sec
3. Cobra with Dorsal Flexion — 15-20 sec
4. Downward Facing Dog — 15-20 sec
5. Double Knee to Chest — 15-20 sec
6. Trunk Rotation — 15-20 sec
7. Cat / Cow Stretch — 15-20 sec
8. Full V Stretch — 15-20 sec

COACHING: Never skip the stretch. A 2-minute stretch session protects joints, reduces DOMS, and prepares the body for the next session.',
  null, 5, 2, 'video');

end $$;
