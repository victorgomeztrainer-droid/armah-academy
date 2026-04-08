-- SEED: CORE Program
-- Run this in Supabase SQL Editor

do $$
declare
  prog_id uuid;
  mod0_id uuid; mod1_id uuid; mod2_id uuid; mod3_id uuid;
  quiz0_id uuid; quiz1_id uuid; quiz2_id uuid; quiz3_id uuid;
  q_id uuid;
begin

-- ── Program ──────────────────────────────────────────────
insert into public.programs (title, slug, description, category, difficulty, estimated_hours, is_published)
values (
  'CORE',
  'core',
  'Functional core training program designed to strengthen the central musculature through three progressive circuits of 8 exercises each.',
  'Group Fitness',
  'intermediate',
  4,
  true
)
returning id into prog_id;

-- ── Module 0: Prerequisite – Functional Back ─────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (prog_id, 'Prerequisite: Functional Back', 'Foundation concepts for safe core training. Must complete before accessing the circuits.', 0, true)
returning id into mod0_id;

insert into public.lessons (module_id, title, description, video_url, duration_minutes, sort_order, lesson_type)
values (mod0_id, 'Functional Back – Theoretical Presentation', 'Overview of spinal anatomy, movement patterns, and injury prevention principles for core training.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 15, 0, 'presentation');

insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod0_id, 'Functional Back Quiz', 70, 3)
returning id into quiz0_id;

-- Quiz 0 questions
insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'Which muscle group is primarily responsible for spinal stabilization?', 'multiple_choice', 0, 'The transverse abdominis is the deepest abdominal muscle and acts as the primary spinal stabilizer.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Rectus abdominis', false, 0),
  (q_id, 'Transverse abdominis', true, 1),
  (q_id, 'Iliopsoas', false, 2),
  (q_id, 'Gluteus maximus', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'Neutral spine means the natural curves of the spine are maintained.', 'true_false', 1, 'Correct. Neutral spine preserves the natural cervical, thoracic, and lumbar curves.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', true, 0),
  (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'Which movement should be avoided when there is lower back pain?', 'multiple_choice', 2, 'Spinal flexion under load (e.g., crunches) increases disc pressure and should be avoided with lower back pain.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Hip hinge', false, 0),
  (q_id, 'Plank hold', false, 1),
  (q_id, 'Spinal flexion under load', true, 2),
  (q_id, 'Lateral walk', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'The diaphragm plays no role in core stability.', 'true_false', 3, 'False. The diaphragm is part of the core canister along with the pelvic floor and deep abdominals.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', false, 0),
  (q_id, 'False', true, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz0_id, 'What is the recommended breathing technique during core exercises?', 'multiple_choice', 4, 'Exhaling on exertion helps activate the deep core muscles and maintains intra-abdominal pressure.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Hold breath throughout', false, 0),
  (q_id, 'Inhale on exertion', false, 1),
  (q_id, 'Exhale on exertion', true, 2),
  (q_id, 'Breathing pattern does not matter', false, 3);

-- ── Module 1: Circuit 1 ───────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (prog_id, 'Circuit 1', 'First circuit — 8 foundational core exercises focusing on stability and activation.', 1, false)
returning id into mod1_id;

insert into public.lessons (module_id, title, video_url, duration_minutes, sort_order, lesson_type) values
  (mod1_id, 'Exercise 1 – Dead Bug', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 0, 'video'),
  (mod1_id, 'Exercise 2 – Bird Dog', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 1, 'video'),
  (mod1_id, 'Exercise 3 – Plank Hold', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 2, 'video'),
  (mod1_id, 'Exercise 4 – Side Plank', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 3, 'video'),
  (mod1_id, 'Exercise 5 – Hollow Body Hold', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 4, 'video'),
  (mod1_id, 'Exercise 6 – Pallof Press', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 5, 'video'),
  (mod1_id, 'Exercise 7 – Glute Bridge', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 6, 'video'),
  (mod1_id, 'Exercise 8 – Bear Crawl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 7, 'video');

insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod1_id, 'Circuit 1 Quiz', 70, 3)
returning id into quiz1_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'What is the primary focus of the Dead Bug exercise?', 'multiple_choice', 0, 'The Dead Bug targets anti-extension core stability — keeping the spine neutral while the limbs move.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Hip flexibility', false, 0),
  (q_id, 'Anti-extension core stability', true, 1),
  (q_id, 'Shoulder strength', false, 2),
  (q_id, 'Leg power', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'During a plank, the hips should be raised higher than the shoulders.', 'true_false', 1, 'False. In a proper plank, the body should form a straight line from head to heels.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', false, 0),
  (q_id, 'False', true, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'Which exercise trains anti-rotation core stability?', 'multiple_choice', 2, 'The Pallof Press is an anti-rotation exercise that trains the core to resist rotational forces.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Glute Bridge', false, 0),
  (q_id, 'Bird Dog', false, 1),
  (q_id, 'Pallof Press', true, 2),
  (q_id, 'Hollow Body Hold', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'The Bird Dog exercise requires simultaneous extension of opposite arm and leg.', 'true_false', 3, 'True. The Bird Dog extends the opposite arm and leg to challenge spinal stability.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', true, 0),
  (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz1_id, 'What muscle does the Glute Bridge primarily target?', 'multiple_choice', 4, 'The Glute Bridge primarily targets the gluteus maximus, which is essential for posterior chain and core function.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Rectus abdominis', false, 0),
  (q_id, 'Hamstrings', false, 1),
  (q_id, 'Gluteus maximus', true, 2),
  (q_id, 'Quadriceps', false, 3);

