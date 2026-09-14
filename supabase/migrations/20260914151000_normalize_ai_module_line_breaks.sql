-- The first IA import used escaped newlines inside SQL string literals.
-- Convert the two visible characters "\\n" into real line breaks for the existing course.
update public.training_modules
set content_text = replace(content_text, E'\\\\n', E'\n')
where training_type = 'ai'
  and content_text like '%\\n%';

update public.training_modules
set trainer_guidance = replace(trainer_guidance, E'\\\\n', E'\n')
where training_type = 'ai'
  and trainer_guidance like '%\\n%';