-- ── Module 2: Circuit 2 ───────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (prog_id, 'Circuit 2', 'Second circuit — 8 intermediate exercises building on Circuit 1 with added load and complexity.', 2, false)
returning id into mod2_id;

insert into public.lessons (module_id, title, video_url, duration_minutes, sort_order, lesson_type) values
  (mod2_id, 'Exercise 1 – Ab Wheel Rollout', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 0, 'video'),
  (mod2_id, 'Exercise 2 – Turkish Get-Up', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 7, 1, 'video'),
  (mod2_id, 'Exercise 3 – Dragon Flag', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 2, 'video'),
  (mod2_id, 'Exercise 4 – Loaded Carry', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 3, 'video'),
  (mod2_id, 'Exercise 5 – Copenhagen Plank', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 4, 'video'),
  (mod2_id, 'Exercise 6 – Landmine Rotation', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 5, 'video'),
  (mod2_id, 'Exercise 7 – Single Leg Deadlift', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 6, 6, 'video'),
  (mod2_id, 'Exercise 8 – Suitcase Carry', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 7, 'video');

insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod2_id, 'Circuit 2 Quiz', 70, 3)
returning id into quiz2_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'The Ab Wheel Rollout is an advanced anti-extension exercise.', 'true_false', 0, 'True. The ab wheel rollout challenges the core to resist extension through a larger range of motion.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', true, 0),
  (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'The Turkish Get-Up trains:', 'multiple_choice', 1, 'The Turkish Get-Up is a total-body movement that builds strength, mobility, and coordination simultaneously.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Only shoulder strength', false, 0),
  (q_id, 'Only hip flexibility', false, 1),
  (q_id, 'Full-body strength, mobility, and coordination', true, 2),
  (q_id, 'Only core endurance', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'Loaded carries improve core stability by challenging the body to resist lateral flexion.', 'true_false', 2, 'True. Carrying an asymmetric load forces the core to work hard to maintain an upright posture.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', true, 0),
  (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'What plane of motion does the Landmine Rotation primarily train?', 'multiple_choice', 3, 'The Landmine Rotation trains the transverse (rotational) plane of motion.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Sagittal', false, 0),
  (q_id, 'Frontal', false, 1),
  (q_id, 'Transverse', true, 2),
  (q_id, 'All planes equally', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz2_id, 'The Copenhagen Plank primarily targets which muscle group?', 'multiple_choice', 4, 'The Copenhagen Plank is a highly effective exercise for the hip adductors (inner thigh).')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Hip abductors', false, 0),
  (q_id, 'Hip adductors', true, 1),
  (q_id, 'Quadriceps', false, 2),
  (q_id, 'Calves', false, 3);

-- ── Module 3: Circuit 3 ───────────────────────────────────
insert into public.modules (program_id, title, description, sort_order, is_prerequisite)
values (prog_id, 'Circuit 3', 'Third circuit — 8 advanced exercises integrating power, endurance, and full-body coordination.', 3, false)
returning id into mod3_id;

insert into public.lessons (module_id, title, video_url, duration_minutes, sort_order, lesson_type) values
  (mod3_id, 'Exercise 1 – L-Sit Hold', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 0, 'video'),
  (mod3_id, 'Exercise 2 – Hanging Knee Raise', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 1, 'video'),
  (mod3_id, 'Exercise 3 – GHD Sit-Up', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 6, 2, 'video'),
  (mod3_id, 'Exercise 4 – Medicine Ball Slam', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 3, 'video'),
  (mod3_id, 'Exercise 5 – Toes to Bar', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 4, 'video'),
  (mod3_id, 'Exercise 6 – Barbell Rollout', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 5, 'video'),
  (mod3_id, 'Exercise 7 – Dragon Flag Negative', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5, 6, 'video'),
  (mod3_id, 'Exercise 8 – Core Circuit Finisher', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 8, 7, 'video');

insert into public.quizzes (module_id, title, passing_score, max_attempts)
values (mod3_id, 'Circuit 3 Quiz', 70, 3)
returning id into quiz3_id;

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'The L-Sit requires maintaining hip flexion at 90° while supporting body weight.', 'true_false', 0, 'True. The L-Sit requires both hip flexion strength and upper body pushing strength to maintain the position.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', true, 0),
  (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'Medicine Ball Slams train which quality?', 'multiple_choice', 1, 'Medicine Ball Slams are a power exercise — they train the ability to generate force rapidly through the core.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Core endurance', false, 0),
  (q_id, 'Core power and explosiveness', true, 1),
  (q_id, 'Core flexibility', false, 2),
  (q_id, 'Core proprioception only', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'Toes to Bar can be regressed to Knees to Chest for beginners.', 'true_false', 2, 'True. Knees to Chest is a common regression that reduces the lever arm and makes the movement more accessible.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', true, 0),
  (q_id, 'False', false, 1);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'Which circuit is the most advanced in the CORE program?', 'multiple_choice', 3, 'Circuit 3 is the most advanced, incorporating power movements and full-body integration.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'Circuit 1', false, 0),
  (q_id, 'Circuit 2', false, 1),
  (q_id, 'Circuit 3', true, 2),
  (q_id, 'They are all the same difficulty', false, 3);

insert into public.quiz_questions (quiz_id, question_text, question_type, sort_order, explanation)
values (quiz3_id, 'The GHD Sit-Up should be programmed for beginners without prior core training.', 'true_false', 4, 'False. The GHD Sit-Up is an advanced exercise that can cause injury if performed without adequate core strength and experience.')
returning id into q_id;
insert into public.quiz_options (question_id, option_text, is_correct, sort_order) values
  (q_id, 'True', false, 0),
  (q_id, 'False', true, 1);

end $$;
